import type { BirpcGroup, ChannelOptions } from 'birpc';
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import type {ViteDevServer} from 'vite'
import { parse, stringify } from 'flatted'
import type { ClientFunctions, DefaultServerFunctions, ServerFunction, ServerFunctions, ServerRPC } from '../types';

export type Config = { serverFunctions: Record<string, ServerFunction>, serverRPC: ServerRPC | null}

const wsClients = new Map<string, Set<WebSocket>>()

export function attachWebSocket(rpc: BirpcGroup<ClientFunctions, DefaultServerFunctions & ServerFunctions>, iframeSrc: string, server: ViteDevServer) {
  if (!wsClients.has(iframeSrc)) {
    wsClients.set(iframeSrc, new Set())
  }

  const route = '/__devtools__ws__/' + iframeSrc.split('/')[1]
  const wss = new WebSocketServer({ noServer: true })

  server.httpServer?.on('upgrade', (request, socket, head) => {
    if (!request.url)
      return

    const { pathname } = new URL(request.url, 'http://localhost')
    if (pathname !== route)
      return

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)

      wsClients.get(iframeSrc)!.add(ws)
      const channel: ChannelOptions = {
        post: d => ws.send(d),
        on: fn => ws.on('message', fn),
        serialize: stringify,
        deserialize: parse,
      }
      rpc.updateChannels((c) => {
        c.push(channel)
      })
      ws.on('close', () => {
        wsClients.get(iframeSrc)!.delete(ws)
        rpc.updateChannels((c) => {
          const index = c.indexOf(channel)
          if (index >= 0)
            c.splice(index, 1)
        })
      })
    })
  })
}
