const { transform } = require('@openintegrationhub/ferryman');
const { authTypes } = require('./authTypes');

function getAuthFromSecretConfig(cfg, logger) {
	const {
		username, passphrase, secretAuthTransform,
	} = cfg;
	const returnConfig = { ...cfg };
	const { auth = {} } = returnConfig;

	// Use JSONata to populate cfg.auth object, works for all types but especially helpful for the MIXED type
	if (secretAuthTransform) {
		returnConfig.auth = transform(cfg, { customMapping: secretAuthTransform });
		logger.debug(`helpers.getAuthFromSecretConfig: after transforming auth config: ${JSON.stringify(returnConfig)}`);
		return returnConfig;
	}
	// Found username and password, authenticate with basic authentication
	if (username && passphrase) {
		auth.basic = auth.basic ? auth.basic : {};
		auth.type = authTypes.BASIC;
		auth.basic.username = username;
		auth.basic.password = passphrase;
	}
	returnConfig.auth = auth;
	logger.debug(`helpers.getAuthFromSecretConfig: config object is now: ${JSON.stringify(returnConfig)}`);
	return returnConfig;
}

module.exports = getAuthFromSecretConfig;