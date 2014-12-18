var ClementineClient = require('clementine-remote').Client;

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
});
client.on('disconnect', function (data) {
	console.log('client disconnecting', data);
});
client.on('end', function () {
	console.log('client disconnected');
});

client.on('message', function (msg) {
	console.log(msg);
});

var elementsList = [
	'pagePlayingTitle', 'pagePlayingSubtitle', 'pagePlayingCover', 'pagePlayingPlaylist',
	'nowPlayingPrevious', 'nowPlayingPlay', 'nowPlayingPause', 'nowPlayingNext',
	'pagePlayingProgress'
];
var elements = {};
for (var i = 0; i < elementsList.length; i++) {
	var el = elementsList[i];
	elements[el] = document.getElementById(el);
}

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
});
client.on('play', function () {
	elements.nowPlayingPlay.style.display = 'none';
	elements.nowPlayingPause.style.display = 'inline-block';
});
client.on('pause', function () {
	elements.nowPlayingPlay.style.display = 'inline-block';
	elements.nowPlayingPause.style.display = 'none';
});
client.on('position', function (pos) {
	elements.pagePlayingProgress.value = pos / client.song.length * 100;
});

elements.nowPlayingPlay.addEventListener('click', function () {
	client.playpause();
});
elements.nowPlayingPause.addEventListener('click', function () {
	client.playpause();
});
elements.nowPlayingPrevious.addEventListener('click', function () {
	client.previous();
});
elements.nowPlayingNext.addEventListener('click', function () {
	client.next();
});

elements.pagePlayingPlaylist.addEventListener('core-activate', function () {
	console.log(elements.pagePlayingPlaylist.selection);
});

window.client = client;

// Tabs
var tabs = document.getElementById('mainTabs');
var pages = document.getElementById('mainPages');
tabs.addEventListener('core-select', function () {
	pages.selected = tabs.selected;
});

var pagePlayingPages = document.getElementById('pagePlayingPages');
var pagePlayingSwitch = document.getElementById('pagePlayingSwitch');
pagePlayingSwitch.addEventListener('click', function () {
	pagePlayingPages.selected = (pagePlayingPages.selected + 1) % 2;
});