<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

// @ts-expect-error virtual module
/* import vueDevToolsOptions from 'virtual:devtools-options' */
import Frame from './FrameBox.vue'
import { useIframe, useInspector, usePanelVisible, usePiPMode, usePosition, useDevtools, useColorScheme, state } from './composables'
import { checkIsSafari, usePreferredColorScheme } from './utils'

const devtools = useDevtools()

const { togglePanelVisible, toggleViewMode, getViewMode, panelVisible } = usePanelVisible()
window.togglePanelVisible = togglePanelVisible
window.toggleViewMode = toggleViewMode
window.getViewMode = getViewMode

onMounted(() => {
  state.value.viewMode = 'default'
})


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
        :title="'Toggle ' + item.name" aria-label="Toggle devtools panel"
        :style="panelVisible === item.iframeSrc ? '' : 'filter:saturate(0)'"
        @click="togglePanelVisible(item.name)"
        v-html="item.icon"
      >
      </div>
      <div style="border-left: 1px solid #8883;width:1px;height:10px;" />
      <div
        v-for="item in devtools"
        :v-if="item.inspector"
        class="devtools-icon-button devtools-inspector-button"
        :class="{ [item.name]: true }"
        title="Toggle Component Inspector"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style="height: 1.1em; width: 1.1em; opacity:0.5;"
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
      :name="item.name"
      :iframeSrc="item.iframeSrc"
      :onIframe="item.onIframe"
      :style="iframeStyle" :is-dragging="isDragging"
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
