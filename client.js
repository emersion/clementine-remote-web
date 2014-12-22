var ClementineClient = require('clementine-remote').Client;
var covers = require('album-cover')('3f6675c78c4054c7ee6e361a06ec6cff');

window.addEventListener('polymer-ready', function (e) {

console.log('Connecting to local clementine server...');
var client = ClementineClient({
	host: 'localhost',
	port: 5500,
	auth_code: 42
});

client.on('connect', function () {
	console.log('connected');
});
client.on('ready', function () {
	console.log('ready');

	elements.pagePlayingPlaylist.data = client.songs;

	if (elements.appPages.selected == 0) {
		elements.pageLibrary.load();
	}
});
client.on('disconnect', function (data) {
	console.log('client disconnecting', data);
});
client.on('end', function () {
	console.log('client disconnected');
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

var elementsList = [
	'appPages',
	'pageLibrary', 'pageAlbum', 'pageArtist',
	'pagePlayingBack',
	'pagePlayingTitle', 'pagePlayingSubtitle', 'pagePlayingCover', 'pagePlayingPlaylist',
	'nowPlayingPrevious', 'nowPlayingPlaypause', 'nowPlayingNext',
	'pagePlayingProgress',
	'nowPlaying',
	'connectDialog'
];
var elements = {};
for (var i = 0; i < elementsList.length; i++) {
	var el = elementsList[i];
	elements[el] = document.getElementById(el);
}

elements.pageLibrary.client = client;
elements.pageAlbum.client = client;
elements.pageArtist.client = client;

// Now playing page
client.on('song', function (song) {
	console.log('Song', song);
	elements.pagePlayingTitle.innerHTML = song.title;
	elements.pagePlayingSubtitle.innerHTML = (song.artist || '')+((song.artist && song.album) ? ' - ' : '')+(song.album || '');

	if (song.art) {
		var src = 'data:image/*;base64,'+song.art.toBase64();
		elements.pagePlayingCover.style.backgroundImage = 'url("'+src+'")';
	} else {
		elements.pagePlayingCover.style.backgroundImage = 'none'; //TODO: default cover
	}

	if (elements.pagePlayingPlaylist.data) {
		elements.pagePlayingPlaylist.selectItem(song.index);
	}
});
client.on('play', function () {
	elements.nowPlayingPlaypause.icon = 'av:pause';
});
client.on('pause', function () {
	elements.nowPlayingPlaypause.icon = 'av:play-arrow';
});
client.on('position', function (pos) {
	elements.pagePlayingProgress.value = pos / client.song.length * 100;
});

elements.pagePlayingBack.addEventListener('click', function () {
	elements.appPages.selected = 0;
});

elements.nowPlayingPlaypause.addEventListener('click', function () {
	client.playpause();
});
elements.nowPlayingPrevious.addEventListener('click', function () {
	client.previous();
});
elements.nowPlayingNext.addEventListener('click', function () {
	client.next();
});

elements.pagePlayingPlaylist.addEventListener('core-activate', function () {
	var sel = elements.pagePlayingPlaylist.selection;
	if (sel) {
		client.change_song(1, sel.index);
	}
});

var pagePlayingPages = document.getElementById('pagePlayingPages');
var pagePlayingSwitch = document.getElementById('pagePlayingSwitch');
pagePlayingSwitch.addEventListener('click', function () {
	pagePlayingPages.selected = (pagePlayingPages.selected + 1) % 2;
});

var clementine = {};
window.clementine = clementine; // Export API

clementine.client = client;

clementine.openAlbum = function (data) {
	elements.pageAlbum.model = data;
	client.library.db.exec('SELECT title, album, artist, CAST(filename AS TEXT) AS filename FROM songs WHERE artist="'+data.artist+'" AND album="'+data.album+'" ORDER BY title', function (res) {
		elements.pageAlbum.tracks = res.results[0].values;
	});
	elements.appPages.selected = 1;
};

clementine.openArtist = function (data) {
	elements.pageArtist.model = data;
	client.library.db.exec('SELECT title, album, artist, CAST(filename AS TEXT) AS filename FROM songs WHERE artist="'+data.artist+'" ORDER BY title', function (res) {
		elements.pageArtist.tracks = res.results[0].values;
		client.library.db.exec('SELECT album, artist, COUNT(*) AS tracks_nbr FROM songs WHERE artist="'+data.artist+'" GROUP BY album ORDER BY album', function (res) {
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
	client.insert_urls(1, [url], { play_now: true });
};

clementine.covers = covers;

});