const kafkaConnections = require('../kafka');
const getAuthFromSecretConfig = require('../helpers');
const { wrapper } = require('@blendededge/ferryman-extensions');

// eslint-disable-next-line no-unused-vars
async function processTrigger(msg, cfg, snapshot, headers, tokenData) {
	let emitter = this;
	let config = cfg;
	try {
		emitter = await wrapper(this, msg, cfg, snapshot, headers, tokenData);
		emitter.logger.info(`Consuming records from ${config.topic}`);

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
				throw e;
			}
		}

		process.on('SIGINT', async () => {
			console.info('\nDisconnecting consumers...');
			emitter.logger.info('SIGINT signal received. Disconnecting consumers...');
			await kafkaConnections.disconnectAllConsumers(emitter);
		});

		process.on('SIGTERM', async () => {
			console.info('\nDisconnecting consumers...');
			emitter.logger.info('SIGTERM signal received. Disconnecting consumers...');
			await kafkaConnections.disconnectAllConsumers(emitter);
		});
	} catch (e) {
		emitter.emit('error', e);
		emitter.logger.error(`Error in consuming records from ${config.topic}: ${e}`);
	}
}

module.exports.process = processTrigger;