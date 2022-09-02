const tip = document.querySelector('#tip-box .tip'),
    captureName = document.querySelector('#tip-box .capture-name'),
    captureTime = document.querySelector('#tip-box .capture-time'),
    targetBtn = document.querySelector('#target'),
    startBtn = document.querySelector('#start'),
    stopBtn = document.querySelector('#stop');

// 录制工具状态枚举
const PENDING = 'pending', // 待选择捕获窗口
    SELECTING = 'selecting', // 正在选择
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
    recordTip = '正在录制',
    endTip = '录制结束：';

/**
 * 打开捕获窗口选择窗口
 */
function openCaptureWindow() {
    if (status === RECORD || status === SELECTING || targetBtn.classList.contains('disable')) {
        return void 0
    }
    captureWindow ??= window.open('capture.html')
    targetBtn.classList.add('disable')
    startBtn.classList.add('disable')
    status = SELECTING
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
        audio: {
            mandatory: {
                chromeMediaSource: 'desktop'
            }
        },
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: id,
                maxFrameRate: 60
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
        let recordTime = 0, timerPt
        recorder = new MediaRecorder(recordStream, {
            mimeType: 'video/webm; codecs=h264'
        })

        recorder.onstop = () => {
            clearInterval(timerPt)
            // 停止视频流
            recordStream?.getTracks()?.forEach(track => track.stop())
            tip.textContent = endTip
            recordTime = 0
            captureTime.textContent = ''
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
        clearInterval(timerPt)
        captureTime.textContent = '(00:00):'
        timerPt = window.setInterval(() => {
            recordTime++
            captureTime.textContent = formatTime(recordTime)
        }, 1000)

        tip.textContent = recordTip
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
       let message = evt.data
       if (message.type === 'close') {
           captureWindow = undefined
           if (sourceId === undefined) {
               status = PENDING
           } else {
               status = CAPTURE
               startBtn.classList.remove('disable')
           }
           targetBtn.classList.remove('disable')
       } else {
           let { name, id } = message.data
           tip.textContent = captureTip
           getCaptureStream(name, id)
       }
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

/**
 * 将秒数格式化为 分:秒
 * @param time 秒数
 */
function formatTime(time) {
    let minutes = ~~(time / 60), seconds = time %= 60
    return `(${minutes.toString().padStart(2, 0)}:${seconds = time.toString().padStart(2, 0)}):`
}