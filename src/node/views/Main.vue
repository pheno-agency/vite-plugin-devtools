<script setup lang="ts">
import { computed, ref } from 'vue'

// @ts-expect-error virtual module
/* import vueDevToolsOptions from 'virtual:devtools-options' */
import Frame from './FrameBox.vue'
import { useIframe, useInspector, usePanelVisible, usePiPMode, usePosition, useDevtools } from './composables'
import { checkIsSafari, useColorScheme, usePreferredColorScheme } from './utils'

const props = defineProps({
  hook: {
    type: Object,
    required: true,
  },
})

const hook = props.hook

const DevToolsHooks = {
  APP_INIT: 'app:init',
  COMPONENT_UPDATED: 'component:updated',
  COMPONENT_ADDED: 'component:added',
  COMPONENT_REMOVED: 'component:removed',
  COMPONENT_EMIT: 'component:emit',
  PERF_START: 'perf:start',
  PERF_END: 'perf:end',
  ADD_ROUTE: 'router:add-route',
  REMOVE_ROUTE: 'router:remove-route',
}

const hookBuffer: [string, { args: any[] }][] = []

let isAppCreated = false
const panelState = ref<{
  viewMode: 'default' | 'xs'
}>({
  viewMode: 'default',
})
const devtools = useDevtools()

const { togglePanelVisible, closePanel, panelVisible } = usePanelVisible()
const panelEl = ref<HTMLDivElement>()
const { onPointerDown, anchorStyle, iframeStyle, isDragging, isVertical } = usePosition(panelEl)
const vars = computed(() => {
  const colorScheme = useColorScheme()
  const dark = colorScheme.value === 'auto'
    ? usePreferredColorScheme().value === 'dark'
    : colorScheme.value === 'dark'
  return {
    '--devtools-widget-bg': dark ? '#111' : '#ffffff',
    '--devtools-widget-fg': dark ? '#F5F5F5' : '#111',
    '--devtools-widget-border': dark ? '#3336' : '#efefef',
    '--devtools-widget-shadow': dark ? 'rgba(0,0,0,0.3)' : 'rgba(128,128,128,0.1)',
  }
})

function waitForClientInjection(iframe: HTMLIFrameElement, retry = 50, timeout = 200): Promise<void> | void {
  const test = () => !!iframe?.contentWindow?.__VUE_DEVTOOLS_VIEW__ && isAppCreated

  if (test())
    return

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (test()) {
        clearInterval(interval)
        resolve()
      }
      else if (retry-- <= 0) {
        clearInterval(interval)
        reject(Error('Vue Devtools client injection failed'))
      }
    }, timeout)
  })
}

const {
  toggleInspector, inspectorLoaded,
  inspectorEnabled, disableInspector,
} = useInspector()

/* const clientUrl = `${vueDevToolsOptions.base || '/'}__devtools__/` */
const clientUrl = `/__devtools-test_devtools__`
/* const { getIframe } = useIframe(clientUrl, async () => {
  const iframe = getIframe()
  await waitForClientInjection(iframe)
  setupClient(iframe)
}) */

// Picture-in-Picture mode
/* const { popup } = usePiPMode(getIframe, hook) */

function setupClient(iframe: HTMLIFrameElement) {
  const injection: any = iframe?.contentWindow?.__VUE_DEVTOOLS_VIEW__
  injection.setClient({
    hook,
    hookBuffer,
    // inspector: {
    //   enable: enableInspector,
    //   disable: disableInspector,
    // },
    panel: {
      toggleViewMode: () => {
        if (panelState.value.viewMode === 'xs')
          panelState.value.viewMode = 'default'
        else
          panelState.value.viewMode = 'xs'
      },
      toggle: togglePanelVisible,
      togglePosition(position) {
        /* if (position === 'popup')
          popup() */
      },
    },
  })
}

function updateHookBuffer(type, args) {
  hookBuffer.push([type, args])
}

function collectDynamicRoute(app) {
  const router = app?.config?.globalProperties?.$router
  if (!router)
    return

  const _addRoute = router.addRoute
  router.addRoute = (...args) => {
    const res = _addRoute(...args)

    if (!iframe.value?.contentWindow?.__VUE_DEVTOOLS_VIEW__?.loaded) {
      updateHookBuffer(DevToolsHooks.ADD_ROUTE, {
        args: [...args],
      })
    }

    return res
  }

  const _removeRoute = router.removeRoute
  router.removeRoute = (...args) => {
    const res = _removeRoute(...args)

    if (!iframe.value?.contentWindow?.__VUE_DEVTOOLS_VIEW__?.loaded) {
      updateHookBuffer(DevToolsHooks.REMOVE_ROUTE, {
        args: [...args],
      })
    }

    return res
  }
}

function collectHookBuffer() {
  // const sortId = 0

  function stopCollect(component) {
    return component?.root?.type?.devtools?.hide || iframe.value?.contentWindow?.__VUE_DEVTOOLS_VIEW__?.loaded
  }

  hook.on(DevToolsHooks.APP_INIT, (app) => {
    if (!app || app._instance.type?.devtools?.hide)
      return

    collectDynamicRoute(app)
    updateHookBuffer(DevToolsHooks.APP_INIT, {
      app,
    })
    setTimeout(() => {
      isAppCreated = true
    }, 80)
  });

  // close perf to avoid performance issue (#9)
  // hook.on(DevToolsHooks.PERF_START, (app, uid, component, type, time) => {
  //   if (stopCollect(component))
  //     return

  //   updateHookBuffer(DevToolsHooks.COMPONENT_EMIT, {
  //     now: Date.now(),
  //     app,
  //     uid,
  //     component,
  //     type,
  //     time,
  //     sortId: sortId++,
  //   })
  // })
  // hook.on(DevToolsHooks.PERF_END, (app, uid, component, type, time) => {
  //   if (stopCollect(component))
  //     return

  //   updateHookBuffer(DevToolsHooks.PERF_END, {
  //     now: Date.now(),
  //     app,
  //     uid,
  //     component,
  //     type,
  //     time,
  //     sortId: sortId++,
  //   })
  // })

  [
    DevToolsHooks.COMPONENT_UPDATED,
    DevToolsHooks.COMPONENT_ADDED,
    DevToolsHooks.COMPONENT_REMOVED,
    DevToolsHooks.COMPONENT_EMIT,
  ].forEach((item) => {
    hook.on(item, (app, uid, parentUid, component) => {
      if (!app || (typeof uid !== 'number' && !uid) || !component || stopCollect(component))
        return

      updateHookBuffer(item, {
        app, uid, parentUid, component,
      })
    })
  })
}

// init
/* collectHookBuffer() */
</script>

<template>
  <div
    id="devtools-anchor"
    :style="[anchorStyle, vars]"
    :class="{ 'devtools-vertical': isVertical }"
  >
    <!-- toggle button -->
    <div v-if="!checkIsSafari()" class="devtools-glowing" :style="isDragging ? 'opacity: 0.6 !important' : ''" />
    <div ref="panelEl" class="devtools-button-panel" @pointerdown="onPointerDown">
      <div
        v-for="item in devtools"
        :key="item.iframeSrc"
        class="devtools-icon-button devtools-vue-button"
        title="Toggle Vue DevTools" aria-label="Toggle devtools panel"
        :style="panelVisible === item.iframeSrc ? '' : 'filter:saturate(0)'"
        @click="togglePanelVisible(item.iframeSrc)"
        v-html="item.icon"
      >
      </div>
      <div style="border-left: 1px solid #8883;width:1px;height:10px;" />
      <div
        class="devtools-icon-button devtools-inspector-button"
        :class="{ disabled: !inspectorLoaded }"
        :disabled="!inspectorLoaded"
        title="Toggle Component Inspector" @click="toggleInspector"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style="height: 1.1em; width: 1.1em; opacity:0.5;"
          :style="inspectorEnabled ? 'opacity:1;color:#00dc82' : ''"
          viewBox="0 0 24 24"
        >
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r=".5" fill="currentColor" /><path d="M5 12a7 7 0 1 0 14 0a7 7 0 1 0-14 0m7-9v2m-9 7h2m7 7v2m7-9h2" /></g>
        </svg>
      </div>
    </div>
    <!-- iframe -->
    <Frame
      v-for="item in devtools"
      :key="item.iframeSrc"
      :iframeSrc="item.iframeSrc"
      :style="iframeStyle" :is-dragging="isDragging"
      :client="{
        close: closePanel,
        inspector: {
          disable: disableInspector,
          isEnabled: ref(inspectorEnabled),
        },
        /* getIFrame: getIframe, */
      }"
      :view-mode="panelState.viewMode"
    />
  </div>
</template>

<style>
#devtools-anchor {
  position: fixed;
  z-index: 2147483645;
  transform-origin: center center;
  transform: translate(-50%, -50%) rotate(0);
}

#devtools-anchor .devtools-icon-button {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  color: inherit;
}

#devtools-anchor .devtools-glowing {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 160px;
  opacity: 0;
  transition: all 0.8s ease;
  pointer-events: none;
  z-index: -1;
  border-radius: 9999px;
  background-image: linear-gradient(45deg,#00dc82,#36e4da,#0047e1);
  filter: blur(60px);
}

#devtools-anchor .devtools-icon-button {
  border-radius: 100%;
  border-width: 0;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
}
#devtools-anchor .devtools-icon-button:hover {
  opacity: 1;
}

#devtools-anchor .devtools-icon-button svg {
  width: 14px;
  height: 14px;
}

#devtools-anchor:hover .devtools-glowing {
  opacity: 0.6;
}

#devtools-anchor .devtools-button-panel {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  height: 30px;
  padding: 4px 4px 4px 5px;
  box-sizing: border-box;
  border: 1px solid var(--devtools-widget-border);
  border-radius: 20px;
  background-color: var(--devtools-widget-bg);
  backdrop-filter: blur(10px);
  color: var(--devtools-widget-fg);
  box-shadow: 2px 2px 8px var(--devtools-widget-shadow);
  transition: background 0.2s ease;
  user-select: none;
}

#devtools-anchor.devtools-vertical .devtools-vue-button {
  transform: rotate(-90deg);
}

#devtools-anchor.devtools-vertical .devtools-button-panel {
  transform: translate(-50%, -50%) rotate(90deg);
  box-shadow: 2px -2px 8px var(--nuxt-devtools-widget-shadow);
}

#devtools-anchor .devtools-inspector-button.disabled {
  opacity: 0.2;
  cursor: not-allowed;
  animation: blink 1.5s linear infinite;
}

@keyframes blink {
  0% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.2;
  }
}
</style>
