// background.js

const MAPPING_SERVICE_URL = 'https://babelfish.dev.cloud.retest.org/api/v1.3.0/paths-webdata-mapping';
const REPORT_DASHBOARD_URL = 'https://garkbit.dev.cloud.retest.org/dashboard';
const RESPONSE_GOLDEN_MASTER_CREATED = 'recheck-web-Golden-Master-created';
const RESPONSE_REPORT_CREATED = 'recheck-web-Report-created';

const ERROR_MSG = 'There was an error in the recheck plugin. Please refresh this page and try again.\n\nIf it still does not work, please consider reporting a bug at\nhttps://github.com/retest/recheck-web-chrome-extension/issues\n\nThank you!';

var activeWindowId;
var activeTab;
var activeTabId;

function errorHandler(reason) {
	console.log(reason);
}

function progress(complete) {}

function splitnotifier() {
	console.log('split-image');
}

function requestScreenshots() {
	console.log("Requesting screenshots.");
	CaptureAPI.captureToDataUrls(activeTab, function(dataUrls) {
		dataUrlsLength = dataUrls.length;
		if (dataUrlsLength === 0) {
			alert(ERROR_MSG);
			console.error("No screenshots received, aborting...");
			return;
		}
		console.log("Received screenshots, now requesting resize.");
		chrome.tabs.sendMessage(activeTabId, {
			'message' : 'recheck-web_resize_img',
			'dataUrls' : dataUrls
		});
	}, errorHandler, progress, splitnotifier);
}

function requestData() {
	console.log("Requesting data.");
	chrome.tabs.sendMessage(activeTabId, {
		'message' : 'recheck-web_clicked'
	}, function(response) {
		sendData(response, dataUrls, token);
	});
}

function requestLogin() {
	console.log("Requesting login.");
	chrome.windows.create({
		'url' : 'login.html',
		'left' : 100,
		'top' : 0,
		'width' : 1000,
		'height' : 870
	});
}

function sendData(request, dataUrl, token) {
	console.log("Sending data to " + MAPPING_SERVICE_URL);
	var name = prompt('Please enter the name of the check: ', request.title);
	if (name == null || name == '') {
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open('POST', MAPPING_SERVICE_URL, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.onreadystatechange = function() {
		handleServerResponse(xhr.readyState, xhr.status, xhr.response, name);
	}
	xhr.send(JSON.stringify({
		'allElements' : JSON.parse(request.allElements),
		'screenshots' : dataUrl,
		'name' : name,
		'title' : request.title,
		'url' : request.url,
		'os' : request.os,
		'browser' : request.browser,
		'screenWidth' : request.screenWidth,
		'screenHeight' : request.screenHeight
	}));
	// cleanup
	data = null;
	dataUrls = [];
	activeWindowId = null;
	activeTab = null;
	activeTabId = null;
}

function handleServerResponse(readyState, status, response, name) {
	if (readyState === 4) {
		if (status == 200) {
			if (response === RESPONSE_GOLDEN_MASTER_CREATED) {
				alert('Created Golden Master "' + name + '".');
			} else if (response === RESPONSE_REPORT_CREATED) {
				chrome.tabs.create({
					'url' : REPORT_DASHBOARD_URL
				});
			} else {
				alert('Error interacting with the retest server:\n\n'
						+ response
						+ '\n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
			}
		} else if (status == 403) {
			alert('Something is wrong with your access rights.\nPlease contact support: support@retest.de');
		} else {
			alert('Server responded with status: ' + status);
		}
	}
}

// when clicked
// requestLogin
// when login
var token;
// requestScreenshots
var dataUrls = [];
var dataUrlsLength;
// requestData
// send all

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.getCurrent({}, function(window) {
		activeWindowId = window.id;
		// persist tabId of activeTab
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function(tabs) {
			activeTab = tabs[0];
			activeTabId = activeTab.id;
			requestLogin();
		});
		chrome.tabs.executeScript(activeTabId, {
			file : 'getAllElementsByPath.js'
		});
		chrome.tabs.executeScript(activeTabId, {
			file : 'content.js'
		});
	});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_login') {
		console.log("Receiving login.");
		token = request.token;
		requestScreenshots();
		sendResponse();
	}
	if (request.message === 'recheck-web_resize_img') {
		console.log("Receiving resized image.");
		dataUrls.push(request.dataUrl);
		if (dataUrls.length === dataUrlsLength) {
			requestData();
		}
		sendResponse();
	}
});
