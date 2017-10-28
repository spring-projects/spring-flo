'use strict';

const path = require("path");
const rimraf = require('rimraf');

const directoryToDelete = 'node_modules';
const fullPath = path.resolve(directoryToDelete);

console.log('Executing PostInstall - Deleting: ' + fullPath);

rimraf(fullPath, function(error) {
	if (error) {
		console.log('Error: ', error);
	}
});

