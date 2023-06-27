import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import createDevtools from "vite-plugin-devtools";

declare module "vite-plugin-devtools" {
  export interface ServerFunctions {
    here(): "here";
  }
  export interface ClientFunctions {
    ping(): string;
  }
}

const { addServerFunction, plugin, serverRPC } = createDevtools("devtools-test", {
  icon: `
        <svg viewBox="0 0 256 198" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#41B883" d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0h47.36Z" />
          <path fill="#41B883" d="m0 0l128 220.8L256 0h-51.2L128 132.48L50.56 0H0Z" />
          <path fill="#35495E" d="M50.56 0L128 133.12L204.8 0h-47.36L128 51.2L97.92 0H50.56Z" />
        </svg>
      `,
  clientDir: "./devtools-test/dist/",
});

addServerFunction("here", function () {
  console.log(serverRPC === this)
  return "here";
});

setInterval(async () => {
  console.log('pinging the client, response:', await serverRPC.ping());
}, 3000);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // VueDevtools(),
    plugin,
    vue(),
    // multiple devtools can be used at the same time
    createDevtools("devtools-test-2", {
      icon: `
        <svg viewBox="0 0 324 324" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top:-3px">
          <path d="M181.767 270H302.211C306.037 270 309.795 269.003 313.108 267.107C316.421 265.211 319.172 262.484 321.084 259.2C322.996 255.915 324.002 252.19 324 248.399C323.998 244.607 322.989 240.883 321.074 237.601L240.187 98.7439C238.275 95.4607 235.525 92.7342 232.213 90.8385C228.901 88.9429 225.143 87.9449 221.318 87.9449C217.494 87.9449 213.736 88.9429 210.424 90.8385C207.112 92.7342 204.361 95.4607 202.449 98.7439L181.767 134.272L141.329 64.7975C139.416 61.5145 136.664 58.7884 133.351 56.8931C130.038 54.9978 126.28 54 122.454 54C118.629 54 114.871 54.9978 111.558 56.8931C108.245 58.7884 105.493 61.5145 103.58 64.7975L2.92554 237.601C1.01067 240.883 0.00166657 244.607 2.06272e-06 248.399C-0.00166244 252.19 1.00407 255.915 2.91605 259.2C4.82803 262.484 7.57884 265.211 10.8918 267.107C14.2047 269.003 17.963 270 21.7886 270H97.3936C127.349 270 149.44 256.959 164.641 231.517L201.546 168.172L221.313 134.272L280.637 236.1H201.546L181.767 270ZM96.1611 236.065L43.3984 236.054L122.49 100.291L161.953 168.172L135.531 213.543C125.436 230.051 113.968 236.065 96.1611 236.065Z" fill="#00DC82" />
        </svg>
    `,
      clientDir: "./devtools-test-2",
    }).plugin,
  ],
});
