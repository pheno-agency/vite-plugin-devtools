import { parse, stringify } from "flatted";
import {
  ClientFunction,
  ClientFunctions,
  ClientRPC,
  DefaultServerFunctions,
  ServerFunctions,
  ToClientFunction,
} from "./types";
export type * from './types'
import { createBirpc } from "birpc";

const clientFunctions = {} as Record<string, ClientFunction>;

const PORT = location.port;
const HOST = [location.hostname, PORT].filter(Boolean).join(":");
const ROUTE = "/__devtools__ws__/" + location.pathname.split("/")[1];
const ENTRY_URL =
  `${location.protocol === "https:" ? "wss:" : "ws:"}//${HOST}` + ROUTE;
const RECONNECT_INTERVAL = 2000;

let connectPromise = connectWS();
let onMessage: Function = () => {};

export const clientRPC: ClientRPC = createBirpc<DefaultServerFunctions & ServerFunctions>(
  clientFunctions,
  {
    post: async (d) => {
      (await connectPromise).send(d);
    },
    on: (fn) => {
      onMessage = fn;
    },
    // these are required when using WebSocket
    serialize: stringify,
    deserialize: parse,
  }
);

async function connectWS() {
  const ws = new WebSocket(ENTRY_URL);
  ws.addEventListener("message", (e) => onMessage(String(e.data)));
  ws.addEventListener("error", (e) => {
    console.error(e);
  });
  ws.addEventListener("close", () => {
    setTimeout(async () => {
      connectPromise = connectWS();
    }, RECONNECT_INTERVAL);
  });
  if (ws.readyState !== WebSocket.OPEN)
    await new Promise((resolve) => ws.addEventListener("open", resolve));
  return ws;
}

export function addClientFunction<T extends keyof ClientFunctions>(
  name: T,
  func: ToClientFunction<ClientFunctions[T]>
): void;
export function addClientFunction(func: ClientFunction): void;
export function addClientFunction<T extends keyof ClientFunctions>(
  nameOrFunc: string | ClientFunction,
  func?: ToClientFunction<ClientFunctions[T]>
) {
  func = typeof nameOrFunc === "function" ? nameOrFunc : func;
  const name = typeof nameOrFunc === "string" ? nameOrFunc : func?.name;
  if (!func) {
    throw new Error("Please specify a client function");
  }
  if (!name) {
    throw new Error("Please specify a name for your client function");
  }

  clientFunctions[name] = func.bind(clientRPC);
}
