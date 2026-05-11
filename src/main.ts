import { FIXED_DT } from "./lib/config";
import {
  CanvasRenderer,
  type ChartPoint,
} from "./lib/renderer";
import "./style.css";
import { SimulationUi } from "./lib/ui";
import { World } from "./lib/world";

const canvasElement = document.querySelector<HTMLCanvasElement>("#world");
if (!canvasElement) {
  throw new Error("Canvas element #world was not found.");
}

const context = canvasElement.getContext("2d");
if (!context) {
  throw new Error("2D canvas context was not available.");
}

const ui = new SimulationUi();
const renderer = new CanvasRenderer(canvasElement, context);
const world = new World(window.innerWidth, window.innerHeight);

let running = true;
let predatorChartVisible = false;
let predatorHistory: ChartPoint[] = [];
let lastRecordedTime = -1;

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.resize(width, height);
  world.resize(width, height);
}

function tick(): void {
  requestAnimationFrame(tick);
  if (running) {
    const speed = ui.getSpeed();
    const params = ui.getParams();
    for (let i = 0; i < speed; i += 1) {
      world.step(FIXED_DT, params);
    }
  }
  const stats = world.getStats();
  recordPredatorHistory(stats.elapsed, stats.predatorCount);
  ui.updateStats(stats);
  renderer.render(world.getAnimals(), predatorChartVisible ? predatorHistory : null);
}

function recordPredatorHistory(time: number, value: number): void {
  if (time === lastRecordedTime) {
    return;
  }
  lastRecordedTime = time;
  predatorHistory.push({ time, value });
}

ui.onToggleRun(() => {
  running = !running;
  ui.setRunning(running);
});

ui.onReset(() => {
  world.reset();
  predatorHistory = [];
  lastRecordedTime = -1;
});

ui.onTogglePredatorChart(() => {
  predatorChartVisible = !predatorChartVisible;
  ui.setPredatorChartVisible(predatorChartVisible);
});

window.addEventListener("resize", resize);

resize();
world.reset();
ui.setRunning(running);
ui.setPredatorChartVisible(predatorChartVisible);
requestAnimationFrame(tick);
