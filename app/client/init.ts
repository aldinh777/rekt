import type { RektComponent } from '../../lib/common/jsx-runtime'
import { createContext } from '../../lib/common/jsx-runtime'
import { renderDom } from '../../lib/client/rekt-dom'
import { destroyListItem, insertListItem, replaceListItem, select, selectAll } from '../../lib/client/utils'
import '../../lib/client/hot-reload'

const cid = document.body.getAttribute('rekt-cid')
const wsHost = 'localhost:3100'
const socket = new WebSocket(`ws://${wsHost}/${cid}`)

socket.addEventListener('message', ({ data }) => {
    const [code] = data.split(':', 1)
    if (code === 'c') {
        const [stateId] = data.slice(2).split(':', 1)
        const value = data.slice(stateId.length + 3)
        const dynamicValues = selectAll('rekt[s]')
        const dynamicProps = selectAll('[rekt-p]')
        for (const elem of dynamicValues) {
            if (elem.getAttribute('s') === stateId) {
                elem.textContent = value
            }
        }
        for (const elem of dynamicProps) {
            const attribs = elem.getAttribute('rekt-p')!
            for (const propPair of attribs.split(' ')) {
                const [prop, targetId] = propPair.split(':')
                if (targetId === stateId) {
                    elem.setAttribute(prop, value)
                }
            }
        }
    } else if (code === 'u') {
        const [itemId] = data.slice(2).split(':', 1)
        const replaceId = data.slice(itemId.length + 3)
        fetch(`/partial?${itemId}`)
            .then((res) => res.text())
            .then((text) => replaceListItem(itemId, replaceId, text))
    } else if (code === 'ib') {
        const [itemId] = data.slice(3).split(':', 1)
        const insertBeforeId = data.slice(itemId.length + 4)
        const target = select(`rekt[ib="${insertBeforeId}"]`)
        fetch(`/partial?${itemId}`)
            .then((res) => res.text())
            .then((text) => insertListItem(itemId, text, target))
    } else if (code === 'ie') {
        const [itemId] = data.slice(3).split(':', 1)
        const insertBeforeId = data.slice(itemId.length + 4)
        const target = select(`rekt[le="${insertBeforeId}"]`)
        fetch(`/partial?${itemId}`)
            .then((res) => res.text())
            .then((text) => insertListItem(itemId, text, target))
    } else if (code === 'd') {
        const deleteId = data.slice(2)
        destroyListItem(deleteId)
    }
})

for (const elem of selectAll('[rekt-t]')) {
    const attribs = elem.getAttribute('rekt-t')!
    for (const propPair of attribs.split(' ')) {
        const [eventName, handlerId] = propPair.split(':')
        elem.addEventListener(eventName, () => fetch(`/trigger?${handlerId}`))
    }
}

for (const elem of selectAll('rekt[type="client"]')) {
    const src = elem.getAttribute('src') + '.js' || ''
    const globalContext = createContext()
    import(src).then(async (Comp: { default: RektComponent }) => {
        const componentContext = createContext()
        renderDom(elem, await Comp.default({}, componentContext), globalContext)
    })
}

for (const elem of selectAll('form[rekt-f]')) {
    elem.addEventListener('submit', (ev: SubmitEvent) => {
        const formId = elem.getAttribute('rekt-f')
        const formData: any = new FormData(ev.currentTarget as HTMLFormElement)
        fetch(`/submit?${formId}`, { method: 'post', body: formData })
        ev.preventDefault()
    })
}
