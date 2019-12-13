// content.js

if (!alreadyInjected) {

	var alreadyInjected = true;

	var WANTED_WIDTH = 800;

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
		    // Fixes dual-screen position                         Most browsers      Firefox
		    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : window.screenX;
		    var dualScreenTop = window.screenTop != undefined ? window.screenTop : window.screenY;

		    var windowWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
		    
		    var systemZoom = windowWidth / window.screen.availWidth;
			sendResponse({
				'message' : 'recheck-web_send_data',
				'allElements' : JSON.stringify(allElements),
				'title' : document.title,
				'url' : window.location.href,
				'os' : getOs(),
				'browser' : getBrowser(),
				'dualScreenLeft' : dualScreenLeft,
				'dualScreenTop' : dualScreenTop,
				'windowWidth' : screen.width,
				'windowHeight' : screen.height,
				'systemZoom' : systemZoom
			});
		}
		if (request.message === 'recheck-web_resize_img') {
			request.dataUrls.forEach(function(dataUrl) {
				resizeDataUrl(dataUrl);
			});
			sendResponse();
		}
	});
}
