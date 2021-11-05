module.exports = {
	env: {
		es2021: true,
		mocha: true,
		node: true,
	},
	extends: 'eslint:recommended',
	parserOptions: {
		'ecmaVersion': 13,
		'sourceType': 'module'
	},
	rules: {
		indent: [
			'error',
			'tab'
		],
		'max-len': ['error', { code: 180 }],
		'linebreak-style': [
			'error',
			'unix'
		],
		quotes: [
			'error',
			'single'
		],
		semi: [
			'error',
			'always'
		]
	}
};
