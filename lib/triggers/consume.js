const kafkaConnections = require('../kafka');

// eslint-disable-next-line no-unused-vars
async function processTrigger(msg, cfg, snapshot) {
	const emitter = this;
	const config = cfg;
	if (config.usage) {
		return console.log(config.usage);
	}
	this.logger.info(`Consuming records from ${config.topic}`); 

	const connectionName = kafkaConnections.createConnectionName(config);

	await kafkaConnections.checkForConsumerConnection(config, connectionName);
	await kafkaConnections.addSubscription(connectionName, config.topic, emitter);

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