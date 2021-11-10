const { createKafka } = require('../kafka');

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
			const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
			console.log(`- ${prefix} ${message.key}#${message.value}`);
		}
	});

	process.on('SIGINT', () => {
		console.log('Disconnecting consumer...');
		consumer.disconnect();
	});
}

module.exports.process = processTrigger;