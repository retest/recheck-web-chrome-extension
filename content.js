// content.js

const WANTED_WIDTH = 1200;

function getOs() {
	return navigator.oscpu;
}

function getBrowser() {
	return navigator.vendor + ' ' + navigator.vendorSub;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_clicked') {
		var htmlNode = document.getElementsByTagName("html")[0];
		var html = transform(htmlNode);
		var allElements = mapElement(htmlNode, "//html[1]", {
			"//html[1]" : html
		});
		sendResponse({
			'message' : 'recheck-web_send_data',
			'allElements' : JSON.stringify(allElements),
			'title' : document.title,
			'url' : window.location.href,
			'os' : getOs(),
			'browser' : getBrowser(),
			'screenWidth' : screen.width,
			'screenHeight' : screen.height
			
		});
	}
	if (request.message === 'recheck-web_resize_img') {
		resizeDataUrl(request.dataUrl);
		sendResponse();
	}
});
