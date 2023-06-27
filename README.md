# vite-plugin-devtools

![vite-plugin-devtools](patak-tweet.png)

## Description

vite-plugin-devtools is a framework-agnostic devtools builder designed for any tool or library based on Vite. It serves as a shared foundation for other devtools plugins such as [vite-plugin-vue-devtools](https://github.com/webfansplz/vite-plugin-vue-devtools) and [nuxt-devtools](https://github.com/nuxt/devtools).

Key Features:

- Extensive API
- Multiple devtools options
- Simple and lightweight
- Full control over the client and server

## Usage

The following code demonstrates how to use vite-plugin-devtools:

```typescript
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

### createDevtools

The `createDevtools` function is used to initialize the devtools.

```typescript
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

#### addServerFunction

The `addServerFunction` function allows adding server functions.

```typescript
addServerFunction("here", function() {
  return "here";
});
```

#### plugin

The `plugin` is an option that can be passed to Vite.

#### serverRPC

The `serverRPC` object is used to call client functions and is bound to the server functions.

```typescript
addServerFunction("here", function() {
  console.log(serverRPC === this);
  return "here";
});
```

### Client

```typescript
declare const clientRPC: ClientRPC;
declare function addClientFunction<T extends keyof ClientFunctions>(name: T, func: ToClientFunction<ClientFunctions[T]>): void;
declare function addClientFunction(func: ClientFunction): void;
declare function changePosition(position: 'bottom' | 'top' | 'left' | 'right'): void;
```

#### addClientFunction

The `addClientFunction` function is used to add a client function that can be called by the server using RPC.

```typescript
import { addClientFunction } from 'vite-plugin-devtools/client'

addClientFunction('ping', () => {
  return 'response from client'
})
```

Server example:

```typescript
setInterval(async () => {
  console.log('pinging the client, response:', await serverRPC.ping());
}, 3000);
```

#### clientRPC

The `clientRPC` is similar to `serverRPC` but allows calling functions defined by the server using `addServerFunction`.

#### changePosition

The `changePosition` function is used to modify the position of the devtools bar and associated iframes. This function affects other devtools positions as well.

