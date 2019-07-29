// background.js

const MAPPING_SERVICE_URL = 'http://babelfish.dev.cloud.retest.org/api/v1.3.0/paths-webdata-mapping';
const REPORT_DASHBOARD_URL = 'http://garkbit.dev.cloud.retest.org/dashboard';
const RESPONSE_GOLDEN_MASTER_CREATED = 'recheck-web-Golden-Master-created';
const RESPONSE_REPORT_CREATED = 'recheck-web-Report-created';

var activeWindowId;
var activeTab;
var activeTabId;

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.getCurrent({}, function(window){
		activeWindowId = window.id;
		// persist tabId of activeTab
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function(tabs) {
			activeTab = tabs[0];
			activeTabId = activeTab.id;
			chrome.windows.create({
				'url' : 'login.html',
				'left' : 100,
				'top' : 0,
				'width' : 1000,
				'height' : 870
			});
		});
	});
});

function captureScreenshots(callback) {
	chrome.tabs.captureVisibleTab(activeWindowId, {
		format : 'jpeg',
		quality : 50
	}, function(dataUrl) {
		callback(dataUrl);
	});
}

function requestData(token) {
	chrome.tabs.sendMessage(activeTabId, {
		'message' : 'recheck-web_clicked'
	}, function(response) {
		sendData(response, token);
	});
}

function sendData(request, token) {
	captureScreenshots(function(dataUrl) {
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
			'screenshot' : dataUrl,
			'name' : name,
			'title' : request.title,
			'url' : request.url,
			'os' : request.os,
			'browser' : request.browser,
			'screensize' : request.screensize
		}));
	});
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
				alert('Error interacting with the retest server:\n\n' + response + '\n\nPlease refresh this page and try again. If it still does not work, please contact support: support@retest.de');
			}
		} else if (status == 403) {
			alert('Something is wrong with your access rights.\nPlease contact support: support@retest.de');
		} else {
			alert('Server responded with status: ' + status);
		}
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_login') {
		requestData(request.token);
	}
});
