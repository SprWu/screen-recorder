const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('emitCapture', (size = 150) => {
    ipcRenderer.send('capture', size)
})

contextBridge.exposeInMainWorld('listenCapture', callback => {
    ipcRenderer.on('capture', (event, args) => {
        callback(args)
    })
})