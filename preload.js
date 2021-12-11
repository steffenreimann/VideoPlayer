//var ipcRenderer = require('electron').ipcRenderer;
const electron = require('electron');
const { dialog, ipcRenderer, remote } = electron;

console.log(remote);

var path = require('path');
var stringMath = require('string-math');
var url = require('url');
const fs = require('fs');
var custom = require('easy-electron-custom-dialog');
const fm = require('easy-nodejs-app-settings');

ipcRenderer.on('message', function(event, obj) {
	console.log('message = ', obj);
	if (obj.type === 'update') {
		window.updateStatus = obj.status;
		handelUpdate(obj);
	}
});

window.updateStatus = null;

window.playlist = [];
window.currentPlaylistIndex = 0;
window.PlaylistLooping = true;
var isNavOpen = true;
window.videoelement = null;
window.currentSpeed = 1;
var currentSpeedIndex = 4;
var playbackSpeeds = [ 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4 ];
var waitToHideControls = 2500;
var mosueMoveTimer = null;
var isMouseOverControls = false;
var isShown = true;
window.currentVideoInfos = {};
var currentExportPath = '';
var EndPoint = 0;
var exportDuration = 0;
var dotPressed = [ false, false, false ];
var wavesurfer;
var currentActiveRegion = null;
var localStore = { regions: {} };
//var videoDir = path.join(process.env.HOME, 'Videos');
var mousePos = {
	x: 0,
	y: 0
};

var MouseDown = false;

//console.log('Video Directory = ', videoDir);

window.TestEvent = async function(data) {
	const result = await ipcRenderer.invoke('TestEvent', data);

	//console.log('TestEvent return ', result);
};

window.convertFile = async function(inputFile, startTime, endTime, outputFile) {
	//console.log('convertFile Event');

	// var data = { inputFile: inputFile, startTime: 2, duration: 10, outputFile: outputFile, fps: 60, format: 'mov', quality: '50%' }
	var data = { inputFile: inputFile, startTime: 2, outputFile: outputFile };
	//console.log('Input File = ', inputFile);
	//console.log('Start Time = ', startTime);
	//console.log('End Time = ', endTime);
	//console.log('Output File = ', outputFile);

	const result = await ipcRenderer.invoke('convertFile', data);
	//console.log('convertFile Event return ', result);
};

window.TestCalc = function(params) {
	console.log(calcVideoFileSize(calcBitRate(1920, 1080, 8, 24), 128, 10));
};

window.saveAs = async function(index) {
	window.convertFile(window.playlist[index], '00:00:03', '00:00:10', `${window.playlist[index]}-new.mp4`);
	//const result = await ipcRenderer.invoke('saveAs', window.playlist[index]);
	//console.log('saveAs return ', result);
};

ipcRenderer.on('TestEvent', function(event, data) {
	console.log('TestEvent ', data);
	//document.getElementById('testFuncCall').innerText = `Button was pressed ${data} times`;
});

document.addEventListener('drop', (event) => {
	event.preventDefault();
	event.stopPropagation();
	console.log(event.dataTransfer.files);
	for (const f of event.dataTransfer.files) {
		// Using the path attribute to get absolute file path
		console.log('File Path of dragged files: ', f.path);
		if (window.playlist.length === 0) {
			window.playlist.push(f.path);
			window.playvideoid(0);
		} else {
			window.playlist.push(f.path);
		}
	}
	renderPlaylist();
});

ipcRenderer.on('callPlayerFunction', function(event, data) {
	console.log('callPlayerFunction ', data);

	switch (data) {
		case 'Before':
			window.previous();
			break;
		case 'TogglePlay':
			window.togglePlay();
			break;
		case 'Next':
			window.next();
			break;
		case 'Slower':
			window.LowerSpeed();
			break;
		case 'Faster':
			window.HigherSpeed();
			break;
		case 'ToggleMute':
			break;
		case 'ToggleFullscreen':
			window.toggleFullscreen('FullscreenContainer');
			break;
		case 'openExport':
			window.openModal('exportModal', window.exportModalFunction);
			break;
		case 'exportFrame':
			window.saveFrame();
			break;

		default:
			break;
	}

	//document.getElementById('testFuncCall').innerText = `Button was pressed ${data} times`;
});

document.addEventListener('dragover', (e) => {
	e.preventDefault();
	e.stopPropagation();
});

document.addEventListener('dragenter', (event) => {
	console.log('File is in the Drop Space');
});

document.addEventListener('dragleave', (event) => {
	console.log('File has left the Drop Space');
});

window.testdia = async function() {
	var testDia = await custom.dialog({
		width: '500px',
		height: '500px',
		electron: electron,
		htmlPath: './public/dialog.html',
		data: { vorname: 'Test', nachname: 'Lost', select: '2', check: true }
	});

	console.log('Test Dialog return = ', testDia);
};

window.next = function() {
	window.currentPlaylistIndex++;
	if (window.currentPlaylistIndex > window.playlist.length - 1 && window.PlaylistLooping) {
		currentPlaylistIndex = 0;
		window.playvideo(window.playlist[window.currentPlaylistIndex]);
		console.log('Play the first Video in playlist ', window.currentPlaylistIndex);
	} else if (window.currentPlaylistIndex <= window.playlist.length - 1) {
		window.playvideo(window.playlist[window.currentPlaylistIndex]);
		console.log('Play the next Video ', window.currentPlaylistIndex);
	} else if (!window.PlaylistLooping) {
		console.log('No Playlist Looping ', window.currentPlaylistIndex);
	}
};

window.previous = function() {
	window.currentPlaylistIndex--;
	if (window.currentPlaylistIndex < 0 && window.PlaylistLooping) {
		currentPlaylistIndex = window.playlist.length - 1;
		window.playvideo(window.playlist[window.currentPlaylistIndex]);
		console.log('Play the last Video in playlist', window.currentPlaylistIndex);
	} else if (window.currentPlaylistIndex >= 0) {
		window.playvideo(window.playlist[window.currentPlaylistIndex]);
		console.log('Play the Video previous ', window.currentPlaylistIndex);
	} else if (!window.PlaylistLooping) {
		console.log('No Playlist Looping ', window.currentPlaylistIndex);
	}
};

window.LowerSpeed = function() {
	console.log('The Video has ended function');
	var SpeedToSet = 1;
	if (currentSpeedIndex > 0) {
		currentSpeedIndex--;
		SpeedToSet = playbackSpeeds[currentSpeedIndex];
	} else {
		SpeedToSet = playbackSpeeds[currentSpeedIndex];
	}

	window.videoelement.playbackRate = SpeedToSet;
	window.videoelement.defaultPlaybackRate = SpeedToSet;
	document.getElementById('currentSpeed').innerText = SpeedToSet;
};

window.HigherSpeed = function() {
	console.log('The Video has ended function');

	var SpeedToSet = 1;
	if (currentSpeedIndex < playbackSpeeds.length - 1) {
		currentSpeedIndex++;
		SpeedToSet = playbackSpeeds[currentSpeedIndex];
	} else {
		SpeedToSet = playbackSpeeds[currentSpeedIndex];
	}

	window.videoelement.playbackRate = SpeedToSet;
	window.videoelement.defaultPlaybackRate = SpeedToSet;
	document.getElementById('currentSpeed').innerText = SpeedToSet;
};

window.onVideoEnded = function() {
	console.log('The Video has ended function');
	console.log(window.videoelement.paused);
	if (!window.videoelement.paused) {
	}
	window.next();
};
//test
window.playvideoid = async function(videoid) {
	window.playvideo(window.playlist[videoid]);
	return;
	console.log('Play video id  = ', videoid);
	console.log('Play video path = ', window.playlist[videoid]);
	window.currentPlaylistIndex = videoid;
	console.log(window.videoelement);
	window.videoelement.src = window.playlist[videoid];
	console.log('window.videoelement.src = ', window.videoelement.src);
	window.videoelement.play;
	window.currentVideoInfos = await window.getFileInfos();
	renderPlaylist();
};

window.removevideoid = function(videoid) {
	console.log('window.playlist = ', window.playlist);
	console.log('remove video = ', videoid);
	window.playlist.splice(videoid, 1);
	if (videoid == window.currentPlaylistIndex) {
		window.next();
	}
	renderPlaylist();
};

window.clearPlaylist = function() {
	window.playlist = [];
	renderPlaylist();
};

// Mark : Render SideNav Playlist

function renderPlaylist() {
	document.getElementById('playlist').innerHTML = '';
	if (window.playlist.length == 0) {
		document.getElementById('video-titel-name').innerText = 'Drag and Drop Files to Play';
		return;
	}
	var FileName = path.basename(window.playlist[window.currentPlaylistIndex]);

	document.getElementById('video-titel-name').innerText = FileName;
	var i = 0;
	window.playlist.forEach((element) => {
		var h = '';
		if (i == window.currentPlaylistIndex) {
			h = '<i class="far fa-play-circle" />';
		}

		document.getElementById('playlist').innerHTML += `
        <div class="playListItem">
            <div class="text" onclick="window.playvideoid('${i}')">
                
                ${path.basename(element)}
            </div>
            <div class="item" style="right: 20px;" onclick="window.openModal('confirmModal')">
                <i class="fas fa-trash"></i>
            </div>
            <div class="item" style="right: 0px;" onclick="window.removevideoid('${i}')">
                <i class="fas fa-times"></i>
            </div>
        </div>
        `;
		i++;
	});
}

// Mark : Render SideNav Clips

function renderSideNavClips() {
	document.getElementById('clips').innerHTML = '';
	if (wavesurfer.regions.list == 0) {
		document.getElementById('clips').innerText = 'Make Clips!';
		return;
	}
	var i = 0;

	Object.keys(wavesurfer.regions.list).forEach((key) => {
		var element = wavesurfer.regions.list[key];

		console.log('element = ', element);
		document.getElementById('clips').innerHTML += `
        <div class="playListItem" onclick="window.playRegion('${element.id}')" onmouseleave="window.HighlightClip('${element.id}',event)" onmouseover="window.HighlightClip('${element.id}',event)">
            <div class="text"  >
                
                ${element.element.title}
            </div>
            <div class="item" style="right: 120px;" onclick="window.setRegionMoveType('${element.id}', 'start')">
                s
            </div>
			<div class="item" style="right: 100px;" onclick="window.setRegionMoveType('${element.id}', 'move')">
				m
			</div>
			<div class="item" style="right: 80px;" onclick="window.setRegionMoveType('${element.id}', 'end')">
				e
			</div>


			<div class="item" style="right: 60px;" onclick="window.handleMoveRegion('${element.id}', 'backward')">
                <i aria-label="Save Frame as PNG" class="fas fa-caret-left"></i>
            </div>
			<div class="item" style="right: 45px;" onclick="window.handleMoveRegion('${element.id}', 'forward')">
                <i aria-label="Save Frame as PNG" class="fas fa-caret-right"></i>
            </div>
			<div class="item" style="right: 20px;" onclick="window.setActiveRegion('${element.id}')">
                <i aria-label="Save Frame as PNG" class="fas fa-highlighter"></i>
            </div>
			
			
            <div class="item" style="right: 0px;" onclick="window.removeRegionButton('${element.id}', event)">
                <i aria-label="Save Frame as PNG" class="fas fa-times"></i>
            </div>
        </div>
        `;
		i++;
	});
}

window.playRegion = function(regionid) {
	console.log('playRegion = ', regionid);
	var region = wavesurfer.regions.list[regionid];
	region.play();
};

// Mark : Highlight Clip

window.testElement = null;
window.HighlightClip = function(regionid, event) {
	console.log('HighlightClip');
	//console.log('regionid = ', regionid);
	//console.log('Region Element = ', document.querySelector(`[data-id="${regionid}"]`));
	//console.log(event);
	//console.log(event.type);
	var htmlElement = document.querySelector(`[data-id="${regionid}"]`);
	window.testElement = htmlElement;
	console.log('Region Element = ', htmlElement);
	if (event.type == 'mouseleave') {
		//console.log('mouseleave');
		//console.log('mouseover', htmlElement.style.backgroundColor);
		htmlElement.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
		console.log('mouseleave', htmlElement.style.backgroundColor);
	} else {
		//console.log('mouseover', htmlElement.style.backgroundColor);
		htmlElement.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
		console.log('mouseover', htmlElement.style.backgroundColor);
	}
};

// Mark : handle Move Region

window.handleMoveRegion = function(regionid, way) {
	console.log('handleMoveRegion');
	console.log('regionid = ', regionid);

	var frameTime = calcSekPerFrame();
	var region = wavesurfer.regions.list[regionid];
	if (region.moveType == 'start' || region.moveType == 'end') {
		if (way == 'forward') {
			window.setRegionParams(regionid, { [region.moveType]: wavesurfer.regions.list[regionid][region.moveType] + frameTime });
		} else if (way == 'backward') {
			window.setRegionParams(regionid, { [region.moveType]: wavesurfer.regions.list[regionid][region.moveType] - frameTime });
		}
	} else if (region.moveType == 'move') {
		if (way == 'forward') {
			window.setRegionParams(regionid, { start: wavesurfer.regions.list[regionid].start + frameTime, end: wavesurfer.regions.list[regionid].end + frameTime });
		} else if (way == 'backward') {
			window.setRegionParams(regionid, { start: wavesurfer.regions.list[regionid].start - frameTime, end: wavesurfer.regions.list[regionid].end - frameTime });
		}
	}
};

window.setRegionMoveType = function(regionid, type) {
	console.log('setRegionMoveType');
	console.log('regionid = ', regionid);
	console.log('type = ', type);
	console.log('wavesurfer.regions.list[regionid] = ', wavesurfer.regions.list[regionid]);
	wavesurfer.regions.list[regionid].moveType = type;
};

window.showSideNavContainer = function(containerName) {
	var containers = document.getElementsByClassName('sideNavBody');
	//console.log('containers = ', containers);
	for (var i = 0; i < containers.length; i++) {
		//containers[i].style.display = 'none';
		containers[i].classList.add('hide');
	}

	//document.getElementById(containerName).style.display = 'block !important';
	document.getElementById(containerName).classList.remove('hide');
};

var slider;

window.onload = function() {
	window.init();
};

window.dai = async function() {
	const result = await ipcRenderer.invoke('downloadAndApplyUpdate');
	console.log(result);
};
function handelUpdate(params) {
	console.log('handelUpdate', params);

	if (params.status == 'error') {
		console.log('update error');
		document.getElementById('startLoadingScreen').classList.add('hide');
	}
	if (params.status == 'update-not-available') {
		console.log('update-check-finished!');
		document.getElementById('startLoadingScreen').classList.add('hide');
	}
	if (params.status == 'update-available') {
		console.log('update-check-finished!');
		document.getElementById('startLoadingScreen').classList.remove('hide');
	}
	if (params.status == 'update-downloaded') {
		console.log('update-check-finished!');
		//document.getElementById('startLoadingScreen').classList.add('hide');
	}
	if (params.status == 'download-progress') {
		changeProgress('updateDownloadProgress', params.progress.percent);
	}
}

window.updateWindow = function(show) {
	if (show) {
		document.getElementById('startLoadingScreen').classList.remove('hide');
	} else {
		document.getElementById('startLoadingScreen').classList.add('hide');
	}
};
window.init = async function() {
	const result = await ipcRenderer.invoke('checking-update-status');
	handelUpdate(result);
	console.log(result);
	console.log('Init Function v0.0.1 alpha');
	window.videoelement = document.getElementsByTagName('video').videoplayer;
	var PlayPauseBTN = document.getElementById('PlayPauseBTN');
	var controls = document.getElementById('controls');

	document.getElementById('FullscreenContainer').addEventListener('fullscreenchange', (event) => {
		console.log(window.isFullscreen());
		ipcRenderer.invoke('setMenuBarVisibility', !window.isFullscreen());
	});

	console.log('uuid', UUID());
	console.log('Document loaded ', document.getElementsByTagName('video').videoplayer);

	navigator.mediaSession.setActionHandler('previoustrack', function() {
		window.previous();
	});
	navigator.mediaSession.setActionHandler('nexttrack', function() {
		window.next();
	});

	window.changeVolume = function(element) {
		console.log(element.value);
		window.videoelement.volume = element.value / 100;
	};
	window.videoelement.ondblclick = function(params) {
		console.log('ondblclick');
		window.toggleFullscreen('FullscreenContainer');
	};

	window.videoelement.onpause = function() {
		PlayPauseBTN.classList.add('fa-play');
		PlayPauseBTN.classList.remove('fa-pause');
		console.log(window.videoelement);
		console.log(window.videoelement.currentTime);
	};
	window.videoelement.onplay = async function() {
		PlayPauseBTN.classList.remove('fa-play');
		PlayPauseBTN.classList.add('fa-pause');
		console.log(window.videoelement);
		console.log(window.videoelement.currentTime);
	};
	window.videoelement.onerror = function(err) {
		console.log(err);
		//alert("Error! Something went wrong", err);
	};
	window.videoelement.ontimeupdate = function(time) {
		//document.getElementById('currentTime').innerText = window.videoelement.currentTime.toFixed(1);
		//wavesurfer.seekTo(window.videoelement.currentTime);
		//document.getElementById('duration').innerText = window.videoelement.duration;
	};

	document.onmousemove = function(event) {
		isMouseMoving = true;
		mousePos.x = event.clientX;
		mousePos.y = event.clientY;
		clearInterval(mosueMoveTimer);
		if (!isShown) {
			window.showControls();
		} else if (!isMouseOverControls && !dotPressed[0] && !dotPressed[1] && !dotPressed[2]) {
			mosueMoveTimer = setInterval(function() {
				window.hideControls();
				clearInterval(mosueMoveTimer);
			}, waitToHideControls);
		}
		if (MouseDown) {
			let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			var percent = mousePos.x / width * 100;
			percent = clamp(percent, 0, 97);
			document.getElementById('mySidenav').style.width = percent + '%';
		}
	};

	controls.onmouseover = function(params) {
		clearInterval(mosueMoveTimer);
		isMouseOverControls = true;
	};

	controls.onmouseleave = function(params) {
		isMouseOverControls = false;
		mosueMoveTimer = setInterval(function() {
			window.hideControls();
		}, waitToHideControls);
	};

	document.getElementById('sidenavResizer').onmousedown = function(event) {
		MouseDown = true;
	};

	document.addEventListener('mouseup', function(event) {
		MouseDown = false;
	});

	// Mark : Wavesurfer Init
	wavesurfer = WaveSurfer.create({
		container: document.querySelector('#waveform'),
		waveColor: '#cecece',
		progressColor: '#5e4c4cd2',
		backend: 'MediaElement',
		barWidth: 1,
		barHeight: 1.1, // the height of the wave
		barGap: null,
		responsive: true,
		fillParent: true,
		barRadius: 1,
		scrollParent: false,
		forceDecode: true,
		plugins: [
			WaveSurfer.regions.create({
				regionsMinLength: 0,
				regions: [],
				dragSelection: {
					slop: 5
				}
			}),
			WaveSurfer.cursor.create({
				showTime: true,
				cursorColor: 'hsla(0, 0%, 100%, 0.5)',
				cursorWidth: 1,
				cursorOpacity: 1,
				cursorTimeWidth: 'auto',
				draggableCursor: true,
				draggableCursorTime: true,
				dragCursor: true,
				dragCursorTime: true,
				dragCursorColor: 'hsla(0, 0%, 100%, 0.5)',
				dragCursorWidth: 1,
				dragCursorOpacity: 1,
				dragCursorTimeWidth: 'auto',
				dragCursorTimeWidthMin: 0.5,
				dragCursorTimeWidthMax: 2,
				dragCursorTimeWidthStep: 0.5,

				opacity: 1,
				customShowTimeStyle: {
					'background-color': '#000',
					color: '#fff',
					padding: '2px',
					'font-size': '10px'
				}
			})
		]
	});

	wavesurfer.on('error', function(e) {
		console.log(e);
	});

	wavesurfer.on('finish', function(e) {
		console.log(e);
	});

	wavesurfer.on('audioprocess', function(e) {
		//console.log(e);
		//  console.log(e)
		//	document.getElementById('currentTime').innerText = window.videoelement.currentTime.toFixed(1);
		//document.getElementById('duration').innerText = window.videoelement.duration;
		// document.getElementById('currentTime').innerText = wavesurfer.getCurrentTime().toFixed(1)
	});

	wavesurfer.on('seek', function(e) {
		CurserToMove.id = 'Main';
	});

	window.getcurrentRegion = function() {
		return currentActiveRegion;
		return wavesurfer.regions.getCurrentRegion();
	};

	window.getSelectedRegions = function() {
		console.log(wavesurfer.regions);
		//console.log(wavesurfer.regions.list())
		//return wavesurfer.regions.list()
	};

	wavesurfer.on('ready', function(e) {
		console.log(e);
		window.StoreRegionEventListener();
		saveRegions();
		wavesurfer.play();
	});

	wavesurfer.on('region-click', function(region, e, d) {
		//e.stopPropagation();
		console.log('Clip Click');
		console.log('region = ', region);
		//console.log('e = ', e);
		console.log('Region Id = ', region.id);

		//currentActiveRegion = region;
		window.setActiveRegion(region);
		if (e.ctrlKey) {
			e.shiftKey ? region.playLoop() : region.play();
		} else {
		}

		// Play on click, loop on shift click
	});

	wavesurfer.on('region-play', function(region) {
		console.log('region-play', region);
		region.once('out', function() {
			wavesurfer.play(region.start);
			wavesurfer.pause();
		});
	});

	wavesurfer.on('region-created', function(region) {
		console.log('region-created', region);
		window.StoreRegionEventListener();
		saveRegions();
		//window.setRegionMoveType(region.id, 'move');
	});

	wavesurfer.on('region-update-end', (region) => {
		console.log('region-update-end', region);
		renderSideNavClips();
		saveRegions();

		if (typeof region.init == 'undefined') {
			region.init = true;
			window.setRegionMoveType(region.id, 'move');
			//console.log('Region Created = ', wavesurfer.regions);
		}
	});
	wavesurfer.on('region-updated', (region) => {
		//currentActiveRegion = region;
		window.setActiveRegion(region);
		if (region.init) {
			if (hasChanged(region.end, localStore.regions[region.id].end) && !hasChanged(region.start, localStore.regions[region.id].start)) {
				console.log('region end has changed !');
				window.videoelement.currentTime = region.end;
				CurserToMove = {
					id: region.id,
					type: 'end'
				};
			} else if (hasChanged(region.start, localStore.regions[region.id].start) && !hasChanged(region.end, localStore.regions[region.id].end)) {
				console.log('region start has changed !');
				window.videoelement.currentTime = region.start;
				CurserToMove = {
					id: region.id,
					type: 'start'
				};
			}
		}

		//saveRegions();
	});
	wavesurfer.on('region-removed', () => {
		renderSideNavClips();
		saveRegions();
	});

	wavesurfer.on('region-in', () => {});
	wavesurfer.on('region-out', () => {});
	wavesurfer.on('contextmenu', () => {
		console.log('contextmenu');
	});

	wavesurfer.on('waveform-ready', () => {
		console.log('waveform-ready');
	});

	document.querySelector('#waveform').addEventListener('wheel', (event) => {
		console.log('wave scroll');
		console.log(event);
		console.log(wavesurfer.params.minPxPerSec);
		var i = wavesurfer.params.minPxPerSec + clamp(Math.round(event.deltaY), -20, 20);

		//wavesurfer.params.minPxPerSec

		console.log(i);
		//console.log(wavesurfer.zoom(i));
		wavesurfer.zoom(Number(i));
	});

	document.querySelector('.video-overlay').addEventListener('wheel', (event) => {
		var i = clamp(Math.round(event.deltaY), -2, 2);
		window.videoelement.currentTime = window.videoelement.currentTime + i;
		console.log(' scroll');
		console.log(event);
	});

	//when document are rezised
	window.addEventListener('resize', () => {
		wavesurfer.drawer.updateSize();
	});

	ipcRenderer.on('ProgressEvent', (event, data) => {
		console.log('ProgressEvent = ', data);
		window.renderCurrentExportProcess(data);
	});
	ipcRenderer.on('StartEvent', (event, data) => {
		console.log('StartEvent = ', data);
		changeProgress('videoExport', 0);
		//window.renderExportText();
	});

	var volInterval = null;
	document.getElementById('volume').addEventListener('mousedown', function(params) {
		volInterval = setInterval(function() {
			var vol = document.getElementById('volume').value;
			window.videoelement.volume = map(vol, 0, 100, 0, 1);
		}, 10);
	});
	document.getElementById('volume').addEventListener('mouseup', function(params) {
		clearInterval(volInterval);
	});

	initSettings();

	window.showControls();
};

// MARK: Init Settings

var settings;
async function initSettings() {
	settings = new fm.File({
		appname: 'VideoTools', // required
		file: 'settings.json', // required
		data: {
			defaultExport: {
				comp: 23,
				preset: 'medium',
				format: 'mp4',
				codec: 'libx264'
			}
		},
		doLogging: true
	});

	await settings.init();
	console.log('DataStore File Init');
	console.log(settings.data);
}

// Mark: set Active Region

window.setActiveRegion = function(region) {
	//console.log('setActiveRegion typeof Region = ', typeof region);
	//console.log('setActiveRegion Region = ', region);

	if (typeof region != 'object') {
		//console.log('Set Activ Region Argument is not an Object.');
		//console.log('Try to get the right Object. Region ID = ', region);
		region = wavesurfer.regions.list[region];
		//console.log('New Region Object = ', region);
	}

	currentActiveRegion = region;
	console.log('window.setActiveRegion');
	console.log(region);
	console.log('WaveSurfer Regions = ', wavesurfer.regions.list);

	for (var key in wavesurfer.regions.list) {
		if (wavesurfer.regions.list.hasOwnProperty(key)) {
			var element = wavesurfer.regions.list[key];
			console.log('key = ', key);
			console.log('element = ', element);
			var t = document.querySelector(`[data-id="${element.id}"]`);
			t.style.zIndex = 2;

			if (typeof t.getElementsByClassName('region-head')[0] != 'undefined') {
				t.removeChild(t.getElementsByClassName('region-head')[0]);
			}
		}
	}

	var current = document.querySelector(`[data-id="${region.id}"]`);

	var head = document.createElement('div');

	head.classList.add('region-head');

	console.log(current.offsetWidth);
	if (current.offsetWidth > 75) {
		head.innerHTML = ` 
		<a class="headItem-fastExport" onclick="window.fastExport('${region.id}', event)">
			<i class="fas fa-file-export"></i> 
		</a>
		<div class="headItem-text">${region.element.title}</div>
		<a class="headItem-removeRegion" onclick="window.removeRegionButton('${region.id}', event)">
			<i class="fas fa-times"></i> 
		</a>`;
	} else if (current.offsetWidth > 40) {
		head.innerHTML = ` 
		<a class="headItem-fastExport" onclick="window.fastExport('${region.id}', event)">
			<i class="fas fa-file-export"></i> 
		</a>
		<a class="headItem-removeRegion" onclick="window.removeRegionButton('${region.id}', event)">
			<i class="fas fa-times"></i> 
		</a>`;
	} else if (current.offsetWidth > 15) {
		head.innerHTML = ` 
		<a class="headItem-fastExport" onclick="window.fastExport('${region.id}', event)">
			<i class="fas fa-file-export"></i> 
		</a>`;
	}

	current.style.zIndex = 3;
	current.appendChild(head);
	console.log(head);
	//current.style = 'z-index: 3';
};

function setExportButtonText() {
	var ECcecked = document.getElementById('exportClipsCeckbox').checked;
	var EVchecked = document.getElementById('exportVideoCeckbox').checked;

	if (ECcecked && EVchecked) {
		document.getElementById('exportbtn').disabled = false;
		document.getElementById('exportbtn').innerText = 'Export Video and Clips';
		return;
	}

	if (ECcecked) {
		document.getElementById('exportbtn').disabled = false;
		document.getElementById('exportbtn').innerText = `Export Only Clips`;
		return;
	}

	if (EVchecked) {
		document.getElementById('exportbtn').disabled = false;
		document.getElementById('exportbtn').innerText = `Export Only Video`;
		return;
	}

	if (!ECcecked && !EVchecked) {
		document.getElementById('exportbtn').innerText = 'Export nothing';
		document.getElementById('exportbtn').disabled = true;
		return;
	}
}

/**
 * check if value has changed
 */
function hasChanged(a, b) {
	//console.log('hasChanged ', a, b);
	// if (a === b) return false;
	if (a === b) {
		return false;
	}
	if (a === null || b === null) {
		return true;
	}
	if (a.length !== b.length) {
		return true;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return true;
		}
	}
	if (a !== b) {
		return true;
	}
	return false;
}

// Mark : Set Region Parameter

//setRegionParams(id, { 'start': 0, 'end': 0 })
/**
 *  Set Region Parameters
 * @param {String} regionid
 * @param {Object} params 
 */
window.setRegionParams = function(regionid, params) {
	window.wavesurfer = wavesurfer;
	//regionid = currentActiveRegion.id;
	console.log('setRegionParams = ', regionid, params);

	var localRegion = wavesurfer.regions.list[regionid];

	Object.keys(params).forEach(function(key) {
		console.log('setRegionParams', key, params[key]);
		console.log(localRegion);
		if (key === 'start' || key === 'end') {
			var resizeValue = 0;
			if (key === 'start') {
				resizeValue = params[key] - localRegion.start;
			} else {
				resizeValue = params[key] - localRegion.end;
			}
			wavesurfer.regions.list[regionid].onResize(resizeValue, key);
		} else {
			wavesurfer.regions.list[regionid][key] = params[key];
		}

		saveRegions();
		//wavesurfer.Region.renderPlaylist()
	});
};

/**
 * Save annotations to localStorage.
 */

function saveRegions() {
	localStore.regions = {};
	Object.keys(wavesurfer.regions.list).forEach(function(id) {
		let region = wavesurfer.regions.list[id];
		let regionData = {
			id: region.id,
			start: region.start,
			end: region.end,
			color: region.color
		};
		localStore.regions[id] = regionData;
		console.log('saveRegions = ', localStore.regions[id]);
	});
}

var RegionsExtraEventListener = {};
window.StoreRegionEventListener = function() {
	console.log('StoreRegionEventListener', RegionsExtraEventListener);
	Object.keys(RegionsExtraEventListener).forEach(function(id) {
		try {
			const element = document.body.querySelectorAll(`[data-id='${id}']`)[0];
			const startLine = element.querySelectorAll('.wavesurfer-handle-start')[0];
			const endLine = element.querySelectorAll('.wavesurfer-handle-end')[0];

			console.log('StoreRegionEventListener element = ', element);

			startLine.removeEventListener('click', () => {}, false);
			endLine.removeEventListener('click', () => {}, false);
		} catch (error) {}

		delete RegionsExtraEventListener[id];
	});
	Object.keys(wavesurfer.regions.list).forEach(function(id) {
		const element = document.body.querySelectorAll(`[data-id='${id}']`)[0];
		const startLine = element.querySelectorAll('.wavesurfer-handle-start')[0];
		const endLine = element.querySelectorAll('.wavesurfer-handle-end')[0];
		console.log('StoreRegionEventListener element = ', startLine);
		console.log('StoreRegionEventListener element = ', endLine);

		startLine.addEventListener(
			'click',
			() => {
				handleRegionExtraEvents(id, 'start');
			},
			false
		);
		endLine.addEventListener(
			'click',
			() => {
				handleRegionExtraEvents(id, 'end');
			},
			false
		);

		RegionsExtraEventListener[id] = id;
	});
};

function handleRegionExtraEvents(id, type) {
	console.log('handleRegionExtraEvents = ', type, id);
	if (type === 'start') {
		CurserToMove.id = id;
		CurserToMove.type = 'start';
	} else if (type === 'end') {
		CurserToMove.id = id;
		CurserToMove.type = 'end';
	}
}

window.removeAllRegions = function() {
	// wavesurfer.regions.list[params.id].name = params.name
	Object.keys(wavesurfer.regions.list).forEach(function(id) {
		wavesurfer.regions.list[id].remove();
	});
};

window.removeRegion = function(id) {
	console.log('removeRegion = ', id);
	wavesurfer.regions.list[id].remove();
	window.renderExportRegion();
};

function setZindex(params) {
	// console.log(document.getElementsByClassName('noUi-origin'));
	document.getElementsByClassName('noUi-origin')[0].style.zIndex = 99;
}

function resetBeforAndAfter() {
	var style = document.createElement('style'); // Create a <button> element
	style.innerHTML += '.noUi-handle:before{background:#ffffff00 !important;}';
	style.innerHTML += '.noUi-handle:after{background:#ffffff00 !important;}';
	document.head.appendChild(style);
}

var playDotColor = 'rgb(132 111 228)';
var playDotShadowColor = 'rgb(132 111 228)';

var StartEndDotColor = 'rgb(207 228 111)';
var StartEndDotShadowColor = 'rgb(207 228 111)';

function setPlayDot(element) {
	//element.getElementsByClassName('noUi-handle:before')[0].style.backgroundColor = '#d33';
	console.log(document.getElementsByClassName('noUi-handle'));

	element.style.backgroundColor = playDotColor;
	element.style.width = '21px';
	element.style.height = '21px';
	element.style.right = '-14px';
	element.style.top = '-3px';
	element.style.boxShadow = `inset 0 0 1px ${playDotShadowColor}, inset 0 1px 7px ${playDotShadowColor}, 0 0px 0px -3px ${playDotShadowColor}`;

	element.style.borderRadius = '10px';
	element.style.border = `1px solid ${playDotShadowColor}`;
}

function setStartEndDot(element) {
	//element.getElementsByClassName('noUi-handle:before')[0].style.backgroundColor = '#d33';
	// console.log(document.getElementsByClassName('noUi-handle'));

	element.style.backgroundColor = StartEndDotColor;
	element.style.width = '11px';
	element.style.height = '28px';
	element.style.right = '-9px';
	element.style.top = '-7px';
	element.style.boxShadow = `inset 0 0 1px ${StartEndDotShadowColor}, inset 0 1px 7px ${StartEndDotShadowColor}, 0 0px 0px -3px ${StartEndDotShadowColor}`;

	element.style.borderRadius = '5px';
	element.style.border = `1px solid ${StartEndDotShadowColor}`;
}

window.showControls = async function() {
	//console.log('Show controls');
	window.fadeInOut('controls', true);
	window.fadeInOut('video-titel', true);
	window.openNav(true);
	await delay(750);
	isShown = true;
};

window.hideControls = async function() {
	//console.log('hide controls');
	window.fadeInOut('controls', false);
	window.fadeInOut('video-titel', false);
	window.closeNav(true);
	await delay(750);
	isShown = false;
};

window.clickOverlay = function() {
	console.log('Click Overlay');
	if (isNavOpen) {
		window.closeNav();
	} else {
		window.togglePlay();
	}
};

window.dbClickOverlay = function() {
	console.log('dbClick Overlay');
	window.toggleFullscreen('FullscreenContainer');
};

/* Function to open fullscreen mode */

window.toggleFullscreen = function(id) {
	const body = document.getElementById(id);

	console.log(id);
	// Hide or Show the Menubar

	// Toggle Fullscreen
	if (window.isFullscreen()) {
		//isFullscreen = false;
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	} else {
		//isFullscreen = true;
		if (body.requestFullscreen) {
			body.requestFullscreen();
		} else if (body.webkitRequestFullscreen) {
			/* Safari */
			body.webkitRequestFullscreen();
		} else if (body.msRequestFullscreen) {
			/* IE11 */
			body.msRequestFullscreen();
		}
	}
};

window.startPIP = function(params) {
	window.videoelement.requestPictureInPicture().catch((error) => {
		// Error handling
		console.log(error);
	});
};

window.toggleNav = function() {
	if (isNavOpen) {
		window.closeNav();
	} else {
		window.openNav();
	}
};

var sidenavOpenInControls = true;
window.openNav = async function(isControls) {
	isNavOpen = true;

	if (isControls) {
		if (sidenavOpenInControls) {
			//console.log('sidenavOpenInControls ', sidenavOpenInControls);
			window.fadeInOut('mySidenav', true);
			document.getElementById('mySidenav').style.display = 'block';
		}
	} else {
		sidenavOpenInControls = true;
		window.fadeInOut('mySidenav', true);
		document.getElementById('mySidenav').style.display = 'block';
	}
};

window.closeNav = async function(isControls) {
	isNavOpen = false;

	if (isControls) {
		if (sidenavOpenInControls) {
			//console.log('sidenavOpenInControls ', sidenavOpenInControls);
			window.fadeInOut('mySidenav', false);
			await delay(750);
			document.getElementById('mySidenav').style.display = 'none';
		}
	} else {
		sidenavOpenInControls = false;
		window.fadeInOut('mySidenav', false);
		await delay(750);
		document.getElementById('mySidenav').style.display = 'none';
	}
};

window.togglePlay = function() {
	if (window.videoelement.paused) {
		//window.videoelement.currentTime =
		window.videoelement.play();
	} else {
		window.videoelement.pause();
	}
};

window.getFileInfos = async function(params) {
	const result = await ipcRenderer.invoke('getFileInfos', window.playlist[window.currentPlaylistIndex]);
	console.log(result);
	return result;
};

window.nextFrame = function(params) {
	window.videoelement.currentTime = window.videoelement.currentTime + calcSekPerFrame();
	return window.videoelement.currentTime;
};

window.previousFrame = function(params) {
	window.videoelement.currentTime = window.videoelement.currentTime - calcSekPerFrame();
	return window.videoelement.currentTime;
};

var canvas = document.createElement('canvas');
function getFrameImg(params) {
	canvas.width = window.currentVideoInfos.streams[0].width;
	canvas.height = window.currentVideoInfos.streams[0].height;
	var ctx = canvas.getContext('2d');
	ctx.drawImage(window.videoelement, 0, 0, canvas.width, canvas.height);
	const url = canvas.toDataURL('image/png', 1);
	const base64Data = url.replace(/^data:image\/png;base64,/, '');
	return base64Data;
}

function calcSekPerFrame() {
	var fps = stringMath(window.currentVideoInfos.streams[0].r_frame_rate);
	var currentFrame = Math.round(fps * window.videoelement.currentTime);
	var frames = Math.round(fps * window.videoelement.duration);
	var sekPerFrame = window.videoelement.duration / frames;
	//console.log('FPS = ', fps);
	//console.log('current Frame = ', currentFrame);
	//console.log('frames = ', frames);
	//console.log('sekPerFrame = ', sekPerFrame);
	//console.log('sekPerFrame*fps = ', sekPerFrame * fps);
	return sekPerFrame;
}

function getCurrentFrameIndex() {
	var fps = stringMath(window.currentVideoInfos.streams[0].r_frame_rate);
	var currentFrame = Math.round(fps * window.videoelement.currentTime);
	return currentFrame;
}

window.skipTime = function(time, forward) {
	var currentTimeLocal = window.videoelement.currentTime;
	console.log(time);
	console.log(currentTimeLocal);
	console.log(currentTimeLocal + time);
	if (forward) {
		window.videoelement.currentTime = currentTimeLocal + time;
	} else {
		window.videoelement.currentTime = currentTimeLocal - time;
	}
};

window.IncDecVolume = function(step, Incerase) {
	step = step / 100;
	if (Incerase) {
		window.videoelement.volume = clamp(window.videoelement.volume + step, 0, 1);
		console.log(window.videoelement.volume);
	} else {
		window.videoelement.volume = clamp(window.videoelement.volume - step, 0, 1);
		console.log(window.videoelement.volume);
	}
	document.getElementById('volume').value = window.videoelement.volume * 100;
};

window.playvideo = async function(video) {
	console.log('Play video = ', video);
	console.log(path.parse(video).ext);

	if (window.checkFileType(video) === 'img') {
		document.getElementById('img-cover').src = video;

		window.videoelement.pause();
		wavesurfer.empty();
		wavesurfer.clearRegions();
		window.videoelement.src = '';
		document.getElementById('img-cover').style.zIndex = '1';
		window.videoelement.style.zIndex = '0';
		renderPlaylist();
		await delay(5000);
		window.next();
	} else {
		window.videoelement.src = video;
		window.videoelement.play;
		console.log('Video Tracks = ', window.videoelement.videoTracks);
		console.log('Audio Tracks = ', window.videoelement.audioTracks);
		wavesurfer.empty();
		wavesurfer.clearRegions();
		wavesurfer.load(window.videoelement);
		document.getElementById('img-cover').style.zIndex = '0';
		window.videoelement.style.zIndex = '1';
		window.currentVideoInfos = await window.getFileInfos();
		console.log('wavesurfer.regions = ', wavesurfer.regions);
		renderPlaylist();
		renderFileInfos();
	}
};
// Mark : Render File Infos
function renderFileInfos() {
	console.log('renderFileInfos', window.currentVideoInfos);
	for (var key in window.currentVideoInfos.regions) {
		//var element = window.currentVideoInfos.regions[key];
		window.addRegion(window.currentVideoInfos.regions[key]);
	}
}

window.addRegion = function() {
	wavesurfer.addRegion({ start: window.currentVideoInfos.regions.start, end: window.currentVideoInfos.regions.end });
};

window.checkFileType = function(file) {
	console.log(file);
	var i = path.parse(file).ext;

	if (i === '.apng' || i === '.avif' || i === '.gif' || i === '.jpg' || i === '.jpeg' || i === '.jfif' || i === '.pjpeg' || i === '.pjp' || i === '.png' || i === '.svg' || i === '.webp' || i === '.bmp' || i === '.ico' || i === '.cur' || i === '.tif' || i === '.tiff') {
		return 'img';
	} else {
		return 'video';
	}
};

window.openModal = async function(elementid, openModalFunction) {
	console.log('Open Modal = ', elementid);
	//Show the Spinner
	//window.ShowLoadingSpinner('Start Loading ' + elementid, true);
	//Check if The callback function is a function
	if (typeof openModalFunction === 'function') {
		//Call the callback function
		await openModalFunction(elementid);
	}
	//Hide the spinner and text
	//window.hideLoadingSpinner();
	//Show the modal
	window.fadeInOut(elementid, true);
	document.getElementById(elementid).style.display = 'block';
};

window.closeModal = async function(elementid, closeModalFunction) {
	console.log('Close Modal = ', elementid);
	//Check if the callback function is a function
	if (typeof closeModalFunction === 'function') {
		//Call the callback function
		closeModalFunction(elementid);
	}
	// Hide the modal
	window.fadeInOut(elementid, false);
	await delay(750);
	document.getElementById(elementid).style.display = 'none';
};

window.exportModalFunction = async function(id) {
	console.log('window.currentVideoInfos = ', window.currentVideoInfos);
	if (Object.keys(window.currentVideoInfos).length != 0) {
		console.log('export Modal Function = ', id);
		console.log('Why ');
		//console.log('window.currentVideoInfos = ', window.currentVideoInfos);
		var VideoExport = {
			dirPath: '',
			exportList: []
		};

		//console.log(wavesurfer.regions.list);
		//console.log(Object.keys(wavesurfer.regions.list).length);
		//window.renderExportRegion(id);
		window.renderExportRegion(id);
		console.log(path.parse(window.playlist[window.currentPlaylistIndex]));

		document.getElementById('videoexportdirpathInputField').value = path.parse(window.playlist[window.currentPlaylistIndex]).dir;
		currentExportPath = path.parse(window.playlist[window.currentPlaylistIndex]).dir;

		document.getElementById('videoexportnameInputField').value = path.parse(window.playlist[window.currentPlaylistIndex]).name;

		document.getElementById('videoexport-bitrate').value = (window.currentVideoInfos.format.bit_rate / 1024).toFixed();
		document.getElementById('videoexport-fps').value = stringMath(window.currentVideoInfos.streams[0].r_frame_rate);
	}

	return;
};

// Mark: Render Export Region

window.renderExportRegion = async function(id) {
	console.log('render Export Region = ', id);

	var fps = stringMath(window.currentVideoInfos.streams[0].r_frame_rate);
	var bitrate = (window.currentVideoInfos.format.bit_rate / 1024).toFixed();
	document.getElementById('regions').innerHTML = '';
	if (Object.keys(wavesurfer.regions.list).length > 0) {
		Object.keys(wavesurfer.regions.list).forEach(function(key) {
			console.log('key = ', key);
			var tempHTML = `
			
			<div class="row ">
							
                            <div class="ig c12" >
								<div class="input c1">
									<div class="region ig-item dark" id="${wavesurfer.regions.list[key].id}">
										<span class="region-time">${wavesurfer.regions.list[key].start.toFixed()} - ${wavesurfer.regions.list[key].end.toFixed()}</span>
									</div>
								</div>
                                <div class="input c1">
                                    <label class="label-top">Bitrate</label>
                                    <input type="text" id="videoexport-bitrate-${key}" class="ig-item dark" value="${bitrate}" />
                                </div>
								<div class="input c1">
                                    <label class="label-top"></label>
                                    <input type="text" id="videoexport-compRate-${key}" class="ig-item dark" value="23" />
                                </div>
                                <div class="input c1">
                                    <label class="label-top">Preset</label>
                                    <div class="select ig-item dark">

                                        <select id="videoexport-preset-${key}" value="medium" class="">
                                            <option value="ultrafast">ultrafast</option>
                                            <option value="superfast">superfast</option>
                                            <option value="veryfast">veryfast</option>
                                            <option value="faster">faster</option>
                                            <option value="fast">fast</option>
                                            <option value="medium">medium</option>
                                            <option value="slow">slow</option>
                                            <option value="slower">slower</option>
                                            <option value="veryslow">veryslow</option>

                                        </select>
                                    </div>
                                </div>
                                <div class="input c1">
                                    <label class="label-top">Quality </label>
                                    <input type="text" id="videoexport-quality-${key}" class="ig-item dark" value="100" />
                                </div>
                                <div class="input c1">
                                    <label class="label-top">fps</label>
                                    <input type="text" id="videoexport-fps-${key}" class="ig-item dark" value="${fps}" />
                                </div>
                                <div class="input c1">
                                    <div class="select ig-item dark">
                                        <select id="videoexport-format-${key}" class="">
                                            <option value="mp4">mp4</option>
                                            <option value="mov">mov</option>
                                            <option value="avi">avi</option>
                                            <option value="flv">flv</option>
                                            <option value="mp3">mp3 Audio Only</option>
                                            <option value="wav">wav Audio Only</option>
                                            <option value="gif">gif</option>
                                        </select>
                                    </div>
                                </div>
								<div class="input c1">
                                    <label class="label-top">Codec</label>
                                    <div class="select ig-item dark">
                                        <select id="videoexport-videoCodec-${key}" class="">
                                            <option value="libx264">libx264</option>
                                            <option value="libx265">libx265</option>
                                        </select>
                                    </div>
                                </div>
								<div class="input c3">
                                    <button type="button" onclick="window.exportClip('${key}')" class="ig-item dark">Export</button>
                                </div>
								<div class="input c1">
                                    <button type="button" onclick="window.removeRegion('${wavesurfer.regions.list[key].id}')" class="ig-item dark">X</button>
                                </div>
                            </div>
                        </div>
			`;
			document.getElementById('regions').innerHTML += tempHTML;
		});
	} else {
		var tempHTML = `
		<div class="input c12">
			<div class="region ig-item dark" id="">
				<span class="">No Clips to Export</span>
			</div>
		</div>`;
		document.getElementById('regions').innerHTML += tempHTML;
	}
	inithb();
};

// MARK: Settings Dialog Function

window.SettingsModalFunction = async function(id) {
	console.log('Settings Modal Function = ', id);
	var settingsDialog = await custom.dialog({
		width: '500px',
		height: '500px',
		electron: electron,
		htmlPath: './public/settings.html',
		closeOnSave: true,
		closeOnAccept: false,
		data: function() {
			return settings.data.defaultExport;
		},
		cb: function(data) {
			if (!data.canceled) {
				settings.setKey({ defaultExport: data.data });
			}
		}
	});

	//settings.setKey({ defaultExport: settingsDialog.data });

	console.log('settings Dialog return = ', settingsDialog);
};

window.ShowLoadingSpinner = function(text, showSpinner) {
	window.fadeInOut('loadingContainer', true);
	//document.getElementById('loadingContainer').style.display = 'block';
	if (showSpinner) {
		document.getElementById('globalSpinner').style.display = 'block';
	} else {
		document.getElementById('globalSpinner').style.display = 'none';
	}
	if (text !== undefined && text !== '') {
		document.getElementById('loadingText').innerHTML = text;
		document.getElementById('loadingText').style.display = 'block';
	} else {
		document.getElementById('loadingText').style.display = 'none';
	}
};

window.hideLoadingSpinner = function() {
	window.fadeInOut('loadingContainer', false);

	///document.getElementById('loadingContainer').style.display = 'none';
};

window.setLoadingSpinnerText = function(text) {
	document.getElementById('loadingText').innerHTML = text;
};

window.fadeInOut = function(elementid, fadeIn) {
	if (fadeIn) {
		document.getElementById(elementid).classList.remove('fadeOut');
		document.getElementById(elementid).classList.add('fadeIn');
	} else {
		document.getElementById(elementid).classList.remove('fadeIn');
		document.getElementById(elementid).classList.add('fadeOut');
	}
};

window.openFiles = async function(params) {
	console.log('Open Files = ', params);
	const result = await ipcRenderer.invoke('openFiles', params);
	console.log('Open Files result = ', result);
	playlist = playlist.concat(result.filePaths);
	//window.playvideo();
	renderPlaylist();
	return result;
};

window.openDialog = async function(params) {
	const result = await ipcRenderer.invoke('openDialog', params);
	return result;
};

window.changeExportPath = async function(params) {
	const result = await ipcRenderer.invoke('openDirDialog', window.playlist[window.currentPlaylistIndex]);
	if (result.canceled) {
	} else {
		console.log(result);
		document.getElementById('videoexportdirpathInputField').value = result.filePaths[0];
		currentExportPath = result.filePaths[0];
	}
};

window.exportVideo = async function() {
	if (currentExportPath == '') {
		return;
	}

	var data = { inputFile: window.playlist[window.currentPlaylistIndex] };
	data.uuid = UUID();
	data.format = document.getElementById('videoexport-format').value;
	data.videoBitrate = document.getElementById('videoexport-bitrate').value;
	data.fps = document.getElementById('videoexport-fps').value;
	data.quality = document.getElementById('videoexport-quality').value;
	data.videoname = document.getElementById('videoexportnameInputField').value;
	data.videoCodec = document.getElementById('videoexport-videoCodec').value;
	data.compression = { rate: document.getElementById('videoexport-compRate').value, preset: document.getElementById('videoexport-preset').value };

	data.outputFile = path.join(currentExportPath, `${data.videoname}_fps-${data.fps}_q-${data.quality}_vb-${data.videoBitrate}.${data.format}`);

	console.log(data);
	window.addCurrentExport(data);
	return;
	exportList.push(data);
	window.renderCurrentExports();
	//const result = await ipcRenderer.invoke('convertFile', data);
	return;
};

var currentExports = {};
var exportHistory = {};

window.exportClip = async function(regionID) {
	var start = wavesurfer.regions.list[regionID].start;
	var end = wavesurfer.regions.list[regionID].end;

	var data = { inputFile: window.playlist[window.currentPlaylistIndex] };

	data.uuid = UUID();
	data.startTime = start;
	data.endTime = end;
	data.format = document.getElementById('videoexport-format-' + regionID).value;
	data.videoBitrate = document.getElementById('videoexport-bitrate-' + regionID).value;
	data.fps = document.getElementById('videoexport-fps-' + regionID).value;
	data.quality = document.getElementById('videoexport-quality-' + regionID).value;

	data.videoCodec = document.getElementById('videoexport-videoCodec-' + regionID).value;
	data.compression = { rate: document.getElementById('videoexport-compRate-' + regionID).value, preset: document.getElementById('videoexport-preset-' + regionID).value };

	data.outputFile = path.join(currentExportPath, `${document.getElementById('videoexportnameInputField').value}_Clip_${start.toFixed()}-${end.toFixed()}_fps-${data.fps}_q-${data.quality}_vb-${data.videoBitrate}_codec-${data.videoCodec}_compRate-${data.compression.rate}_compPre-${data.compression.preset}.${data.format}`);

	//exportList.push(data);
	window.addCurrentExport(data);
	return;
	window.renderCurrentExports();
	//const result = await ipcRenderer.invoke('convertFile', data);

	return;
};

window.addCurrentExport = async function(data) {
	var check = await ckeckNewExportItem(data);
	if (check) {
		currentExports[data.uuid] = data;
	}
	window.renderCurrentExports();
	window.renderHistoryExports();
};

async function ckeckNewExportItem(data) {
	return new Promise((resolve) => {
		for (var key in currentExports) {
			var element = currentExports[key];
			if (element.outputFile == data.outputFile) {
				resolve(false);
			}
		}
		resolve(true);
	});
}

window.addCurrentExportToHistory = async function(uuid) {
	exportHistory[uuid] = currentExports[uuid];
	console.log(`UUID = ${uuid} // Export History = ${JSON.stringify(exportHistory[uuid])} // Current Exports = ${JSON.stringify(currentExports[uuid])}`);

	window.removeFromExportList(uuid);
	window.renderHistoryExports();
};

window.removeFromExportList = async function(uuid) {
	delete currentExports[uuid];
	window.renderCurrentExports();
};

window.renderCurrentExports = function() {
	var exportListHTML = ``;

	Object.keys(currentExports).forEach(function(key) {
		const element = currentExports[key];
		exportListHTML += `<div class="row exportListItem" >
		<div class="c1 tcenter">
		${element.videoBitrate}kBit/s
		</div>
		<div class="c1 tcenter">
		${element.quality} %
		</div>
		<div class="c1 tcenter">
		${element.fps} FPS
		</div>
		<div class="c1 tcenter">
		${element.format} 
		</div>
		<div class="c7 tcenter">
		${element.outputFile} 
		</div>
		<div class="c1 tcenter" onclick="window.removeFromExportList('${key}')">
		Remove
		</div>
		</div>`;
	});
	document.getElementById('exportList').innerHTML = exportListHTML;
};

// Mark : Render History Exports

window.renderHistoryExports = function() {
	var exportHListHTML = ``;

	Object.keys(exportHistory).forEach(function(key) {
		const element = exportHistory[key];
		//console.log('Path test ', path.normalize(element.outputFile));
		//console.log('Path test ', element.outputFile.replace(/\\/g, '/'));
		//console.log('History Element = ', element);
		exportHListHTML += `<div class="row exportListItem" >
		<div class="c1 tcenter">
		${element.videoBitrate}kBit/s
		</div>
		<div class="c1 tcenter">
		${element.quality} %
		</div>
		<div class="c1 tcenter">
		${element.fps} FPS
		</div>
		<div class="c1 tcenter">
		${element.format} 
		</div>
		<div class="c8 tcenter">
		<div onclick="window.openFileInBrowserAndHighlight('${element.outputFile.replace(/\\/g, '/')}')">${element.outputFile} </div>
		
		</div>
		
		</div>`;
	});
	document.getElementById('exportHList').innerHTML = exportHListHTML;
};

var ExportFilesLength = 0;
var ExportFilesFinished = 0;
window.exportAll = async function() {
	var EVchecked = document.getElementById('exportVideoCeckbox').checked;
	console.log('exportAll = ', EVchecked);
	if (EVchecked) {
		ExportFilesLength++;
		await window.exportVideo();
	}
	var ECchecked = document.getElementById('exportClipsCeckbox').checked;
	if (Object.keys(wavesurfer.regions.list).length > 0 && ECchecked) {
		ExportFilesLength = ExportFilesLength + Object.keys(wavesurfer.regions.list).length;
		await window.exportAllClips();
	}
	console.log('Export All Finished!');

	return null;
};

window.exportAllClips = async function() {
	var array = Object.keys(wavesurfer.regions.list);
	for (let index = 0; index < array.length; index++) {
		const element = array[index];
		console.log(element);
		await window.exportClip(element);
	}
	return;
};

window.clearExportHistory = async function() {
	exportHistory = {};
	window.renderHistoryExports();
};

// Mark : Fast Export

window.fastExport = async function(id, event) {
	event.stopPropagation();
	console.log('Fast Export = ', id);
	console.log('Using default Export Settings = ', settings.data.defaultExport);
};

window.removeRegionButton = async function(id, event) {
	event.stopPropagation();
	console.log('Remove Region = ', id);
	wavesurfer.regions.list[id].remove();
};

// Mark: Start Converting File

var exportList = [];
window.startExport = async function() {
	//exportHistory = {};
	//renderHistoryExports();
	for (var key in currentExports) {
		if (currentExports.hasOwnProperty(key)) {
			var element = currentExports[key];

			document.getElementById('exportText').innerHTML = `${Object.keys(currentExports).length} files left to process`;
			const result = await ipcRenderer.invoke('convertFile', element);
			window.addCurrentExportToHistory(result.data.uuid);
		}
	}

	if (Object.keys(currentExports).length > 0) {
		window.startExport();
	} else {
		document.getElementById('exportText').innerHTML = `Finished`;
	}

	exportList = [];
	return;
};

window.renderCurrentExportProcess = function(process) {
	console.log('renderCurrentExportProcess', process);

	//document.getElementById('exportText').innerHTML = `${ExportFilesFinished}/${ExportFilesLength} File ${process.outputFile}`;
	//document.getElementById('exportText').innerHTML = `Exporting File ${process.outputFile}`;
	changeProgress('videoExport', process.progress.percent);
};

document.onkeydown = handleWindowKeys;
//document.onkeyup = document.onkeypress = handle;

var CurserToMove = {
	id: 'Main',
	type: ''
};

// mark : Handle Window Keys

function handleWindowKeys(e) {
	console.log(e.key);

	switch (e.code) {
		case 'ArrowUp':
			if (e.ctrlKey) {
				window.HigherSpeed();
				//window.IncDecVolume(1, true)
			} else {
				window.IncDecVolume(10, true);
			}

			break;
		case 'ArrowDown':
			if (e.ctrlKey) {
				window.LowerSpeed();
				//window.IncDecVolume(1, false)
			} else {
				window.IncDecVolume(10, false);
			}
			break;
		case 'ArrowRight':
			console.log('ArrowRight', CurserToMove);

			if (CurserToMove.id == 'Main') {
				//console.log('ArrowRight Main');
				window.nextFrame();
			} else if (typeof wavesurfer.regions.list[CurserToMove.id] != 'undefined') {
				var frameTime = calcSekPerFrame();
				//console.log(CurserToMove);

				//console.log('ArrowRight Region frameTime = ', frameTime);
				//console.log('ArrowRight Region old time = ', wavesurfer.regions.list[CurserToMove.id][CurserToMove.type]);
				//console.log('ArrowRight Region new time = ', wavesurfer.regions.list[CurserToMove.id][CurserToMove.type] + frameTime);
				window.setRegionParams(CurserToMove.id, { [CurserToMove.type]: wavesurfer.regions.list[CurserToMove.id][CurserToMove.type] + frameTime });
			}

			return;
			if (dotPressed[2] || dotPressed[1]) {
				var sliderval = slider.noUiSlider.get();
				if (dotPressed[2]) {
					sliderval[2] = window.nextFrame();
				} else {
					sliderval[1] = window.nextFrame();
				}
				slider.noUiSlider.set(sliderval);
			} else {
				if (e.ctrlKey || window.videoelement.paused) {
					window.nextFrame();
				} else {
					window.skipTime(3, true);
				}
			}

			break;
		case 'ArrowLeft':
			if (CurserToMove.id == 'Main') {
				console.log('ArrowLeft Main');
				window.previousFrame();
			} else if (typeof wavesurfer.regions.list[CurserToMove.id] != 'undefined') {
				var frameTime = calcSekPerFrame();
				console.log('ArrowLeft Region frameTime = ', frameTime);
				console.log('ArrowLeft Region old time = ', wavesurfer.regions.list[CurserToMove.id][CurserToMove.type]);
				console.log('ArrowLeft Region new time = ', wavesurfer.regions.list[CurserToMove.id][CurserToMove.type] - frameTime);

				window.setRegionParams(CurserToMove.id, { [CurserToMove.type]: wavesurfer.regions.list[CurserToMove.id][CurserToMove.type] - frameTime });
			}

			return;

			if (dotPressed[2] || dotPressed[1]) {
				var sliderval = slider.noUiSlider.get();
				if (dotPressed[2]) {
					sliderval[2] = window.previousFrame();
				} else {
					sliderval[1] = window.previousFrame();
				}
				slider.noUiSlider.set(sliderval);
			} else {
				if (e.ctrlKey || window.videoelement.paused) {
					window.previousFrame();
				} else {
					window.skipTime(3, false);
				}
			}
			break;
		case 'Space':
			if (e.ctrlKey) {
				//window.previousFrame()
				window.toggleFullscreen('FullscreenContainer');
				console.log('Arrow Right Key Pressed');
			} else {
				window.togglePlay();
				//window.skipTime(3, false)
				console.log('Arrow Right Key Pressed');
			}
			break;
		case 'KeyS':
			if (e.ctrlKey) {
				console.log('Arrow Right Key Pressed');
			} else {
				window.showControls();
				console.log('Arrow Right Key Pressed');
			}
			break;
		case 'KeyH':
			if (e.ctrlKey) {
				console.log('Arrow Right Key Pressed');
			} else {
				window.hideControls();
				console.log('Arrow Right Key Pressed');
			}
			break;
		case 'KeyE':
			if (e.ctrlKey) {
				console.log('E and ctrl Key Pressed');
			} else {
				console.log('E  Key Pressed');
			}
			break;
		case 'Delete':
			console.log('Delete regionId = ', currentActiveRegion.id);
			if (currentActiveRegion.id) {
				window.removeRegion(currentActiveRegion.id);
			}
			break;
		default:
			break;
	}

	if (e.keyCode >= 37 && e.keyCode <= 40) {
		return false;
	}
}

window.saveFrame = async function() {
	var parsedPath = path.parse(window.playlist[window.currentPlaylistIndex]);
	// var framePath = `${parsedPath.dir}/${parsedPath.name}-Frame_${getCurrentFrameIndex()}.png`
	var framePath = path.join(parsedPath.dir, `${parsedPath.name}-Frame_${getCurrentFrameIndex()}.png`);
	console.log(framePath);
	const result = await ipcRenderer.invoke('saveDialog', framePath);

	if (!result.canceled) {
		fs.writeFile(result.filePath, getFrameImg(), 'base64', function(err) {
			console.log(err);
		});
	}
};

window.getSettings = function() {
	//const result = await ipcRenderer.invoke('getSettings');
	//  return result;
};

window.setSettings = function(settings) {
	// const result = await ipcRenderer.invoke('setSettings', settings);
	// return result;
};

window.setKey = function(data) {
	//  const result = await ipcRenderer.invoke('setKey', data);
	//  return result;
};

window.isFullscreen = function() {
	if (document.fullscreenElement) {
		return true;
	} else {
		return false;
	}
};

window.openFileInBrowserAndHighlight = function(data) {
	if (typeof data == 'undefined' || data == null || data == '') {
		if (window.playlist[window.currentPlaylistIndex]) {
			ipcRenderer.invoke('openFileInBrowserAndHighlight', window.playlist[window.currentPlaylistIndex]);
		}
	} else {
		console.log('Open in Browser = ', data.replaceAll('/', '\\'));
		ipcRenderer.invoke('openFileInBrowserAndHighlight', data.replaceAll('/', '\\'));
	}
};

window.startDeleteFromDrive = function() {
	console.log('window.startDeleteFromDrive = ');

	ipcRenderer.invoke('deleteFromDrive', window.playlist[window.currentPlaylistIndex]);
	window.removevideoid(currentPlaylistIndex);
	window.closeModal('confirmModal');
};

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Clamp number between two values with the following line:
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * Generate a UUID
 */
function UUID() {
	function ff(s) {
		var pt = (Math.random().toString(16) + '000000000').substr(2, 8);
		return s ? '-' + pt.substr(0, 4) + '-' + pt.substr(4, 4) : pt;
	}
	return ff() + ff(true) + ff(true) + ff();
}
