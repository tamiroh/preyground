import {
  Predator,
  type Animal,
} from "./animal";

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

  public render(animals: readonly Animal[]): void {
    this.context.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    for (const animal of animals) {
      this.drawAnimal(animal);
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
}
