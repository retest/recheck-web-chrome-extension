// background.js

const MAPPING_SERVICE_URL = 'http://localhost:8080/api/v1.3.0/paths-webdata-mapping';
const REPORT_DASHBOARD_URL = 'http://garkbit.dev.cloud.retest.org/dashboard';
const RESPONSE_GOLDEN_MASTER_CREATED = 'recheck-web-Golden-Master-created';
const RESPONSE_REPORT_CREATED = 'recheck-web-Report-created';

var activeTabId;

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	// persist tabId of activeTab
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(tabs) {
		var activeTab = tabs[0];
		activeTabId = activeTab.id;
	});
	chrome.windows.create({
		'url' : 'login.html',
		'left' : 100,
		'top' : 0,
		'width' : 1000,
		'height' : 870
	});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_login') {
		chrome.tabs.sendMessage(activeTabId, {
			'message' : 'recheck-web_clicked'
		}, function(response) {
			var name = prompt('Please enter the name of the check: ', response.title);
			if (name == null || name == '') {
				return;
			}
			var xhr = new XMLHttpRequest();
			xhr.open('POST', MAPPING_SERVICE_URL, true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.setRequestHeader('Authorization', 'Bearer ' + request.token);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status == 200) {
						if (xhr.response === RESPONSE_GOLDEN_MASTER_CREATED) {
							alert('Created Golden Master ' + name);
						} else if (xhr.response === RESPONSE_REPORT_CREATED) {
							chrome.tabs.create({
								'url' : REPORT_DASHBOARD_URL
							});
						} else {
							alert('Error interacting with retest: ' + xhr.response);
						}
					} else {
						alert('Request returned status : ' + xhr.status);
					}
				}
			}
			xhr.send(JSON.stringify({
				'allElements' : JSON.parse(response.allElements),
				'name' : name,
				'title' : response.title,
				'token' : request.token
			}));
		});
	}
});
