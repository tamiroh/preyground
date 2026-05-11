type WorldStatsView = {
  elapsed: number;
  preyCount: number;
  predatorCount: number;
  eatenCount: number;
};

type WorldRuleParamsView = {
  preyBirthRate: number;
  predatorHunger: number;
};

type UiElements = {
  time: HTMLElement | null;
  preyCount: HTMLElement | null;
  predatorCount: HTMLElement | null;
  predatorStat: HTMLElement | null;
  eatenCount: HTMLElement | null;
  toggleRun: HTMLButtonElement | null;
  reset: HTMLButtonElement | null;
  speed: HTMLInputElement | null;
  preyBirth: HTMLInputElement | null;
  predatorHunger: HTMLInputElement | null;
};

export class SimulationUi {
  private readonly elements: UiElements = {
    time: document.querySelector<HTMLElement>("#time"),
    preyCount: document.querySelector<HTMLElement>("#preyCount"),
    predatorCount: document.querySelector<HTMLElement>("#predatorCount"),
    predatorStat: document.querySelector<HTMLElement>("#predatorStat"),
    eatenCount: document.querySelector<HTMLElement>("#eatenCount"),
    toggleRun: document.querySelector<HTMLButtonElement>("#toggleRun"),
    reset: document.querySelector<HTMLButtonElement>("#reset"),
    speed: document.querySelector<HTMLInputElement>("#speed"),
    preyBirth: document.querySelector<HTMLInputElement>("#preyBirth"),
    predatorHunger: document.querySelector<HTMLInputElement>("#predatorHunger"),
  };

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
    if (this.elements.toggleRun) {
      this.elements.toggleRun.textContent = running ? "Pause" : "Resume";
    }
  }

  public updateStats(stats: WorldStatsView): void {
    if (this.elements.time) this.elements.time.textContent = stats.elapsed.toFixed(0);
    if (this.elements.preyCount) this.elements.preyCount.textContent = String(stats.preyCount);
    if (this.elements.predatorCount) this.elements.predatorCount.textContent = String(stats.predatorCount);
    if (this.elements.eatenCount) this.elements.eatenCount.textContent = String(stats.eatenCount);
  }

  public onToggleRun(handler: () => void): void {
    this.elements.toggleRun?.addEventListener("click", handler);
  }

  public onReset(handler: () => void): void {
    this.elements.reset?.addEventListener("click", handler);
  }

  public onTogglePredatorChart(handler: () => void): void {
    this.elements.predatorStat?.addEventListener("click", handler);
    this.elements.predatorStat?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }
    });
  }

  public setPredatorChartVisible(visible: boolean): void {
    this.elements.predatorStat?.classList.toggle("is-active", visible);
    this.elements.predatorStat?.setAttribute("aria-pressed", String(visible));
  }
}
