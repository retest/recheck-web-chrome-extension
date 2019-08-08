// prompt.js, should be called in prompt.html

function $(id) {
	return document.getElementById(id);
}

function createGoldenMasterClicked() {
	if (chrome && chrome.runtime) {
		chrome.runtime.sendMessage({
			'message' : 'recheck-web_sendGMName',
			'name' : $('createName').value,
			'action' : 'create-overwrite'
		});
	}
	window.close();
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
	var existing = $('compareName');
	var selected = existing.options[existing.selectedIndex].value;
	if (chrome && chrome.runtime) {
		chrome.runtime.sendMessage({
			'message' : 'recheck-web_sendGMName',
			'name' : selected,
			'action' : 'compare'
		});
	}
	window.close();
}

function checkGoldenMasterExists() {
	var existing = $('compareName');
	var textField = $('createName');
	var button = $('create');
	for (i = 0; i < existing.length; ++i) {
		if (existing.options[i].value === textField.value) {
			existing.selectedIndex = i;
			button.innerHTML = 'Overwrite Existing';
			button.title = 'Will overwrite the existing Golden Master with that name!';
			textField.classList.add('warn');
			textField.title = 'Will overwrite the existing Golden Master with that name!';
			return;
		}
	}
	button.innerHTML = 'Create';
	button.title = '';
	textField.classList.remove('warn');
	textField.title = '';
}

function appendOption(select, text) {
	var option = document.createElement('option');
	option.textContent = text;
	option.value = text;
	select.appendChild(option);
}

function loadExistingGoldenMasters(existing) {
	var select = $('compareName');
	// clear all
	while (select.firstChild) {
		select.removeChild(select.firstChild);
	}
	appendOption(select, '');
	for (var i = 0; i < existing.length; i++) {
		appendOption(select, existing[i]);
	}
}

window.addEventListener('load', function(event) {
	$('create').addEventListener('click', createGoldenMasterClicked);
	$('cancel').addEventListener('click', cancelClicked);
	$('compare').addEventListener('click', compareGoldenMasterClicked);
	$('createName').addEventListener('input', checkGoldenMasterExists);
	if (chrome && chrome.runtime) {
		chrome.runtime.sendMessage({
			'message' : 'recheck-web_sendExistingGMs'
		}, loadExistingGoldenMasters);
	}
});

window.addEventListener('beforeunload', cancelClicked);

if (chrome.runtime) {
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.message === 'recheck-web_aborted') {
			window.close();
		}
	});
}
