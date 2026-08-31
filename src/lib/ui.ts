type WorldStatsView = {
  elapsed: number;
  preyCount: number;
  predatorCount: number;
  killedPreyCount: number;
  killedPredatorCount: number;
};

type WorldRuleParamsView = {
  preyBirthRate: number;
  predatorHunger: number;
};

type UiElements = {
  time: HTMLElement | null;
  preyCount: HTMLElement | null;
  predatorCount: HTMLElement | null;
  plotToggle: HTMLButtonElement | null;
  plotToggleLabel: HTMLElement | null;
  killedPreyCount: HTMLElement | null;
  toggleRun: HTMLButtonElement | null;
  toggleRunLabel: HTMLElement | null;
  reset: HTMLButtonElement | null;
  speed: HTMLInputElement | null;
  speedVal: HTMLElement | null;
  preyBirth: HTMLInputElement | null;
  preyBirthVal: HTMLElement | null;
  predatorHunger: HTMLInputElement | null;
  predatorHungerVal: HTMLElement | null;
};

export class SimulationUi {
  private readonly elements: UiElements = {
    time: document.querySelector<HTMLElement>("#time"),
    preyCount: document.querySelector<HTMLElement>("#preyCount"),
    predatorCount: document.querySelector<HTMLElement>("#predatorCount"),
    plotToggle: document.querySelector<HTMLButtonElement>("#plotToggle"),
    plotToggleLabel: document.querySelector<HTMLElement>("#plotToggleLabel"),
    killedPreyCount: document.querySelector<HTMLElement>("#killedPreyCount"),
    toggleRun: document.querySelector<HTMLButtonElement>("#toggleRun"),
    toggleRunLabel: document.querySelector<HTMLElement>("#toggleRun .btn-label"),
    reset: document.querySelector<HTMLButtonElement>("#reset"),
    speed: document.querySelector<HTMLInputElement>("#speed"),
    speedVal: document.querySelector<HTMLElement>("#speedVal"),
    preyBirth: document.querySelector<HTMLInputElement>("#preyBirth"),
    preyBirthVal: document.querySelector<HTMLElement>("#preyBirthVal"),
    predatorHunger: document.querySelector<HTMLInputElement>("#predatorHunger"),
    predatorHungerVal: document.querySelector<HTMLElement>("#predatorHungerVal"),
  };

  public constructor() {
    this.bindSlider(this.elements.speed, this.elements.speedVal, (value) => `×${value}`);
    this.bindSlider(this.elements.preyBirth, this.elements.preyBirthVal, formatRate);
    this.bindSlider(this.elements.predatorHunger, this.elements.predatorHungerVal, (value) => String(value));
  }

  public getSpeed(): number {
    return Number(this.elements.speed?.value ?? 2);
  }

  public getParams(): WorldRuleParamsView {
    return {
      preyBirthRate: Number(this.elements.preyBirth?.value ?? 0.025),
      predatorHunger: Number(this.elements.predatorHunger?.value ?? 22),
    };
  }

  public setRunning(running: boolean): void {
    if (this.elements.toggleRunLabel) {
      this.elements.toggleRunLabel.textContent = running ? "Pause" : "Resume";
    }
  }

  public updateStats(stats: WorldStatsView): void {
    if (this.elements.time) this.elements.time.textContent = stats.elapsed.toFixed(0);
    if (this.elements.preyCount) this.elements.preyCount.textContent = String(stats.preyCount);
    if (this.elements.predatorCount) this.elements.predatorCount.textContent = String(stats.predatorCount);
    if (this.elements.killedPreyCount) this.elements.killedPreyCount.textContent = String(stats.killedPreyCount);
  }

  public onToggleRun(handler: () => void): void {
    this.elements.toggleRun?.addEventListener("click", handler);
  }

  public onReset(handler: () => void): void {
    this.elements.reset?.addEventListener("click", handler);
  }

  public onTogglePopulationChart(handler: () => void): void {
    this.elements.plotToggle?.addEventListener("click", handler);
  }

  public setPopulationChartVisible(visible: boolean): void {
    this.elements.plotToggle?.classList.toggle("is-active", visible);
    this.elements.plotToggle?.setAttribute("aria-pressed", String(visible));
    if (this.elements.plotToggleLabel) {
      this.elements.plotToggleLabel.textContent = visible ? "hide population plot" : "plot population";
    }
  }

  private bindSlider(
    input: HTMLInputElement | null,
    output: HTMLElement | null,
    format: (value: number) => string,
  ): void {
    if (!input) {
      return;
    }
    const sync = (): void => {
      const value = Number(input.value);
      const min = Number(input.min);
      const max = Number(input.max);
      const filled = max > min ? ((value - min) / (max - min)) * 100 : 0;
      input.style.setProperty("--fill", `${filled}%`);
      if (output) {
        output.textContent = format(value);
      }
    };
    input.addEventListener("input", sync);
    sync();
  }
}

function formatRate(value: number): string {
  return value
    .toFixed(3)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}
