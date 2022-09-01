const tip = document.querySelector('#tip-box .tip'),
    captureName = document.querySelector('#tip-box .capture-name'),
    targetBtn = document.querySelector('#target'),
    startBtn = document.querySelector('#start'),
    stopBtn = document.querySelector('#stop');

// 录制工具状态枚举
const PENDING = 'pending', // 待选择捕获窗口
    CAPTURE = 'capture', // 已选择捕获窗口且成功获取视频流
    RECORD = 'record'; // 正在录制

let sourceId = undefined, // 捕获窗口id
    captureWindow = undefined, // 捕获窗口引用
    recordStream = undefined, // 捕获窗口视频流
    recorder = undefined; // 录制工具实例

let status = PENDING // 录制工具状态

// 文本提示
const notCaptureTip = '请选择捕获窗口',
    errorCaptureTip = '窗口视频流获取出错，请重新选择',
    captureTip = '捕获窗口：',
    recordTip = '正在录制：',
    endTip = '录制结束：';

/**
 * 打开捕获窗口选择窗口
 */
function openCaptureWindow() {
    if (status === RECORD || targetBtn.classList.contains('disable')) {
        return void 0
    }
    captureWindow = window.open('capture.html')
}

/**
 * 获取捕获窗口的视频流
 * @param name 捕获窗口名称
 * @param id 捕获窗口 sourceId
 */
function getCaptureStream(name ,id) {
    if (recordStream !== undefined) {
        recordStream.getTracks().forEach(track => track.stop())
    }
    navigator.mediaDevices.getUserMedia({
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: id
            }
        }
    }).then(stream => {
        recordStream = stream
        captureName.textContent = name
        sourceId = id
        startBtn.classList.remove('disable')
        status = CAPTURE
    }).catch(() => {
        sourceId = undefined
        recordStream = undefined
        captureName.textContent = ''
        tip.textContent = errorCaptureTip
        status = PENDING
    })
}

/**
 * 开始录制
 */
function startRecord() {
    if (status !== CAPTURE || startBtn.classList.contains('disable')) {
        return void 0
    }
    if (sourceId !== undefined && recordStream !== undefined) {
        // 储存捕获的视频内容
        let chunk = []
        recorder = new MediaRecorder(recordStream, {
            mimeType: 'video/webm; codecs=h264'
        })

        recorder.onstop = () => {
            // 停止视频流
            recordStream?.getTracks()?.forEach(track => track.stop())
            tip.textContent = endTip
            downloadRecordFile(chunk)
            status = PENDING
            targetBtn.classList.remove('disable')
            startBtn.classList.add('disable')
            stopBtn.classList.add('disable')
            sourceId = undefined
            recordStream = undefined
            recorder = undefined
            chunk = undefined
        }

        recorder.ondataavailable = e => chunk.push(e.data)

        recorder.start()
        status = RECORD
        targetBtn.classList.add('disable')
        startBtn.classList.add('disable')
        stopBtn.classList.remove('disable')
    }
}

/**
 * 停止录制
 */
function stopRecord() {
    if (status !== RECORD || stopBtn.classList.contains('disable')) {
        return void 0
    }
    if (recorder !== undefined && recorder.state !== 'inactive') {
        recorder.stop()
    }
}

/**
 * 下载录制文件
 * @param file 视频录制的chunk
 */
function downloadRecordFile(file) {
    const blob = new Blob(file, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const fileName = `录制-${Date.now()}.webm`
    a.href = url
    a.download = fileName
    a.click()
    captureName.textContent = fileName
    URL.revokeObjectURL(url)
}

targetBtn.addEventListener('click', openCaptureWindow)

startBtn.addEventListener('click', startRecord)

stopBtn.addEventListener('click', stopRecord)

window.addEventListener('message', evt => {
   if (evt.origin === 'file://') {
       let { name, id } = evt.data
       tip.textContent = captureTip
       getCaptureStream(name, id)
   }
})

window.listenKeyboardEvent(execType => {
    switch (execType) {
        case 'capture':
            openCaptureWindow()
            break;
        case 'startRecord':
            startRecord()
            break;
        case 'stopRecord':
            stopRecord()
            break;
        default:
            break;
    }
})