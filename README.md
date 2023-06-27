![](patak-tweet.png)

# vite-plugin-devtools

A framework-agnostic devtools builder for any tool/library that is based on
vite. It can be used as a shared base for [vite-plugin-vue-devtools](https://github.com/webfansplz/vite-plugin-vue-devtools) and
[nuxt-devtools](https://github.com/nuxt/devtools).

- Extensive API
- Multi-devtools Option
- Simple & Light-weight
- Full Client & Server Control

```ts
// server (vite.config.js or plugin entry)
import createDevtools from "vite-plugin-devtools";

const { addServerFunction, plugin, serverRPC } = createDevtools("devtools-test", {
  icon: `/* svg string */`,
  clientDir: "./test/dist/",
});

// client (in `clientDir`)
import { addClientFunction } from 'vite-plugin-devtools/client'

addClientFunction('ping', () => {
  return 'response from client'
})
```

## API
### `createDevtools`

```ts
type Options = {
    icon: string;
    clientDir: string;
};

declare function createDevtools<T extends keyof ServerFunctions = keyof ServerFunctions>(name: string, options: Options): {
    serverRPC: birpc.BirpcGroupReturn<ClientFunctions>;
    addServerFunction: AddServerFunction<T>;
    plugin: PluginOption;
};
```

#### `addServerFunction`

```ts
addServerFunction("here", function() {
  return "here";
});
```
#### `plugin`
The plugin that can be passed to Vite.

#### `serverRPC`
An object that can be used to call the client functions. The RPC is also bound to the `this` in server functions.

```ts
addServerFunction("here", function() {
  console.log(serverRPC === this)
  return "here";
});
```

### Client
```ts
declare const clientRPC: ClientRPC;
declare function addClientFunction<T extends keyof ClientFunctions>(name: T, func: ToClientFunction<ClientFunctions[T]>): void;
declare function addClientFunction(func: ClientFunction): void;
declare function changePosition(position: 'bottom' | 'top' | 'left' | 'right'): void;
```
#### `addClientFunction`

Add a client function that the server can run using the rpc!

```ts
import { addClientFunction } from 'vite-plugin-devtools/client'

addClientFunction('ping', () => {
  return 'response from client'
})
```
server:

```ts
setInterval(async () => {
  console.log('pinging the client, response:', await serverRPC.ping());
}, 3000);
```

#### `clientRPC`
Similar to `serverRPC`, but for all the functions that the server defined using
`addServerFunction`.

#### `changePosition`
changes the position of the devtools bar and all of the associated iframes. This
function also affects other devtools positions also.

