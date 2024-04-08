import { join } from 'path'
import { renderer } from './renderer'
import { routing } from './routing'
import { hasher } from './hasher'

const PORT = process.env['HTTP_PORT'] || 3000

function startHttpServer() {
    const server = Bun.serve({
        port: PORT,
        async fetch(req) {
            const url = new URL(req.url)
            const { pathname } = url
            if (pathname === '/port-data') {
                return new Response(
                    JSON.stringify({
                        HTTP: PORT,
                        WS: process.env['WS_PORT'] || 3100,
                        WSRELOAD: process.env['WSRELOAD_PORT'] || 3101
                    }),
                    { headers: { 'Content-Type': 'application/json' } }
                )
            } else if (pathname === '/partial') {
                const partialId = url.search.slice(1)
                const connectionId = req.headers.get('Connection-ID')
                const { result, content } = renderer.renderPartial(partialId, connectionId)
                switch (result) {
                    case 'ok':
                        return new Response(content, { headers: { 'Content-Type': 'text/html' } })
                    case 'not found':
                        return new Response('not found', { status: 404 })
                    case 'unauthorized':
                        return new Response('unauthorized', { status: 401 })
                    default:
                        return new Response('error', { status: 500 })
                }
            } else if (pathname === '/trigger') {
                const handlerId = url.search.slice(1)
                if (req.method !== 'POST') {
                    return new Response('not allowed', { status: 405 })
                }
                const result = renderer.triggerEvent(handlerId, await req.text())
                switch (result) {
                    case 'ok':
                        return new Response('ok')
                    case 'not found':
                        return new Response('not found', { status: 404 })
                    default:
                        return new Response('error', { status: 500 })
                }
            } else if (pathname === '/submit') {
                const handlerId = url.search.slice(1)
                const [contentType] = req.headers.get('Content-Type')?.split(';') || []
                if (!(req.method === 'POST' && contentType === 'multipart/form-data')) {
                    return new Response('invalid', { status: 400 })
                }
                const formData = await req.formData()
                const result = renderer.submitForm(handlerId, formData)
                switch (result) {
                    case 'ok':
                        return new Response('ok')
                    case 'not found':
                        return new Response('not found', { status: 404 })
                    default:
                        return new Response('error', { status: 500 })
                }
            }
            const filename = pathname === '/' ? '/index.html' : pathname
            const file = Bun.file(join(import.meta.dir, '../app/static', filename))
            if (await file.exists()) {
                return new Response(file)
            }
            const buildFile = Bun.file(join(import.meta.dir, '../build', filename))
            if (await buildFile.exists()) {
                return new Response(buildFile)
            }
            const rootPath = join(import.meta.dir, '../app/server')
            const pageHandlers = await routing.parseRouting(rootPath, pathname)
            if (pageHandlers.status === 'page') {
                const responseData = { headers: { 'Content-Type': 'text/html' } }
                const context = hasher.createServerContext(req, responseData, pageHandlers.params)
                const page = await renderer.renderPage(pageHandlers.layout, pageHandlers.page, context)
                return new Response(page, responseData)
            }
            return new Response('Not Found', { status: 404 })
        }
    })
    console.log(`http server running at http://${server.hostname}:${server.port}`)
}

export const http = {
    startServer: startHttpServer
}
