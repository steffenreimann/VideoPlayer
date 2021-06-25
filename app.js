const electron = require('electron');
const path = require('path');
const url = require('url');
const settings = require('easy-nodejs-app-settings')
// SET ENV
process.env.NODE_ENV = 'development';
const { app, BrowserWindow, Menu, ipcMain } = electron;


app.on('ready', function () {
    // Create new window
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 500,
        title: 'Electon Example',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'public/index.html'),
        protocol: 'file:',
        slashes: true,
        title: 'Electron Example'
    }));

    // Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });

    mainWindow.on('minimize', function (event) {
    });

    mainWindow.on('restore', function (event) {
    });
    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
    mainWindow.toggleDevTools();
});

// Create menu template
const mainMenuTemplate = [
    // Each object is a dropdown
    {
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function () { app.quit(); } }
        ]
    }, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Test Function Call", accelerator: "CmdOrCtrl+S", click: function () { testFunction(); } },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
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


settings.init('Electon Example App').then((resolveData) => {
    console.log('Settings File Succsessfull Init.')
    settings.setKey({ 'Key': 'value', 'otherKey': 'otherValue' }).then((data) => {
        console.log('Change Value by keys = ', data)
    }, (err) => {
        console.log('Set Value by key error = ', err)
    })
}, (rejectData) => {
    console.log('Cant Init Settings File!!! Error= ', rejectData)
})

ipcMain.handle('TestEvent', async (event, data) => {
    console.log(data)
    return data
})

// This is the Test Function that you can call from Menu
var i = 0
function testFunction(params) {
    i++
    console.log('You Click in Menu the Test Button i = ', i);
    mainWindow.send('TestEvent', i);
}