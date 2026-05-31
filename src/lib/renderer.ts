import {
  Predator,
  type Animal,
} from "./animal";

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

  public resize(width: number, height: number): void {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.floor(width * pixelRatio);
    this.canvas.height = Math.floor(height * pixelRatio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  public render(animals: readonly Animal[], populationHistory: PopulationHistory | null = null): void {
    this.context.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    for (const animal of animals) {
      this.drawAnimal(animal);
    }
    if (populationHistory) {
      this.drawPopulationChart(populationHistory);
    }
  }

  private drawBackground(): void {
    const gradient = this.context.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#13201f");
    gradient.addColorStop(1, "#1d2f29");
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.width, this.height);

    this.context.strokeStyle = "rgb(255 255 255 / 0.06)";
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
    const radius = predator ? 6.5 : 3.8;
    const angle = Math.atan2(animal.vy, animal.vx);

    this.context.save();
    this.context.translate(animal.x, animal.y);
    this.context.rotate(angle);
    this.context.fillStyle = predator ? "#ef767a" : "#8ee6a8";
    this.context.strokeStyle = predator ? "rgb(255 230 230 / 0.78)" : "rgb(225 255 232 / 0.72)";
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

  private drawPopulationChart(history: PopulationHistory): void {
    const chartWidth = Math.max(280, this.width - 36);
    const chartHeight = 190;
    const left = 18;
    const top = Math.max(18, this.height - chartHeight - 18);
    const padding = 34;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 1.7;

    this.context.save();
    this.context.fillStyle = "rgb(16 22 21 / 0.84)";
    this.context.strokeStyle = "rgb(255 255 255 / 0.16)";
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.roundRect(left, top, chartWidth, chartHeight, 8);
    this.context.fill();
    this.context.stroke();

    this.context.fillStyle = "#eef3f6";
    this.context.font = "600 13px ui-sans-serif, system-ui";
    this.context.fillText("Population over time", left + 14, top + 24);

    if (history.prey.length < 2 || history.predators.length < 2) {
      this.context.fillStyle = "rgb(238 243 246 / 0.65)";
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

    this.context.strokeStyle = "rgb(255 255 255 / 0.12)";
    this.context.beginPath();
    this.context.moveTo(plotLeft, plotTop);
    this.context.lineTo(plotLeft, plotBottom);
    this.context.lineTo(plotLeft + plotWidth, plotBottom);
    this.context.stroke();

    this.drawChartLine(sampledPreyHistory, "#8ee6a8", minTime, maxTime, maxValue, plotLeft, plotBottom, plotWidth, plotHeight);
    this.drawChartLine(sampledPredatorHistory, "#ef767a", minTime, maxTime, maxValue, plotLeft, plotBottom, plotWidth, plotHeight);

    const latestPrey = history.prey[history.prey.length - 1];
    const latestPredators = history.predators[history.predators.length - 1];
    this.context.fillStyle = "rgb(238 243 246 / 0.7)";
    this.context.font = "12px ui-sans-serif, system-ui";
    this.context.fillStyle = "#8ee6a8";
    this.context.fillText(`prey ${latestPrey.value}`, plotLeft, plotBottom + 22);
    this.context.fillStyle = "#ef767a";
    this.context.fillText(`predators ${latestPredators.value}`, plotLeft + 82, plotBottom + 22);
    this.context.fillStyle = "rgb(238 243 246 / 0.7)";
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
