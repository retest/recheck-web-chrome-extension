// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if ( request.message === 'clicked_recheck-web' ) {
    	var name = prompt('Please enter the name of the check: ', document.title);
    	if (name == null || name == '') {
    		return;
    	} 
    	var xhr = new XMLHttpRequest();
    	xhr.open('POST', 'http://localhost:8080/api/v1.3.0/paths-webdata-mapping', true);
    	xhr.setRequestHeader('Content-Type', 'application/json');
    	xhr.setRequestHeader('Authorization', 'Bearer ' + request.token);
    	xhr.onreadystatechange = function() {
    	    if (xhr.readyState === 4) {
    	      alert(xhr.response);
    	    }
    	}
    	xhr.send(JSON.stringify({
    		'allElements': allElements,
    		'name': name
    	}));
    }
  }
);
