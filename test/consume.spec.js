/* eslint-disable no-unused-vars */
const td = require('testdouble');
const { expect } = require('chai');

const kafkaClient = {};
kafkaClient.consumer = () => {
	return {
		connect: () => true,
		subscribe: () => true,
		disconnect: () => true,
		run: () => true
	};
};

const componentConfig = {
	topic: 'test-topic',
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
errorKafka.consumer.run = () => new Error('Error in consuming records');

describe('consume action', () => {
	let process, kafka, emit, that, error;
	beforeEach(() => {
		that = {
			emit: (data, msg) => msg,
			logger: {
				info: () => true,
				error: () => true
			}
		};

		kafka = td.replace('../lib/kafka');
		emit = td.function();
		error = td.function();
		process = require('../lib/triggers/consume').process;
	
		td.when(kafka.createKafka(componentConfig)).thenReturn(kafkaClient);
		td.when(kafka.createKafka(errorComponentConfig)).thenReturn(errorKafka);
		td.when(emit('data', { topic: 'test-topic', partition: 0, key: 'hello', value: 'world' }));
		td.when(error(td.matchers.anything()));
	});

	afterEach(() => {
		td.reset();
	});

	it('consume message', async () => {
		await process.call(that, {}, componentConfig, {});
		td.verify(emit('data', { topic: 'test-topic', partition: 0, key: 'hello', value: 'world' }));
	});

	it('reconnect on error', async () => {
	});

	it('on error emit exception', async () => {
		await process.call(that, {}, errorComponentConfig, {});
		td.verify(error(td.matchers.anything()));
	});

});
