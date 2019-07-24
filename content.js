// content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_clicked') {
		var name = prompt('Please enter the name of the check: ',
				document.title);
		if (name == null || name == '') {
			return;
		}
		sendResponse({
			'allElements' : JSON.stringify(allElements),
			'name' : name
		});
	}
});
