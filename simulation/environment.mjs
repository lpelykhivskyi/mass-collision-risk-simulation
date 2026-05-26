import { clamp, round } from "./utils.mjs";

export class Environment {
  constructor({
    windKn,
    currentKn,
    seaState,
    visibilityRisk,
    aisQualityRisk = 0.25,
  }) {
    this.windKn = windKn;
    this.currentKn = currentKn;
    this.seaState = seaState;
    this.visibilityRisk = visibilityRisk;
    this.aisQualityRisk = aisQualityRisk;
  }

  environmentalRisk() {
    const rWind = clamp((this.windKn - 10) / (30 - 10));
    const rCurrent = clamp(this.currentKn / 3);
    const rWave = clamp((this.seaState - 1) / (5 - 1));
    const rVisibility = clamp(this.visibilityRisk);

    const rEnv =
      0.35 * rWind +
      0.3 * rCurrent +
      0.25 * rWave +
      0.1 * rVisibility;

    return round(clamp(rEnv), 3);
  }

  uncertaintyIndex() {
    const rEnv = this.environmentalRisk();

    const uAis = clamp(this.aisQualityRisk);
    const uEnv = clamp(0.65 * rEnv + 0.1);
    const uPrediction = clamp(0.55 * rEnv + 0.1);

    const u = 0.4 * uAis + 0.35 * uEnv + 0.25 * uPrediction;

    return round(clamp(u), 3);
  }
}
