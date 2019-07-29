// content.js

function getOs() {
	return navigator.oscpu;
}

function getBrowser() {
	return navigator.vendor + ' ' + navigator.vendorSub;
}

function getScreensize() {
	if (screen.width) {
		width = (screen.width) ? screen.width : '';
		height = (screen.height) ? screen.height : '';
		return '' + width + 'x' + height;
	}
}

function resizeDataUrl(dataUrl, wantedWidth, wantedHeight, callback) {
	var img = document.createElement('img');

	img.onload = function() {
		// We create a canvas and get its context.
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		// We set the dimensions at the wanted size.
		canvas.width = wantedWidth;
		canvas.height = wantedHeight;

		// We resize the image with the canvas method drawImage();
		ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

		var newDataUrl = canvas.toDataURL();
		chrome.runtime.sendMessage({
			'message' : 'recheck-web_resize_img',
			'dataUrl' : newDataUrl
		});
	};

	// We put the Data URI in the image's src attribute
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
			'screensize' : getScreensize()
		});
	}
	if (request.message === 'recheck-web_resize_img') {
		resizeDataUrl(request.dataUrl, request.width, request.height);
		sendResponse();
	}
});
