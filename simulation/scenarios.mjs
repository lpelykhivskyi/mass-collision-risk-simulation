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

export function createScenario8() {
  const ownShip = new VesselState({
    name: "OS",
    xNm: 0,
    yNm: 0,
    speedKn: 12,
    courseDeg: 0,
  });

  // TS-1 — прогнозована ціль, менш критична взаємодія
  const target1 = new VesselState({
    name: "TS-1",
    xNm: -1.2,
    yNm: 1.9,
    speedKn: 9,
    courseDeg: 120,
  });

  // TS-2 — найбільш небезпечна пара для OS:
  // підібрано так, щоб на початковому кроці отримати приблизно
  // DCPA ≈ 0.19 nm та TCPA ≈ 8 хв.
  const target2 = new VesselState({
    name: "TS-2",
    xNm: 1.48,
    yNm: 1.48,
    speedKn: 10,
    courseDeg: 270,
  });

  const environment = new Environment({
    // Обмежена акваторія, помірний вітер, інтенсивний локальний трафік.
    // Параметри підібрані так, щоб середовищний ризик був помірно підвищеним.
    windKn: 20,
    currentKn: 1.2,
    seaState: 3,
    visibilityRisk: 0.2,

    // Підвищена невизначеність через багатосуднову ситуацію
    // та інтенсивний локальний трафік.
    aisQualityRisk: 0.45,
  });

  return new Scenario({
    name: "Сценарій 8 — багатосуднова ситуація з трьома суднами в обмеженій акваторії",
    ownShip,
    targetShips: [target1, target2],
    environment,
    encounterType: EncounterType.MULTI_SHIP,
    colregsRole: ColregsRole.MIXED,
    description:
      "Обмежена акваторія, помірний вітер та інтенсивний локальний трафік. OS одночасно взаємодіє з двома цільовими суднами; COLREGs-ролі для пар різні. Одне судно діє прогнозовано, друге реагує із запізненням. Значення DCPA та TCPA інтерпретуються для найбільш небезпечної пари суден.",
  });
}
