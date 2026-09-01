import {
  Predator,
  type Animal,
} from "./animal.ts";
import type { Size } from "./math.ts";
import type { Grass } from "./world.ts";

const MAX_ENERGY_SIZE_SCALE = 1.55;
const MIN_ENERGY_SIZE_SCALE = 0.68;
const PREDATOR_BASE_RADIUS = 5.3;
const PREDATOR_FULL_SIZE_ENERGY = 32;
const PREY_BASE_RADIUS = 3.4;
const PREY_FULL_SIZE_ENERGY = 9;

export type ChartPoint = {
  time: number;
  value: number;
};

export type PopulationHistory = {
  prey: readonly ChartPoint[];
  predators: readonly ChartPoint[];
};

export class CanvasRenderer {
  private width = 0;
  private height = 0;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  public constructor(mount: HTMLElement) {
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("aria-label", "predator prey simulation");
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("2D canvas context was not available.");
    }
    this.context = context;
    mount.append(this.canvas);
  }

  public resize(worldSize: Size): void {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.width = worldSize.width;
    this.height = worldSize.height;
    this.canvas.width = Math.floor(worldSize.width * pixelRatio);
    this.canvas.height = Math.floor(worldSize.height * pixelRatio);
    this.canvas.style.width = `${worldSize.width}px`;
    this.canvas.style.height = `${worldSize.height}px`;
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  public render(
    animals: readonly Animal[],
    grasses: readonly Readonly<Grass>[],
    populationHistory: PopulationHistory | null = null,
  ): void {
    this.context.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawGrasses(grasses);
    for (const animal of animals) {
      this.drawAnimal(animal);
    }
    if (populationHistory) {
      this.drawPopulationChart(populationHistory);
    }
  }

  private drawGrasses(grasses: readonly Readonly<Grass>[]): void {
    this.context.strokeStyle = "rgb(234 229 219 / 0.13)";
    this.context.lineWidth = 1;
    this.context.beginPath();
    for (const grass of grasses) {
      this.context.moveTo(grass.x - 1.6, grass.y);
      this.context.lineTo(grass.x + 1.6, grass.y);
      this.context.moveTo(grass.x, grass.y - 1.6);
      this.context.lineTo(grass.x, grass.y + 1.6);
    }
    this.context.stroke();
  }

  private drawBackground(): void {
    const { width, height } = this;
    const centerX = width * 0.45;
    const centerY = height * 0.4;

    const vignette = this.context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(width, height) * 0.8,
    );
    vignette.addColorStop(0, "#1b1b1c");
    vignette.addColorStop(0.5, "#121212");
    vignette.addColorStop(1, "#090909");
    this.context.fillStyle = vignette;
    this.context.fillRect(0, 0, width, height);

    this.context.lineWidth = 1;

    this.context.strokeStyle = "rgb(234 229 219 / 0.045)";
    this.context.beginPath();
    for (let x = 60; x < width; x += 60) {
      this.context.moveTo(x, 0);
      this.context.lineTo(x, height);
    }
    for (let y = 60; y < height; y += 60) {
      this.context.moveTo(0, y);
      this.context.lineTo(width, y);
    }
    this.context.stroke();

    this.context.strokeStyle = "rgb(234 229 219 / 0.05)";
    for (const radius of [width * 0.2, width * 0.34]) {
      this.context.beginPath();
      this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.context.stroke();
    }

    this.context.strokeStyle = "rgb(234 229 219 / 0.09)";
    this.context.beginPath();
    this.context.moveTo(centerX, 0);
    this.context.lineTo(centerX, height);
    this.context.moveTo(0, centerY);
    this.context.lineTo(width, centerY);
    this.context.stroke();

    this.drawCornerBrackets();

    this.context.strokeStyle = "rgb(234 229 219 / 0.12)";
    this.context.beginPath();
    for (let i = 0, x = 80; x < width - 40; i += 1, x += 40) {
      this.context.moveTo(x, 24);
      this.context.lineTo(x, i % 5 === 0 ? 34 : 29);
    }
    this.context.stroke();
  }

  private drawCornerBrackets(): void {
    const margin = 24;
    const arm = 42;
    const { width: w, height: h } = this;
    this.context.strokeStyle = "rgb(234 229 219 / 0.22)";
    this.context.lineWidth = 1.2;
    this.context.beginPath();
    this.context.moveTo(margin, margin + arm);
    this.context.lineTo(margin, margin);
    this.context.lineTo(margin + arm, margin);
    this.context.moveTo(w - margin - arm, margin);
    this.context.lineTo(w - margin, margin);
    this.context.lineTo(w - margin, margin + arm);
    this.context.moveTo(margin, h - margin - arm);
    this.context.lineTo(margin, h - margin);
    this.context.lineTo(margin + arm, h - margin);
    this.context.moveTo(w - margin - arm, h - margin);
    this.context.lineTo(w - margin, h - margin);
    this.context.lineTo(w - margin, h - margin - arm);
    this.context.stroke();
  }

  private drawAnimal(animal: Animal): void {
    const predator = animal instanceof Predator;
    const radius = this.animalRadius(animal, predator);
    const angle = Math.atan2(animal.vy, animal.vx);

    this.context.save();
    this.context.translate(animal.x, animal.y);
    this.context.rotate(angle);

    if (predator) {
      this.context.fillStyle = "#e58d54";
      this.context.strokeStyle = "rgb(201 123 71 / 0.9)";
      this.context.lineWidth = 0.8;
      this.context.beginPath();
      this.context.moveTo(radius * 1.6, 0);
      this.context.lineTo(-radius, radius * 0.9);
      this.context.lineTo(-radius * 0.55, 0);
      this.context.lineTo(-radius, -radius * 0.9);
      this.context.closePath();
      this.context.fill();
      this.context.stroke();
    } else {
      this.context.strokeStyle = "#6fd8ba";
      this.context.lineWidth = 1.5;
      this.context.beginPath();
      this.context.arc(0, 0, radius, 0, Math.PI * 2);
      this.context.moveTo(radius * 1.3, 0);
      this.context.lineTo(radius * 2.4, 0);
      this.context.stroke();
    }
    this.context.restore();
  }

  private animalRadius(animal: Animal, predator: boolean): number {
    return (predator ? PREDATOR_BASE_RADIUS : PREY_BASE_RADIUS)
      * this.energySizeScale(animal.energy, predator ? PREDATOR_FULL_SIZE_ENERGY : PREY_FULL_SIZE_ENERGY);
  }

  private energySizeScale(energy: number, fullSizeEnergy: number): number {
    return MIN_ENERGY_SIZE_SCALE
      + Math.min(1, Math.max(0, energy / fullSizeEnergy)) * (MAX_ENERGY_SIZE_SCALE - MIN_ENERGY_SIZE_SCALE);
  }

  private drawPopulationChart(history: PopulationHistory): void {
    const chartWidth = Math.max(280, this.width - 36);
    const chartHeight = 168;
    const left = 18;
    const top = Math.max(18, this.height - chartHeight - 18);
    const rightGutter = 40;
    const plotLeft = left + 18;
    const plotWidth = chartWidth - 18 - rightGutter;
    const plotTop = top + 24;
    const plotBottom = top + chartHeight - 20;
    const plotHeight = plotBottom - plotTop;

    this.context.save();
    this.context.fillStyle = "#161617";
    this.context.strokeStyle = "rgb(234 229 219 / 0.17)";
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.roundRect(left, top, chartWidth, chartHeight, 13);
    this.context.fill();
    this.context.stroke();

    if (history.prey.length < 2 || history.predators.length < 2) {
      this.context.fillStyle = "rgb(234 229 219 / 0.3)";
      this.context.font = '12px "IBM Plex Mono", ui-monospace, monospace';
      this.context.fillText("collecting data…", plotLeft, plotTop + 8);
      this.context.restore();
      return;
    }

    const sampledPreyHistory = this.sampleChartHistory(history.prey, Math.max(2, Math.floor(plotWidth)));
    const sampledPredatorHistory = this.sampleChartHistory(history.predators, Math.max(2, Math.floor(plotWidth)));
    const minTime = Math.min(history.prey[0].time, history.predators[0].time);
    const maxTime = Math.max(
      history.prey[history.prey.length - 1].time,
      history.predators[history.predators.length - 1].time,
    );
    const maxValue = Math.max(
      1,
      ...history.prey.map((point) => point.value),
      ...history.predators.map((point) => point.value),
    );

    this.context.strokeStyle = "rgb(234 229 219 / 0.2)";
    this.context.beginPath();
    this.context.moveTo(plotLeft, plotTop);
    this.context.lineTo(plotLeft, plotBottom);
    this.context.lineTo(plotLeft + plotWidth, plotBottom);
    this.context.stroke();

    this.context.fillStyle = "rgb(234 229 219 / 0.32)";
    this.context.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    this.context.fillText(`max ${maxValue}`, plotLeft, plotTop - 8);

    this.drawChartLine(sampledPreyHistory, "#6fd8ba", minTime, maxTime, maxValue, plotLeft, plotBottom, plotWidth, plotHeight);
    this.context.setLineDash([4, 3]);
    this.drawChartLine(sampledPredatorHistory, "#e58d54", minTime, maxTime, maxValue, plotLeft, plotBottom, plotWidth, plotHeight);
    this.context.setLineDash([]);

    const latestPrey = history.prey[history.prey.length - 1];
    const latestPredators = history.predators[history.predators.length - 1];
    const preyEndY = this.clampChartY(latestPrey.value, maxValue, plotTop, plotBottom, plotHeight);
    let predatorEndY = this.clampChartY(latestPredators.value, maxValue, plotTop, plotBottom, plotHeight);
    if (Math.abs(predatorEndY - preyEndY) < 13) {
      predatorEndY = preyEndY + (predatorEndY < preyEndY ? -13 : 13);
    }

    const lineEndX = plotLeft + plotWidth;
    const labelRight = left + chartWidth - 12;
    this.context.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    this.context.textAlign = "right";
    this.context.textBaseline = "middle";
    this.drawChartEndLabel(String(latestPrey.value), "#6fd8ba", lineEndX, preyEndY, labelRight);
    this.drawChartEndLabel(String(latestPredators.value), "#e58d54", lineEndX, predatorEndY, labelRight);
    this.context.textAlign = "left";
    this.context.textBaseline = "alphabetic";
    this.context.restore();
  }

  private clampChartY(
    value: number,
    maxValue: number,
    plotTop: number,
    plotBottom: number,
    plotHeight: number,
  ): number {
    return Math.min(plotBottom, Math.max(plotTop, plotBottom - (value / maxValue) * plotHeight));
  }

  private drawChartEndLabel(text: string, color: string, dotX: number, dotY: number, labelRight: number): void {
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(dotX, dotY, 2.4, 0, Math.PI * 2);
    this.context.fill();
    this.context.fillText(text, labelRight, dotY);
  }

  private drawChartLine(
    history: readonly ChartPoint[],
    color: string,
    minTime: number,
    maxTime: number,
    maxValue: number,
    plotLeft: number,
    plotBottom: number,
    plotWidth: number,
    plotHeight: number,
  ): void {
    this.context.strokeStyle = color;
    this.context.lineWidth = 2;
    this.context.beginPath();
    history.forEach((point, index) => {
      const x = plotLeft + ((point.time - minTime) / Math.max(1, maxTime - minTime)) * plotWidth;
      const y = plotBottom - (point.value / maxValue) * plotHeight;
      if (index === 0) {
        this.context.moveTo(x, y);
      } else {
        this.context.lineTo(x, y);
      }
    });
    this.context.stroke();
  }

  private sampleChartHistory(history: readonly ChartPoint[], maxPoints: number): readonly ChartPoint[] {
    if (history.length <= maxPoints) {
      return history;
    }

    const sampled: ChartPoint[] = [];
    const bucketSize = history.length / maxPoints;
    for (let bucket = 0; bucket < maxPoints; bucket += 1) {
      const start = Math.floor(bucket * bucketSize);
      const end = Math.min(history.length, Math.floor((bucket + 1) * bucketSize));
      let maxPoint = history[start];
      for (let index = start + 1; index < end; index += 1) {
        if (history[index].value > maxPoint.value) {
          maxPoint = history[index];
        }
      }
      sampled.push(maxPoint);
    }
    return sampled;
  }
}
