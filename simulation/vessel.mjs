import { degToRad } from "./utils.mjs";
import { DEFAULT_OWN_SHIP_LENGTH_NM } from "./constants.mjs";

export class VesselState {
  constructor({
    name,
    xNm,
    yNm,
    speedKn,
    courseDeg,
    lengthNm = DEFAULT_OWN_SHIP_LENGTH_NM,
  }) {
    this.name = name;
    this.xNm = xNm;
    this.yNm = yNm;
    this.speedKn = speedKn;
    this.courseDeg = courseDeg;
    this.lengthNm = lengthNm;
  }

  velocityNmPerMin() {
    const speedNmMin = this.speedKn / 60;
    const courseRad = degToRad(this.courseDeg);

    return {
      x: speedNmMin * Math.sin(courseRad),
      y: speedNmMin * Math.cos(courseRad),
    };
  }

  positionVector() {
    return {
      x: this.xNm,
      y: this.yNm,
    };
  }

  move(dtMin) {
    const velocity = this.velocityNmPerMin();

    return new VesselState({
      name: this.name,
      xNm: this.xNm + velocity.x * dtMin,
      yNm: this.yNm + velocity.y * dtMin,
      speedKn: this.speedKn,
      courseDeg: this.courseDeg,
      lengthNm: this.lengthNm,
    });
  }
}
