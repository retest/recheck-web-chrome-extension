var keycloak = Keycloak({
    url: 'https://sso.prod.cloud.retest.org/auth',
    realm: 'customer',
    clientId: 'marvin'
});

var reloadData = function () {
    keycloak.updateToken(10)
            .success(function() {
                alert("User " + keycloak.idTokenParsed.email + " is logged in.");
            })
            .error(function() {
                alert('Failed to updateToken.');
            });
}

keycloak.init({ onLoad: 'login-required' })
	.success(function(authenticated) {
		alert(authenticated ? 'authenticated' : 'not authenticated');
	})
	.error(function() {
		alert('failed to initialize');
	});

keycloak.updateToken(10)
	.success(function() {
        alert("User " + keycloak.idTokenParsed.email + " is logged in.");
    })
	.error(function(errorData) {
		alert("Error updating token for user " + keycloak.idTokenParsed + ": " + errorData);
	});
