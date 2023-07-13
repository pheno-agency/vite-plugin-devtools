<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { PANEL_MAX, PANEL_MIN, popupWindow, state, useIframe, useInspector, usePanelVisible, usePiPMode } from './composables'
import { useWindowEventListener } from './utils'

let isAppCreated = false

const props = defineProps<{
  isDragging: boolean
  name: string
  iframeSrc: string
  onIframe: string
}>()
const { closePanel, panelVisible } = usePanelVisible()

const container = ref<HTMLElement>()
const isResizing = ref<false | { top?: boolean; left?: boolean; right?: boolean; bottom?: boolean }>(false)

const {
  toggleInspector, inspectorLoaded,
  inspectorEnabled, disableInspector,
} = useInspector()

const { getIframe, iframe } = useIframe(props.name, props.iframeSrc)

// Picture-in-Picture mode
/* const { popup } = usePiPMode(getIframe, hook) */
const { popup } = usePiPMode(props.name, getIframe)


import(/* @vite-ignore */ props.onIframe).then((m) => m?.['default'](getIframe()))

/* watchEffect(() => {
  console.log('here')
  if (iframe.value) {
    console.log('here after')
    if (props.onIframe) { */
    //  import(/* @vite-ignore */ props.onIframe).then((m) => m?.['default']())
    /* }
  }
}) */

watchEffect(() => {
  if (!container.value)
    return
  if (state.value.open === props.iframeSrc) {
    const iframe = getIframe()
    iframe.style.pointerEvents = (isResizing.value || props.isDragging) ? 'none' : 'auto'

    if (!popupWindow.value) {
      if (Array.from(container.value.children).every(el => el !== iframe))
        container.value.appendChild(iframe)
    }
  }
})

useWindowEventListener('keydown', (e) => {
  if (e.key === 'Escape' && inspectorEnabled.value) {
    e.preventDefault()
    disableInspector()
    closePanel()
  }
})

useWindowEventListener('mousedown', (e: MouseEvent) => {
  if (!state.value.closeOnOutsideClick)
    return
  if (popupWindow.value)
    return
  if (!state.value.open || isResizing.value || inspectorEnabled.value)
    return

  const matched = e.composedPath().find((_el) => {
    const el = _el as HTMLElement
    return Array.from(el.classList || []).some(c => c.startsWith('devtools-'))
      || el.tagName?.toLowerCase() === 'iframe'
  })

  if (!matched)
    state.value.open = null
})

useWindowEventListener('mousemove', (e) => {
  if (!isResizing.value)
    return
  if (!state.value.open)
    return

  const iframe = getIframe()
  const box = iframe.getBoundingClientRect()

  if (isResizing.value.right) {
    const widthPx = Math.abs(e.clientX - (box?.left || 0))
    const width = widthPx / window.innerWidth * 100
    state.value.width = Math.min(PANEL_MAX, Math.max(PANEL_MIN, width))
  }
  else if (isResizing.value.left) {
    const widthPx = Math.abs((box?.right || 0) - e.clientX)
    const width = widthPx / window.innerWidth * 100
    state.value.width = Math.min(PANEL_MAX, Math.max(PANEL_MIN, width))
  }

  if (isResizing.value.top) {
    const heightPx = Math.abs((box?.bottom || 0) - e.clientY)
    const height = heightPx / window.innerHeight * 100
    state.value.height = Math.min(PANEL_MAX, Math.max(PANEL_MIN, height))
  }
  else if (isResizing.value.bottom) {
    const heightPx = Math.abs(e.clientY - (box?.top || 0))
    const height = heightPx / window.innerHeight * 100
    state.value.height = Math.min(PANEL_MAX, Math.max(PANEL_MIN, height))
  }
})

useWindowEventListener('mouseup', () => {
  isResizing.value = false
})

useWindowEventListener('mouseleave', () => {
  isResizing.value = false
})
</script>

<template>
  <div
    v-show="state.open === props.iframeSrc && !inspectorEnabled.value && !popupWindow"
    ref="container"
    class="devtools-frame"
    :class="{ 'view-mode-xs': state.viewMode === 'xs' }"
  >
    <!-- Handlers -->
    <div
      v-show="state.position !== 'top'"
      class="devtools-resize-handle devtools-resize-handle-horizontal"
      :style="{ top: 0 }"
      @mousedown.prevent="() => isResizing = { top: true }"
    />
    <div
      v-show="state.position !== 'bottom'"
      class="devtools-resize-handle devtools-resize-handle-horizontal"
      :style="{ bottom: 0 }"
      @mousedown.prevent="() => isResizing = { bottom: true }"
    />
    <div
      v-show="state.position !== 'left'"
      class="devtools-resize-handle devtools-resize-handle-vertical"
      :style="{ left: 0 }"
      @mousedown.prevent="() => isResizing = { left: true }"
    />
    <div
      v-show="state.position !== 'right'"
      class="devtools-resize-handle devtools-resize-handle-vertical"
      :style="{ right: 0 }"
      @mousedown.prevent="() => isResizing = { right: true }"
    />
    <div
      v-show="state.position !== 'top' && state.position !== 'left'"
      class="devtools-resize-handle devtools-resize-handle-corner"
      :style="{ top: 0, left: 0, cursor: 'nwse-resize' }"
      @mousedown.prevent="() => isResizing = { top: true, left: true }"
    />
    <div
      v-show="state.position !== 'top' && state.position !== 'right'"
      class="devtools-resize-handle devtools-resize-handle-corner"
      :style="{ top: 0, right: 0, cursor: 'nesw-resize' }"
      @mousedown.prevent="() => isResizing = { top: true, right: true }"
    />
    <div
      v-show="state.position !== 'bottom' && state.position !== 'left'"
      class="devtools-resize-handle devtools-resize-handle-corner"
      :style="{ bottom: 0, left: 0, cursor: 'nesw-resize' }"
      @mousedown.prevent="() => isResizing = { bottom: true, left: true }"
    />
    <div
      v-show="state.position !== 'bottom' && state.position !== 'right'"
      class="devtools-resize-handle devtools-resize-handle-corner"
      :style="{ bottom: 0, right: 0, cursor: 'nwse-resize' }"
      @mousedown.prevent="() => isResizing = { bottom: true, right: true }"
    />
  </div>
</template>

<style scoped>
.devtools-frame {
  position: fixed;
  z-index: 2147483645;
}

.devtools-frame :deep(iframe) {
  width: 100%;
  height: 100%;
  outline: none;
  background: var(--devtools-widget-bg);
  border: 1px solid rgba(125,125,125,0.2);
  border-radius: 10px;
}

.devtools-resize-handle-horizontal {
  position: absolute;
  left: 6px;
  right: 6px;
  height: 10px;
  margin: -5px 0;
  cursor: ns-resize;
  border-radius: 5px;
}
.devtools-resize-handle-vertical {
  position: absolute;
  top: 6px;
  bottom: 0;
  width: 10px;
  margin: 0 -5px;
  cursor: ew-resize;
  border-radius: 5px;
}
.devtools-resize-handle-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  margin: -6px;
  border-radius: 6px;
}
.devtools-resize-handle:hover {
  background: rgba(125,125,125,0.1);
}

.devtools-frame.view-mode-xs {
  width: 400px !important;
  height: 80px !important;
}
</style>
