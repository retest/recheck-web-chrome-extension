// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if ( request.message === "clicked_browser_action" ) {
    	var request = new XMLHttpRequest();
    	request.open("POST", "http://localhost:8080/api/v0.1.0/paths-webdata-mapping", true);
    	request.setRequestHeader('Content-Type', 'application/json');
    	request.send(JSON.stringify(allElements));
    }
  }
);
