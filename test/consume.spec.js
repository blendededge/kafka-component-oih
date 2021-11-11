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

describe('consume action', () => {
	let process, kafka, emit, that;
	beforeEach(() => {
		that = {
			emit: (data, msg) => msg,
			logger: {
				info: () => true
			}
		};

		kafka = td.replace('../lib/kafka');
		emit = td.function();
		process = require('../lib/triggers/consume').process;
	
		td.when(kafka.createKafka(td.matchers.anything())).thenReturn(kafkaClient);
		td.when(emit('data', { topic: 'test-topic', partition: 0, key: 'hello', value: 'world' }));
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
	});

});
