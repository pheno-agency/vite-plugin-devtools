/* This file runs only one time for all devtools instances */

const styles = `
  <style>
    :root {
      --devtools-hover-translate: translateX(3px);
    }

    .devtools-panel {
      position: fixed;
      z-index: 2147483645;
      width: calc(80vw - 20px);
      height: calc(60vh - 20px);
    }

    .devtools-panel iframe {
      width: 100%;
      height: 100%;
      outline: 0;
      border: 1px solid rgba(125, 125, 125, 0.2);
      border-radius: 8px;
    }

    .devtools-toggle {
      background: #0C0C0C;
      border: 1px solid rgba(125, 125, 125, 0.2);
      box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.1);
      z-index: 2147483645;
      cursor: pointer;
      opacity: 0.8;
      padding: 0;
      transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
      outline: 0;
      border-color: initial !important;
    }

    .devtools-toggle:hover {
      transform: var(--devtools-hover-translate);
      opacity: 1;
    }

    .devtools-toggle svg {
      width: 16px;
      height: 16px;
      margin: auto;
      margin-top: 3px;
    }

    .devtools-bar {
      display: flex;
      gap: 10px;
      position: fixed;
    }

    .devtools-resize-handle:hover {
      background: rgba(125, 125, 125, 0.1);
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

    .devtools-resize-handle-corner {
      position: absolute;
      width: 14px;
      height: 14px;
      margin: -6px;
      border-radius: 6px;
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
  </style>
`

const headEl = document.getElementsByTagName('head')[0]

headEl.innerHTML = headEl.innerHTML + styles

const CONTAINER_ID = '__devtools-container__'
const el = document.createElement('div')
el.setAttribute('id', CONTAINER_ID)
el.dataset.vInspectorIgnore = 'true'
const barEl = document.createElement('div')
barEl.classList.add('devtools-bar')
el.append(barEl)

document.querySelectorAll('body')[0].append(el)
