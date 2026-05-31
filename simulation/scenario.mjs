export class Scenario {
  constructor({
    number,
    name,
    ownShip,
    targetShips,
    environment,
    encounterType,
    colregsRole,
    description,
    cpa,
    risk,
  }) {
    this.number = number;
    this.name = name;
    this.ownShip = ownShip;
    this.targetShips = targetShips;
    this.environment = environment;
    this.encounterType = encounterType;
    this.colregsRole = colregsRole;
    this.description = description;
    this.cpa = cpa;
    this.risk = risk;
  }
}
