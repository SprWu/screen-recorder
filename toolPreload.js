const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('listenKeyboardEvent', callback => {
    ipcRenderer.on('keyboard-event', (event, args) => callback(args))
})