import type { RektContext, RektNode, RektProps } from '../lib/jsx-runtime'
import { join } from 'path'
import { stateHash } from '../lib/state-hash'
import { connectToHub } from '../lib/bun-worker-hub'

const hub = connectToHub({
    renderJSX: (jsxPath, connectionId) => renderLayout(jsxPath, connectionId),
    unsubscribe: async (connectionId) => stateHasher.unsubscribe(connectionId)
})
const stateHasher = stateHash((state, id, connections) => {
    return state.onChange((val) => {
        hub.fetch('ws', 'pushState', val, id, [...connections])
    })
})

function renderProps(props: RektProps, { connectionId }: RektContext) {
    const reactiveProps = []
    let strProps = ''
    for (const prop in props) {
        const value = props[prop]
        if (prop === 'children') {
            continue
        } else if (prop.startsWith('on:')) {
            const event = prop.slice(3)
            strProps += ` on${event}="() => trig()"`
            continue
        } else if (typeof value === 'function' && 'onChange' in value) {
            reactiveProps.push([prop, stateHasher.id(value, connectionId)])
            strProps += ` ${prop}="${value()}"`
        } else {
            strProps += ` ${prop}="${value}"`
        }
    }
    if (reactiveProps.length) {
        strProps += ` rekt-p="${reactiveProps.map((p) => p.join(':')).join(' ')}"`
    }
    return strProps
}

export function renderToHTML(item: RektNode | RektNode[], context: RektContext): string {
    const { connectionId } = context
    if (item instanceof Array) {
        return item.map((nested) => renderToHTML(nested, context)).join('')
    } else if (typeof item === 'string') {
        return item
    } else if (typeof item === 'function' && 'onChange' in item) {
        return `<rekt s="${stateHasher.id(item, connectionId)}">${item()}</rekt>`
    } else if (typeof item === 'object' && 'tag' in item && 'props' in item) {
        const { tag, props } = item
        if (typeof tag === 'string') {
            if (props.children !== undefined) {
                return `<${tag}${renderProps(props, context)}>${renderToHTML(props.children, context)}</${tag}>`
            } else {
                return `<${tag}${renderProps(props, context)} />`
            }
        } else {
            return renderToHTML(tag(props, context), context)
        }
    } else {
        return String(item)
    }
}

async function renderJSX(src: string, context: RektContext) {
    const component = await import(src)
    const result = component.default({}, context)
    return renderToHTML(result, context)
}

async function renderLayout(jsxPath: string, connectionId: string) {
    const file = Bun.file(join(import.meta.dir, '../src', 'layout.html'))
    const html = await file.text()
    const context = stateHasher.generateContext(connectionId)
    const jsxOutput = await renderJSX(jsxPath, context)
    return html
        .replace('%COMPONENT_ENTRY%', jsxOutput)
        .replace('%APP_TITLE%', process.env['APP_TITLE'] as string)
        .replace('%CONNECTION_ID%', connectionId)
}

console.log('renderer is ready')
