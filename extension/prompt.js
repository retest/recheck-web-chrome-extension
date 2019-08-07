// prompt.js, should be called in prompt.html

function $(id) {
	return document.getElementById(id);
}

function createGoldenMasterClicked() {
	alert("Create Clicked");
}

function cancelClicked() {
	if (chrome && chrome.runtime) {
		chrome.runtime.sendMessage({
			'message' : 'recheck-web_aborted'
		});
	}
	window.close();
}

function compareGoldenMasterClicked() {
	alert("Create Clicked");
}

window.addEventListener('load', function(event) {
	$('create').addEventListener('click', createGoldenMasterClicked);
	$('cancel').addEventListener('click', cancelClicked);
	$('compare').addEventListener('click', compareGoldenMasterClicked);
});

window.addEventListener('beforeunload', cancelClicked);
