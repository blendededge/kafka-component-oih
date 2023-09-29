/* eslint-disable no-unused-vars */
const td = require('testdouble');
const { expect } = require('chai');
const kafkaConnections = require('../lib/kafka');

const ANY_PARAM = td.matchers.anything();

const componentConfig = {
	topic: 'test-topic',
	mechanism: 'plain',
	clientId: '12345-clientId',
	groupId: '54321-groupId',
	'bootstrap-servers': 'test-server',
	'sasl-username': 'test-username',
	'sasl-password': 'test-password',
};

const auth = {
	basic: {
		username: 'test-username',
		password: 'test-password'
	}
};

const connectionName = {
	username: componentConfig['sasl-username'],
	clientId: componentConfig.clientId,
	mechanism: componentConfig.mechanism,
	'bootstrap-servers': componentConfig['bootstrap-servers']
};

const errorComponentConfig = {
	...componentConfig,
	topic: 'test-topic-error'
};

const producersStub = {
	get: () => {
		return {
			send: ({ topic }) => {
				if (topic === 'test-topic') {
					return [
						{
							topic,
							partition: 0
						}
					];
				} else {
					throw new Error();
				}
			}
		};
	}
};

describe('produce action', () => {
	let process, emit, that, error;
	beforeEach(() => {
		that = {
			emit: (data, msg) => msg,
			logger: {
				child: () => ({
					info: () => true,
					debug: () => true,
					error: () => true,
				}),
			}
		};

		const checkForProducerConnection = td.replace(kafkaConnections, 'checkForProducerConnection');
		const ensureTopicExists = td.replace(kafkaConnections, 'ensureTopicExists');
		const getAuthFromSecretConfig = td.replace('../lib/helpers');
		emit = td.function();
		error = td.function();
		td.replace(kafkaConnections, 'producers', producersStub);
		td.when(checkForProducerConnection(componentConfig, connectionName)).thenResolve(true);
		td.when(ensureTopicExists(connectionName, componentConfig.topic)).thenResolve(true);
		td.when(getAuthFromSecretConfig(componentConfig, ANY_PARAM)).thenReturn(auth);
		td.when(getAuthFromSecretConfig(errorComponentConfig, ANY_PARAM)).thenReturn(auth);
		td.when(emit('data', ANY_PARAM));
		td.when(error(ANY_PARAM));

		process = require('../lib/actions/produce').process;
	});

	afterEach(() => {
		td.reset();
	});

	it('produce message', async () => {
		await process.call(that, { data: {} }, componentConfig, {});
		td.verify(emit('data', ANY_PARAM));
	});

	it('reconnect on error', async () => {
	});

	it('on error emit exception', async () => {
		let error;
		try {
			await process.call(that, { data: {} }, errorComponentConfig, {});
		} catch (e) {
			error = e;
		}
		expect(error.message).to.contain('Error');
	});

});
