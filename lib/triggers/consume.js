const kafkaConnections = require('../kafka');
const getAuthFromSecretConfig = require('../helpers');

// eslint-disable-next-line no-unused-vars
async function processTrigger(msg, cfg, snapshot) {
	const emitter = this;
	const config = cfg;
	this.logger.info(`Consuming records from ${config.topic}`);

	if (config.injectSecret) {
		const { auth } = getAuthFromSecretConfig(config, emitter.logger);
		config['sasl-username'] = auth.basic.username;
		config['sasl-password'] = auth.basic.password;
	}

	const connectionName = kafkaConnections.createConnectionName(config);

	await kafkaConnections.checkForConsumerConnection(config, connectionName);
	try {
		await kafkaConnections.addSubscription(connectionName, config.topic, emitter);
	} catch (e) {
		emitter.logger.error('Error in adding subscription');
		throw new Error(e);
	}

	process.on('SIGINT', async () => {
		console.log('\nDisconnecting consumers...');
		await kafkaConnections.disconnectAllConsumers(emitter);
	});

	process.on('SIGTERM', async () => {
		console.log('\nDisconnecting consumers...');
		await kafkaConnections.disconnectAllConsumers(emitter);
	});
}

module.exports.process = processTrigger;