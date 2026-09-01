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

type ParamKey = "speed" | "preyBirth" | "predatorHunger";

type ParamDescriptor = {
  key: ParamKey;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (value: number) => string;
};

type StatKey = "preyCount" | "predatorCount" | "killedPreyCount";

type StatRowDescriptor = {
  key: StatKey;
  label: string;
  icon: string | null;
  valueClass: string | null;
};

const PREY_ICON =
  '<svg width="13" height="13" viewBox="-9 -9 18 18"><g stroke="#74e0c0" stroke-width="1.6" fill="none"><circle r="3.5" /><path d="M3.5 0h4.2" /></g></svg>';
const PREDATOR_ICON =
  '<svg width="13" height="13" viewBox="-9 -9 18 18"><path d="M8 0L-6 5 -2.6 0 -6 -5Z" fill="#ef9d63" /></svg>';
const CARET_ICON =
  '<svg class="plot-toggle-caret" width="7" height="9" viewBox="0 0 7 9" aria-hidden="true"><path d="M0 0l7 4.5L0 9z" fill="currentColor" /></svg>';
const PAUSE_ICON =
  '<svg class="btn-ic" width="10" height="11" viewBox="0 0 10 11" aria-hidden="true"><rect x="0" y="0" width="3" height="11" fill="currentColor" /><rect x="7" y="0" width="3" height="11" fill="currentColor" /></svg>';
const RESET_ICON =
  '<svg class="btn-ic" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M10 3.2A4.4 4.4 0 1 0 10.6 7" /><path d="M10.4 1.2v2.3H8.1" stroke-linecap="round" stroke-linejoin="round" /></svg>';

const PARAMS: readonly ParamDescriptor[] = [
  { key: "speed", label: "Tempo", min: 1, max: 8, step: 1, value: 2, format: (value) => `×${value}` },
  { key: "preyBirth", label: "Prey natality", min: 0, max: 0.08, step: 0.002, value: 0.025, format: formatRate },
  { key: "predatorHunger", label: "Predator forbearance", min: 8, max: 45, step: 1, value: 22, format: (value) => String(value) },
];

const STAT_ROWS: readonly StatRowDescriptor[] = [
  { key: "preyCount", label: "Prey", icon: PREY_ICON, valueClass: "val-prey" },
  { key: "predatorCount", label: "Predators", icon: PREDATOR_ICON, valueClass: "val-pred" },
  { key: "killedPreyCount", label: "Prey taken", icon: null, valueClass: null },
];

export class SimulationUi {
  private readonly paramInputs = new Map<ParamKey, HTMLInputElement>();
  private readonly statValues = new Map<StatKey, HTMLElement>();
  private plotToggle!: HTMLButtonElement;
  private plotToggleLabel!: HTMLElement;
  private toggleRunButton!: HTMLButtonElement;
  private toggleRunLabel!: HTMLElement;
  private resetButton!: HTMLButtonElement;

  public constructor(mount: HTMLElement) {
    mount.append(
      el("aside", { class: "log", "aria-label": "observation log" }, [
        this.buildCensus(),
        this.buildParameters(),
        this.buildControls(),
      ]),
    );
  }

  public getSpeed(): number {
    return Number(this.paramInputs.get("speed")!.value);
  }

  public getParams(): WorldRuleParamsView {
    return {
      preyBirthRate: Number(this.paramInputs.get("preyBirth")!.value),
      predatorHunger: Number(this.paramInputs.get("predatorHunger")!.value),
    };
  }

  public setRunning(running: boolean): void {
    this.toggleRunLabel.textContent = running ? "Pause" : "Resume";
  }

  public updateStats(stats: WorldStatsView): void {
    for (const row of STAT_ROWS) {
      this.statValues.get(row.key)!.textContent = String(stats[row.key]);
    }
  }

  public onToggleRun(handler: () => void): void {
    this.toggleRunButton.addEventListener("click", handler);
  }

  public onReset(handler: () => void): void {
    this.resetButton.addEventListener("click", handler);
  }

  public onTogglePopulationChart(handler: () => void): void {
    this.plotToggle.addEventListener("click", handler);
  }

  public setPopulationChartVisible(visible: boolean): void {
    this.plotToggle.classList.toggle("is-active", visible);
    this.plotToggle.setAttribute("aria-pressed", String(visible));
    this.plotToggleLabel.textContent = visible ? "hide population plot" : "plot population";
  }

  private buildCensus(): HTMLElement {
    this.plotToggleLabel = el("span", {}, ["plot population"]);
    this.plotToggle = el("button", { type: "button", class: "plot-toggle", "aria-pressed": "false" });
    this.plotToggle.innerHTML = CARET_ICON;
    this.plotToggle.append(this.plotToggleLabel);

    const head = el("div", { class: "block-head" }, [
      el("h2", { class: "block-label" }, ["Census"]),
      this.plotToggle,
    ]);
    const rows = STAT_ROWS.map((row) => this.buildStatRow(row));
    return el("section", { class: "block" }, [head, el("dl", { class: "census" }, rows)]);
  }

  private buildStatRow(row: StatRowDescriptor): HTMLElement {
    const icon = el("span", { class: "row-ic", "aria-hidden": "true" });
    if (row.icon) {
      icon.innerHTML = row.icon;
    }
    const value = el("dd", { class: row.valueClass ? `val ${row.valueClass}` : "val" }, ["0"]);
    this.statValues.set(row.key, value);
    return el("div", { class: "row" }, [
      icon,
      el("dt", {}, [row.label]),
      el("span", { class: "leader" }),
      value,
    ]);
  }

  private buildParameters(): HTMLElement {
    return el("section", { class: "block" }, [
      el("h2", { class: "block-label" }, ["Observed parameters"]),
      ...PARAMS.map((descriptor) => this.buildParam(descriptor)),
    ]);
  }

  private buildParam(descriptor: ParamDescriptor): HTMLElement {
    const output = el("output", { for: descriptor.key }, [descriptor.format(descriptor.value)]);
    const input = el("input", {
      id: descriptor.key,
      type: "range",
      min: String(descriptor.min),
      max: String(descriptor.max),
      step: String(descriptor.step),
      value: String(descriptor.value),
    });
    this.paramInputs.set(descriptor.key, input);

    const sync = (): void => {
      const value = Number(input.value);
      const filled = descriptor.max > descriptor.min
        ? ((value - descriptor.min) / (descriptor.max - descriptor.min)) * 100
        : 0;
      input.style.setProperty("--fill", `${filled}%`);
      output.textContent = descriptor.format(value);
    };
    input.addEventListener("input", sync);
    sync();

    return el("div", { class: "param" }, [
      el("div", { class: "param-top" }, [
        el("label", { for: descriptor.key }, [descriptor.label]),
        output,
      ]),
      el("div", { class: "param-track" }, [input]),
    ]);
  }

  private buildControls(): HTMLElement {
    this.toggleRunLabel = el("span", { class: "btn-label" }, ["Pause"]);
    this.toggleRunButton = el("button", { type: "button", class: "btn btn-primary" });
    this.toggleRunButton.innerHTML = PAUSE_ICON;
    this.toggleRunButton.append(this.toggleRunLabel);

    this.resetButton = el("button", { type: "button", class: "btn" });
    this.resetButton.innerHTML = RESET_ICON;
    this.resetButton.append(el("span", { class: "btn-label" }, ["Reset field"]));

    return el("section", { class: "controls" }, [this.toggleRunButton, this.resetButton]);
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  children: readonly (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

function formatRate(value: number): string {
  return value
    .toFixed(3)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}
