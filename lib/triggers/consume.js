const kafkaConnections = require('../kafka');
const getAuthFromSecretConfig = require('../helpers');
const { wrapper } = require('@blendededge/ferryman-extensions');

// eslint-disable-next-line no-unused-vars
async function processTrigger(msg, cfg, snapshot) {
	const emitter = wrapper(this, msg, cfg, snapshot);
	const config = cfg;
	this.logger.info(`Consuming records from ${config.topic}`);

	const { auth } = getAuthFromSecretConfig(config, emitter.logger);
	if (auth && auth.basic) {
		config['sasl-username'] = auth.basic.username;
		config['sasl-password'] = auth.basic.passphrase;
	}

	const connectionName = kafkaConnections.createConnectionName(config);

	const existingConnection = await kafkaConnections.checkForConsumerConnection(config, connectionName);
	if (!existingConnection) {
		try {
			await kafkaConnections.addSubscription(connectionName, config.topic, emitter);
		} catch (e) {
			emitter.logger.error('Error in adding subscription');
			throw new Error(e);
		}
	}

	process.on('SIGINT', async () => {
		console.log('\nDisconnecting consumers...');
		await kafkaConnections.disconnectAllConsumers(emitter);
	});

	process.on('SIGTERM', async () => {
		console.log('\nDisconnecting consumers...');
		await kafkaConnections.disconnectAllConsumers(emitter);
	});

	emitter.emit('end');
}

module.exports.process = processTrigger;