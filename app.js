const electron = require('electron');
var os = require('os');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
var pathToFfmpeg = require('ffmpeg-ffprobe-static');
var ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const url = require('url');
const { promises: fs } = require('fs');
const settings = require('easy-nodejs-app-settings');
// SET ENV
process.env.NODE_ENV = 'development';
const { app, BrowserWindow, Menu, ipcMain, dialog } = electron;
var ffmetadata = require('ffmetadata');
var platform = os.platform();
//patch for compatibilit with electron-builder, for smart built process.
if (platform == 'darwin') {
	platform = 'mac';
} else if (platform == 'win32') {
	platform = 'win';
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.channel = 'alpha';

if (app.isPackaged) {
	pathToFfmpeg.ffmpegPath = pathToFfmpeg.ffmpegPath.replace('app.asar', 'app.asar.unpacked');
	pathToFfmpeg.ffprobePath = pathToFfmpeg.ffprobePath.replace('app.asar', 'app.asar.unpacked');
}

log.info('pathToFfmpeg', pathToFfmpeg);
process.env.FFMPEG_PATH = pathToFfmpeg.ffmpegPath;
process.env.FFPROBE_PATH = pathToFfmpeg.ffprobePath;

// Set path to ffmpeg - optional if in $PATH or $FFMPEG_PATH
ffmetadata.setFfmpegPath(process.env.FFMPEG_PATH);

log.info('FFMPEG Path = ', process.env.FFMPEG_PATH);
log.info('FFPROBE Path = ', process.env.FFPROBE_PATH);

var mainWindow = null;

//proc = new ffmpeg({ source: movieUrl, nolog: true, timeout: FFMPEG_TIMEOUT })

//proc.addOptions(opts)
//proc.writeToStream(response, function (return_code, error) {

app.on('ready', function() {
	// Create new window
	mainWindow = new BrowserWindow({
		width: 1470,
		height: 920,
		minHeight: 720,
		minWidth: 720,
		title: 'VideoTools',
		//autoHideMenuBar: true, //hide menu bar
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: false,
			preload: path.join(__dirname, 'preload.js'),
			devTools: true
		}
	});

	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'public/index.html'),
			protocol: 'file:',
			slashes: true,
			title: 'VideoTools'
		})
	);

	// Quit app when closed
	mainWindow.on('closed', function() {
		app.quit();
	});

	mainWindow.on('minimize', function(event) {});

	mainWindow.on('restore', function(event) {});
	// Build menu from template
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	//const mainMenu = Menu.buildFromTemplate([]);
	// Insert menu
	Menu.setApplicationMenu(mainMenu);
	mainWindow.toggleDevTools();

	log.info('App starting...');
	//log.info(autoUpdater);

	function sendStatusToWindow(text) {
		log.info(text);
		mainWindow.webContents.send('message', text);
	}

	autoUpdater.on('checking-for-update', () => {
		updateStatus = 'checking-for-update';
		sendStatusToWindow({ type: 'update', status: 'checking-for-update' });
	});
	autoUpdater.on('update-available', (info) => {
		updateStatus = 'update-available';
		sendStatusToWindow({ type: 'update', status: 'update-available' });
	});
	autoUpdater.on('update-not-available', (info) => {
		updateStatus = 'update-not-available';
		sendStatusToWindow({ type: 'update', status: 'update-not-available' });
	});
	autoUpdater.on('error', (err) => {
		updateStatus = 'error';
		//sendStatusToWindow({ type: 'update', status: 'error', error: err });
	});
	autoUpdater.on('download-progress', (progressObj) => {
		let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
		log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
		log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
		updateStatus = 'download-progress';
		sendStatusToWindow({ type: 'update', status: 'download-progress', progress: progressObj });
	});
	autoUpdater.on('update-downloaded', (info) => {
		updateStatus = 'update-downloaded';
		sendStatusToWindow({ type: 'update', status: 'update-downloaded' });
		sendStatusToWindow('Start Install');
		autoUpdater.quitAndInstall();
	});
	autoUpdater.setFeedURL({
		provider: 'github',
		owner: 'steffenreimann',
		repo: 'VideoPlayer'
	});

	autoUpdater.checkForUpdates().then((data) => {
		//log.info('checkForUpdates ');
		sendStatusToWindow(data);
	});

	//autoUpdater.checkForUpdatesAndNotify().then(() => {
	//	updateStatus = 'update-check-finished';
	//	sendStatusToWindow({ type: 'update', status: 'update-check-finished' });
	//});
});

var updateStatus = null;

ipcMain.handle('checking-update-status', async (event, data) => {
	log.info(data);

	if (!updateStatus) {
		autoUpdater.checkForUpdatesAndNotify().then(() => {
			updateStatus = 'update-check-finished';
			sendStatusToWindow({ type: 'update', status: 'update-check-finished' });
		});
	}

	return updateStatus;
});
ipcMain.handle('downloadAndApplyUpdate', async (event, data) => {
	return new Promise((resolve, reject) => {
		autoUpdater.downloadUpdate();
	});
});

// Create menu template
const mainMenuTemplate = [
	// Each object is a dropdown
	{
		label: 'App',
		submenu: [
			{
				label: 'Export Frame',
				accelerator: 'CmdOrCtrl+R',
				click: function() {
					callPlayerFunction('exportFrame');
					//callFrameExportWindow();
				}
			},
			{
				label: 'Export Video and Clips',
				accelerator: 'CmdOrCtrl+E',
				click: function() {
					//callVideoExportWindow();
					callPlayerFunction('openExport');
				}
			},
			{ type: 'separator' },
			{
				label: 'Quit',
				accelerator: 'Command+Q',
				click: function() {
					app.quit();
				}
			}
		]
	},
	{
		label: 'Player',
		submenu: [
			{
				label: 'Slower',
				accelerator: 'CmdOrCtrl+S',
				click: function() {
					callPlayerFunction('Slower');
				}
			},
			{
				label: 'Faster',
				accelerator: 'CmdOrCtrl+D',
				click: function() {
					callPlayerFunction('Faster');
				}
			},
			{ type: 'separator' },
			{
				label: 'Before',
				accelerator: 'CmdOrCtrl+F',
				click: function() {
					callPlayerFunction('Before');
				}
			},
			{
				label: 'Toggle Play',
				accelerator: 'CmdOrCtrl+G',
				click: function() {
					callPlayerFunction('TogglePlay');
				}
			},
			{
				label: 'Next',
				accelerator: 'CmdOrCtrl+H',
				click: function() {
					callPlayerFunction('Next');
				}
			}
		]
	}
];

function callPlayerFunction(cmd) {
	mainWindow.webContents.send('callPlayerFunction', cmd);
}

// If OSX, add empty object to menu
if (process.platform == 'darwin') {
	// mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if (process.env.NODE_ENV !== 'production') {
	mainMenuTemplate.push({
		label: 'Developer Tools',
		submenu: [
			{
				role: 'reload'
			},
			{
				label: 'Toggle DevTools',
				accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
				click(item, focusedWindow) {
					focusedWindow.toggleDevTools();
				}
			}
		]
	});
}

settings.init({ App: 'EasyVideoPlayer' }).then(
	(resolveData) => {
		log.info('Settings Path = ', settings.settingFilePath);
		if (resolveData == null) {
			settings.setKey({ Key: 'value', otherKey: 'otherValue' }).then(
				(data) => {
					log.info('Init Succsessfull First Start = ', data);
				},
				(err) => {
					log.info('Set Value by key error = ', err);
				}
			);
		} else {
			log.info('Init Succsessfull ', resolveData);
		}
	},
	(rejectData) => {
		log.info('Cant Init Settings File!!! Error= ', rejectData);
	}
);

ipcMain.handle('setMenuBarVisibility', async (event, data) => {
	mainWindow.setMenuBarVisibility(data);
	return;
});

ipcMain.handle('getSettings', async (event) => {
	var settingsData = await settings.getSettings();
	return settingsData;
});

ipcMain.handle('setSettings', async (event, data) => {
	var settingsData = await settings.setSettings(data);
	return settingsData;
});

ipcMain.handle('setKey', async (event, data) => {
	var settingsData = await settings.setKey(data);
	return settingsData;
});

ipcMain.handle('TestEvent', async (event, data) => {
	log.info(data);
	return data;
});

var playlist = [];
ipcMain.handle('playlist', async (event, data) => {
	if (!data) {
		return playlist;
	} else {
		playlist = data;
		return playlist;
	}
});

ipcMain.handle('saveAs', async (event, filePath) => {
	//log.info(filePath)
	var buffer = await fs.readFile(filePath);

	return fs.stat(filePath);
});

//const { spawn } = require('child_process');
const { exec, spawn } = require('child-process-async');

ipcMain.handle('getFileInfos', async (event, filePath) => {
	//ffprobe -hide_banner -loglevel fatal -show_error -show_format -show_streams -show_programs -show_chapters -show_private_data -print_format json
	//-v quiet -print_format json -show_format -show_streams
	const childInfo = await spawn(process.env.FFPROBE_PATH, [ '-loglevel', 'fatal', '-show_error', '-print_format', 'json', '-show_format', '-show_streams', '-show_programs', '-show_chapters', '-show_private_data', '-show_metadata', filePath ]);

	const childInfoOut = await childInfo;

	//log.info(childInfoOut.stdout.toString());
	// log.info(childInfoOut.stderr.toString());
	// log.info(childInfoOut);

	//const childHash = await spawn(process.env.FFMPEG_PATH, [ '-i', filePath, '-map', '0:v', '-c', 'copy', '-f', 'hash', '-hash', 'md5', '-' ]);
	//const childHashOut = await childHash;
	//var outHashString = childHashOut.stdout.toString().normalize();
	//outHashString = outHashString.split('=')[1];
	//log.info(outHashString);
	//log.info(childHashOut.stderr.toString());
	console.log(childInfoOut.stdout.toString());

	//const childInfoNOJSON = await spawn(process.env.FFPROBE_PATH, [ '-loglevel', 'verbose', '-print_format', 'json', '-f', '-show_streams', filePath ]);
	//const childInfoOutNOJSON = await childInfoNOJSON;
	//console.log(childInfoOutNOJSON.stdout.toString());

	// Read song.mp3 metadata
	ffmetadata.read(filePath, function(err, data) {
		if (err) console.error('Error reading metadata', err);
		else console.log(data);
	});

	fs.writeFile('./testoutputlogfile.txt', childInfoOut.stdout.toString(), (err) => {
		if (err) {
			log.info(err);
		} else {
			log.info('The file has been saved!');
		}
	});

	var returnData = JSON.parse(childInfoOut.stdout.toString());
	//returnData.hash = childHashOut.stdout.toString();
	log.info(returnData);
	return returnData;
});

// ffmpeg -i input.mp4 -map 0:v -c copy -f md5 -

//ffmpeg -i input.mp4 -map 0 -c copy -f streamhash -hash md5 -

ipcMain.handle('openFiles', async (event, filePath) => {
	log.info('openFiles');
	const options = {
		defaultPath: filePath,
		properties: [ 'openFile', 'multiSelections' ]
	};
	const Files = await dialog.showOpenDialog(options);
	log.info(Files);
	return Files;
});

ipcMain.handle('openDialog', async (event, filePath) => {
	log.info('open dialog');
	const options = {
		defaultPath: filePath
	};
	const savePath = await dialog.showSaveDialog(null, options);
	log.info(savePath);
	return savePath;
});

ipcMain.handle('openDirDialog', async (event, filePath) => {
	log.info('open dialog');
	const options = {
		defaultPath: filePath,
		properties: [ 'openDirectory' ]
	};
	const savePath = await dialog.showOpenDialog(null, options);
	log.info(savePath);
	return savePath;
});

ipcMain.handle('saveDialog', async (event, filePath) => {
	const options = {
		defaultPath: filePath
	};
	const savePath = await dialog.showSaveDialog(null, options);
	log.info(savePath);
	return savePath;
});

ipcMain.handle('OpenExportVideoWindow', async (event, filePath) => {
	var exportWindow = new BrowserWindow({
		width: 1000,
		height: 500,
		title: 'Electon Example',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: false,
			preload: path.join(__dirname, 'exportPreload.js')
		}
	});

	exportWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'public/exportVideo.html'),
			protocol: 'file:',
			slashes: true,
			title: 'Electron Example'
		})
	);

	// Quit app when closed
	exportWindow.on('closed', function() {
		// app.quit();
	});

	exportWindow.on('minimize', function(event) {});

	exportWindow.on('restore', function(event) {});
	// Build menu from template
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	//const mainMenu = Menu.buildFromTemplate([]);
	// Insert menu
	Menu.setApplicationMenu(mainMenu);
	exportWindow.toggleDevTools();
});

ipcMain.handle('convertFile', async (event, data, cb) => {
	log.info('convertFile');
	var d = await convertFile(data);
	return d;
});

ipcMain.handle('TestExportSize', async (event, data, cb) => {
	log.info('convertFile');
	var d = await convertFile(data);
	var s = await fs.stat(data.outputFile);
	return s;
});

ipcMain.handle('openFileInBrowserAndHighlight', async (event, data) => {
	log.info('openFileInBrowserAndHighlight');
	exec(`explorer /select, ${data}`).catch((error) => {});
	return;
});

ipcMain.handle('deleteFromDrive', async (event, data) => {
	log.info('deleteFromDrive');
	var ret = await fs.unlink(data);
	return ret;
});

// This is the Test Function that you can call from Menu
var i = 0;
function testFunction(params) {
	i++;
	log.info('You Click in Menu the Test Button i = ', i);
	mainWindow.send('TestEvent', i);
}

var currentProcs = {};

function removeProc(id) {
	delete currentProcs[id];
}

async function convertFile(data) {
	return new Promise(function(resolve, reject) {
		// executor (the producing code, "singer")
		//ffmpeg -i inputVideo.mp4 -ss 00:00:03 -to 00:00:08 -c:v copy -c:a copy trimmedVideo.mp4

		var pid = UUID();
		currentProcs[pid] = data;

		var duration = 0;
		//const child = await spawn(process.env.FFPROBE_PATH, ['-i', 'inputFile', '-ss', 'StartTime', '-to', '-EndTime', '-c:v copy -c:a', 'outputFile']);

		log.info('Input data = ', data);

		//const child = await spawn(process.env.FFMPEG_PATH, ['-i', inputFile, '-ss', startTime, '-to', endTime, '-c:v', 'copy', '-c:a', outputFile]);
		//const { stdout, stderr } = await child;

		//log.info('stdout = ', stdout.toString());
		//log.info('stderr = ', stderr.toString());
		//return stdout.toString()

		//make sure you set the correct path to your video file
		var proc = new ffmpeg({ source: data.inputFile, nolog: false });

		// data = { inputFile: '', startTime: 2, duration: 10, outputFile: outputFile, fps: 60, format: 'mov', quality: '50%' }
		//	proc.addOptions([ '-map 0:a?', '-map 0:v? copy ', '-map 0:s? copy ', '-map 0:d? copy ', '-map 0:t? copy ' ]);
		proc.addOptions([ '-map 0' ]);
		proc.addOptions([ '-movflags use_metadata_tags' ]);
		//proc.addOptions([ '-map_metadata 0' ]);
		//proc.addOptions([ '-metadata:s:a:0 title=One' ]);
		proc.addOptions([ '-v verbose' ]);
		//proc.addOptions([ '-c:a copy' ]);
		// Set Quality
		if (typeof data.quality != 'undefined') {
			proc.withSize(`${data.quality}%`);
		} else {
			proc.withSize('100%');
		}

		//Set FPS
		if (typeof data.fps != 'undefined') {
			proc.withFps(data.fps);
		} else {
			data.fps = 24;
			proc.withFps(24);
		}

		//Set Start Time
		if (typeof data.startTime != 'undefined') {
			proc.setStartTime(data.startTime);
		} else {
			proc.setStartTime(0);
		}

		//Set setDuration
		if (typeof data.endTime != 'undefined') {
			log.info('data.endTime  = ', data.endTime);
			log.info(' data.startTime = ', data.startTime);
			log.info('data.endTime - data.startTime = ', data.endTime - data.startTime);
			//data.duration = data.endTime - data.startTime;
			proc.setDuration(data.endTime - data.startTime);
			duration = data.endTime - data.startTime;
		} else {
			//proc.setDuration(0)
		}

		//Set setDuration
		if (typeof data.duration != 'undefined') {
			proc.setDuration(data.duration);
			duration = data.duration;
		} else {
			//proc.setDuration(0)
		}

		//Set format
		if (typeof data.format != 'undefined') {
			proc.toFormat(data.format);
		} else {
			//proc.toFormat(0)
			//proc.toFormat(data.format || 'mov')
		}

		if (typeof data.videoBitrate != 'undefined') {
			proc.videoBitrate(data.videoBitrate);
		} else {
		}

		if (data.format != 'mp3' && data.format != 'wav' && data.format != 'gif') {
			if (typeof data.videoCodec != 'undefined') {
				proc.videoCodec(data.videoCodec);
			} else {
				proc.withVideoCodec('libx264');
			}
		}

		if (typeof data.compression != 'undefined') {
			proc.addOptions([ '-crf ' + data.compression.rate, '-preset ' + data.compression.preset ]);
		} else {
			proc.addOptions([ '-crf 30', '-preset medium' ]);
		}

		proc.on('start', function(commandLine) {
			log.info('Spawned FFmpeg with command: ' + commandLine);
			mainWindow.send('StartEvent', commandLine);
		});

		proc.on('error', function(err) {
			log.info('error: ', err);

			resolve({ msg: 'Error!', data: data, err: err });
			removeProc(pid);
		});

		proc.on('end', function(err) {
			if (!err) {
				log.info('conversion Done');
				resolve({ msg: 'Finished', data: data, err: false });
			}
			removeProc(pid);
		});

		proc.on('progress', function(progress) {
			// The 'progress' event is emitted every time FFmpeg
			// reports progress information. 'progress' contains
			// the following information:
			// - 'frames': the total processed frame count
			// - 'currentFps': the framerate at which FFmpeg is
			//   currently processing
			// - 'currentKbps': the throughput at which FFmpeg is
			//   currently processing
			// - 'targetSize': the current size of the target file
			//   in kilobytes
			// - 'timemark': the timestamp of the current frame
			//   in seconds
			// - 'percent': an estimation of the progress
			if (duration == 0) {
				duration = proc._ffprobeData.format.duration;
				log.info(proc._ffprobeData.format.duration);
			}

			var currentSek = progress.frames / data.fps;
			progress.percent = currentSek / duration * 100;
			data.progress = progress;
			mainWindow.send('ProgressEvent', data);
		});
		// save to file <-- the new file I want -->
		proc.saveToFile(data.outputFile);
	});
}

function UUID() {
	function ff(s) {
		var pt = (Math.random().toString(16) + '000000000').substr(2, 8);
		return s ? '-' + pt.substr(0, 4) + '-' + pt.substr(4, 4) : pt;
	}
	return ff() + ff(true) + ff(true) + ff();
}
