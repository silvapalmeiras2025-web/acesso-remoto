const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { io } = require('socket.io-client');
const robot = require('robotjs');

let mainWindow;
let socket;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "RemoteConnect Desktop",
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Carrega a URL do seu app (substitua pela URL real após o deploy)
  mainWindow.loadURL('https://ais-dev-2pjiadu76na6jcwecqcy6v-49324637534.us-east1.run.app');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// Lógica de Controle Nativo Integrada no App
ipcMain.on('start-native-control', (event, deviceId) => {
  if (socket) socket.disconnect();

  socket = io('https://ais-dev-2pjiadu76na6jcwecqcy6v-49324637534.us-east1.run.app');

  socket.on('connect', () => {
    socket.emit('identify-agent', deviceId);
  });

  socket.on('execute-command', (cmd) => {
    if (cmd.type === 'mouse_move') {
      const screenSize = robot.getScreenSize();
      robot.moveMouse(cmd.pos.x * screenSize.width, cmd.pos.y * screenSize.height);
    } else if (cmd.type === 'mouse_click') {
      robot.mouseClick();
    }
  });
});
