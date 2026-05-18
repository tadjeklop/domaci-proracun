export const SCENARIO_TEMPLATES = [
  {
    id: "afford",
    title: "Ali si lahko privoščimo?",
    text: "En večji nakup ali dogodek z datumom in morebitnim mesečnim stroškom.",
    assumptions: [
      { type: "one_off_expense", label: "Enkratni strošek", amount: 4000, startMonth: 2 },
      { type: "recurring_expense", label: "Vzdrževanje po nakupu", amount: 0, startMonth: 3 },
    ],
  },
  {
    id: "income",
    title: "Sprememba prihodka",
    text: "Povišica, porodniška, izguba dela ali začasen padec dohodka.",
    assumptions: [
      { type: "income_change", label: "Sprememba prihodka", amount: -500, startMonth: 0, endMonth: 5 },
    ],
  },
  {
    id: "debt",
    title: "Hitrejše odplačilo dolga",
    text: "Preveri, ali višje mesečno plačilo ogrozi denarni tok.",
    assumptions: [
      { type: "debt_payment_change", label: "Dodatno plačilo dolga", amount: 250, startMonth: 0 },
    ],
  },
  {
    id: "goal",
    title: "Cilj ali varčevanje",
    text: "Dodaj ali spremeni mesečno varčevanje in vidi vpliv na varnost.",
    assumptions: [
      { type: "savings_change", label: "Dodatno varčevanje", amount: 200, startMonth: 0 },
    ],
  },
  {
    id: "inflation",
    title: "Dražje življenje",
    text: "Kaj se zgodi, če se stroški dvignejo hitreje od pričakovanj.",
    assumptions: [
      { type: "expense_percent", label: "Višji stroški", percent: 8, startMonth: 0 },
    ],
  },
];

export const ASSUMPTION_TYPES = [
  ["one_off_expense", "Enkratni strošek"],
  ["recurring_expense", "Mesečni strošek"],
  ["income_change", "Sprememba prihodka"],
  ["expense_change", "Sprememba stroškov"],
  ["expense_percent", "Stroški v %"],
  ["savings_change", "Sprememba varčevanja"],
  ["debt_payment_change", "Plačilo dolga"],
  ["investment_return", "Donos naložb"],
  ["inflation", "Inflacija"],
];
