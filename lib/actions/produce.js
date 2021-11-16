const getAuthFromSecretConfig = require('../helpers');
const kafkaConnections = require('../kafka');
const { newMessage } = require('../messages');

/**
 * Executes the action logic and initializes a Kafka producer. Produces messages provided via cfg 
 * @param {Object} msg 
 * @param {Object} cfg 
 * @param {Object} snapshot 
 * @returns 
 */
// eslint-disable-next-line no-unused-vars
async function processAction(msg, cfg, snapshot) {
	const emitter = this;
	const config = cfg;
	if (config.usage) {
		return console.log(config.usage);
	}
	const topic = msg.data.topic ?? config.topic;
	const messages = msg.data.messages ?? config.messages;

	const { auth } = getAuthFromSecretConfig(config, emitter.logger);
	if (auth) {
		config['sasl-username'] = auth.basic.username;
		config['sasl-password'] = auth.basic.password;
	}
	
	const connectionName = kafkaConnections.createConnectionName(config);
	await kafkaConnections.checkForProducerConnection(config, connectionName);
	await kafkaConnections.ensureTopicExists(connectionName, config.topic);

	const producer = kafkaConnections.producers.get(connectionName);
	let response;
	try {
		response = await producer.send({
			topic,
			messages
		});
	} catch (e) {
		emitter.logger.error('Error in sending messages');
		throw new Error(e);
	}

	response.forEach(record => {
		const data = {
			topic: record.topicName,
			partition: record.partition
		};
		emitter.logger.debug(`Successfully posted record to topic "${data.topic}" partition ${data.partition}`);
		emitter.emit('data', newMessage(data));
	});

	emitter.emit('end');

	process.on('SIGINT', async () => {
		console.log('\nDisconnecting producers...');
		await kafkaConnections.disconnectAllProducers(emitter);
	});

	process.on('SIGTERM', async () => {
		console.log('\nDisconnecting producers...');
		await kafkaConnections.disconnectAllProducers(emitter);
	});
}

module.exports.process = processAction;