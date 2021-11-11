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

describe('produce action', () => {
	let process, kafka, emit;
	beforeEach(() => {
		kafka = td.replace('../lib/kafka');
		emit = td.function();
		process = require('../lib/actions/produce').process;

		td.when(kafka.createKafka(td.matchers.anything())).thenReturn(kafkaClient);
		td.when(emit('data', { topic: 'test-topic', partition: 0 }));
	});

	afterEach(() => {
		td.reset();
	});

	it('produce message', async () => {
		await process.call(
			{ 
				emit: (type, body) => body, 
				logger: {
					debug: (data) => data
				}
			}, 
			{}, 
			componentConfig, 
			{}
		);
		td.verify(emit('data', { topic: 'test-topic', partition: 0 }));
	});

	it('reconnect on error', async () => {
	});

	it('on error emit exception', async () => {
	});

});
