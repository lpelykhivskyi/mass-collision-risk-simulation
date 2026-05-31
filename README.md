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

Для зменшення залежності від масштабу судна додатково обчислюються безрозмірні показники:

```
D* = DCPA / L_o
T* = TCPA / (L_o / ||v_0|| + ε)
```

де `L_o = 100 м ≈ 0.054 NM` — прийнята довжина власного судна, `||v_0||` — швидкість OS у NM/хв, `ε = 0.001 хв` — малий доданок для уникнення ділення на нуль.

### 2. Геометричний ризик

```
R_geom = 0.45 · r_DCPA + 0.40 · r_TCPA + 0.15 · C_encounter
```

де:
- `r_DCPA = clamp(1 − D* / D*_ref)`, де `D*_ref = DCPA_ref / L_o`
- `r_TCPA = clamp(1 − T* / T*_ref)`, де `T*_ref = TCPA_ref / (L_o / ||v_0|| + ε)`
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

У коді реалізовано 13 умовних сценаріїв з таблиці моделювання. Значення DCPA, TCPA та fuzzy-based показники ризику з таблиці інтерпретуються як фінальний/цільовий стан сценарію. На проміжних часових кроках програма будує перехід від геометрично розрахованого стану до табличного значення наприкінці моделювання.

Початкові координати, швидкості та курси цільових суден підібрані окремо для кожного сценарію так, щоб сценарій починався з низького або середнього рівня ризику, а наприкінці досягав табличного рівня ризику. Це дозволяє інтерпретувати графіки як розвиток навігаційної ситуації від відносно безпечного початкового стану до характерного фінального стану сценарію.

Для багатосуднових сценаріїв фінальні табличні DCPA/TCPA інтерпретуються як значення для найбільш небезпечної пари суден.

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
| `scenario_2_results.csv` ... `scenario_13_results.csv` | Дані сценаріїв 2–13 по кроках |
| `combined_results.csv`        | Об'єднані дані всіх сценаріїв              |
| `scenario_1_risk_plot.svg`    | SVG-графік R_total, R_geom, R_env (сц. 1) |
| `scenario_2_risk_plot.svg` ... `scenario_13_risk_plot.svg` | SVG-графіки R_total, R_geom, R_env |
| `representative_scenarios_comparison.svg` | Порівняльний SVG-графік R_total для сценаріїв 1, 4, 6, 8, 13 |

Колонки CSV: `time_min`, `scenario`, `own_ship`, `target_ship`, `encounter_type`, `colregs_role`, `dcpa_nm`, `tcpa_min`, `d_star`, `t_star`, `own_ship_length_nm`, `r_geom`, `r_env`, `u`, `c_colregs`, `r_total`, `risk_level`, `aggregation`.

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

To reduce dependence on vessel scale, dimensionless indicators are also computed:

```
D* = DCPA / L_o
T* = TCPA / (L_o / ||v_0|| + ε)
```

where `L_o = 100 m ≈ 0.054 NM` is the assumed own-ship length, `||v_0||` is OS speed in NM/min, and `ε = 0.001 min` is a small term used to avoid division by zero.

### 2. Geometric Risk

```
R_geom = 0.45 · r_DCPA + 0.40 · r_TCPA + 0.15 · C_encounter
```

where:
- `r_DCPA = clamp(1 − D* / D*_ref)`, where `D*_ref = DCPA_ref / L_o`
- `r_TCPA = clamp(1 − T* / T*_ref)`, where `T*_ref = TCPA_ref / (L_o / ||v_0|| + ε)`
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

The code implements 13 conditional scenarios from the modelling table. DCPA, TCPA, and fuzzy-based risk values from the table are interpreted as the final/target state of each scenario. At intermediate time steps, the program builds a transition from the geometrically computed state toward the table value at the end of the simulation.

Initial target-ship coordinates, speeds, and courses are selected separately for each scenario so that the simulation starts at a low or medium risk level and reaches the table risk level at the end. This makes the plots interpretable as the evolution of a navigation situation from a relatively safe initial state toward the characteristic final state of the scenario.

For multi-ship scenarios, the final table DCPA/TCPA values are interpreted as the values of the most dangerous vessel pair.

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
| `scenario_2_results.csv` ... `scenario_13_results.csv` | Per-step data for scenarios 2–13 |
| `combined_results.csv`        | All scenarios merged                        |
| `scenario_1_risk_plot.svg`    | R_total, R_geom, R_env over time (sc. 1)   |
| `scenario_2_risk_plot.svg` ... `scenario_13_risk_plot.svg` | R_total, R_geom, R_env over time |
| `representative_scenarios_comparison.svg` | Comparative R_total SVG plot for scenarios 1, 4, 6, 8, 13 |

CSV columns: `time_min`, `scenario`, `own_ship`, `target_ship`, `encounter_type`, `colregs_role`, `dcpa_nm`, `tcpa_min`, `d_star`, `t_star`, `own_ship_length_nm`, `r_geom`, `r_env`, `u`, `c_colregs`, `r_total`, `risk_level`, `aggregation`.
