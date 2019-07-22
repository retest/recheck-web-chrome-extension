// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if ( request.message === "clicked_browser_action" ) {
    	alert("Hello from your Chrome extension!");
    	
        chrome.runtime.sendMessage({"message": "open_new_tab", "url": "https://retest.de" });
    }
  }
);
