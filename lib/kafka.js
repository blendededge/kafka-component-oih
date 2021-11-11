const { Kafka } = require('kafkajs');

async function createKafka(config) {
	const sasl = {
		username: config['sasl-username'],
		password: config['sasl-password'],
		mechanism: config.mechanism
	};
	const ssl = !!sasl;
	
	const kafka = new Kafka({
		clientId: config.clientId,
		brokers: [config['bootstrap-servers']],
		ssl, 
		sasl
	});

	return kafka;
}

async function ensureTopicExists(kafka, topic) {
	const admin = kafka.admin();
	await admin.connect();

	const topics = await admin.listTopics();
	if (!topics.includes(topic)) {
		await admin.createTopics({
			topics: [
				{
					topic,
					replicationFactor: 3
				}
			]});
	}

	await admin.disconnect();
}

module.exports = {
	createKafka,
	ensureTopicExists
};