var extend = require('extend');

module.exports = function(grunt) {
	var browserifyBuildTask = {
		files: {
			'public/assets/bundle.js': ['client.js']
		},
		options: {
			transform: ['aliasify', 'brfs']
		}
	};

	// Project config
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			build: browserifyBuildTask,
			watch: extend({}, browserifyBuildTask, { options: { watch: true, keepAlive: true } })
		}
	});

	grunt.loadNpmTasks('grunt-browserify');

	grunt.registerTask('default', ['browserify:build']);
	grunt.registerTask('watch', ['browserify:watch']);
};