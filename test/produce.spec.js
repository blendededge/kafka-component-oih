/* eslint-disable no-unused-vars */
const td = require('testdouble');
const { expect } = require('chai');

const kafkaClient = {};
kafkaClient.producer = () => {
	return {
		connect: () => true,
		send: () => [{
			topicName: 'test-topic',
			partition: 0
		}],
		disconnect: () => true
	};
};
kafkaClient.admin = () => {
	return {
		connect: () => true,
		listTopics: () => ['test-topic'],
		disconnect: () => true
	};
};
const componentConfig = {
	topic: 'test-topic',
	messages: [
		{key: 'hello', value: 'world'}
	],
	'bootstrap-servers': 'test',
	'sasl-username': 'test',
	'sasl-password': 'test',
	'security-protocol': 'sasl_plain',
	'sasl-mechanisms': 'PLAIN',
};

const errorComponentConfig = {
	...componentConfig,
	topic: 'test-topic-error'
};

const errorKafka = kafkaClient;
errorKafka.producer.send = () => new Error('Error in sending messages');

describe('produce action', () => {
	let process, kafka, emit, that, error;
	beforeEach(() => {
		that = {
			emit: (data, msg) => msg,
			logger: {
				info: () => true,
				debug: () => true,
				error: () => true
			}
		};

		kafka = td.replace('../lib/kafka');
		emit = td.function();
		error = td.function();
		process = require('../lib/actions/produce').process;

		td.when(kafka.createKafka(componentConfig)).thenReturn(kafkaClient);
		td.when(kafka.createKafka(errorComponentConfig)).thenReturn(errorKafka);
		td.when(emit('data', { topic: 'test-topic', partition: 0 }));
		td.when(error(td.matchers.anything()));
	});

	afterEach(() => {
		td.reset();
	});

	it('produce message', async () => {
		await process.call(that, {}, componentConfig, {});
		td.verify(emit('data', { topic: 'test-topic', partition: 0 }));
	});

	it('reconnect on error', async () => {
	});

	it('on error emit exception', async () => {
		await process.call(that, {}, errorComponentConfig, {});
		td.verify(error(td.matchers.anything()));
	});

});
