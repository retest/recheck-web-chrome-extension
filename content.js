// content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_clicked') {
		var htmlNode = document.getElementsByTagName("html")[0];
		var html = transform(htmlNode);
		var allElements = mapElement(htmlNode, "//html[1]", {
			"//html[1]": html
		});
		sendResponse({
			'allElements' : JSON.stringify(allElements),
			'title' : document.title
		});
	}
});
