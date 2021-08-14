const electron = require('electron');
const path = require('path');
const url = require('url');
const { promises: fs } = require('fs');
const settings = require('easy-nodejs-app-settings');
// SET ENV
process.env.NODE_ENV = 'development';
const { app, BrowserWindow, Menu, ipcMain, dialog } = electron;

var pathToFfmpeg = require('ffmpeg-static');
var pathToFfmpeg = require('ffmpeg-ffprobe-static');

process.env.FFMPEG_PATH = pathToFfmpeg.ffmpegPath;
process.env.FFPROBE_PATH = pathToFfmpeg.ffprobePath;

console.log('FFMPEG Path = ', process.env.FFMPEG_PATH);
console.log('FFPROBE Path = ', process.env.FFPROBE_PATH);

var ffmpeg = require('fluent-ffmpeg');

//proc = new ffmpeg({ source: movieUrl, nolog: true, timeout: FFMPEG_TIMEOUT })

//proc.addOptions(opts)
//proc.writeToStream(response, function (return_code, error) {

app.on('ready', function() {
	// Create new window
	mainWindow = new BrowserWindow({
		width: 1270,
		height: 720,
		minHeight: 720,
		minWidth: 720,
		title: 'Electon Example',
		//autoHideMenuBar: true, //hide menu bar
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: false,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'public/index.html'),
			protocol: 'file:',
			slashes: true,
			title: 'Electron Example'
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
});

// Create menu template
const mainMenuTemplate = [
	// Each object is a dropdown
	{
		label: 'Application',
		submenu: [
			{ label: 'About Application', selector: 'orderFrontStandardAboutPanel:' },
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
		label: 'Edit',
		submenu: [
			{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
			{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
			{ type: 'separator' },
			{
				label: 'Test Function Call',
				accelerator: 'CmdOrCtrl+S',
				click: function() {
					testFunction();
				}
			},
			{ type: 'separator' },
			{ label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
			{ label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
			{ label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
			{ label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
		]
	}
];

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
		console.log('Settings Path = ', settings.settingFilePath);
		if (resolveData == null) {
			settings.setKey({ Key: 'value', otherKey: 'otherValue' }).then(
				(data) => {
					console.log('Init Succsessfull First Start = ', data);
				},
				(err) => {
					console.log('Set Value by key error = ', err);
				}
			);
		} else {
			console.log('Init Succsessfull ', resolveData);
		}
	},
	(rejectData) => {
		console.log('Cant Init Settings File!!! Error= ', rejectData);
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
	console.log(data);
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
	//console.log(filePath)
	var buffer = await fs.readFile(filePath);

	return fs.stat(filePath);
});

//const { spawn } = require('child_process');
const { exec, spawn } = require('child-process-async');

ipcMain.handle('getFileInfos', async (event, filePath) => {
	//ffprobe -hide_banner -loglevel fatal -show_error -show_format -show_streams -show_programs -show_chapters -show_private_data -print_format json
	//-v quiet -print_format json -show_format -show_streams
	const childInfo = await spawn(process.env.FFPROBE_PATH, [ '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', '-show_programs', '-show_chapters', '-show_private_data', filePath ]);
	const childInfoOut = await childInfo;

	//console.log(childInfoOut.stdout.toString());
	// console.log(childInfoOut.stderr.toString());
	// console.log(childInfoOut);

	const childHash = await spawn(process.env.FFMPEG_PATH, [ '-i', filePath, '-map', '0:v', '-c', 'copy', '-f', 'hash', '-hash', 'md5', '-' ]);
	const childHashOut = await childHash;
	var outHashString = childHashOut.stdout.toString().normalize();
	outHashString = outHashString.split('=')[1];
	//console.log(outHashString);
	//console.log(childHashOut.stderr.toString());
	//console.log(childHashOut);

	var returnData = JSON.parse(childInfoOut.stdout.toString());
	returnData.hash = childHashOut.stdout.toString();
	console.log(returnData);
	return returnData;
});

// ffmpeg -i input.mp4 -map 0:v -c copy -f md5 -

//ffmpeg -i input.mp4 -map 0 -c copy -f streamhash -hash md5 -

ipcMain.handle('openFiles', async (event, filePath) => {
	console.log('openFiles');
	const options = {
		defaultPath: filePath,
		properties: [ 'openFile', 'multiSelections' ]
	};
	const Files = await dialog.showOpenDialog(options);
	console.log(Files);
	return Files;
});

ipcMain.handle('openDialog', async (event, filePath) => {
	console.log('open dialog');
	const options = {
		defaultPath: filePath
	};
	const savePath = await dialog.showSaveDialog(null, options);
	console.log(savePath);
	return savePath;
});

ipcMain.handle('openDirDialog', async (event, filePath) => {
	console.log('open dialog');
	const options = {
		defaultPath: filePath,
		properties: [ 'openDirectory' ]
	};
	const savePath = await dialog.showOpenDialog(null, options);
	console.log(savePath);
	return savePath;
});

ipcMain.handle('saveDialog', async (event, filePath) => {
	const options = {
		defaultPath: filePath
	};
	const savePath = await dialog.showSaveDialog(null, options);
	console.log(savePath);
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
	console.log('convertFile');
	var d = await convertFile(data);
	return d;
});

ipcMain.handle('TestExportSize', async (event, data, cb) => {
	console.log('convertFile');
	var d = await convertFile(data);
	var s = await fs.stat(data.outputFile);
	return s;
});

ipcMain.handle('openFileInBrowserAndHighlight', async (event, data) => {
	console.log('openFileInBrowserAndHighlight');
	exec(`explorer /select, ${data}`).catch((error) => {});
	return;
});

// This is the Test Function that you can call from Menu
var i = 0;
function testFunction(params) {
	i++;
	console.log('You Click in Menu the Test Button i = ', i);
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

		console.log('Input data = ', data);

		//const child = await spawn(process.env.FFMPEG_PATH, ['-i', inputFile, '-ss', startTime, '-to', endTime, '-c:v', 'copy', '-c:a', outputFile]);
		//const { stdout, stderr } = await child;

		//console.log('stdout = ', stdout.toString());
		//console.log('stderr = ', stderr.toString());
		//return stdout.toString()

		//make sure you set the correct path to your video file
		var proc = new ffmpeg({ source: data.inputFile, nolog: true });

		// data = { inputFile: '', startTime: 2, duration: 10, outputFile: outputFile, fps: 60, format: 'mov', quality: '50%' }

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
			console.log('data.endTime  = ', data.endTime);
			console.log(' data.startTime = ', data.startTime);
			console.log('data.endTime - data.startTime = ', data.endTime - data.startTime);
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

		proc.on('start', function(commandLine) {
			console.log('Spawned FFmpeg with command: ' + commandLine);
			mainWindow.send('StartEvent', commandLine);
		});

		proc.on('error', function(err) {
			console.log('error: ', +err);
			resolve('Error!', err);
			removeProc(pid);
		});

		proc.on('end', function(err) {
			if (!err) {
				console.log('conversion Done');
				resolve('Finished', false);
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
				console.log(proc._ffprobeData.format.duration);
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
