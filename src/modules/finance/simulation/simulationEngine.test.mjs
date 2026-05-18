import test from "node:test";
import assert from "node:assert/strict";
import {
  compareScenarios,
  runSimulation,
} from "./simulationEngine.js";

const baseline = {
  startYear: 2026,
  startMonth: 4,
  months: 12,
  startingCash: 10000,
  startingNetWorth: 12000,
  monthlyIncome: 3600,
  fixedExpenses: 1600,
  variableExpenses: 900,
  goalContributions: 300,
  debtPayments: 200,
  emergencyTargetMonths: 3,
  annualInvestmentReturn: 0.05,
  annualInflation: 0.02,
};

test("one-off decision below safety buffer is tight and reports the first risk month", () => {
  const scenario = {
    id: "vacation",
    name: "Dopust",
    assumptions: [
      { id: "a1", type: "one_off_expense", amount: 5200, startMonth: 2, enabled: true },
    ],
  };

  const result = runSimulation(baseline, scenario);

  assert.equal(result.verdict.level, "tight");
  assert.equal(result.risks[0].kind, "below_buffer");
  assert.equal(result.risks[0].monthIndex, 2);
  assert.equal(result.summary.worstMonth.index, 2);
});

test("recurring cost creates monthly shortfall recommendation when cash goes negative", () => {
  const scenario = {
    id: "subscription",
    name: "Nova narocnina",
    assumptions: [
      { id: "a1", type: "recurring_expense", amount: 2200, startMonth: 0, enabled: true },
    ],
  };

  const result = runSimulation(baseline, scenario);

  assert.equal(result.verdict.level, "not_affordable");
  assert.ok(result.summary.monthlySurplus < 0);
  assert.match(result.recommendations[0].text, /znižaj stroške|povečaj prihodke/i);
});

test("annual investment return increases projected net worth", () => {
  const noReturn = runSimulation({ ...baseline, annualInvestmentReturn: 0 }, { assumptions: [] });
  const withReturn = runSimulation({ ...baseline, annualInvestmentReturn: 0.08 }, { assumptions: [] });

  assert.ok(withReturn.points.at(-1).netWorth > noReturn.points.at(-1).netWorth);
});

test("scenario comparison sorts selected scenarios by ending cash", () => {
  const strong = runSimulation(baseline, {
    id: "strong",
    name: "Močan scenarij",
    assumptions: [{ id: "a1", type: "income_change", amount: 300, startMonth: 0, enabled: true }],
  });
  const weak = runSimulation(baseline, {
    id: "weak",
    name: "Slab scenarij",
    assumptions: [{ id: "a2", type: "expense_change", amount: 400, startMonth: 0, enabled: true }],
  });

  const rows = compareScenarios([weak, strong]);

  assert.equal(rows[0].id, "strong");
  assert.equal(rows[1].id, "weak");
});
