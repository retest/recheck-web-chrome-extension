// background.js

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
			'message' : 'clicked_recheck-web',
			'authenticated' : request.authenticated,
			'token' : request.token,
			'refreshToken' : request.refreshToken,
			'subject' : request.subject,
			'realmAccess' : request.realmAccess,
			'resourceAccess' : request.resourceAccess
		});
	}
});
