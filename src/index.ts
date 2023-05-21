import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePath } from "vite";
import type { PluginOption } from "vite";

type Options = {
  icon: string
};

function getDevtoolsPath() {
  const pluginPath = normalizePath(
    path.dirname(fileURLToPath(import.meta.url))
  );
  return pluginPath.replace(/\/src/, "/src/node").replace(/\/dist$/, "/src/node");
}

export default function createDevtools(
  name: string,
  options: Options
): PluginOption {
  const devtoolsPath = getDevtoolsPath();
  let resolvedAppPath: string
  return {
    name,
    enforce: "pre",
    apply: "serve",
    configureServer(server) {
      const base = (server.config.base) || '/'
      console.log(`${base}__devtools__`)
      server.middlewares.use(`${base}__devtools__`, (req, res) => res.write('here') && res.end())

    },
    async resolveId(importee: string) {
      if (importee.startsWith(`virtual:devtools:${name}:`)) {
        resolvedAppPath = importee.replace(
          `virtual:devtools:${name}:`,
          `${devtoolsPath}/`
        );
        return resolvedAppPath + `?devtools=${name}`;
      }
      if (importee === 'virtual:devtools:common') {
        return `${devtoolsPath}/common.js`
      }
    },
    transform(src, id) {
      const [path, query] = id.split('?')
      if (path === resolvedAppPath && query.split('=')?.[1] === name) {
        return src.replace('__icon__', options.icon)
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
  };
}
