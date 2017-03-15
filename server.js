var fs = require('fs');
var YAML = require('yamljs');
var Sitemapper = require('sitemapper');
var sitemap = new Sitemapper();
var FB = require('fb');
var csvWriter= require('csv-write-stream');
var ctr = 0;

function BlogWriter(_url, _fileName) {
	this.writer = csvWriter({headers: ["Last_Modified", "Link", "FB_Shares", "FB_Comments"]});
	this.url = _url;
	this.fileName = _fileName;
	this.writer.pipe(fs.createWriteStream(_fileName));
}

var accessToken = "1077129835747671|ZdgcEyZpjEaTdbi32ro8nlgJjOE";
FB.setAccessToken(accessToken);

writeIntoCSV = function(csvRecord, writerObject){
	// console.log(csvRecord);
	writerObject.writer.write(csvRecord);
}

logProperFormat = function(fbJson, writerObject){
	if(typeof fbJson.og_object === 'undefined'){
		return;
	}
	var postUpdatedTime = fbJson.og_object.updated_time;
	// var postLikes = fbJson.og_object.likes.summary.total_count;
	var postLink = fbJson.id;
	console.log(postLink);
	var postShares = fbJson.share.share_count;
	var postComments = fbJson.share.comment_count; 
	csvRecord = {Last_Modified: postUpdatedTime, Link: postLink, FB_Shares: postShares, FB_Comments: postComments}
	writeIntoCSV(csvRecord, writerObject);
}

logFBDetails = function(blog_url, writerObject){
	var requestString = "/?id="+blog_url+"&access_token="+accessToken;
	FB.api(requestString, 'get', function (res) {
		if(!res || res.error) {
		}
		logProperFormat(res, writerObject);
	});
}

fetchUrlToCheck = function(sitesList, writerObject){
	for(var i=0; i < sitesList.length ; i++){
		var url = sitesList[i];
		if(url.includes('sitemap')){
			fetchSitesList(url, writerObject);
		}
		else{
			logFBDetails(sitesList[i], writerObject);
		}
	}
}

fetchSitesList = function(url, writerObject){
	sitemap.fetch(url).then(function(sites) {
		fetchUrlToCheck(sites.sites, writerObject);
	});
}

webListFile = YAML.load('weblist.yml');
var webSiteUrls = webListFile.website_list;
var loopLength = Object.keys(webSiteUrls).length;

for(var i = 0; i < loopLength; i++){
	var fileName = webSiteUrls[i].csVFileName;
	var url = webSiteUrls[i].hostName;
	var writerObject = new BlogWriter(url, fileName);
	fetchSitesList(url, writerObject);
}
