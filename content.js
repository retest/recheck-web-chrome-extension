// content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_clicked') {
		sendResponse({
			'allElements' : JSON.stringify(allElements),
			'title' : document.title
		});
	}
});
