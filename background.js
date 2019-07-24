// background.js

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.create({'url': 'login.html', 'left': 100, 'top': 0, 'width': 1000, 'height': 870}, function(window) {
	});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_login') {
		var keycloak = Keycloak({
		    url: 'https://sso.prod.cloud.retest.org/auth',
		    realm: 'customer',
		    clientId: 'marvin'
		});
		keycloak.init();
		console.log('keycloak initialized: ' + keycloak.subject);
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {
				'message' : 'clicked_recheck-web'
			});
		});
	}
});
