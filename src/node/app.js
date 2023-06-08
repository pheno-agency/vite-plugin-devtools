import "virtual:devtools:common";
import { iframeSrc, icon } from "./injectable";

const devtoolsButton = document.createElement("button");
devtoolsButton.classList.add("devtools-toggle");
devtoolsButton.innerHTML = icon;

const PANEL_MIN = 15;
const PANEL_MAX = 100;
const PANEL_PADDING = 10;

const state = {
  panelEl: null,
  iframeEl: null,
  position: "bottom",
  viewMode: "default",
  width: 80,
  height: 60,
};

const changePanelStyle = (panelEl) => {
  const height = `calc(${state.height}vh - ${PANEL_PADDING}px)`;
  const width = `calc(${state.width}vw - ${PANEL_PADDING}px)`;
  /* if (panelState.value.viewMode === 'component-inspector') {
    return {
      bottom: `${PANEL_PADDING}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      height: '80px',
      width: '400px',
    }
  } */
  let style;

  if (state.position === "bottom") {
    style = {
      transform: "translateX(-50%)",
      bottom: `${PANEL_PADDING}px`,
      left: "50%",
      height,
      width,
    };
  } else if (state.position === "top") {
    style = {
      transform: "translateX(-50%)",
      top: `${PANEL_PADDING}px`,
      left: "50%",
      height,
      width,
    };
  } else if (state.position === "left") {
    style = {
      transform: "translateY(-50%)",
      top: "50%",
      left: `${PANEL_PADDING}px`,
      height,
      width,
    };
  } else {
    style = {
      transform: "translateY(-50%)",
      top: "50%",
      right: `${PANEL_PADDING}px`,
      height,
      width,
    };
  }

  Object.assign(panelEl.style, style);
};

const toggleButtonPosition = (side) =>
  requestAnimationFrame(() => {
    state.position = side;
    const toggleElements = document.querySelectorAll(".devtools-toggle");
    const barEl = document.querySelector(".devtools-bar");
    const rootEl = document.querySelector(":root");

    let toggleStyle;
    let barStyle;

    switch (side) {
      case "left": {
        toggleStyle = {
          height: "35px",
          width: "35px",
          borderRadius: "0 100px 100px 0",
        };
        barStyle = {
          top: "calc(50% - 25px)",
          left: "-8px",
          flexDirection: "column",
        };
        rootEl.style.setProperty(
          "--devtools-hover-translate",
          "translateX(3px)"
        );

        break;
      }
      case "right": {
        toggleStyle = {
          height: "35px",
          width: "35px",
          borderRadius: "100px 0 0 100px",
        };
        barStyle = {
          top: "calc(50% - 25px)",
          right: "-8px",
          flexDirection: "column",
        };
        rootEl.style.setProperty(
          "--devtools-hover-translate",
          "translateX(-3px)"
        );

        break;
      }
      case "top": {
        toggleStyle = {
          borderRadius: "0 0 100px 100px",
          height: "30px",
          width: "40px",
        };
        barStyle = {
          top: "-3px",
          left: "calc(50%)",
        };
        rootEl.style.setProperty(
          "--devtools-hover-translate",
          "translate(0, 3px)"
        );

        break;
      }
      default: {
        toggleStyle = {
          borderRadius: "100px 100px 0 0",
          height: "30px",
          width: "40px",
        };
        barStyle = {
          bottom: "-5px",
          left: "calc(50% - 25px)",
        };
        rootEl.style.setProperty(
          "--devtools-hover-translate",
          "translate(0, -3px)"
        );
      }
    }
    const resetKeys = ["top", "right", "bottom", "left"];

    for (const el of toggleElements) {
      Object.assign(el.style, toggleStyle);
    }
    for (const k of resetKeys) {
      barEl.style[k] = "";
    }
    Object.assign(barEl.style, barStyle);
  });

let isDragging = false;

function toggleDragging(direction) {
  isDragging = direction;
}

const mouseleave = () => {
  state.iframeEl.style.pointerEvents = "auto";
  isDragging = false;
};

document.addEventListener("mouseup", mouseleave);
document.addEventListener("mouseleave", mouseleave);

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  state.iframeEl.style.pointerEvents = "none";
  const alignSide = state.position === "left" || state.position === "right";

  if (isDragging === "horizontal" || isDragging === "both") {
    const y =
      state.position === "top" ? window.innerHeight - e.clientY : e.clientY;
    const boxHeight = window.innerHeight;
    const value = alignSide
      ? (Math.abs(y - window.innerHeight / 2) / boxHeight) * 100 * 2
      : ((window.innerHeight - y) / boxHeight) * 100;
    state.height = Math.min(PANEL_MAX, Math.max(PANEL_MIN, value));
  }

  if (isDragging === "vertical" || isDragging === "both") {
    const x =
      state.position === "left" ? window.innerWidth - e.clientX : e.clientX;
    const boxWidth = window.innerWidth;
    const value = alignSide
      ? ((window.innerWidth - x) / boxWidth) * 100
      : (Math.abs(x - window.innerWidth / 2) / boxWidth) * 100 * 2;
    state.width = Math.min(PANEL_MAX, Math.max(PANEL_MIN, value));
  }

  changePanelStyle(state.panelEl);
});

const resizeBaseClassName = "devtools-resize-handle";
const resizeVerticalClassName = [
  resizeBaseClassName,
  `${resizeBaseClassName}-vertical`,
];
const resizeHorizontalClassName = [
  resizeBaseClassName,
  `${resizeBaseClassName}-horizontal`,
];
const resizeCornerClassName = [
  resizeBaseClassName,
  `${resizeBaseClassName}-corner`,
];

const resizeEls = new Map();
function loadResize(panelEl) {
  for (const [k, v] of resizeEls) {
    k.parentElement.removeChild(k);
    k.removeEventListener("mousedown", v);
    resizeEls.delete(v);
  }
  const divs = [
    {
      class: resizeHorizontalClassName,
      display: state.position !== "top",
      style: { top: 0 },
      direction: "horizontal",
    },
    {
      class: resizeCornerClassName,
      display: state.position !== "top" && state.position !== "left",
      style: { top: 0, left: 0, cursor: "nwse-resize" },
      direction: "both",
    },
    {
      class: resizeCornerClassName,
      display: state.position !== "top" && state.position !== "right",
      style: { top: 0, right: 0, cursor: "nesw-resize" },
      direction: "both",
    },

    //
    {
      class: resizeHorizontalClassName,
      display: state.position !== "bottom",
      style: { bottom: 0 },
      direction: "horizontal",
    },
    {
      class: resizeCornerClassName,
      display: state.position !== "bottom" && state.position !== "right",
      style: { bottom: 0, right: 0, cursor: "nwse-resize" },
      direction: "both",
    },
    {
      class: resizeCornerClassName,
      display: state.position !== "bottom" && state.position !== "left",
      style: { bottom: 0, left: 0, cursor: "nesw-resize" },
      direction: "both",
    },

    // vertical
    {
      class: resizeVerticalClassName,
      display: state.position !== "left",
      style: { left: 0 },
      direction: "vertical",
    },
    {
      class: resizeVerticalClassName,
      display: state.position !== "right",
      style: { right: 0 },
      direction: "vertical",
    },
  ];
  divs.forEach(({ display, direction, style, class: classList }) => {
    if (!display) {
      return;
    }
    const resizeEl = document.createElement("div");

    resizeEl.classList.add(...classList);
    Object.assign(resizeEl.style, style);
    const listener = (e) => {
      e.preventDefault();
      toggleDragging(direction);
    };
    resizeEls.set(resizeEl, listener);
    resizeEl.addEventListener("mousedown", listener);
    panelEl.appendChild(resizeEl);
  });
}

const loadPanel = (barEl) =>
  requestAnimationFrame(() => {
    const panelEl = document.createElement("div");
    state.panelEl = panelEl;
    Object.assign(panelEl.style, {
      zIndex: -100000,
      left: "-9999px",
      top: "-9999px",
    });
    panelEl.classList.add("devtools-panel");
    const iframeEl = document.createElement("iframe");
    state.iframeEl = iframeEl;
    iframeEl.src = iframeSrc;
    panelEl.appendChild(iframeEl);
    barEl.append(panelEl);

    loadResize(panelEl);

    devtoolsButton.addEventListener("mousedown", (e) => {
      e.preventDefault();
      togglePanel(panelEl);
    });
  });

let isPanelVisible = false;

function togglePanel(panelEl) {
  if (isPanelVisible) {
    // hide
    Object.assign(panelEl.style, {
      zIndex: -100000,
      left: "-9999px",
      top: "-9999px",
    });
  } else {
    // hide other panels
    const panelEls = document.querySelectorAll(".devtools-panel");
    panelEls.forEach((el) => {
      Object.assign(el.style, {
        zIndex: -100000,
        left: "-9999px",
        top: "-9999px",
      });
    });
    Object.assign(panelEl.style, {
      zIndex: "unset",
      left: "unset",
      top: "unset",
    });
    changePanelStyle(panelEl);
  }
  isPanelVisible = !isPanelVisible;
}

const positionBroadcast = new BroadcastChannel("__devtools__position__");

positionBroadcast.onmessage = ({ data: p }) => {
  localStorage.setItem("__devtools__position__", p);

  toggleButtonPosition(p);
};

function load() {
  const barEl = document.querySelector(".devtools-bar");
  barEl.append(devtoolsButton);

  toggleButtonPosition(
    localStorage.getItem("__devtools__position__") || "bottom"
  );

  loadPanel(barEl);
}
load();
