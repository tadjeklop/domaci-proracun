import React, { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { C, aBtn, aCd, aInp } from "../../../lib/styles.js";
import { buildBaselineFromFinanceData, compareScenarios, runSimulation } from "./simulationEngine.js";
import { ASSUMPTION_TYPES, SCENARIO_TEMPLATES } from "./scenarioTemplates.js";
import {
  loadSimulationScenarios,
  loadSimulationSettings,
  saveSimulationScenarios,
  saveSimulationSettings,
} from "./simulationStorage.js";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const money = value => `${Math.round(Number(value) || 0).toLocaleString("sl-SI")} €`;
const shortMoney = value => {
  const abs = Math.abs(Number(value) || 0);
  if (abs >= 1000000) return `${Math.round(value / 100000) / 10}M`;
  if (abs >= 1000) return `${Math.round(value / 100) / 10}k`;
  return `${Math.round(value)}`;
};

const defaultScenario = () => ({
  id: uid(),
  name: "Nov scenarij",
  assumptions: [],
});

const fieldStyle = { ...aInp, minHeight: 38 };
const miniButton = { ...aBtn, padding: "8px 10px", fontSize: 13 };
const cardBase = { ...aCd, width: "auto", minWidth: 0, padding: 16, borderRadius: 18, boxSizing: "border-box" };

function Metric({ label, value, tone }) {
  return (
    <div style={{ ...cardBase, padding: 14, minHeight: 86, borderLeft: `4px solid ${tone || C.ac}` }}>
      <div style={{ fontSize: 11, color: C.sb, textTransform: "uppercase", fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: tone || C.tx, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function AssumptionRow({ assumption, onChange, onDelete }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr .8fr .7fr .7fr auto", gap: 8, alignItems: "center" }}>
      <input style={fieldStyle} value={assumption.label || ""} placeholder="Opis" onChange={e => onChange({ ...assumption, label: e.target.value })} />
      <select style={fieldStyle} value={assumption.type} onChange={e => onChange({ ...assumption, type: e.target.value })}>
        {ASSUMPTION_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <input style={fieldStyle} type="number" value={assumption.amount ?? 0} onChange={e => onChange({ ...assumption, amount: +e.target.value })} />
      <input style={fieldStyle} type="number" value={assumption.percent ?? ""} placeholder="%" onChange={e => onChange({ ...assumption, percent: e.target.value === "" ? "" : +e.target.value })} />
      <input style={fieldStyle} type="number" min="0" value={assumption.startMonth ?? 0} onChange={e => onChange({ ...assumption, startMonth: +e.target.value })} />
      <button style={miniButton} onClick={onDelete}>Izbriši</button>
    </div>
  );
}

export default function FinancialSimulationTab({
  data,
  year,
  month,
  categories,
  savingsData,
  netWorthAssets,
  netWorthLiabilities,
  debts,
  subscriptions,
  isMobile,
}) {
  const [settings, setSettings] = useState(() => loadSimulationSettings());
  const [saved, setSaved] = useState(() => loadSimulationScenarios());
  const [scenario, setScenario] = useState(() => saved[0] || defaultScenario());
  const [compareIds, setCompareIds] = useState(() => []);
  const [view, setView] = useState("simple");

  const baseline = useMemo(() => buildBaselineFromFinanceData({
    data,
    year,
    month,
    categories,
    savingsData,
    netWorthAssets,
    netWorthLiabilities,
    debts,
    subscriptions,
    settings,
  }), [data, year, month, categories, savingsData, netWorthAssets, netWorthLiabilities, debts, subscriptions, settings]);

  const baselineResult = useMemo(() => runSimulation(baseline, { id: "baseline", name: "Osnovni potek", assumptions: [] }), [baseline]);
  const result = useMemo(() => runSimulation(baseline, { ...scenario, months: settings.months }), [baseline, scenario, settings.months]);
  const savedResults = useMemo(() => saved.map(item => runSimulation(baseline, { ...item, months: settings.months })), [saved, baseline, settings.months]);
  const comparison = useMemo(() => compareScenarios([
    baselineResult,
    result,
    ...savedResults.filter(item => compareIds.includes(item.id)),
  ]), [baselineResult, result, savedResults, compareIds]);

  const updateSettings = next => {
    setSettings(next);
    saveSimulationSettings(next);
  };

  const saveScenario = () => {
    const next = [scenario, ...saved.filter(item => item.id !== scenario.id)].slice(0, 12);
    setSaved(next);
    saveSimulationScenarios(next);
  };

  const useTemplate = template => {
    setScenario({
      id: uid(),
      name: template.title,
      assumptions: template.assumptions.map((a, index) => ({ id: uid(), enabled: true, confidence: "medium", ...a, label: a.label || `Predpostavka ${index + 1}` })),
    });
    setView("simple");
  };

  const updateAssumption = (index, next) => {
    setScenario(current => ({
      ...current,
      assumptions: current.assumptions.map((item, i) => i === index ? next : item),
    }));
  };

  const addAssumption = () => setScenario(current => ({
    ...current,
    assumptions: [...current.assumptions, { id: uid(), type: "one_off_expense", label: "Nova predpostavka", amount: 100, startMonth: 0, enabled: true }],
  }));

  const removeAssumption = index => setScenario(current => ({
    ...current,
    assumptions: current.assumptions.filter((_, i) => i !== index),
  }));

  const chartData = result.points.map((point, index) => ({
    ...point,
    label: point.key.slice(5),
    baselineCash: baselineResult.points[index]?.cash,
  }));

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px" }}>Odločitve in scenariji</h2>
          <div style={{ color: C.sb }}>Izberi odločitev, preveri varnost in po potrebi popravi številke.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {[3, 6, 12, 36, 60, 120].map(months => (
            <button key={months} style={{ ...miniButton, background: settings.months === months ? C.ac : C.card, color: settings.months === months ? "#fff" : C.tx }} onClick={() => updateSettings({ ...settings, months })}>
              {months < 24 ? `${months} mes.` : `${Math.round(months / 12)} let`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
        {["simple", "scenarios", "compare", "assumptions"].map(id => (
          <button key={id} style={{ ...miniButton, background: view === id ? C.ac : C.card, color: view === id ? "#fff" : C.tx }} onClick={() => setView(id)}>
            {id === "simple" ? "Hiter pregled" : id === "scenarios" ? "Izberi odločitev" : id === "compare" ? "Primerjava" : "Uredi številke"}
          </button>
        ))}
        <button style={{ ...miniButton, marginLeft: "auto", background: "#10a37f", color: "#fff" }} onClick={saveScenario}>Shrani scenarij</button>
      </div>

      {view === "simple" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            {SCENARIO_TEMPLATES.map(template => (
              <button key={template.id} style={{ ...cardBase, textAlign: "left", cursor: "pointer", padding: 14, minHeight: 118 }} onClick={() => useTemplate(template)}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>{template.title}</div>
                <div style={{ color: C.sb, marginTop: 6, fontSize: 13, lineHeight: 1.35 }}>{template.text}</div>
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(280px, 380px)", gap: 14, alignItems: "start" }}>
            <div style={cardBase}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: C.sb, fontWeight: 800 }}>Trenutni scenarij</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{scenario.name}</div>
                </div>
                <button style={miniButton} onClick={() => setView("assumptions")}>Uredi številke</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
                <Metric label="Ocena" value={result.verdict.label} tone={result.verdict.tone} />
                <Metric label="Konec denarja" value={money(result.summary.endingCash)} tone={result.verdict.tone} />
                <Metric label="Najslabši mesec" value={money(result.summary.worstMonth.cash)} tone={result.summary.worstMonth.cash < 0 ? "#ef4444" : C.tx} />
                <Metric label="Mesečni tok" value={money(result.summary.monthlySurplus)} tone={result.summary.monthlySurplus < 0 ? "#ef4444" : "#10a37f"} />
              </div>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ead7c9" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={shortMoney} width={58} />
                    <Tooltip formatter={value => money(value)} labelFormatter={label => `Mesec ${label}`} />
                    <Legend />
                    <Line type="monotone" dataKey="baselineCash" name="Osnova" stroke="#9ca3af" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cash" name="Scenarij" stroke="#10a37f" strokeWidth={3} />
                    <Line type="monotone" dataKey="buffer" name="Varnostna meja" stroke="#f59e0b" strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...cardBase, borderTop: `5px solid ${result.verdict.tone}` }}>
              <h3 style={{ marginTop: 0 }}>Kaj to pomeni?</h3>
              <div style={{ fontSize: 22, fontWeight: 900, color: result.verdict.tone }}>{result.verdict.label}</div>
              <p style={{ color: C.sb }}>{result.verdict.text}</p>
              <h4>Priporočila</h4>
              {result.recommendations.map(item => <div key={item.id} style={{ padding: "8px 0", borderTop: "1px solid #ead7c9" }}>{item.text}</div>)}
            </div>
          </div>
        </div>
      )}

      {view === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.45fr .8fr", gap: 14 }}>
          <div style={cardBase}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: C.sb, fontWeight: 800 }}>Aktivni scenarij</div>
                <input style={{ ...fieldStyle, fontSize: 18, fontWeight: 800, minWidth: 260 }} value={scenario.name} onChange={e => setScenario({ ...scenario, name: e.target.value })} />
              </div>
              <div style={{ color: result.verdict.tone, fontWeight: 900, fontSize: 20 }}>{result.verdict.label}</div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ead7c9" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={shortMoney} width={58} />
                  <Tooltip formatter={value => money(value)} labelFormatter={label => `Mesec ${label}`} />
                  <Legend />
                  <Line type="monotone" dataKey="baselineCash" name="Osnova" stroke="#9ca3af" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cash" name="Scenarij" stroke="#10a37f" strokeWidth={3} />
                  <Line type="monotone" dataKey="buffer" name="Varnostna meja" stroke="#f59e0b" strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...cardBase, borderTop: `5px solid ${result.verdict.tone}` }}>
            <h3 style={{ marginTop: 0 }}>Odločitev</h3>
            <div style={{ fontSize: 22, fontWeight: 900, color: result.verdict.tone }}>{result.verdict.label}</div>
            <p style={{ color: C.sb }}>{result.verdict.text}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Metric label="Konec denarja" value={money(result.summary.endingCash)} tone={result.verdict.tone} />
              <Metric label="Najslabši mesec" value={money(result.summary.worstMonth.cash)} tone={result.summary.worstMonth.cash < 0 ? "#ef4444" : C.tx} />
              <Metric label="Mesečni tok" value={money(result.summary.monthlySurplus)} tone={result.summary.monthlySurplus < 0 ? "#ef4444" : "#10a37f"} />
              <Metric label="Neto vrednost" value={money(result.summary.endingNetWorth)} tone="#7c3aed" />
            </div>
            <h4>Priporočila</h4>
            {result.recommendations.map(item => <div key={item.id} style={{ padding: "8px 0", borderTop: "1px solid #ead7c9" }}>{item.text}</div>)}
          </div>
        </div>
      )}

      {view === "scenarios" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          {SCENARIO_TEMPLATES.map(template => (
            <button key={template.id} style={{ ...cardBase, textAlign: "left", cursor: "pointer" }} onClick={() => useTemplate(template)}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{template.title}</div>
              <div style={{ color: C.sb, marginTop: 8, lineHeight: 1.35 }}>{template.text}</div>
            </button>
          ))}
        </div>
      )}

      {view === "compare" && (
        <div style={cardBase}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {saved.map(item => (
              <label key={item.id} style={{ ...aBtn, display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={compareIds.includes(item.id)} onChange={e => setCompareIds(e.target.checked ? [...compareIds, item.id] : compareIds.filter(id => id !== item.id))} />
                {item.name}
              </label>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
              <thead>
                <tr style={{ color: C.sb, textAlign: "left" }}>
                  <th>Scenarij</th><th>Ocena</th><th>Konec denarja</th><th>Neto vrednost</th><th>Najslabši mesec</th><th>Mesečni tok</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(row => (
                  <tr key={row.id} style={{ borderTop: "1px solid #ead7c9" }}>
                    <td style={{ padding: 10, fontWeight: 800 }}>{row.name}</td>
                    <td style={{ color: row.verdict.tone, fontWeight: 900 }}>{row.verdict.label}</td>
                    <td>{money(row.endingCash)}</td>
                    <td>{money(row.endingNetWorth)}</td>
                    <td>{money(row.worstCash)}</td>
                    <td>{money(row.monthlySurplus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "assumptions" && (
        <div style={cardBase}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Predpostavke scenarija</h3>
            <button style={{ ...miniButton, background: C.ac, color: "#fff" }} onClick={addAssumption}>+ Dodaj predpostavko</button>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {scenario.assumptions.map((assumption, index) => (
              <AssumptionRow
                key={assumption.id || index}
                assumption={assumption}
                onChange={next => updateAssumption(index, next)}
                onDelete={() => removeAssumption(index)}
              />
            ))}
            {!scenario.assumptions.length && <div style={{ color: C.sb }}>Dodaj predpostavko ali izberi predlogo scenarija.</div>}
          </div>
        </div>
      )}

      <div style={{ ...cardBase, marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Denarni tok po mesecih</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ead7c9" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={shortMoney} width={58} />
              <Tooltip formatter={value => money(value)} />
              <Legend />
              <Bar dataKey="income" name="Prihodki" fill="#10a37f" />
              <Bar dataKey="expenses" name="Odhodki" fill="#d67252" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
