const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let serverProcess;
let mainWindow;

function startServer() {
    serverProcess = spawn('node', ['server.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        backgroundColor: '#1a1a1a',
        title: 'Welcome to Derry - Todo App',
        icon: path.join(__dirname, 'public', 'icon-192.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Wait a bit for server to start
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
    }, 2000);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    startServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
