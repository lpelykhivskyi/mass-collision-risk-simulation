# mass-collision-risk-simulation

Інструмент сценарного моделювання ризику зіткнення морських автономних надводних суден (МАСС) з використанням DCPA/TCPA, ролей COLREGs, екологічних факторів та нечіткої агрегації ризику.

---

## Зміст

- [Опис](#опис)
- [Архітектура проекту](#архітектура-проекту)
- [Математична модель](#математична-модель)
- [Рівні ризику](#рівні-ризику)
- [Сценарії](#сценарії)
- [Запуск](#запуск)
- [Результати](#результати)
- [English](#english)

---

## Опис

Симулятор оцінює ризик зіткнення між власним судном (OS) та одним або кількома цільовими суднами (TS) у дискретних часових кроках. На кожному кроці обчислюються геометричний ризик (DCPA/TCPA), екологічний ризик, індекс невизначеності та поправочний коефіцієнт COLREGs. Ці складові агрегуються у загальний нормований ризик R_total ∈ [0, 1].

---

## Архітектура проекту

```
main.mjs                    — точка входу, запускає сценарії, зберігає CSV та SVG
simulation/
  vessel.mjs                — клас VesselState: позиція, курс, швидкість, рух
  environment.mjs           — клас Environment: вітер, течія, хвилі, видимість, AIS
  risk.mjs                  — розрахунок DCPA/TCPA, R_geom, R_total, рівень ризику
  simulate.mjs              — покроке моделювання, агрегація по парах суден
  scenario.mjs              — клас Scenario: контейнер сценарію
  scenarios.mjs             — визначення конкретних сценаріїв
  constants.mjs             — enum EncounterType та ColregsRole
  output.mjs                — збереження CSV, генерація SVG-графіків, консольний вивід
  utils.mjs                 — допоміжні функції: clamp, round, degToRad
simulation_results/         — вихідні CSV та SVG (генеруються при запуску)
```

---

## Математична модель

### 1. DCPA / TCPA

Відстань найближчого зближення (DCPA) та час до найближчого зближення (TCPA) розраховуються через вектори відносного положення та відносної швидкості суден.

### 2. Геометричний ризик

```
R_geom = 0.45 · r_DCPA + 0.40 · r_TCPA + 0.15 · C_encounter
```

де:
- `r_DCPA = clamp(1 − DCPA / DCPA_ref)`,  `DCPA_ref = 0.6 NM`
- `r_TCPA = clamp(1 − TCPA / TCPA_ref)`,  `TCPA_ref = 30 хв`
- `C_encounter` — коефіцієнт типу зустрічі: head-on=0.80, multi-ship=0.75, crossing=0.65, overtaking=0.45

### 3. Екологічний ризик

```
R_env = 0.35 · r_wind + 0.30 · r_current + 0.25 · r_wave + 0.10 · r_visibility
```

### 4. Індекс невизначеності

```
U = 0.40 · u_AIS + 0.35 · u_env + 0.25 · u_prediction
```

де складові залежать від якості AIS та R_env.

### 5. Коефіцієнт COLREGs

| Роль       | C_COLREGs |
|------------|-----------|
| give-way   | 0.65      |
| stand-on   | 0.50      |
| mutual     | 0.60      |
| mixed      | 0.75      |

### 6. Загальний ризик

```
R_total = 0.45 · R_geom + 0.30 · R_env + 0.15 · U + 0.075 · C_COLREGs + Δ_interaction
```

Члени взаємодії `Δ_interaction`:
- `+0.08` якщо R_geom ≥ 0.6 та R_env ≥ 0.6
- `+0.05` якщо C_COLREGs ≥ 0.65 та R_geom ≥ 0.55
- `+0.10 · R_env · U` завжди

---

## Рівні ризику

| R_total    | Рівень   |
|------------|----------|
| ≤ 0.30     | Низький  |
| ≤ 0.60     | Середній |
| ≤ 0.80     | Високий  |
| > 0.80     | Критичний|

---

## Сценарії

### Сценарій 1 — Перетин курсів за умов сильного вітру та течії

- **OS**: 0 NM, курс 0°, швидкість 12 вуз.
- **TS-1**: (2.79, 1.76) NM, курс 270°, 12 вуз.
- **Зустріч**: crossing, OS = give-way
- **Середовище**: вітер 25 вуз., течія 1.75 вуз., хвиля 3.5

### Сценарій 2 — Багатосудновий демо-сценарій

- **OS**: 0 NM, курс 0°, швидкість 12 вуз.
- **TS-1**: (2.79, 1.76) NM, курс 270°, 12 вуз.
- **TS-2**: (−1.50, 2.20) NM, курс 135°, 10 вуз.
- **TS-3**: (0.80, −2.50) NM, курс 10°, 9 вуз.
- **Зустріч**: multi-ship, ролі = mixed
- **Середовище**: вітер 22 вуз., течія 1.5 вуз., хвиля 3.0

В багатосудновому режимі на кожному кроці обирається пара з максимальним R_total.

---

## Запуск

```bash
node main.mjs
```

Потрібен Node.js ≥ 18 (ESM, вбудовані модулі `node:fs`, `node:path`).

---

## Результати

Після запуску у папці `simulation_results/` з'являються:

| Файл                          | Вміст                                      |
|-------------------------------|--------------------------------------------|
| `scenario_1_results.csv`      | Дані сценарію 1 по кроках                  |
| `scenario_2_results.csv`      | Дані сценарію 2 по кроках                  |
| `combined_results.csv`        | Об'єднані дані обох сценаріїв              |
| `scenario_1_risk_plot.svg`    | SVG-графік R_total, R_geom, R_env (сц. 1) |
| `scenario_2_risk_plot.svg`    | SVG-графік R_total, R_geom, R_env (сц. 2) |

Колонки CSV: `time_min`, `scenario`, `own_ship`, `target_ship`, `encounter_type`, `colregs_role`, `dcpa_nm`, `tcpa_min`, `r_geom`, `r_env`, `u`, `c_colregs`, `r_total`, `risk_level`, `aggregation`.

---

---

# English

Scenario-based simulation tool for collision risk assessment of Maritime Autonomous Surface Ships (MASS) using DCPA/TCPA, COLREGs roles, environmental factors, and fuzzy-oriented risk aggregation.

---

## Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Mathematical Model](#mathematical-model)
- [Risk Levels](#risk-levels)
- [Scenarios](#scenarios-1)
- [Usage](#usage)
- [Output](#output)

---

## Overview

The simulator evaluates collision risk between an own ship (OS) and one or more target ships (TS) at discrete time steps. At each step it computes geometric risk (DCPA/TCPA), environmental risk, an uncertainty index, and a COLREGs correction coefficient. These components are aggregated into a normalised total risk R_total ∈ [0, 1].

---

## Project Structure

```
main.mjs                    — entry point: runs scenarios, writes CSV and SVG
simulation/
  vessel.mjs                — VesselState class: position, course, speed, movement
  environment.mjs           — Environment class: wind, current, waves, visibility, AIS
  risk.mjs                  — DCPA/TCPA, R_geom, R_total, risk level
  simulate.mjs              — time-step loop, max-pair aggregation for multi-ship
  scenario.mjs              — Scenario container class
  scenarios.mjs             — concrete scenario definitions
  constants.mjs             — EncounterType and ColregsRole enums
  output.mjs                — CSV export, SVG plot generation, console preview
  utils.mjs                 — helpers: clamp, round, degToRad
simulation_results/         — generated CSV and SVG files
```

---

## Mathematical Model

### 1. DCPA / TCPA

Distance at Closest Point of Approach (DCPA) and Time to CPA (TCPA) are derived from relative position and relative velocity vectors.

### 2. Geometric Risk

```
R_geom = 0.45 · r_DCPA + 0.40 · r_TCPA + 0.15 · C_encounter
```

where:
- `r_DCPA = clamp(1 − DCPA / DCPA_ref)`,  `DCPA_ref = 0.6 NM`
- `r_TCPA = clamp(1 − TCPA / TCPA_ref)`,  `TCPA_ref = 30 min`
- `C_encounter` — encounter-type coefficient: head-on=0.80, multi-ship=0.75, crossing=0.65, overtaking=0.45

### 3. Environmental Risk

```
R_env = 0.35 · r_wind + 0.30 · r_current + 0.25 · r_wave + 0.10 · r_visibility
```

### 4. Uncertainty Index

```
U = 0.40 · u_AIS + 0.35 · u_env + 0.25 · u_prediction
```

Components depend on AIS data quality and R_env.

### 5. COLREGs Coefficient

| Role      | C_COLREGs |
|-----------|-----------|
| give-way  | 0.65      |
| stand-on  | 0.50      |
| mutual    | 0.60      |
| mixed     | 0.75      |

### 6. Total Risk

```
R_total = 0.45 · R_geom + 0.30 · R_env + 0.15 · U + 0.075 · C_COLREGs + Δ_interaction
```

Interaction terms `Δ_interaction`:
- `+0.08` if R_geom ≥ 0.6 and R_env ≥ 0.6
- `+0.05` if C_COLREGs ≥ 0.65 and R_geom ≥ 0.55
- `+0.10 · R_env · U` always

---

## Risk Levels

| R_total    | Level    |
|------------|----------|
| ≤ 0.30     | Low      |
| ≤ 0.60     | Medium   |
| ≤ 0.80     | High     |
| > 0.80     | Critical |

---

## Scenarios

### Scenario 1 — Crossing encounter under strong wind and current

- **OS**: origin, course 0°, speed 12 kn
- **TS-1**: (2.79, 1.76) NM, course 270°, 12 kn
- **Encounter**: crossing, OS = give-way
- **Environment**: wind 25 kn, current 1.75 kn, sea state 3.5

### Scenario 2 — Multi-ship demo

- **OS**: origin, course 0°, speed 12 kn
- **TS-1**: (2.79, 1.76) NM, course 270°, 12 kn
- **TS-2**: (−1.50, 2.20) NM, course 135°, 10 kn
- **TS-3**: (0.80, −2.50) NM, course 10°, 9 kn
- **Encounter**: multi-ship, roles = mixed
- **Environment**: wind 22 kn, current 1.5 kn, sea state 3.0

In multi-ship mode the pair with the highest R_total is selected at each time step.

---

## Usage

```bash
node main.mjs
```

Requires Node.js ≥ 18 (ESM, built-in `node:fs` / `node:path`).

---

## Output

Files written to `simulation_results/`:

| File                          | Contents                                    |
|-------------------------------|---------------------------------------------|
| `scenario_1_results.csv`      | Per-step data for scenario 1                |
| `scenario_2_results.csv`      | Per-step data for scenario 2                |
| `combined_results.csv`        | Both scenarios merged                       |
| `scenario_1_risk_plot.svg`    | R_total, R_geom, R_env over time (sc. 1)   |
| `scenario_2_risk_plot.svg`    | R_total, R_geom, R_env over time (sc. 2)   |

CSV columns: `time_min`, `scenario`, `own_ship`, `target_ship`, `encounter_type`, `colregs_role`, `dcpa_nm`, `tcpa_min`, `r_geom`, `r_env`, `u`, `c_colregs`, `r_total`, `risk_level`, `aggregation`.
