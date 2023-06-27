import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePath, ViteDevServer } from "vite";
import type { PluginOption } from "vite";
import { createBirpcGroup } from 'birpc';
import sirv from "sirv";
import type { ClientFunctions, DefaultServerFunctions, ServerFunction, ServerFunctions, ToServerFunction } from './types';
import { attachWebSocket, Config } from "./middlewares/attach";
import { getPackages } from "./functions/packages";
import {
  getImageMeta,
  getStaticAssets,
  getTextAssetContent,
} from "./functions/assets";
export type * from "./types";

type Options = {
  icon: string;
  clientDir: string;
};

function getDevtoolsPath() {
  const pluginPath = normalizePath(
    path.dirname(fileURLToPath(import.meta.url))
  );
  return pluginPath
    .replace(/\/src/, "/src/node")
    .replace(/\/dist$/, "/src/node");
}

export type KeyOf<T> = keyof T extends any ? keyof T : keyof T;

function addServerFunctionToConfig<T extends keyof ServerFunctions>(
  config: Config,
  name: T,
  func: ToServerFunction<ServerFunctions[T]>
): void;
function addServerFunctionToConfig(config: Config, func: ServerFunction): void;
function addServerFunctionToConfig<T extends keyof ServerFunctions>(
  config: Config,
  nameOrFunc: T | ServerFunction,
  func?: ToServerFunction<ServerFunctions[T]>
): void {
  func = typeof nameOrFunc === "function" ? nameOrFunc : func;
  const name = typeof nameOrFunc === "string" ? nameOrFunc : func?.name;
  if (!func) {
    throw new Error("Please specify a server function");
  }
  if (!name) {
    throw new Error("Please specify a name for your server function");
  }
  console.log(config.serverRPC)
  // @ts-ignore
  config.serverFunctions[name] = func.bind(config.serverRPC);
}

interface AddServerFunction<T extends keyof ServerFunctions> {
  (name: T, func: ToServerFunction<ServerFunctions[T]>): void;
  (func: ServerFunction): void;
}

export default function createDevtools<
  T extends keyof ServerFunctions = keyof ServerFunctions
>(name: string, options: Options) {
  let server: ViteDevServer;
  const config: Config = {
    serverFunctions: {
      staticAssets: () => getStaticAssets(server.config),
      getImageMeta,
      getTextAssetContent,
      getPackages: () => getPackages(server.config.root),
    } as DefaultServerFunctions as any,
    serverRPC: null,
  };

  const rpc = createBirpcGroup<ClientFunctions, DefaultServerFunctions & ServerFunctions>(
    config.serverFunctions as any,
    [],
    {},
  )
  config.serverRPC = rpc.broadcast

  const devtoolsPath = getDevtoolsPath();
  let iframeSrc: string;

  // path should run seprately
  const isolatedFilesMeta: Record<
    string,
    [/* relative */ string, /* absolute */ string]
  > = {
    "./injectable": ["./injectable.ts", ""],
  };

  return {
    serverRPC: config.serverRPC,
    addServerFunction: addServerFunctionToConfig.bind(
      null,
      config
    ) as unknown as AddServerFunction<T>,
    plugin: <PluginOption>{
      name,
      enforce: "pre",
      apply: "serve",
      configureServer(_server) {
        server = _server;
        const base = server.config.base || "/";
        iframeSrc = `${base}__${name}_devtools__`;
        server.middlewares.use(
          iframeSrc,
          sirv(options.clientDir, { single: true, dev: true })
        );

        attachWebSocket(rpc, iframeSrc, server);
      },
      async resolveId(importee: string, importer) {
        if (importee.startsWith(`virtual:devtools:${name}:`)) {
          const resolvedAppPath = importee.replace(
            `virtual:devtools:${name}:`,
            `${devtoolsPath}/`
          );
          return resolvedAppPath + `?devtools=${name}`;
        }
        if (
          getDevtoolsNameFromUrl(importer) === name &&
          isolatedFilesMeta[importee]
        ) {
          isolatedFilesMeta[importee][1] = path.join(
            devtoolsPath,
            isolatedFilesMeta[importee][0]
          );
          return isolatedFilesMeta[importee][1] + `?devtools=${name}`;
        }
        if (importee === "virtual:devtools:common") {
          return `${devtoolsPath}/common.js`;
        }
        // return importee
      },
      transform(src, id) {
        if (
          id.startsWith(isolatedFilesMeta["./injectable"][1]) &&
          getDevtoolsNameFromUrl(id) === name
        ) {
          return src
            .replace("__icon__", options.icon)
            .replace("__iframe_src__", iframeSrc);
        }
      },
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              tag: "script",
              injectTo: "head",
              attrs: {
                type: "module",
                src: `/@id/virtual:devtools:${name}:app.js`,
              },
            },
          ],
        };
      },
    },
  };
}

function getDevtoolsNameFromUrl(id: string = "") {
  const [, query] = id?.split("?");
  return query?.split("=")?.[1];
}
