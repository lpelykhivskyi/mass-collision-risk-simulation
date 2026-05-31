export const EncounterType = {
  HEAD_ON: "head-on",
  CROSSING: "crossing",
  OVERTAKING: "overtaking",
  MULTI_SHIP: "multi-ship",
};

export const ColregsRole = {
  GIVE_WAY: "give-way",
  STAND_ON: "stand-on",
  MUTUAL: "mutual",
  MIXED: "mixed",
};

export const DEFAULT_OWN_SHIP_LENGTH_M = 100;
export const METERS_PER_NAUTICAL_MILE = 1852;
export const DEFAULT_OWN_SHIP_LENGTH_NM =
  DEFAULT_OWN_SHIP_LENGTH_M / METERS_PER_NAUTICAL_MILE;
export const TCPA_NORMALIZATION_EPSILON_MIN = 0.001;
