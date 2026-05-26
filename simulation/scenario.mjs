export class Scenario {
  constructor({
    name,
    ownShip,
    targetShips,
    environment,
    encounterType,
    colregsRole,
    description,
  }) {
    this.name = name;
    this.ownShip = ownShip;
    this.targetShips = targetShips;
    this.environment = environment;
    this.encounterType = encounterType;
    this.colregsRole = colregsRole;
    this.description = description;
  }
}
