// popup.js, should be included in the popup

function $(id) {
	return document.getElementById(id);
}
function show(id) {
	$(id).style.display = 'block';
}
function hide(id) {
	$(id).style.display = 'none';
}

chrome.runtime.sendMessage({
	'message' : 'recheck-web_popupOpened'
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_login') {
		show('login');
	}
	if (request.message === 'recheck-web_captureScreenshot') {
		show('captureScreenshot');
	}
	if (request.message === 'recheck-web_captureData') {
		show('captureData');
	}
	if (request.message === 'recheck-web_sendData') {
		show('sendData');
	}
	if (request.message === 'recheck-web_processing') {
		show('processing');
	}
	if (request.message === 'recheck-web_closePopup') {
		window.close();
	}
});
