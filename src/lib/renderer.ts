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

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
  ) {}

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
    for (const grass of grasses) {
      this.drawGrass(grass);
    }
    for (const animal of animals) {
      this.drawAnimal(animal);
    }
    if (populationHistory) {
      this.drawPopulationChart(populationHistory);
    }
  }

  private drawGrass(grass: Readonly<Grass>): void {
    this.context.fillStyle = "rgb(150 150 150 / 0.34)";
    this.context.beginPath();
    this.context.arc(grass.x, grass.y, 2.8, 0, Math.PI * 2);
    this.context.fill();
  }

  private drawBackground(): void {
    this.context.fillStyle = "#161616";
    this.context.fillRect(0, 0, this.width, this.height);

    this.context.strokeStyle = "rgb(232 232 232 / 0.055)";
    this.context.lineWidth = 1;
    for (let x = 0; x < this.width; x += 48) {
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, this.height);
      this.context.stroke();
    }
    for (let y = 0; y < this.height; y += 48) {
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.width, y);
      this.context.stroke();
    }
  }

  private drawAnimal(animal: Animal): void {
    const predator = animal instanceof Predator;
    const radius = this.animalRadius(animal, predator);
    const angle = Math.atan2(animal.vy, animal.vx);

    this.context.save();
    this.context.translate(animal.x, animal.y);
    this.context.rotate(angle);
    this.context.fillStyle = predator ? "#c78376" : "#9fbd8e";
    this.context.strokeStyle = predator ? "rgb(238 215 207 / 0.72)" : "rgb(226 234 216 / 0.66)";
    this.context.lineWidth = 1.4;
    this.context.beginPath();
    this.context.moveTo(radius * 1.5, 0);
    this.context.lineTo(-radius, radius * 0.8);
    this.context.lineTo(-radius * 0.65, 0);
    this.context.lineTo(-radius, -radius * 0.8);
    this.context.closePath();
    this.context.fill();
    this.context.stroke();
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
    const chartHeight = 190;
    const left = 18;
    const top = Math.max(18, this.height - chartHeight - 18);
    const padding = 34;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 1.7;

    this.context.save();
    this.context.fillStyle = "rgb(22 22 22 / 0.92)";
    this.context.strokeStyle = "rgb(232 232 232 / 0.14)";
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.roundRect(left, top, chartWidth, chartHeight, 8);
    this.context.fill();
    this.context.stroke();

    this.context.fillStyle = "#e8e8e8";
    this.context.font = "600 13px ui-sans-serif, system-ui";
    this.context.fillText("Population over time", left + 14, top + 24);

    if (history.prey.length < 2 || history.predators.length < 2) {
      this.context.fillStyle = "rgb(232 232 232 / 0.62)";
      this.context.font = "12px ui-sans-serif, system-ui";
      this.context.fillText("Collecting data...", left + 14, top + 50);
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
    const plotLeft = left + padding;
    const plotTop = top + 48;
    const plotBottom = plotTop + plotHeight;

    this.context.strokeStyle = "rgb(232 232 232 / 0.12)";
    this.context.beginPath();
    this.context.moveTo(plotLeft, plotTop);
    this.context.lineTo(plotLeft, plotBottom);
    this.context.lineTo(plotLeft + plotWidth, plotBottom);
    this.context.stroke();

    this.drawChartLine(sampledPreyHistory, "#858585", minTime, maxTime, maxValue, plotLeft, plotBottom, plotWidth, plotHeight);
    this.drawChartLine(sampledPredatorHistory, "#b8b8b8", minTime, maxTime, maxValue, plotLeft, plotBottom, plotWidth, plotHeight);

    const latestPrey = history.prey[history.prey.length - 1];
    const latestPredators = history.predators[history.predators.length - 1];
    this.context.fillStyle = "rgb(232 232 232 / 0.68)";
    this.context.font = "12px ui-sans-serif, system-ui";
    this.context.fillStyle = "#858585";
    this.context.fillText(`prey ${latestPrey.value}`, plotLeft, plotBottom + 22);
    this.context.fillStyle = "#b8b8b8";
    this.context.fillText(`predators ${latestPredators.value}`, plotLeft + 82, plotBottom + 22);
    this.context.fillStyle = "rgb(232 232 232 / 0.68)";
    this.context.fillText(`max ${maxValue}`, plotLeft + plotWidth - 52, plotTop - 8);
    this.context.restore();
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
