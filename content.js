// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if ( request.message === 'clicked_recheck-web' ) {
    	var name = prompt('Please enter the name of the check: ', document.title);
    	if (name == null || name == '') {
    		return;
    	} 
    	var request = new XMLHttpRequest();
    	request.open('POST', 'http://localhost:8080/api/v0.1.0/paths-webdata-mapping', true);
    	request.setRequestHeader('Content-Type', 'application/json');
    	request.setRequestHeader('Authorization', 'Bearer ' + request.token);
    	request.onreadystatechange = function() {
    	    if (request.readyState === 4) {
    	      alert(request.response);
    	    }
    	}
    	request.send(JSON.stringify({
    		'allElements': allElements,
    		'name': name
    		}));
    }
  }
);
