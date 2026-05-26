import { VesselState } from "./vessel.mjs";
import { Environment } from "./environment.mjs";
import { Scenario } from "./scenario.mjs";
import { EncounterType, ColregsRole } from "./constants.mjs";

export function createScenario4() {
  const ownShip = new VesselState({
    name: "OS",
    xNm: 0,
    yNm: 0,
    speedKn: 12,
    courseDeg: 0,
  });

  const targetShip = new VesselState({
    name: "TS-1",
    xNm: 2.79,
    yNm: 1.76,
    speedKn: 12,
    courseDeg: 270,
  });

  const environment = new Environment({
    windKn: 25,
    currentKn: 1.75,
    seaState: 3.5,
    visibilityRisk: 0.25,
    aisQualityRisk: 0.25,
  });

  return new Scenario({
    name: "Сценарій 4 — перетин курсів за умов сильного вітру та течії",
    ownShip,
    targetShips: [targetShip],
    environment,
    encounterType: EncounterType.CROSSING,
    colregsRole: ColregsRole.GIVE_WAY,
    description:
      "OS — give-way vessel, тобто судно, що повинно поступитися дорогою; TS — stand-on vessel, тобто судно, що має зберігати курс і швидкість.",
  });
}

export function createMultiShipDemo() {
  const ownShip = new VesselState({
    name: "OS",
    xNm: 0,
    yNm: 0,
    speedKn: 12,
    courseDeg: 0,
  });

  const target1 = new VesselState({
    name: "TS-1",
    xNm: 2.79,
    yNm: 1.76,
    speedKn: 12,
    courseDeg: 270,
  });

  const target2 = new VesselState({
    name: "TS-2",
    xNm: -1.5,
    yNm: 2.2,
    speedKn: 10,
    courseDeg: 135,
  });

  const target3 = new VesselState({
    name: "TS-3",
    xNm: 0.8,
    yNm: -2.5,
    speedKn: 9,
    courseDeg: 10,
  });

  const environment = new Environment({
    windKn: 22,
    currentKn: 1.5,
    seaState: 3,
    visibilityRisk: 0.3,
    aisQualityRisk: 0.25,
  });

  return new Scenario({
    name: "Багатосудновий сценарій — OS та три цільові судна",
    ownShip,
    targetShips: [target1, target2, target3],
    environment,
    encounterType: EncounterType.MULTI_SHIP,
    colregsRole: ColregsRole.MIXED,
    description: "Багатосуднова ситуація зі змішаними COLREGs-ролями.",
  });
}
