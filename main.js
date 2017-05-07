const Config = require('./build/Config').default;
Config.loadCustom();

const path = require('path');
const url = require('url');
const electron = require('electron');
require('electron-debug')({enabled: Config.ENABLE_DEBUG});

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of some objects, if we won't, the objects will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Set proper env we are running in depending on whether we have electron prebuilt
const isProd = process.mainModule.filename.indexOf('app.asar') !== -1;
process.env.NODE_ENV = isProd ? 'production' : 'development';

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 760,
    icon: __dirname + '/res/icon.' + (process.platform === 'win32' ? 'ico' : 'png')
  });
  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'build/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
