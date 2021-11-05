# Kafka-component

This is the Apache Kafka component for the Open Integration Hub platform

The **Kafka component** is a simple yet powerful component that allows you to consume or produce messages to Kafka topics without programming your own components and deploying them into the platform.

This document covers the following topics:

- [Introduction](#introduction)
- [Secret Service Integration](#secret-service-integration)

## Introduction



### Secret Service Integration

To securely retrieve credentials from the secret service ferryman will inject a secret object by specifying the `credential_id` at the top level of a component configuration in a flow.  The `credential_id` should be a secret service secret ID.

The secret service can currently support these secret types:
- SIMPLE - Constains a `username` and `passphrase` and will be used for `Basic Auth`
- MIXED - The `payload` of this type is a stringified JSON object. The `payload` string is parsed into an object before being added to the component config object. Because of the flexible nature of this type a JSONata transformation config is provided `secretAuthTransform`. The output of this transformation will replace the `config.auth` configuration.  The `secretAuthTransform` will work for tranforming the data for other types but isn't necessary since the other secret types have well-defined structure.
- API_KEY - Contains a `key` and `headerName` and will be used for `API Key Auth`
- OA1_TWO_LEGGED - Contains `expiresAt`
- OA1_THREE_LEGGED - Contains `accessToken` which will be sent as a Bearer Token in the request header
- OA2_AUTHORIZATION_CODE - Contains `accessToken` which will be sent as a Bearer Token in the request header
- SESSION_AUTH - Contains `accessToken` which will be sent as a Bearer Token in the request header
