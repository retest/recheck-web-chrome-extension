// background.js

var accessToken;
var refreshToken;

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	// Send a message to the active tab
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(tabs) {
		var activeTab = tabs[0];
		chrome.browserAction.setPopup({
		    popup: "login.html"
		});
		chrome.tabs.sendMessage(activeTab.id, {
			"message" : "clicked_recheck-web"
		});
	});
});
