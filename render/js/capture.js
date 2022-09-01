let recordStream, recorder

const sourcesBox = document.querySelector('#sources-box')
sourcesBox.addEventListener('click', event => {
    const target = event.path.find(node => node?.classList?.contains('source'))
    if (target) {
        window.opener.postMessage({
            type: 'selected',
            data: { name: target.dataset.name, id: target.dataset.id }
        })
        window.close()
    }
}, false)

window.onbeforeunload = () => {
    window.opener.postMessage({
        type: 'close'
    })
}

window.listenCapture(sources => {
    const fragment = document.createDocumentFragment()
    sources.forEach(source => {
        const div = document.createElement('div')
        div.classList.add('source')
        div.dataset.name = source.name
        div.dataset.id = source.id
        const thumbnail = document.createElement('img')
        thumbnail.classList.add('thumbnail')
        thumbnail.src = source.thumbnail
        const info = document.createElement('div')
        info.classList.add('info')
        const icon = document.createElement('img')
        icon.classList.add('source-icon')
        icon.src = source.appIcon
        const name = document.createElement('span')
        name.classList.add('source-name')
        name.textContent = source.name
        info.appendChild(icon)
        info.appendChild(name)
        div.appendChild(thumbnail)
        div.appendChild(info)
        fragment.appendChild(div)
    })
    sourcesBox.innerHTML = ''
    sourcesBox.appendChild(fragment)
})

window.onload = () => window.emitCapture()