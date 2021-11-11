const { createKafka, ensureTopicExists } = require('../kafka');
const messages = require('../messages');

// eslint-disable-next-line no-unused-vars
async function processAction(msg, cfg, snapshot) {
	const config = cfg;
	if (config.usage) {
		return console.log(config.usage);
	}
	const kafka = await createKafka(config);

	await ensureTopicExists(kafka, config.topic);

	const producer = kafka.producer();
	await producer.connect();
	let response;
	try {
		response = await producer.send({
			topic: config.topic,
			messages: config.messages
		});
	} catch (e) {
		this.logger.error('Error in sending messages');
		throw new Error(e);
	}

	response.forEach(record => {
		const data = {
			topic: record.topicName,
			partition: record.partition
		};
		this.logger.debug(`Successfully posted record to topic "${data.topic}" partition ${data.partition}`);
		this.emit('data', messages.newMessage(data));
	});

	producer.disconnect();
}

module.exports.process = processAction;