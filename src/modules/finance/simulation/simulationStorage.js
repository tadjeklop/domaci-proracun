const SCENARIOS_KEY = "dp_sim_scenarios";
const SETTINGS_KEY = "dp_sim_settings";
const VERSION_KEY = "dp_sim_version";

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local-only app: storage failure should not block the simulation screen.
  }
};

export const loadSimulationScenarios = () => read(SCENARIOS_KEY, []);
export const saveSimulationScenarios = scenarios => {
  write(SCENARIOS_KEY, scenarios);
  write(VERSION_KEY, 2);
};

export const loadSimulationSettings = () => read(SETTINGS_KEY, {
  months: 12,
  netWorthYears: 5,
  emergencyTargetMonths: 3,
});

export const saveSimulationSettings = settings => write(SETTINGS_KEY, settings);
