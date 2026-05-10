import { FIXED_DT } from "./lib/config";
import { CanvasRenderer } from "./lib/renderer";
import { PredatorPreySimulation } from "./lib/simulation";
import "./style.css";
import { SimulationUi } from "./lib/ui";

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
const simulation = new PredatorPreySimulation(window.innerWidth, window.innerHeight);

let running = true;

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.resize(width, height);
  simulation.resize(width, height);
}

function tick(): void {
  requestAnimationFrame(tick);
  if (running) {
    const speed = ui.getSpeed();
    const params = ui.getParams();
    for (let i = 0; i < speed; i += 1) {
      simulation.step(FIXED_DT, params);
    }
  }
  ui.updateStats(simulation.getStats());
  renderer.render(simulation.getAnimals());
}

ui.onToggleRun(() => {
  running = !running;
  ui.setRunning(running);
});

ui.onReset(() => {
  simulation.reset();
});

window.addEventListener("resize", resize);

resize();
ui.setRunning(running);
requestAnimationFrame(tick);
