var ClementineClient = require('clementine-remote').Client;

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
		ensureLibraryLoaded();
	}
});
client.on('disconnect', function (data) {
	console.log('client disconnecting', data);
});
client.on('end', function () {
	console.log('client disconnected');
});

client.on('message', function (msg) {
	if (msg.type == 45) return;
	console.log(msg);
});

client.on('library', function (library) {
	library.saveToCache(function () {
		console.log('Library saved to cache.');
	});
});

var elementsList = [
	'appPages',
	'refreshLibraryBtn', 'mainTracks', 'mainAlbums', 'mainPlayingToolbar',
	'pageAlbum',
	'pagePlayingBack',
	'pagePlayingTitle', 'pagePlayingSubtitle', 'pagePlayingCover', 'pagePlayingPlaylist',
	'nowPlayingPrevious', 'nowPlayingPlaypause', 'nowPlayingNext',
	'pagePlayingProgress',
	'nowPlaying',
	'downloadingLibraryToast', 'connectDialog'
];
var elements = {};
for (var i = 0; i < elementsList.length; i++) {
	var el = elementsList[i];
	elements[el] = document.getElementById(el);
}

elements.mainPlayingToolbar.client = client;
elements.pageAlbum.client = client;

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

elements.refreshLibraryBtn.addEventListener('click', function () {
	ensureLibraryLoaded(true);
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

// Tabs
var tabs = document.getElementById('mainTabs');
var pages = document.getElementById('mainPages');
var ensureLibraryLoaded = function (reload) {
	var libraryLoaded = function () {
		if (reload) {
			elements.mainAlbums.data = null;
			elements.mainTracks.data = null;
		}

		switch (parseInt(pages.selected)) {
			case 0:
				break;
			case 1:
				break;
			case 2:
				if (!elements.mainAlbums.data) {
					client.library.db.exec('SELECT album, artist, COUNT(*) AS tracks_nbr, art_automatic, art_manual FROM songs GROUP BY album ORDER BY album', function (res) {
						elements.mainAlbums.data = res.results[0].values;
						elements.downloadingLibraryToast.dismiss();
					});
					elements.downloadingLibraryToast.show();
				}
				break;
			case 3:
				if (!elements.mainTracks.data) {
					client.library.db.exec('SELECT title, album, artist, CAST(filename AS TEXT) AS filename FROM songs ORDER BY title', function (res) {
						elements.mainTracks.data = res.results[0].values;
						elements.downloadingLibraryToast.dismiss();
					});
					elements.downloadingLibraryToast.show();
				}
				break;
		}
	};

	if (client.library.db.opened && !reload) {
		libraryLoaded();
	} else if (client.library.isCached() && !reload) {
		client.library.openFromCache(function () {
			elements.downloadingLibraryToast.dismiss();
			libraryLoaded();
		});
		elements.downloadingLibraryToast.show();
	} else {
		client.once('library', function (library) {
			elements.downloadingLibraryToast.dismiss();
			libraryLoaded();
		});
		client.get_library();
		elements.downloadingLibraryToast.show();
	}
};
tabs.addEventListener('core-select', function () {
	if (pages.selected == tabs.selected) {
		return;
	}
	pages.selected = tabs.selected;

	ensureLibraryLoaded();
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

clementine.openNowPlaying = function () {
	elements.appPages.selected = 2;
};

clementine.goBack = function () {
	elements.appPages.selected = 0;
};

clementine.playTrack = function (url) {
	client.insert_urls(1, [url], { play_now: true });
};

});