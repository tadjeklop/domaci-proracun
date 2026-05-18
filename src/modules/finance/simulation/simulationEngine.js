const toNumber = value => Number.isFinite(+value) ? +value : 0;
const round = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
const sum = items => (items || []).reduce((total, value) => total + toNumber(value), 0);

export const monthKey = (year, monthIndex) => {
  const date = new Date(year, monthIndex, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const addMonths = (year, monthIndex, offset) => {
  const date = new Date(year, monthIndex + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth(), key: monthKey(date.getFullYear(), date.getMonth()) };
};

const getMonth = (data, year, month) => data?.[year]?.[month] || {};

const categoryTotal = (monthData, categories, predicate, field = "actual") => {
  return sum((categories || []).filter(predicate).map(cat => {
    if (cat.subs) return sum(cat.subs.map(sub => toNumber(monthData?.[sub.id]?.[field])));
    return toNumber(monthData?.[cat.id]?.[field]);
  }));
};

const averageClosedValue = (data, categories, predicate, year, month, field = "actual") => {
  const values = [];
  for (let i = 1; i <= 12; i += 1) {
    const d = new Date(year, month - i, 1);
    const md = getMonth(data, d.getFullYear(), d.getMonth());
    if (md.closed) values.push(categoryTotal(md, categories, predicate, field));
  }
  return values.length ? sum(values) / values.length : 0;
};

const incomeTotal = monthData => sum(Object.values(monthData?.inc || {}).flatMap(person => Object.values(person || {})));

const averageClosedIncome = (data, year, month) => {
  const values = [];
  for (let i = 1; i <= 12; i += 1) {
    const d = new Date(year, month - i, 1);
    const md = getMonth(data, d.getFullYear(), d.getMonth());
    if (md.closed) values.push(incomeTotal(md));
  }
  return values.length ? sum(values) / values.length : 0;
};

const currentSavings = savingsData => {
  if (!savingsData) return 0;
  return sum(Object.values(savingsData).map(value => {
    if (typeof value === "number") return value;
    if (value && typeof value === "object") return value.current ?? value.balance ?? value.amount ?? 0;
    return 0;
  }));
};

export function buildBaselineFromFinanceData({
  data,
  year,
  month,
  categories = [],
  savingsData,
  netWorthAssets = {},
  netWorthLiabilities = {},
  debts = [],
  subscriptions = [],
  settings = {},
} = {}) {
  const md = getMonth(data, year, month);
  const fixed = cat => cat.tp === "fixed";
  const variable = cat => cat.tp === "var";
  const saving = cat => cat.tp === "saving" || cat.tp === "savings" || cat.tp === "savings_inv";
  const currentIncome = incomeTotal(md);
  const monthlyIncome = currentIncome || averageClosedIncome(data, year, month);
  const fixedExpenses = categoryTotal(md, categories, fixed, "plan") || averageClosedValue(data, categories, fixed, year, month);
  const variableExpenses = averageClosedValue(data, categories, variable, year, month) || categoryTotal(md, categories, variable, "plan");
  const goalContributions = categoryTotal(md, categories, saving, "plan");
  const subscriptionTotal = sum((subscriptions || []).map(s => s.amount ?? s.price));
  const debtPayments = sum((debts || []).map(d => d.payment ?? d.minPayment ?? d.monthly ?? 0));
  const debtBalances = sum((debts || []).map(d => d.balance ?? d.amount ?? 0));
  const assets = sum(Object.values(netWorthAssets || {}));
  const liabilities = sum(Object.values(netWorthLiabilities || {})) + debtBalances;
  const savedCash = currentSavings(savingsData);
  const startingCash = savedCash || Math.max(0, currentIncome - fixedExpenses - variableExpenses);

  return {
    startYear: year,
    startMonth: month,
    months: settings.months || 12,
    startingCash,
    startingNetWorth: assets + savedCash - liabilities,
    monthlyIncome,
    fixedExpenses,
    variableExpenses,
    goalContributions,
    subscriptions: subscriptionTotal,
    debtPayments,
    emergencyTargetMonths: settings.emergencyTargetMonths || 3,
    annualInvestmentReturn: settings.annualInvestmentReturn ?? 0.04,
    annualInflation: settings.annualInflation ?? 0.02,
  };
}

const activeInMonth = (assumption, monthIndex) => {
  if (assumption.enabled === false) return false;
  const start = toNumber(assumption.startMonth);
  const end = assumption.endMonth === "" || assumption.endMonth == null ? Infinity : toNumber(assumption.endMonth);
  return monthIndex >= start && monthIndex <= end;
};

const applyAssumptions = (base, assumptions, monthIndex) => {
  const state = { ...base, oneOff: 0, riskNotes: [] };
  (assumptions || []).forEach(assumption => {
    if (!activeInMonth(assumption, monthIndex)) return;
    const amount = toNumber(assumption.amount);
    const percent = toNumber(assumption.percent) / 100;
    if (assumption.type === "one_off_expense" && monthIndex === toNumber(assumption.startMonth)) state.oneOff += amount;
    if (assumption.type === "recurring_expense") state.variableExpenses += amount;
    if (assumption.type === "income_change") state.monthlyIncome += amount || state.monthlyIncome * percent;
    if (assumption.type === "expense_change") state.variableExpenses += amount || state.variableExpenses * percent;
    if (assumption.type === "expense_percent") state.variableExpenses += state.variableExpenses * percent;
    if (assumption.type === "savings_change") state.goalContributions += amount;
    if (assumption.type === "debt_payment_change") state.debtPayments += amount;
    if (assumption.type === "investment_return") state.annualInvestmentReturn = percent || amount / 100;
    if (assumption.type === "inflation") state.annualInflation = percent || amount / 100;
  });
  return state;
};

const verdictFor = ({ lowestCash, buffer, monthlySurplus, firstRiskMonth }) => {
  if (lowestCash < 0) {
    return { level: "not_affordable", label: "Ni priporočljivo", tone: "#ef4444", text: "Scenarij v enem ali več mesecih pade pod ničlo." };
  }
  if (monthlySurplus < 0 || firstRiskMonth != null) {
    return { level: "tight", label: "Tesno", tone: "#f59e0b", text: "Izvedljivo je, ampak varnostna rezerva postane prenizka." };
  }
  if (lowestCash < buffer * 1.25) {
    return { level: "risky", label: "Tvegano", tone: "#f97316", text: "Denarni tok ostane pozitiven, vendar je prostora malo." };
  }
  return { level: "safe", label: "Varno", tone: "#10a37f", text: "Scenarij ohrani rezervo in pozitiven mesečni tok." };
};

export function runSimulation(baseline, scenario = {}) {
  const months = Math.max(1, toNumber(scenario.months || baseline.months || 12));
  const fixedBase = toNumber(baseline.fixedExpenses);
  const variableBase = toNumber(baseline.variableExpenses) + toNumber(baseline.subscriptions);
  const buffer = (fixedBase + variableBase) * toNumber(baseline.emergencyTargetMonths || 3);
  const assumptions = scenario.assumptions || [];
  const points = [];
  const risks = [];
  let cash = toNumber(baseline.startingCash);
  let netWorth = toNumber(baseline.startingNetWorth) || cash;
  let firstRiskMonth = null;
  let lowest = { cash: Infinity, index: 0, key: "" };

  for (let index = 0; index < months; index += 1) {
    const monthInfo = addMonths(baseline.startYear || new Date().getFullYear(), baseline.startMonth || 0, index);
    const adjustedBase = {
      monthlyIncome: toNumber(baseline.monthlyIncome),
      fixedExpenses: fixedBase,
      variableExpenses: variableBase * Math.pow(1 + toNumber(baseline.annualInflation), index / 12),
      goalContributions: toNumber(baseline.goalContributions),
      debtPayments: toNumber(baseline.debtPayments),
      annualInvestmentReturn: toNumber(baseline.annualInvestmentReturn),
    };
    const adjusted = applyAssumptions(adjustedBase, assumptions, index);
    const outflow = adjusted.fixedExpenses + adjusted.variableExpenses + adjusted.goalContributions + adjusted.debtPayments + adjusted.oneOff;
    const surplus = adjusted.monthlyIncome - outflow;
    cash += surplus;
    netWorth = netWorth * (1 + adjusted.annualInvestmentReturn / 12) + surplus;
    const point = {
      index,
      key: monthInfo.key,
      income: round(adjusted.monthlyIncome),
      expenses: round(outflow),
      surplus: round(surplus),
      cash: round(cash),
      netWorth: round(netWorth),
      buffer: round(buffer),
    };
    points.push(point);
    if (cash < lowest.cash) lowest = { cash, index, key: monthInfo.key };
    if (cash < buffer && firstRiskMonth == null) firstRiskMonth = index;
    if (cash < 0) risks.push({ kind: "negative_cash", monthIndex: index, month: monthInfo.key, amount: round(cash) });
    else if (cash < buffer) risks.push({ kind: "below_buffer", monthIndex: index, month: monthInfo.key, amount: round(buffer - cash) });
  }

  const monthlySurplus = points.length ? points.at(-1).surplus : 0;
  const verdict = verdictFor({ lowestCash: lowest.cash, buffer, monthlySurplus, firstRiskMonth });
  const gap = Math.max(0, buffer - lowest.cash);
  const recommendations = [];
  if (lowest.cash < 0) recommendations.push({ id: "negative", text: `Znižaj stroške ali povečaj prihodke: scenarij potrebuje približno ${Math.ceil(Math.abs(lowest.cash))} € dodatne rezerve.` });
  if (gap > 0) recommendations.push({ id: "buffer", text: `Za varno rezervo znižaj stroške ali povečaj prihodke za približno ${Math.ceil(gap / months)} € na mesec.` });
  if (monthlySurplus < 0) recommendations.push({ id: "surplus", text: `Mesečni tok je negativen. Znižaj stroške ali povečaj prihodke za vsaj ${Math.ceil(Math.abs(monthlySurplus))} € na mesec.` });
  if (!recommendations.length) recommendations.push({ id: "ok", text: "Scenarij je stabilen. Najprej preveri datum večjih stroškov in nato ga lahko uporabiš kot del plana." });

  return {
    id: scenario.id || "baseline",
    name: scenario.name || "Osnovni scenarij",
    assumptions,
    points,
    risks,
    verdict,
    recommendations,
    summary: {
      startingCash: round(baseline.startingCash),
      endingCash: round(points.at(-1)?.cash || baseline.startingCash),
      endingNetWorth: round(points.at(-1)?.netWorth || baseline.startingNetWorth),
      monthlySurplus: round(monthlySurplus),
      safetyBuffer: round(buffer),
      firstRiskMonth,
      worstMonth: { index: lowest.index, key: lowest.key, cash: round(lowest.cash) },
      runwayMonths: round((points.at(-1)?.cash || 0) / Math.max(1, fixedBase + variableBase)),
    },
  };
}

export function compareScenarios(results) {
  return [...(results || [])]
    .map(result => ({
      id: result.id,
      name: result.name,
      verdict: result.verdict,
      endingCash: result.summary.endingCash,
      endingNetWorth: result.summary.endingNetWorth,
      worstCash: result.summary.worstMonth.cash,
      firstRiskMonth: result.summary.firstRiskMonth,
      monthlySurplus: result.summary.monthlySurplus,
    }))
    .sort((a, b) => b.endingCash - a.endingCash);
}
