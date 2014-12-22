var ClementineClient = require('clementine-remote').Client;
var covers = require('album-cover')('3f6675c78c4054c7ee6e361a06ec6cff');

window.addEventListener('polymer-ready', function () {

var elementsList = [
	'appPages',
	'pageLibrary', 'pageAlbum', 'pageArtist', 'pageNowPlaying',
	'connectDialog', 'connectDialogAddress', 'connectDialogRemember', 'connectDialogSubmit'
];
var elements = {};
for (var i = 0; i < elementsList.length; i++) {
	var el = elementsList[i];
	elements[el] = document.getElementById(el);
}

var clementine = {};
window.clementine = clementine; // Export API

clementine.connect = function (opts, done) {
	console.log('Connecting to local clementine server...');
	var client = ClementineClient(opts);

	var doneCalled = false;

	client.on('connect', function () {
		console.log('connected');
	});
	client.on('ready', function () {
		console.log('ready');

		elements.pageLibrary.load();

		if (done && !doneCalled) {
			done();
			doneCalled = true;
		}
	});
	client.on('disconnect', function (data) {
		console.log('client disconnecting', data);

		if (done && !doneCalled) {
			done({
				reason: data.reason_disconnect
			});
			doneCalled = true;
		}
	});
	client.on('end', function () {
		console.log('client disconnected');
	});

	client.on('error', function (err) {
		console.error('connection failed', err);

		if (done && !doneCalled) {
			done(err);
			doneCalled = true;
		}
	});

	client.on('message', function (msg) {
		if (msg.type == 45 || msg.type == 46) return;
		console.log(msg);
	});

	client.on('library', function (library) {
		library.saveToCache(function () {
			console.log('Library saved to cache.');
		});
	});

	this.client = client;
	elements.pageLibrary.client = client;
	elements.pageAlbum.client = client;
	elements.pageArtist.client = client;
	elements.pageNowPlaying.client = client;
};

clementine.disconnect = function () {
	this.client.disconnect();
	elements.connectDialog.disconnect();
};

clementine.openAlbum = function (data) {
	elements.pageAlbum.model = data;
	this.client.library.db.exec('SELECT title, album, artist, CAST(filename AS TEXT) AS filename FROM songs WHERE artist="'+data.artist+'" AND album="'+data.album+'" ORDER BY title', function (res) {
		elements.pageAlbum.tracks = res.results[0].values;
	});
	elements.appPages.selected = 1;
};

clementine.openArtist = function (data) {
	var that = this;

	elements.pageArtist.model = data;
	this.client.library.db.exec('SELECT title, album, artist, CAST(filename AS TEXT) AS filename FROM songs WHERE artist="'+data.artist+'" ORDER BY title', function (res) {
		elements.pageArtist.tracks = res.results[0].values;
		that.client.library.db.exec('SELECT album, artist, COUNT(*) AS tracks_nbr FROM songs WHERE artist="'+data.artist+'" GROUP BY album ORDER BY album', function (res) {
			elements.pageArtist.albums = res.results[0].values;
		});
	});
	elements.appPages.selected = 2;
};

clementine.openNowPlaying = function () {
	elements.appPages.selected = 3;
};

clementine.goBack = function () {
	elements.appPages.selected = 0;
};

clementine.playTrack = function (url) {
	this.client.insert_urls(1, [url], { play_now: true });
};

clementine.covers = covers;

elements.connectDialog.open();

});