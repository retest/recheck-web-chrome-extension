var keycloak = Keycloak({
// TODO url: 'https://sso.prod.cloud.retest.org/auth',
	url: 'https://sso.dev.cloud.retest.org/auth',
    realm: 'customer',
    clientId: 'marvin'
});

window.addEventListener("load", function(event) {
    keycloak.init({ onLoad: 'login-required' })
        .success(function(){
	        chrome.runtime.sendMessage({
	        	'message': 'recheck-web_login',
	        	'authenticated': keycloak.authenticated,
	        	'token': keycloak.token,
	        	'refreshToken': keycloak.refreshToken,
	        	'subject': keycloak.subject,
	        	'realmAccess': keycloak.realmAccess,
	        	'resourceAccess': keycloak.resourceAccess
	        });
			window.close();
        })
        .error(function(errorData) {
            document.getElementById('messages').innerHTML = '<b>Failed to load data. Error: ' + JSON.stringify(errorData) + '</b>';
        });
});
