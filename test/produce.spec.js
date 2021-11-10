/* eslint-disable no-unused-vars */
const td = require('testdouble');
const kafka = require('../lib/kafka');

// Test still in progress
// Currently trying to get the createKafka function to be mocked somehow.
describe('produce action', () => {
	const kafkaClient = {
		producer: {
			connect: true,
			send: [{
				topicName: 'test-topic',
				partition: 0
			}],
			disconnect: true
		},
		admin: {
			connect: true,
			listTopics: ['test-topic'],
			disconnect: true
		}
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
	let process;
	beforeEach(() => {
		td.reset();
		process = require('../lib/actions/produce').process;
		const res = td.function(kafka);
		td.when(res(td.matchers.anything())).thenReturn('hi');
	});

	afterEach(() => {
		td.reset();
	});

	it('produce message', async () => {
		try {
			const res = await process({}, componentConfig, {});
			console.log(res);
		} catch (e) {
			console.log(e);
		}
	});

	it('reconnect on error', async () => {
	});

	it('on error emit exception', async () => {
	});

});
