const { Kafka } = require('kafkajs');
const messages = require('./messages');

class KafkaConnections {
	constructor() {
		this.consumers = new Map();
		this.producers = new Map();
		this.admin = new Map();
	}

	createConnectionName(config, topic) {
		return `USER_${config['sasl-username']}
		_CLIENT_ID_${config.clientId}
		_MECHANISM_${config.mechanism}
		_SERVERS_${config['bootstrap-servers']}
		_TOPIC_${topic || config.topic}`;
	}

	async checkForConsumerConnection(config, connectionName) {
		// TO DO - Add further logic to check status of connection
		if (!this.consumers.has(connectionName)) {
			try {
				await this.addConsumerConnection(config, connectionName);
				return false;
			} catch (e) {
				throw new Error(e);
			}
		}
		return true;
	}

	async checkForProducerConnection(config, connectionName) {
		// TO DO - Add further logic to check status of connection
		if (!this.producers.has(connectionName)) {
			try {
				await this.addProducerConnection(config, connectionName);
			} catch (e) {
				throw new Error(e);
			}
		}
	}

	async addConsumerConnection(config, connectionName) {
		const groupId = config.groupId || 'default';
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
		
		this.admin.set(connectionName, kafka.admin());
		this.consumers.set(connectionName, kafka.consumer({ groupId }));
		await this.consumers.get(connectionName).connect({ groupId });
	}

	async addSubscription(connectionName, topic, emitter) {
		await this.consumers.get(connectionName).subscribe({ topic });
		await this.addSubscriptionFunction(connectionName, emitter);
	}

	async addSubscriptionFunction(connectionName, emitter) {
		const messageCallback = async function({ topic, partition, message }) {
			try {
				console.log(message.key);
				const key = Buffer.from(message.key).toString();
				const value = JSON.parse(Buffer.from(message.value).toString());
				console.log(key, value);
				const msg = {
					topic, 
					partition,
					key,
					value
				};
				emitter.emit('data', messages.newMessage(msg)); 
				emitter.logger.info(`Consumed record from topic ${topic} with key ${message.key} and value ${message.value} of partition ${partition}`);
			} catch (e) {
				console.log(e);
				emitter.logger.error('Error while consuming records');
				throw new Error(e);
			}
		};
		this.consumers.get(connectionName).run({
			eachMessage: messageCallback
		});
	}

	async addProducerConnection(config, connectionName) {
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
		
		this.admin.set(connectionName, kafka.admin());
		this.producers.set(connectionName, kafka.producer());
		await this.producers.get(connectionName).connect();
	}

	async ensureTopicExists(connectionName, topic) {
		const admin = await this.admin.get(connectionName);
		const topics = await admin.listTopics();
		if (!topics.includes(topic)) {
			await admin.createTopics({
				topics: [
					{
						topic,
						replicationFactor: 3
					}
				]
			});
		}
		await admin.disconnect();
	}

	async disconnectOneConsumer(connectionName, emitter) {
		try {
			await this.consumers.get(connectionName).disconnect();
		} catch (e) {
			emitter.logger.error('Error while disconnecting');
			throw new Error(e);
		}
	}

	async disconnectAllConsumers(emitter) {
		this.consumers.forEach(async (connection) => {
			try {
				await connection.disconnect();
			} catch (e) {
				emitter.logger.error('Error while disconnecting');
				throw new Error(e);
			}
		});
	}

	async disconnectOneProducer(connectionName, emitter) {
		try {
			await this.producers.get(connectionName).disconnect();
		} catch (e) {
			emitter.logger.error('Error while disconnecting');
			throw new Error(e);
		}
	}

	async disconnectAllProducers(emitter) {
		this.producers.forEach(async (connection) => {
			try {
				await connection.disconnect();
			} catch (e) {
				emitter.logger.error('Error while disconnecting');
				throw new Error(e);
			}
		});
	}
}

const kafkaConnections = new KafkaConnections();

module.exports = kafkaConnections;