window.CaptureAPI = (function() {

	var MAX_PRIMARY_DIMENSION = 15000 * 2;
	var MAX_SECONDARY_DIMENSION = 4000 * 2;
	var MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;

	//
	// URL Matching test - to verify we can talk to this URL
	//
	var matches = [ 'http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*' ];
	var noMatches = [ /^https?:\/\/chrome.google.com\/.*$/ ];

	function isValidUrl(url) {
		// couldn't find a better way to tell if executeScript
		// wouldn't work -- so just testing against known urls
		// for now...
		var r, i;
		for (i = noMatches.length - 1; i >= 0; i--) {
			if (noMatches[i].test(url)) {
				return false;
			}
		}
		for (i = matches.length - 1; i >= 0; i--) {
			r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
			if (r.test(url)) {
				return true;
			}
		}
		return false;
	}

	function initiateCapture(tab, callback) {
		console.log("Sending scroll request.");
		chrome.tabs.sendMessage(tab.id, {
			msg : 'scrollPage'
		}, function() {
			// We're done taking snapshots of all parts of the window. Display
			// the resulting full screenshot images in a new browser tab.
			callback();
		});
	}

	function capture(data, screenshots, sendResponse, splitnotifier) {
		console.log("Capturing screenshot.");
		chrome.tabs.captureVisibleTab(activeWindowId, {
			format : 'png',
			quality : 100
		}, function(dataURI) {
			if (dataURI) {
				var image = new Image();
				image.onload = function() {
					data.image = {
						width : image.width,
						height : image.height
					};

					// given device mode emulation or zooming,
					// we may end up with
					// a different sized image than expected, so
					// let's adjust to
					// match it!
					if (data.windowWidth !== image.width) {
						var scale = image.width / data.windowWidth;
						console.log("Found window width is not image width, using scaele: " + scale);
						data.x *= scale;
						data.y *= scale;
						data.totalWidth *= scale;
						data.totalHeight *= scale;
					}

					// lazy initialization of screenshot
					// canvases (since we need to wait
					// for actual image size)
					if (!screenshots.length) {
						Array.prototype.push.apply(screenshots, _initScreenshots(data.totalWidth, data.totalHeight));
						if (screenshots.length > 1) {
							if (splitnotifier) {
								splitnotifier();
							}
						}
					}

					// draw it on matching screenshot canvases
					_filterScreenshots(data.x, data.y, image.width, image.height, screenshots).forEach(function(screenshot) {
						console.log("Drawing image on " + (data.x - screenshot.left) + "/" + (data.y - screenshot.top) + ".");
						screenshot.ctx.drawImage(image, data.x - screenshot.left, data.y - screenshot.top);
					});

					// send back log data for debugging (but
					// keep it truthy to
					// indicate success)
					console.log("Sending screenshot.");
					sendResponse(JSON.stringify(data, null, 4) || true);
				};
				image.src = dataURI;
			}
		});
	}

	function _initScreenshots(totalWidth, totalHeight) {
		// Create and return an array of screenshot objects based
		// on the `totalWidth` and `totalHeight` of the final image.
		// We have to account for multiple canvases if too large,
		// because Chrome won't generate an image otherwise.
		//
		var badSize = (totalHeight > MAX_PRIMARY_DIMENSION || totalWidth > MAX_PRIMARY_DIMENSION || totalHeight * totalWidth > MAX_AREA);
		var biggerWidth = totalWidth > totalHeight;
		var maxWidth = (!badSize ? totalWidth : (biggerWidth ? MAX_PRIMARY_DIMENSION : MAX_SECONDARY_DIMENSION));
		var maxHeight = (!badSize ? totalHeight : (biggerWidth ? MAX_SECONDARY_DIMENSION : MAX_PRIMARY_DIMENSION));
		var numCols = Math.ceil(totalWidth / maxWidth);
		var numRows = Math.ceil(totalHeight / maxHeight), row, col, canvas, left, top;

		var canvasIndex = 0;
		var result = [];

		for (row = 0; row < numRows; row++) {
			for (col = 0; col < numCols; col++) {
				var canvas = document.createElement('canvas');
				canvas.width = (col == numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth);
				canvas.height = (row == numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight);

				var left = col * maxWidth;
				var top = row * maxHeight;

				result.push({
					canvas : canvas,
					ctx : canvas.getContext('2d'),
					index : canvasIndex,
					left : left,
					right : left + canvas.width,
					top : top,
					bottom : top + canvas.height
				});

				canvasIndex++;
			}
		}

		return result;
	}

	function _filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
		// Filter down the screenshots to ones that match the location
		// of the given image.
		//
		var imgRight = imgLeft + imgWidth;
		var imgBottom = imgTop + imgHeight;
		return screenshots.filter(function(screenshot) {
			return (imgLeft < screenshot.right && imgRight > screenshot.left && imgTop < screenshot.bottom && imgBottom > screenshot.top);
		});
	}

	function getDataURLs(screenshots) {
		return screenshots.map(function(screenshot) {
			var dataURI = screenshot.canvas.toDataURL();
			return dataURI;
		});
	}

	function captureToDataUrls(tab, callback, errback, progress, splitnotifier) {
		console.log("Received screenshot request.");
		var loaded = false;
		var screenshots = [];
		var timeout = 3000;
		var timedOut = false;
		var noop = function() {};

		callback = callback || noop;
		errback = errback || noop;
		progress = progress || noop;

		if (!isValidUrl(tab.url)) {
			errback('invalid url'); // TODO errors
		}

		var listener = function(request, sender, sendResponse) {
			if (request.msg === 'capture') {
				console.log("Received capture request.");
				progress(request.complete);
				capture(request, screenshots, sendResponse, splitnotifier);

				// https://developer.chrome.com/extensions/messaging#simple
				//
				// If you want to asynchronously use sendResponse, add return
				// true;
				// to the onMessage event handler.
				//
				return true;
			}
		};
		if (!window.hasCaptureListener) {
			window.hasCaptureListener = true;
			chrome.runtime.onMessage.addListener(listener);
		}

		chrome.tabs.executeScript(tab.id, {
			file : 'page.js'
		}, function() {
			if (timedOut) {
				console.error('Timed out too early while waiting for ' + 'chrome.tabs.executeScript. Try increasing the timeout.');
			} else {
				loaded = true;
				progress(0);

				initiateCapture(tab, function() {
					callback(getDataURLs(screenshots));
				});
			}
		});

		window.setTimeout(function() {
			if (!loaded) {
				timedOut = true;
				errback('execute timeout');
			}
		}, timeout);
	}

	return {
		captureToDataUrls : captureToDataUrls
	};

})();
