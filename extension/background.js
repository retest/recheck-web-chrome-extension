// background.js

const MAPPING_SERVICE_URL = 'https://babelfish.prod.cloud.retest.org/api/v1.3.0/paths-webdata-mapping';
const GOLDEN_MASTER_SERVICE_URL = 'https://babelfish.prod.cloud.retest.org/api/v1.3.0/existing-golden-masters';
const REPORT_DASHBOARD_URL = 'https://garkbit.prod.cloud.retest.org/dashboard';
const RESPONSE_GOLDEN_MASTER_CREATED = 'recheck-web-Golden-Master-created';
const RESPONSE_REPORT_CREATED = 'recheck-web-Report-created';

const ERROR_MSG = 'There was an error in the recheck plugin. Please refresh this page and try again.\n\nIf it still does not work, please consider reporting a bug at\nhttps://github.com/retest/recheck-web-chrome-extension/issues\n\nThank you!';
const ERROR_MSG_TOO_LARGE = 'Website is too large for demo.\n\nChecking large sites incurrs significant traffic, processing and storage costs. Since this is only a demo, we therefore limited the size of websites that you can check.\n\nTo check larger sites, please use the full version or contact us.';

var activeWindowId;
var activeTab;
var activeTabId;
var dataUrls = [];
var dataUrlsLength;
var reportTab;
var token;
var existingGoldenMasterNames;
var emergencyReset;
var data;

function errorHandler(reason) {
	console.log(reason);
}

function progress(complete) {}

function splitnotifier() {
	console.log('split-image');
}

function abort(msg) {
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_aborted'
	});
	if (msg) {
		alert(msg);
	}
	// cleanup
	data = null;
	dataUrls = [];
	activeWindowId = null;
	activeTab = null;
	activeTabId = null;
	return;
}

function ensureValidUrl(url) {
	if (url.startsWith("file://")) {
		chrome.extension.isAllowedFileSchemeAccess(function () {
			if (chrome.runtime.lastError) {
				abort("Local file access disabled.\n\nPlease go to the extension configuration (chrome://extensions/) and enable \"Allow access to file URLs\" for this extension.");
			}
		});
	}
	return true;
}

function requestExistingGoldenMasterNames(token) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', GOLDEN_MASTER_SERVICE_URL, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status == 200) {
				existingGoldenMasterNames = JSON.parse(xhr.response);
			}
		}
	}
	console.log("Requesting existing Golden Master names at " + GOLDEN_MASTER_SERVICE_URL);
	xhr.send('Requesting all existing Golden Master names.');
}

function requestScreenshots() {
	console.log("Requesting screenshots.");
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_captureScreenshot'
	});
	CaptureAPI.captureToDataUrls(activeTab, function(dataUrlsInput) {
		if (dataUrlsInput.length === 0) {
			console.error("No screenshots received, aborting...");
			abort(ERROR_MSG);
		}
		dataUrlsLength = dataUrlsInput.length;
		console.log("Received " + dataUrlsLength + " screenshots, now requesting resize.");
		chrome.tabs.sendMessage(activeTabId, {
			'message' : 'recheck-web_resize_img',
			'dataUrls' : dataUrlsInput
		});
	}, errorHandler, progress, splitnotifier);
}

function requestData() {
	console.log("Requesting data.");
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_captureData'
	});
	chrome.tabs.sendMessage(activeTabId, {
		'message' : 'recheck-web_clicked'
	}, function(response) {
		data = response;
		requestGoldenMasterName(response.title);
	});
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_requestGoldenMasterName'
	});
}

function requestLogin() {
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_requestLogin'
	});
	console.log("Requesting login.");
	chrome.windows.create({
		'url' : 'login.html',
		'left' : 100,
		'top' : 0,
		'width' : 1000,
		'height' : 870
	});
}

function sanitize(input) {
	return input.replace(/\W/g, ' ').replace(/\s\s+/g, ' ').trim();
}

function requestGoldenMasterName(title) {
	var w = 800;
	var h = 450;
	var checkName = sanitize(title);
	console.log("Requesting user input for " + checkName);
    var left = ((data.screenWidth - w) / 2) + data.dualScreenLeft;
    var top = ((data.screenHeight - h) / 2) + data.dualScreenTop;
	chrome.windows.create({
		'url' : 'prompt.html',
		'type' : 'popup',
		'top' : top,
		'left' : left,
		'width' : w,
		'height' : h
	});
}

function sendData(name, action) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', MAPPING_SERVICE_URL, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.onreadystatechange = function() {
		handleServerResponse(xhr.readyState, xhr.status, xhr.response, name);
	}
	console.log("Sending data to " + MAPPING_SERVICE_URL);
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_sendData'
	});
	xhr.send(JSON.stringify({
		'allElements' : JSON.parse(data.allElements),
		'screenshots' : dataUrls,
		'name' : sanitize(name),
		'action' : action,
		'title' : sanitize(data.title),
		'url' : data.url,
		'os' : data.os,
		'browser' : data.browser,
		'screenWidth' : data.screenWidth,
		'screenHeight' : data.screenHeight
	}));
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_processing'
	});
}

function openReports() {
	chrome.tabs.create({
		'url' : REPORT_DASHBOARD_URL
	}, function(tab) {
		reportTab = tab;
	});
}

function handleServerResponse(readyState, status, response, name) {
	if (readyState === 4) {
		abort(null);
		if (status == 200) {
			if (response === RESPONSE_GOLDEN_MASTER_CREATED) {
				alert('Created Golden Master "' + name + '".');
			} else if (response == 0) {
				console.log("Server responded with status " + status + ", response: " + response);
				alert(ERROR_MSG_TOO_LARGE);
			} else if (response === RESPONSE_REPORT_CREATED) {
				if (!reportTab) {
					openReports();
				} else {
					chrome.tabs.get(reportTab.id, function callback(tab) {
						if (chrome.runtime.lastError || tab.url != REPORT_DASHBOARD_URL) {
							reportTab = null;
							openReports();
						} else {
							chrome.tabs.reload(reportTab.id);
							chrome.tabs.update(reportTab.id, { 'active': true }, (tab) => { });
						}
					});
				}
			} else {
				console.log("Error interacting with the retest server, response: " + response)
				alert('Error interacting with the retest server:\n\n' + response
						+ '\n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
			}
		} else if (status == 403) {
			console.log("Server responded with status " + status);
			alert('Something is wrong with your access rights.\nPlease contact support: support@retest.de');
		} else if (status == 413) {
			console.log("Server responded with status " + status);
			alert(ERROR_MSG_TOO_LARGE);
		} else if (status >= 500 && status < 600) {
			console.log("Server responded with status " + status + ", response: " + response);
			alert('Error interacting with the retest server. \n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
		} else {
			console.log("Server responded with status " + status + ", response: " + response);
			alert('Error interacting with the retest server (status ' + status + '):\n\n' + response
					+ '\n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
		}
	}
}

function recheck(){
	chrome.windows.getCurrent({}, function(window) {
		activeWindowId = window.id;
		// persist tabId of activeTab
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function(tabs) {
			activeTab = tabs[0];
			activeTabId = activeTab.id;
			if (!ensureValidUrl(activeTab.url)) {
				return;
			}
			chrome.windows.create({
				'url' : 'popup.html',
				'type' : 'popup',
				'width' : 350,
				'height' : 600
			}, function(window) {});
			requestLogin();
		});
		chrome.tabs.executeScript(activeTabId, {
			file : 'getAllElementsByPath.js'
		});
		chrome.tabs.executeScript(activeTabId, {
			file : 'content.js'
		});
	});
}

chrome.browserAction.onClicked.addListener(function() {
	if (activeTab) {
		alert("Capture already in progress, please wait until finished.");
		return;
	}
	// This is so if anything happens, at some point we get reset
	window.clearTimeout(emergencyReset);
	emergencyReset = setTimeout(function(){abort(); }, 600000);
	recheck();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_login') {
		console.log("Receiving login.");
		token = request.token;
		requestExistingGoldenMasterNames(token);
		requestScreenshots();
		sendResponse();
	}
	if (request.message === 'recheck-web_resize_img') {
		console.log("Receiving resized image.");
		dataUrls.push(request.dataUrl);
		if (dataUrls.length === dataUrlsLength) {
			requestData();
		} else {
			console.log("Waiting for " + (dataUrlsLength - dataUrls.length) + " more images before continuing.");
		}
		sendResponse();
	}
	if (request.message === 'recheck-web_aborted') {
		console.log("Receiving abort.");
		abort(null);
	}
	if (request.message === 'recheck-web_sendExistingGMs') {
		sendResponse({
			'existing' :existingGoldenMasterNames,
			'title' : sanitize(data.title)
		});
	}
	if (request.message === 'recheck-web_sendGMName') {
		sendData(request.name, request.action);
	}
});
