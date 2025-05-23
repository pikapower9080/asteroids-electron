// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { RPClient, Presence } = require('rpcord')

let setupPresence = false

const rpc = new RPClient("1335090441908916294")

rpc.on('ready', () => {
  console.log("Connected to Discord")
})

let lastPresence = null

ipcMain.on('message-from-renderer', async (event, data) => {
  const rawData = data
  data = JSON.parse(data)
  if (data.type && data.type == "updatePresence") {
    if (lastPresence == rawData) return
    lastPresence = rawData
    if (!setupPresence) {
      try {
        await rpc.connect()
        setupPresence = true
      } catch(error) {
        console.warn("Could not connect to Discord")
        return
      }
    }
    const presence = new Presence()
    if (data.state) presence.setState(data.state)
    if (data.details) presence.setDetails(data.details)
    if (data.startTimestamp) presence.setStartTimestamp(data.startTimestamp)
    if (rpc.connected) {
      rpc.setActivity(presence)
    }
  } else if (data.type && data.type == "stopPresence") {
    rpc.disconnect()
    setupPresence = false
    console.log("Disconnected from Discord")
  } else if (data.type && data.type == "quit") {
    app.quit()
  }
})

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: !(process.env.NODE_ENV === 'development'),
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      devTools: (process.env.NODE_ENV === 'development'),
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('app/singlefile.html')

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler((( { url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  }))
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})