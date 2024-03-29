// background.js

const MAPPING_SERVICE_URL = 'https://chrome-extension-backend.prod.cloud.retest.org/api/v1/paths-webdata-mapping';
const GOLDEN_MASTER_SERVICE_URL = 'https://chrome-extension-backend.prod.cloud.retest.org/api/v1/existing-golden-masters';
const REPORT_DASHBOARD_URL = 'https://rehub.retest.de/dashboard';
const RESPONSE_GOLDEN_MASTER_CREATED = 'recheck-web-Golden-Master-created';
const RESPONSE_REPORT_CREATED = 'recheck-web-Report-created';

const ERROR_MSG = 'There was an error in the recheck plugin. Please refresh this page and try again.\n\nIf it still does not work, please consider reporting a bug at\nhttps://github.com/retest/recheck-web-chrome-extension/issues\n\nThank you!';
const ERROR_MSG_TOO_LARGE = 'Website is too large for demo.\n\nChecking large sites incurs significant traffic, processing and storage costs. Since this is only a demo, we therefore limited the size of websites that you can check.\n\nTo check larger sites, please use the full version or contact us.';

const TOPLEVEL_FRAMEID = 0;

var activeWindowId;
var activeTab;
var activeTabId;
var dataUrls = [];
var dataUrlsLength;
var reportTab;
var title;
var token;
var existingGoldenMasterNames;
var emergencyReset;
var data;
var frameData = [];

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
}

function requestExistingGoldenMasterNames(token) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', GOLDEN_MASTER_SERVICE_URL, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				existingGoldenMasterNames = JSON.parse(xhr.response);
			}
		}
	};
	console.log("Requesting existing Golden Master names at " + GOLDEN_MASTER_SERVICE_URL);
	xhr.send('Requesting all existing Golden Master names.');
}

function processDataUrls(dataUrlsInput) {
	if (dataUrlsInput.length === 0) {
		if (chrome.runtime.lastError && activeTab.url.startsWith("file://")) {
			abort("Local file access disabled.\n\nPlease go to the extension configuration (chrome://extensions/) and enable \"Allow access to file URLs\" for this extension.");
		} else if (!activeTab.url || activeTab.url === '' || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('https://chrome.google.com/')) {
			abort("Chrome disallows extensions access to certain URLs. This is one of them. Please visit another website and try again.");
		} else {
			console.error("No screenshots received, aborting...");
			abort(ERROR_MSG);
		}
		return;
	}

	dataUrlsLength = dataUrlsInput.length;
	console.log(`Received ${dataUrlsLength} screenshots, now requesting resize.`);

	chrome.tabs.sendMessage(activeTabId, {
		'message': 'recheck-web_resize_img',
		'dataUrls': dataUrlsInput
	}, {'frameId': 0});
}


function requestScreenshots() {
	console.log("Requesting screenshots.");

	chrome.runtime.sendMessage({
		'message' : 'recheck-web_captureScreenshot'
	});

	CaptureAPI.captureToDataUrls(activeTab, processDataUrls, err => console.log(err), () => {},
		() => console.log('split-image'));
}

function requestData() {
	console.log("Requesting data.");
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_captureData'
	});
	chrome.tabs.sendMessage(activeTabId, {
		'message' : 'recheck-web_clicked'
	}, function(response) {
		requestGoldenMasterName(response);
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

function requestGoldenMasterName(data) {
	var w = 800;
	var h = 450;
	title = sanitize(data.title);
	console.log(`Requesting user input for ${title}`);
    var left = Math.round(((data.windowWidth - w) / 2) + data.dualScreenLeft);
    var top = Math.round(((data.windowHeight - h) / 2) + data.dualScreenTop);
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
	// TODO: this needs to be fixed: name and id should be pairs of a map
	let realName = name.split('[')[0];
	let id = "";
	if (action === "compare") {
		id = name.split('[')[1].replace(']', '');
	}

	let xhr = new XMLHttpRequest();
	xhr.open('POST', MAPPING_SERVICE_URL, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.onreadystatechange = function() {
		handleServerResponse(xhr.readyState, xhr.status, xhr.response, realName);
	};
	console.log(`Sending data to ${MAPPING_SERVICE_URL}`);
	chrome.runtime.sendMessage({
		'message' : 'recheck-web_sendData'
	});
	xhr.send(JSON.stringify({
		'allElements' : data.allElements,
		'screenshots' : dataUrls,
		'name' : sanitize(realName),
		'id' : id,
		'action' : action,
		'title' : sanitize(data.title),
		'url' : data.url,
		'os.name' : data.osName,
		'os.version' : data.osVersion,
		'browser.name' : data.browserName,
		'browser.version' : data.browserVersion,
		'window.width' : data.windowWidth,
		'window.height' : data.windowHeight
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

function handleSuccessfulResponse(response, name, status) {
	switch (response) {
		case RESPONSE_GOLDEN_MASTER_CREATED:
			alert(`Created Golden Master "${name}".`);
			break;
		case 0:
			console.log(`Server responded with status ${status}, response: ${response}`);
			alert(ERROR_MSG_TOO_LARGE);
			break;
		case RESPONSE_REPORT_CREATED:
			if (!reportTab) {
				openReports();
			} else {
				chrome.tabs.get(reportTab.id, function callback(tab) {
					if (chrome.runtime.lastError || tab.url !== REPORT_DASHBOARD_URL) {
						reportTab = null;
						openReports();
					} else {
						chrome.tabs.reload(reportTab.id);
						chrome.tabs.update(reportTab.id, {'active': true}, () => {});
					}
				});
			}
			break;
		default:
			console.log(`Error interacting with the retest server, response: ${response}`);
			alert('Error interacting with the retest server:\n\n' + response
				+ '\n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
			break;
	}
}

function handleServerResponse(readyState, status, response, name) {
	if (readyState === XMLHttpRequest.DONE) {
		abort(null);
		if (status === 200) {
			handleSuccessfulResponse(response, name, status);
		} else if (status === 403) {
			console.log(`Server responded with status ${status}`);
			alert('Something is wrong with your access rights.\nPlease contact support: support@retest.de');
		} else if (status === 413) {
			console.log(`Server responded with status ${status}`);
			alert(ERROR_MSG_TOO_LARGE);
		} else if (status >= 500 && status < 600) {
			console.log(`Server responded with status ${status}, response: ${response}`);
			alert('Error interacting with the retest server. \n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
		} else {
			console.log(`Server responded with status ${status}, response: ${response}`);
			alert('Error interacting with the retest server (status ' + status + '):\n\n' + response
					+ '\n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
		}
	}
}

function recheck(){
	chrome.windows.getCurrent({}, function(window) {
		if (chrome.runtime.lastError){
			console.error(chrome.runtime.lastError.message);
		}
		activeWindowId = window.id;
		// persist tabId of activeTab
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function(tabs) {
			activeTab = tabs[0];
			activeTabId = activeTab.id;
			chrome.windows.create({
				'url' : 'popup.html',
				'type' : 'popup',
				'width' : 350,
				'height' : 600
			}, function(window) {});
			requestLogin();
		});
		chrome.tabs.executeScript(activeTabId, {
			file : 'getAllElementsByPath.js',
			allFrames : true
		});
		chrome.tabs.executeScript(activeTabId, {
			file : 'content.js',
			allFrames : true
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

function getFramePrefixWithUrl(allElements, url) {
	var entries = Object.entries(allElements);
	// iterate over all elements
	for (const [path, properties] of entries) {
		// find iframe or frame with same URL
		if (properties.tagName === "iframe" || properties.tagName === "frame") {
			var src = properties.src;
			if (url.endsWith(src)) {
				return path;
			}
		} 
	}
	return "";
}

function addFrameToData(request) {
	var prefix = getFramePrefixWithUrl(data.allElements, request.url);
	if (prefix === "") {
		frameData.push(request);
		console.log(`Found no frame prefix with URL ${request.url} postponing processing.`);
		return;
	}
	var allNewElements = JSON.parse(request.allElements);
	var entries = Object.entries(allNewElements);
	// add all elements with prefix of frame
	for (const [path, properties] of entries) {
		data.allElements[prefix + path.replace("//", "/")] = properties; 
	}
}

function tryToAddAllReceivedFramesToData() {
	var i = 0;
	var limit = frameData.length * 2;
	while (i < limit && frameData.length > 0) {
		i++;
		addFrameToData(frameData.shift());
	}
}

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
			console.log(`Waiting for ${dataUrlsLength - dataUrls.length} more images before continuing.`);
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
			'title' : title
		});
	}
	if (request.message === 'recheck-web_sendGMName') {
		// TODO: this needs to be fixed: request.name should be replaced by a map containing id and name of a GM
		sendData(request.name, request.action);
	}
	if (request.message === 'recheck-web_send_data') {
		if (sender.frameId === TOPLEVEL_FRAMEID) {
			console.log(`Receiving data from content ${request.url}.`);
			data = request;
			data.allElements = JSON.parse(data.allElements);
			tryToAddAllReceivedFramesToData();
		} else {
			console.log(`Receiving second data package from another content ${request.url}.`);
			frameData.push(request);
			if (data) {
				tryToAddAllReceivedFramesToData();
			}
		}
	}
});
