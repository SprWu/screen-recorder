const { app, BrowserWindow, ipcMain, desktopCapturer, Menu, globalShortcut } = require('electron')

const gotTheLock = app.requestSingleInstanceLock()

let mainWindow, intervalPt, childWindowCount = 0

if (gotTheLock) {
    app.on('second-instance', () => {
        if (mainWindow !== undefined) {
            mainWindow.isMaximizable() && mainWindow.restore()
            mainWindow.focus()
        }
    })
    app.on('window-all-closed', () => app.quit())
    app.on('will-quit', () => globalShortcut.unregisterAll())
    app.whenReady().then(() => {
        registerKeyboardEventListen()
        createMainWindow()
    })
} else {
    app.quit()
}

function createMainWindow() {
    ipcMain.on('capture', (event, args) => {
        clearInterval(intervalPt)
        getCapture(event, args)
        intervalPt = setInterval(() => getCapture(event, args), 1000)
    })

    mainWindow = new BrowserWindow({
        useContentSize: true,
        x: 100,
        y: 100,
        width: 300,
        height: 170,
        resizable: false,
        fullscreenable: false,
        show: false,
        icon: './render/recorder.ico',
        webPreferences: {
            preload: app.getAppPath() + '/toolPreload.js'
        }
    })

    // 控制新窗口打开
    mainWindow.webContents.setWindowOpenHandler(() => {
        if (childWindowCount === 0) {
            childWindowCount++
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    useContentSize: true,
                    center: true,
                    fullscreenable: false,
                    width: 990,
                    height: 470,
                    parent: mainWindow,
                    resizable: false,
                    autoHideMenuBar: true,
                    icon: './render/recorder.ico',
                    webPreferences: {
                        preload: app.getAppPath() + '/capturePreload.js'
                    }
                }
            }
        } else {
            return {
                action: 'deny'
            }
        }
    })

    // 当捕获窗口关闭时，需要停止计时器，结束获取捕获窗口
    mainWindow.webContents.on('did-create-window', captureWindow => {
        captureWindow.webContents.on('destroyed', () => {
            clearInterval(intervalPt)
            childWindowCount = 0
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            }
        })
    })

    mainWindow.loadFile('./render/tool.html').then(() => {
        mainWindow.setMenu(new Menu())
        mainWindow.show()
    })
}

/**
 * 响应页面请求的获取捕获窗口
 * @param event 事件
 * @param size 缩略图大小
 */
function getCapture(event, size) {
    desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: size, height: size },
        fetchWindowIcons: true
    }).then(sources => {
        event.reply('capture', sources.map(source => ({
            id: source.id,
            name: source.name,
            appIcon: source.appIcon?.toDataURL(),
            thumbnail: source.thumbnail.toDataURL()
        })))
    })
}

/**
 * 注册全局键盘事件
 */
function registerKeyboardEventListen() {
    globalShortcut.register('Shift+Alt+C', () => {
        mainWindow.webContents.send('keyboard-event', 'capture')
    })
    globalShortcut.register('Shift+Alt+R', () => {
        mainWindow.webContents.send('keyboard-event', 'startRecord')
    })
    globalShortcut.register('Shift+Alt+E', () => {
        mainWindow.webContents.send('keyboard-event', 'stopRecord')
    })
    globalShortcut.register('Shift+Alt+T', () => {
        mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop(), 'pop-up-menu')
    })
}