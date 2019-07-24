var keycloak = Keycloak({
    url: 'https://sso.prod.cloud.retest.org/auth',
    realm: 'customer',
    clientId: 'marvin'
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message === "clicked_recheck-web") {
		console.log('Got message about click.' );
	}
});


var reloadData = function () {
    keycloak.updateToken(10)
            .success(function() {
            	window.close();
            })
            .error(function() {
                alert('Failed to updateToken.');
            });
}

document.addEventListener('DOMContentLoaded', function () {
	keycloak.init({ onLoad: 'login-required' })
		.success(function(authenticated) {
			if (authenticated) {
		        chrome.runtime.sendMessage({'message': 'recheck-web_login' });
			}
			window.close();
		})
		.error(function() {
			alert('Failed to initialize keycloak!');
		});
});
