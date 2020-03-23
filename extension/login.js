var keycloak = Keycloak({
	url : 'https://login.retest.de/auth',
	realm : 'customer',
	clientId : 'rehub'
});

window.addEventListener("load", function(event) {
	keycloak.init({
		onLoad : 'login-required'
	}).success(function() {
		console.log("Sending login info.");
		var email = null;
		if (keycloak.idTokenParsed) {
			email = keycloak.idTokenParsed.upn;
		}
		chrome.runtime.sendMessage({
			'message' : 'recheck-web_login',
			'token' : keycloak.token,
			'email' : email
		});
		window.close();
	}).error(function(errorData) {
		document.getElementById('messages').innerHTML = '<b>Failed to load data. Error: ' + JSON.stringify(errorData) + '</b>';
	});
});

if (chrome.runtime) {
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.message === 'recheck-web_aborted') {
			window.close();
		}
	});
}