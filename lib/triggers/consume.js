const { createKafka } = require('../kafka');
const messages = require('../messages');

// eslint-disable-next-line no-unused-vars
async function processTrigger(msg, cfg, snapshot) {
	const config = cfg;
	const groupId = config.groupId ?? 'default';
	if (config.usage) {
		return console.log(config.usage);
	}
	this.logger.info(`Consuming records from ${config.topic}`); 

	const kafka = await createKafka(config);

	const consumer = kafka.consumer({ groupId });
	await consumer.connect({ groupId });
	await consumer.subscribe({ topic: config.topic });

	consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			const msg = {
				topic,
				partition,
				key: message.key,
				value: message.value
			};
			this.emit('data', messages.newMessage(msg));
			this.logger.info(`Consumed record from topic ${topic} with key ${message.key} and value ${message.value} of partition ${partition}`);
		}
	});

	process.on('SIGINT', () => {
		console.log('\nDisconnecting consumer...');
		consumer.disconnect();
	});
}

module.exports.process = processTrigger;