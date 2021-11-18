const { transform } = require('@openintegrationhub/ferryman');
const { authTypes } = require('./authTypes');

function getAuthFromSecretConfig(cfg, logger) {
	const returnConfig = { ...cfg };
	const { auth = {} } = returnConfig;

	// Use JSONata to populate cfg.auth object, works for all types but especially helpful for the MIXED type
	if (cfg.secretAuthTransform) {
		returnConfig.auth = transform(cfg, { customMapping: cfg.secretAuthTransform });
		logger.debug(`helpers.getAuthFromSecretConfig: after transforming auth config: ${JSON.stringify(returnConfig)}`);
		return returnConfig;
	}
	// Found username and password, authenticate with basic authentication
	if (cfg.username && cfg.passphrase) {
		auth.basic = auth.basic ? auth.basic : {};
		auth.type = authTypes.BASIC;
		auth.basic.username = cfg.username;
		auth.basic.password = cfg.passphrase;
	}
	returnConfig.auth = auth;
	logger.debug(`helpers.getAuthFromSecretConfig: config object is now: ${JSON.stringify(returnConfig)}`);
	return returnConfig;
}

module.exports = getAuthFromSecretConfig;