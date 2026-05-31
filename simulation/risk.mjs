import { clamp, round } from "./utils.mjs";
import {
  EncounterType,
  ColregsRole,
  DEFAULT_OWN_SHIP_LENGTH_NM,
  TCPA_NORMALIZATION_EPSILON_MIN,
} from "./constants.mjs";

export function dimensionlessCpa({
  dcpaNm,
  tcpaMin,
  ownShipLengthNm = DEFAULT_OWN_SHIP_LENGTH_NM,
  ownSpeedNmPerMin,
  epsilonMin = TCPA_NORMALIZATION_EPSILON_MIN,
}) {
  const safeLengthNm = ownShipLengthNm || DEFAULT_OWN_SHIP_LENGTH_NM;
  const safeOwnSpeedNmPerMin = ownSpeedNmPerMin || 0;
  const timeScaleMin =
    safeOwnSpeedNmPerMin > 0
      ? safeLengthNm / safeOwnSpeedNmPerMin + epsilonMin
      : Number.POSITIVE_INFINITY;

  return {
    dStar: round(dcpaNm / safeLengthNm, 3),
    tStar: Number.isFinite(tcpaMin / timeScaleMin)
      ? round(tcpaMin / timeScaleMin, 3)
      : Number.POSITIVE_INFINITY,
    ownShipLengthNm: safeLengthNm,
    ownSpeedNmPerMin: round(safeOwnSpeedNmPerMin, 3),
    timeScaleMin: Number.isFinite(timeScaleMin)
      ? round(timeScaleMin, 3)
      : Number.POSITIVE_INFINITY,
  };
}

export function calculateCpa(ownShip, targetShip) {
  const ownPosition = ownShip.positionVector();
  const targetPosition = targetShip.positionVector();

  const ownVelocity = ownShip.velocityNmPerMin();
  const targetVelocity = targetShip.velocityNmPerMin();
  const ownSpeedNmPerMin = Math.hypot(ownVelocity.x, ownVelocity.y);

  const relativePosition = {
    x: targetPosition.x - ownPosition.x,
    y: targetPosition.y - ownPosition.y,
  };

  const relativeVelocity = {
    x: targetVelocity.x - ownVelocity.x,
    y: targetVelocity.y - ownVelocity.y,
  };

  const velocityNormSq =
    relativeVelocity.x ** 2 + relativeVelocity.y ** 2;

  if (velocityNormSq === 0) {
    const distance = Math.hypot(relativePosition.x, relativePosition.y);
    const cpa = {
      dcpaNm: round(distance, 3),
      tcpaMin: Number.POSITIVE_INFINITY,
    };

    return {
      ...cpa,
      ...dimensionlessCpa({
        ...cpa,
        ownShipLengthNm: ownShip.lengthNm,
        ownSpeedNmPerMin,
      }),
    };
  }

  const dot =
    relativePosition.x * relativeVelocity.x +
    relativePosition.y * relativeVelocity.y;

  const tcpaMin = -dot / velocityNormSq;

  let dcpaNm;

  if (tcpaMin < 0) {
    dcpaNm = Math.hypot(relativePosition.x, relativePosition.y);
  } else {
    const closestVector = {
      x: relativePosition.x + relativeVelocity.x * tcpaMin,
      y: relativePosition.y + relativeVelocity.y * tcpaMin,
    };

    dcpaNm = Math.hypot(closestVector.x, closestVector.y);
  }

  const cpa = {
    dcpaNm: round(dcpaNm, 3),
    tcpaMin: round(tcpaMin, 2),
  };

  return {
    ...cpa,
    ...dimensionlessCpa({
      ...cpa,
      ownShipLengthNm: ownShip.lengthNm,
      ownSpeedNmPerMin,
    }),
  };
}

export function encounterCoefficient(encounterType) {
  const values = {
    [EncounterType.HEAD_ON]: 0.8,
    [EncounterType.CROSSING]: 0.65,
    [EncounterType.OVERTAKING]: 0.45,
    [EncounterType.MULTI_SHIP]: 0.75,
  };

  return values[encounterType] ?? 0.5;
}

export function colregsCoefficient(role) {
  const values = {
    [ColregsRole.GIVE_WAY]: 0.65,
    [ColregsRole.STAND_ON]: 0.5,
    [ColregsRole.MUTUAL]: 0.6,
    [ColregsRole.MIXED]: 0.75,
  };

  return values[role] ?? 0.5;
}

export function geometricRisk({
  dcpaNm,
  tcpaMin,
  dStar,
  tStar,
  ownShipLengthNm = DEFAULT_OWN_SHIP_LENGTH_NM,
  ownSpeedNmPerMin,
  encounterType,
  dcpaRefNm = 0.6,
  tcpaRefMin = 30,
}) {
  if (tcpaMin < 0) {
    return 0;
  }

  const timeScaleMin =
    ownSpeedNmPerMin > 0
      ? ownShipLengthNm / ownSpeedNmPerMin + TCPA_NORMALIZATION_EPSILON_MIN
      : Number.POSITIVE_INFINITY;
  const dcpaRefStar = dcpaRefNm / ownShipLengthNm;
  const tcpaRefStar = tcpaRefMin / timeScaleMin;
  const effectiveDStar =
    dStar ??
    dimensionlessCpa({
      dcpaNm,
      tcpaMin,
      ownShipLengthNm,
      ownSpeedNmPerMin,
    }).dStar;
  const effectiveTStar =
    tStar ??
    dimensionlessCpa({
      dcpaNm,
      tcpaMin,
      ownShipLengthNm,
      ownSpeedNmPerMin,
    }).tStar;

  const rDcpa = clamp(1 - effectiveDStar / dcpaRefStar);
  const rTcpa = clamp(1 - effectiveTStar / tcpaRefStar);
  const rEncounter = encounterCoefficient(encounterType);

  const rGeom = 0.45 * rDcpa + 0.4 * rTcpa + 0.15 * rEncounter;

  return round(clamp(rGeom), 3);
}

export function totalRisk({ rGeom, rEnv, u, cColregs }) {
  /*
   * R_total = f(R_geom, R_env, U, C_COLREGs)
   *
   * Це спрощена числова апроксимація нечіткої агрегації.
   * У статті краще писати, що R_total є умовним виходом
   * нечіткого висновку, а не просто арифметичною сумою.
   */

  const rCore =
    0.45 * rGeom +
    0.3 * rEnv +
    0.15 * u +
    0.075 * cColregs;

  let interaction = 0;

  // IF R_geom is high AND R_env is high THEN R_total increases.
  if (rGeom >= 0.6 && rEnv >= 0.6) {
    interaction += 0.08;
  }

  // Якщо COLREGs-роль вимагає активного маневру,
  // а геометричний ризик уже підвищений.
  if (cColregs >= 0.65 && rGeom >= 0.55) {
    interaction += 0.05;
  }

  // Взаємодія середовища та невизначеності прогнозу.
  interaction += 0.1 * rEnv * u;

  const rTotal = rCore + interaction;

  return round(clamp(rTotal), 3);
}

export function riskLevel(rTotal) {
  if (rTotal <= 0.3) return "Низький";
  if (rTotal <= 0.6) return "Середній";
  if (rTotal <= 0.8) return "Високий";
  return "Критичний";
}
