// content.js

const WANTED_WIDTH = 1200;

function getOs() {
	return navigator.oscpu;
}

function getBrowser() {
	return navigator.vendor + ' ' + navigator.vendorSub;
}

function resizeDataUrl(dataUrl) {
	var img = document.createElement('img');

	img.onload = function() {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		canvas.width = WANTED_WIDTH;
		canvas.height = img.height * (WANTED_WIDTH / img.width);

		ctx.drawImage(this, 0, 0, canvas.width, canvas.height);

		var newDataUrl = canvas.toDataURL();
		chrome.runtime.sendMessage({
			'message' : 'recheck-web_resize_img',
			'dataUrl' : newDataUrl
		});
	};

	img.src = dataUrl;
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
		request.dataUrls.forEach(function(dataUrl) {
			resizeDataUrl(dataUrl);
		});
		sendResponse();
	}
});
