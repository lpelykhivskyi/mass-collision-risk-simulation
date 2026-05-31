import { VesselState } from "./vessel.mjs";
import { Environment } from "./environment.mjs";
import { Scenario } from "./scenario.mjs";
import { EncounterType, ColregsRole } from "./constants.mjs";

const BASE_OWN_SHIP = {
  name: "OS",
  xNm: 0,
  yNm: 0,
  speedKn: 12,
  courseDeg: 0,
};

const scenarioTable = [
  {
    number: 1,
    vesselCount: 2,
    name: "Сценарій 1 — зустріч на зустрічних курсах за помірних умов",
    description:
      "Помірний вітер 10–15 kn, хвилювання 2 бали, добра видимість. Взаємне розходження; обидва судна діють за логікою head-on. Прогнозована, своєчасна реакція обох суден.",
    encounterType: EncounterType.HEAD_ON,
    colregsRole: ColregsRole.MUTUAL,
    environment: { windKn: 12, currentKn: 0.5, seaState: 2, visibilityRisk: 0.1 },
    initialTargets: [{ xNm: 2, yNm: 5, speedKn: 10, courseDeg: 180 }],
    cpa: { dcpaNm: 0.28, tcpaMin: 12 },
    risk: { u: 0.18, rGeom: 0.64, rEnv: 0.24, rTotal: 0.49, riskLevel: "Середній" },
  },
  {
    number: 2,
    vesselCount: 2,
    name: "Сценарій 2 — зустріч на зустрічних курсах без своєчасної зміни курсу TS",
    description:
      "Помірні умови, добра видимість. Взаємне розходження; затримка маневру цільовим судном. Інертна або запізніла реакція.",
    encounterType: EncounterType.HEAD_ON,
    colregsRole: ColregsRole.MUTUAL,
    environment: { windKn: 12, currentKn: 0.5, seaState: 2, visibilityRisk: 0.1 },
    initialTargets: [{ xNm: 1.5, yNm: 4, speedKn: 11, courseDeg: 180 }],
    cpa: { dcpaNm: 0.19, tcpaMin: 10 },
    risk: { u: 0.22, rGeom: 0.76, rEnv: 0.25, rTotal: 0.67, riskLevel: "Високий" },
  },
  {
    number: 3,
    vesselCount: 2,
    name: "Сценарій 3 — перетин курсів, де OS є судном, що повинно поступитися дорогою",
    description:
      "Добра видимість, слабка течія. OS — give-way; TS — stand-on. TS діє прогнозовано, зберігає курс і швидкість.",
    encounterType: EncounterType.CROSSING,
    colregsRole: ColregsRole.GIVE_WAY,
    environment: { windKn: 8, currentKn: 0.4, seaState: 1.5, visibilityRisk: 0.08 },
    initialTargets: [{ xNm: -2.5, yNm: 5.5, speedKn: 10, courseDeg: 180 }],
    cpa: { dcpaNm: 0.26, tcpaMin: 13 },
    risk: { u: 0.18, rGeom: 0.58, rEnv: 0.2, rTotal: 0.54, riskLevel: "Середній" },
  },
  {
    number: 4,
    vesselCount: 2,
    name: "Сценарій 4 — перетин курсів за умов сильного вітру та течії",
    description:
      "Вітер 22–28 kn, течія 1.5–2.0 kn, хвилювання 3–4 бали. OS — give-way; TS — stand-on. Поведінка загалом прогнозована, але маневр ускладнений зовнішніми збуреннями.",
    encounterType: EncounterType.CROSSING,
    colregsRole: ColregsRole.GIVE_WAY,
    environment: { windKn: 25, currentKn: 1.75, seaState: 3.5, visibilityRisk: 0.25 },
    initialTargets: [{ xNm: 2.8, yNm: 4.5, speedKn: 10, courseDeg: 200 }],
    cpa: { dcpaNm: 0.24, tcpaMin: 12 },
    risk: { u: 0.38, rGeom: 0.61, rEnv: 0.62, rTotal: 0.72, riskLevel: "Високий" },
  },
  {
    number: 5,
    vesselCount: 2,
    name: "Сценарій 5 — перетин курсів, де OS є stand-on vessel",
    description:
      "Помірні умови, добра видимість. OS — stand-on; TS — give-way. Порушення очікуваної COLREGs-логіки; відсутній своєчасний маневр TS.",
    encounterType: EncounterType.CROSSING,
    colregsRole: ColregsRole.STAND_ON,
    environment: { windKn: 12, currentKn: 0.5, seaState: 2, visibilityRisk: 0.1 },
    initialTargets: [{ xNm: -2.8, yNm: 4.5, speedKn: 10, courseDeg: 160 }],
    cpa: { dcpaNm: 0.25, tcpaMin: 12 },
    risk: { u: 0.22, rGeom: 0.6, rEnv: 0.24, rTotal: 0.8, riskLevel: "Високий" },
  },
  {
    number: 6,
    vesselCount: 2,
    name: "Сценарій 6 — обгін за спокійних умов",
    description:
      "Спокійне море, добра видимість. Обгоняюче / обганюване судно. Кооперативна поведінка, стабільна швидкість, прогнозований маневр.",
    encounterType: EncounterType.OVERTAKING,
    colregsRole: ColregsRole.MUTUAL,
    environment: { windKn: 5, currentKn: 0.2, seaState: 1, visibilityRisk: 0.05 },
    initialTargets: [{ xNm: 3.5, yNm: 8, speedKn: 7, courseDeg: 180 }],
    cpa: { dcpaNm: 0.4, tcpaMin: 22 },
    risk: { u: 0.1, rGeom: 0.32, rEnv: 0.1, rTotal: 0.23, riskLevel: "Низький" },
  },
  {
    number: 7,
    vesselCount: 2,
    name: "Сценарій 7 — обгін із раптовим зменшенням швидкості TS",
    description:
      "Спокійне море, добра видимість. Обгоняюче / обганюване судно. Несподіване зменшення швидкості цільовим судном.",
    encounterType: EncounterType.OVERTAKING,
    colregsRole: ColregsRole.MUTUAL,
    environment: { windKn: 5, currentKn: 0.2, seaState: 1, visibilityRisk: 0.05 },
    initialTargets: [{ xNm: -1.5, yNm: 4, speedKn: 11, courseDeg: 180 }],
    cpa: { dcpaNm: 0.2, tcpaMin: 10 },
    risk: { u: 0.18, rGeom: 0.71, rEnv: 0.12, rTotal: 0.64, riskLevel: "Високий" },
  },
  {
    number: 8,
    vesselCount: 3,
    name: "Сценарій 8 — багатосуднова ситуація з трьома суднами в обмеженій акваторії",
    description:
      "Обмежена акваторія, помірний вітер, інтенсивний локальний трафік. OS одночасно взаємодіє з двома TS; ролі для пар різні. Одне судно діє прогнозовано, друге реагує із запізненням.",
    encounterType: EncounterType.MULTI_SHIP,
    colregsRole: ColregsRole.MIXED,
    environment: { windKn: 20, currentKn: 1.2, seaState: 3, visibilityRisk: 0.2 },
    initialTargets: [
      { xNm: 2, yNm: 5, speedKn: 10, courseDeg: 180 },
      { xNm: 3, yNm: 6, speedKn: 9, courseDeg: 210 },
    ],
    cpa: { dcpaNm: 0.19, tcpaMin: 8 },
    risk: { u: 0.4, rGeom: 0.74, rEnv: 0.44, rTotal: 0.76, riskLevel: "Високий" },
  },
  {
    number: 9,
    vesselCount: 4,
    name: "Сценарій 9 — багатосуднова ситуація з чотирма суднами та різними COLREGs-ролями",
    description:
      "Обмежений простір для маневру, помірне хвилювання, неоднорідний трафік. Для різних пар одночасно виникають stand-on/give-way ролі. Частково інертна групова реакція; простір для маневру звужений.",
    encounterType: EncounterType.MULTI_SHIP,
    colregsRole: ColregsRole.MIXED,
    environment: { windKn: 18, currentKn: 1, seaState: 3, visibilityRisk: 0.25 },
    initialTargets: [
      { xNm: -2.5, yNm: 5.5, speedKn: 10, courseDeg: 180 },
      { xNm: 3, yNm: 6, speedKn: 9, courseDeg: 210 },
      { xNm: -3, yNm: 6, speedKn: 9, courseDeg: 150 },
    ],
    cpa: { dcpaNm: 0.16, tcpaMin: 7 },
    risk: { u: 0.46, rGeom: 0.8, rEnv: 0.48, rTotal: 0.83, riskLevel: "Критичний" },
  },
  {
    number: 10,
    vesselCount: 3,
    name: "Сценарій 10 — торговельне судно та риболовне судно",
    description:
      "Прибережний район, локальне хвилювання, активна риболовна обстановка. Роль залежить від фактичного статусу риболовного судна та геометрії зближення. Нерегулярна траєкторія або змінний режим швидкості риболовного судна.",
    encounterType: EncounterType.CROSSING,
    colregsRole: ColregsRole.MIXED,
    environment: { windKn: 16, currentKn: 0.8, seaState: 2.5, visibilityRisk: 0.2 },
    initialTargets: [
      { xNm: 2.8, yNm: 4.5, speedKn: 10, courseDeg: 200 },
      { xNm: -4, yNm: 7, speedKn: 8, courseDeg: 135 },
    ],
    cpa: { dcpaNm: 0.22, tcpaMin: 10 },
    risk: { u: 0.52, rGeom: 0.64, rEnv: 0.36, rTotal: 0.75, riskLevel: "Високий" },
  },
  {
    number: 11,
    vesselCount: 3,
    name: "Сценарій 11 — перетин курсів із неповними або зашумленими AIS-даними",
    description:
      "Помірні погодні умови, але деградована якість AIS-даних. Роль визначається з нижчою достовірністю через неповноту даних. Поведінка частково спостережувана; прогноз руху нестійкий.",
    encounterType: EncounterType.CROSSING,
    colregsRole: ColregsRole.MIXED,
    environment: { windKn: 12, currentKn: 0.5, seaState: 2, visibilityRisk: 0.1 },
    initialTargets: [
      { xNm: -2.8, yNm: 4.5, speedKn: 10, courseDeg: 160 },
      { xNm: 4, yNm: 7, speedKn: 8, courseDeg: 225 },
    ],
    cpa: { dcpaNm: 0.26, tcpaMin: 13 },
    risk: { u: 0.72, rGeom: 0.58, rEnv: 0.2, rTotal: 0.68, riskLevel: "Високий" },
  },
  {
    number: 12,
    vesselCount: 4,
    name: "Сценарій 12 — багатосуднова ситуація за поганої видимості",
    description:
      "Видимість < 1 nm, хвилювання 3 бали, обмежений простір для маневру. Кілька одночасних взаємодій; часовий запас для реакції скорочується. Переважно обережна, але неоднорідна за темпом реакції група суден.",
    encounterType: EncounterType.MULTI_SHIP,
    colregsRole: ColregsRole.MIXED,
    environment: { windKn: 18, currentKn: 1.1, seaState: 3, visibilityRisk: 0.75 },
    initialTargets: [
      { xNm: 2, yNm: 5, speedKn: 10, courseDeg: 180 },
      { xNm: 4, yNm: 7, speedKn: 8, courseDeg: 225 },
      { xNm: -4, yNm: 7, speedKn: 8, courseDeg: 135 },
    ],
    cpa: { dcpaNm: 0.18, tcpaMin: 8 },
    risk: { u: 0.65, rGeom: 0.75, rEnv: 0.71, rTotal: 0.86, riskLevel: "Критичний" },
  },
  {
    number: 13,
    vesselCount: 5,
    name: "Сценарій 13 — сильний вітер, течія та непередбачувана поведінка одного із суден",
    description:
      "Вітер 25–30 kn, течія 1.5–2.0 kn, хвилювання 4–5 балів, знижена видимість. Для кількох пар виникають конфліктуючі ролі; окремі взаємодії потребують термінової give-way дії. Одне судно діє непередбачувано/ризиково, інші маневрують з обмеженнями.",
    encounterType: EncounterType.MULTI_SHIP,
    colregsRole: ColregsRole.MIXED,
    environment: { windKn: 28, currentKn: 1.75, seaState: 4.5, visibilityRisk: 0.55 },
    initialTargets: [
      { xNm: 3.5, yNm: 8, speedKn: 7, courseDeg: 180 },
      { xNm: -3.5, yNm: 8, speedKn: 7, courseDeg: 180 },
      { xNm: 4, yNm: 7, speedKn: 8, courseDeg: 225 },
      { xNm: -4, yNm: 7, speedKn: 8, courseDeg: 135 },
    ],
    cpa: { dcpaNm: 0.15, tcpaMin: 6 },
    risk: { u: 0.68, rGeom: 0.84, rEnv: 0.83, rTotal: 0.92, riskLevel: "Критичний" },
  },
];

function createTargetShips(row) {
  return Array.from({ length: row.vesselCount - 1 }, (_, index) => {
    const targetNumber = index + 1;
    const target = row.initialTargets[index];

    return new VesselState({
      name: `TS-${targetNumber}`,
      ...target,
    });
  });
}

function createScenarioFromTable(row) {
  return new Scenario({
    number: row.number,
    name: row.name,
    ownShip: new VesselState(BASE_OWN_SHIP),
    targetShips: createTargetShips(row),
    environment: new Environment(row.environment),
    encounterType: row.encounterType,
    colregsRole: row.colregsRole,
    description: row.description,
    cpa: row.cpa,
    risk: row.risk,
    maneuverMarker: row.maneuverMarker,
  });
}

export function createAllScenarios() {
  return scenarioTable.map(createScenarioFromTable);
}

export function createScenario(number) {
  const row = scenarioTable.find((scenario) => scenario.number === number);

  if (!row) {
    throw new Error(`Unknown scenario number: ${number}`);
  }

  return createScenarioFromTable(row);
}

export function createScenario4() {
  return createScenario(4);
}
