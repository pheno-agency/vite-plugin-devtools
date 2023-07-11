import path from "node:path";
import {fileURLToPath} from "node:url";
import {normalizePath} from "vite";
import type {
  PluginOption, HtmlTagDescriptor, ViteDevServer, Plugin} from "vite";
import {createBirpcGroup} from "birpc";
import sirv from "sirv";
import type {
  ClientFunctions, DefaultServerFunctions, ServerFunction, ServerFunctions,
  ToServerFunction,} from "./types";
import {attachWebSocket, Config} from "./middlewares/attach";
import {getPackages} from "./functions/packages";
import {
  getImageMeta,
  getStaticAssets,
  getTextAssetContent,
} from "./functions/assets";
export type * from "./types";

type Options = {
  icon: string; clientDir : string;
  onIframe?: string

/**
 * append an import to the module id ending with `appendTo` instead of adding a
 * script into body useful for projects that do not use html file as an entry
 *
 * WARNING: only set this if you know exactly what it does.
 */
  appendTo?: string | RegExp
};

  function getDevtoolsPath() {
    const pluginPath =
        normalizePath(path.dirname(fileURLToPath(import.meta.url)));
    return pluginPath.replace(/\/src/, "/src/node")
        .replace(/\/dist$/, "/src/node");
  }

  export type KeyOf<T> = keyof T extends any ? keyof T : keyof T;

  function addServerFunctionToConfig<T extends keyof ServerFunctions>(
      config: Config, name: T,
      func: ToServerFunction<ServerFunctions[T]>): void;
  function addServerFunctionToConfig(config: Config,
                                     func: ServerFunction): void;
  function addServerFunctionToConfig<T extends keyof ServerFunctions>(
      config: Config, nameOrFunc: T|ServerFunction,
      func?: ToServerFunction<ServerFunctions[T]>): void {
    func = typeof nameOrFunc === "function" ? nameOrFunc : func;
    const name = typeof nameOrFunc === "string" ? nameOrFunc : func?.name;
    if (!func) {
      throw new Error("Please specify a server function");
    }
    if (!name) {
      throw new Error("Please specify a name for your server function");
    }
    // @ts-ignore
    config.serverFunctions[name] = func.bind(config.serverRPC);
  }

  interface AddServerFunction<T extends keyof ServerFunctions> {
    (name: T, func: ToServerFunction<ServerFunctions[T]>): void;
    (func: ServerFunction): void;
  }

  // useful for detecting only one time `views/dist/view.js` run
  let firstPlugin: string

  export function getBase(name: string) { return `/__${name}_devtools__/`}

  export default function
  createDevtools<T extends keyof ServerFunctions = keyof ServerFunctions>(
      name: string, options: Options) {
    let server: ViteDevServer;
    const config: Config = {
      serverFunctions : {
        staticAssets : () => getStaticAssets(server.config),
        getImageMeta,
        getTextAssetContent,
        getPackages : () => getPackages(server.config.root),
      } as DefaultServerFunctions as any,
      serverRPC : null,
    };

    const rpc = createBirpcGroup<ClientFunctions, DefaultServerFunctions&
                                 ServerFunctions>(config.serverFunctions as any,
                                                  [], {});
    config.serverRPC = rpc.broadcast;

    const devtoolsPath = getDevtoolsPath();
    let iframeSrc: string;

    // path should run seprately
    const isolatedFilesMeta:
        Record<string, [ /* relative */ string, /* absolute */ string ]> = {
          "./injectable" : [ "./injectable.ts", "" ],
        };

    return {
      serverRPC : config.serverRPC,
      addServerFunction : addServerFunctionToConfig.bind(null, config) as
                              unknown as AddServerFunction<T>,
      plugin : {
        name,
        enforce : "pre",
        apply : "serve",
        configureServer(_server) {
          server = _server;
          const base = server.config.base || "/";
          iframeSrc = `${base}__${name}_devtools__`;
          server.middlewares.use(
              iframeSrc, sirv(options.clientDir, {single : true, dev : true}));

          attachWebSocket(rpc, iframeSrc, server);
        },
        async resolveId(importee: string, importer) {
          if (importee.startsWith(`virtual:devtools:${name}:`)) {
            const resolvedAppPath = importee.replace(
                `virtual:devtools:${name}:`, `${devtoolsPath}/`);
            return {id : resolvedAppPath, external : 'absolute'};
          }
        },
        transform(code, id) {
          const {appendTo} = options

          if (!appendTo)
          return

              const [filename] = id.split('?', 2)
          if ((typeof appendTo === 'string' && filename.endsWith(appendTo)) ||
              (appendTo instanceof RegExp && appendTo.test(filename)))
          return { code: `${code}\nimport 'virtual:vue-devtools-path:app.js'` }
        },
        transformIndexHtml(html) {
          if (!firstPlugin) {
            firstPlugin = name
          }
          const tags: HtmlTagDescriptor[] = [
              {
                tag: "script",
                injectTo: "head-prepend",
                children: `
                globalThis.__devtools ??= []
                globalThis.__devtools.push({
                  name: '${name}',
                  iframeSrc: '${iframeSrc}',
                  icon: \`${options.icon}\`,
                  onIframe: '${options.onIframe}'
                })
                `,
                attrs: {
                  type: "module",
                },
              },
          ...(firstPlugin === name
            ? [{
                tag: "script",
                injectTo: "head",
                attrs: {
                  type: "module",
                  src: `/@id/virtual:devtools:${name}:views/dist/view.js`,
                },
              },{
                tag: "link",
                injectTo: "head",
                attrs: {
                  rel: "stylesheet",
                  href: `/@id/virtual:devtools:${name}:views/dist/style.css`,
                },
              }
            ]  satisfies HtmlTagDescriptor[]
            : []),
        ];
          return {
            html,
            tags,
          };
        },
      } satisfies Plugin,
    };
  }
