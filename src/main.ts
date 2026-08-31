import {
  CanvasRenderer,
  type ChartPoint,
  type PopulationHistory,
} from "./lib/renderer.ts";
import "./style.css";
import { SimulationUi } from "./lib/ui.ts";
import { World } from "./lib/world.ts";

const FIXED_DT = 1 / 60;

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
const world = new World({
  width: window.innerWidth,
  height: window.innerHeight,
});

let running = true;
let populationChartVisible = false;
let preyHistory: ChartPoint[] = [];
let predatorHistory: ChartPoint[] = [];
let lastRecordedTime = -1;

function resize(): void {
  const worldSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  renderer.resize(worldSize);
  world.resize(worldSize);
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
  const stats = world.stats;
  recordPopulationHistory(stats.elapsed, stats.preyCount, stats.predatorCount);
  ui.updateStats(stats);
  renderer.render(world.animals, world.grass, populationChartVisible ? getPopulationHistory() : null);
}

function recordPopulationHistory(time: number, preyCount: number, predatorCount: number): void {
  if (time === lastRecordedTime) {
    return;
  }
  lastRecordedTime = time;
  preyHistory.push({ time, value: preyCount });
  predatorHistory.push({ time, value: predatorCount });
}

function getPopulationHistory(): PopulationHistory {
  return {
    prey: preyHistory,
    predators: predatorHistory,
  };
}

ui.onToggleRun(() => {
  running = !running;
  ui.setRunning(running);
});

ui.onReset(() => {
  world.reset();
  preyHistory = [];
  predatorHistory = [];
  lastRecordedTime = -1;
});

ui.onTogglePopulationChart(() => {
  populationChartVisible = !populationChartVisible;
  ui.setPopulationChartVisible(populationChartVisible);
});

window.addEventListener("resize", resize);

resize();
world.reset();
ui.setRunning(running);
ui.setPopulationChartVisible(populationChartVisible);
requestAnimationFrame(tick);
