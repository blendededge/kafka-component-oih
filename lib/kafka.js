const { Kafka } = require('kafkajs');
const messages = require('./messages');

class KafkaConnections {
	constructor() {
		this.consumers = new Map();
		this.admin = new Map();
	}

	createConnectionName(config) {
		return {
			username: config['sasl-username'],
			clientId: config.clientId,
			mechanism: config.mechanism,
			'bootstrap-servers': config['bootstrap-servers']
		};
	}

	async checkForConsumerConnection(config, connectionName) {
		// TO DO - Add further logic to check status of connection
		if (!this.consumers.has(connectionName)) {
			try {
				await this.addConsumerConnection(config, connectionName);
			} catch (e) {
				throw new Error(e);
			}
		}
	}

	async addConsumerConnection(config, connectionName) {
		const groupId = config.groupId ?? 'default';
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
				const msg = {
					topic, 
					partition,
					key: message.key,
					value: message.value
				};
				emitter.emit('data', messages.newMessage(msg));
				emitter.logger.info(`Consumed record from topic ${topic} with key ${message.key} and value ${message.value} of partition ${partition}`);
			} catch (e) {
				console.log(e);
				emitter.logger.error('Error while consuming records');
				throw new Error(e);
			}
		};
		await this.consumers.get(connectionName).run({
			eachMessage: messageCallback
		});
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
}

const kafkaConnections = new KafkaConnections();

module.exports = kafkaConnections;