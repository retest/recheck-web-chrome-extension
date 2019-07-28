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

async function captureScreenshot(callback) {
	let promise = new Promise((resolve, reject) => {
		  domtoimage.toJpeg(document.body, { quality: 0.3 })
		  .then(function (dataUrl) {
			  callback(dataUrl);
		  })
		  .catch(function (error) {
			  callback('ERROR: Error creating screenshot for ' + window.location.href);
		  });
	});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_clicked') {
		captureScreenshot(function(dataUrl) {
			var htmlNode = document.getElementsByTagName("html")[0];
			var html = transform(htmlNode);
			var allElements = mapElement(htmlNode, "//html[1]", {
				"//html[1]": html
			});
			chrome.runtime.sendMessage({
				'message' : 'recheck-web-send_data',
				'allElements' : JSON.stringify(allElements),
				'screenshot' : dataUrl,
				'title' : document.title,
				'url' : window.location.href,
				'os' : getOs(),
				'browser' : getBrowser(),
				'screensize' : getScreensize()
			});
		});
		sendResponse();
	}
});
