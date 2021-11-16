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
		const checkForConsumerConnection = td.replace(kafkaConnections, 'checkForConsumerConnection');
		const addSubscription = td.replace(kafkaConnections, 'addSubscription');
		const disconnectAllConsumers = td.replace(kafkaConnections, 'disconnectAllConsumers');
		const getAuthFromSecretConfig = td.replace('../lib/helpers');
		td.when(checkForConsumerConnection(componentConfig, connectionName)).thenResolve(true);
		td.when(addSubscription(connectionName, componentConfig.topic, ANY_PARAM)).thenResolve(true);
		td.when(checkForConsumerConnection(errorComponentConfig, connectionName)).thenReject(new Error);
		td.when(disconnectAllConsumers(ANY_PARAM)).thenResolve(true);
		td.when(getAuthFromSecretConfig(componentConfig, ANY_PARAM)).thenReturn(undefined);

		process = require('../lib/triggers/consume').process;
	});

	afterEach(() => {
		td.reset();
	});

	it('consume message', async (done) => {
		process.call(that, {}, componentConfig, {});
		done();
	});

	it('reconnect on error', async () => {
	});

	it('on error emit exception', async (done) => {
		let error;
		try {
			process.call(that, {}, errorComponentConfig, {});
			done();
		} catch (e) {
			error = e;
		}
		expect(error.message).to.include('Error');
	});

});
