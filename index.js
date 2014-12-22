var fs = require('fs');
var express = require('express');
var netApi = require('net-browserify/api');

// Create a server
var server = require('http').createServer();

var app = express();
app.set('port', process.env.PORT || 3000);
server.addListener('request', app);

app.get('/manifest.webapp', function (req, res, next) {
	res.type('application/x-web-app-manifest+json');
	next();
});
app.use(express.static(__dirname+'/public'));
app.use(netApi(server, {
	to: [{ host: 'localhost', port: 5500 }]
}));

server.listen(app.get('port'), function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);
});