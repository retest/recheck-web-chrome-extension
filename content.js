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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === 'recheck-web_clicked') {
		var htmlNode = document.getElementsByTagName("html")[0];
		var html = transform(htmlNode);
		var allElements = mapElement(htmlNode, "//html[1]", {
			"//html[1]": html
		});
		sendResponse({
			'allElements' : JSON.stringify(allElements),
			'title' : document.title,
			'url' : window.location.href,
			'os' : getOs(),
			'browser' : getBrowser(),
			'screensize' : getScreensize()
		});
	}
});
