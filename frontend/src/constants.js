export const SEV_OPTIONS = [
  { value: 10, label: "10 — Business-critical or safety-critical failure" },
  { value: 9,  label: "9 — Major operational impact" },
  { value: 8,  label: "8 — Significant customer dissatisfaction" },
  { value: 7,  label: "7 — Disruption with workaround" },
  { value: 6,  label: "6 — Moderate inconvenience" },
  { value: 5,  label: "5 — Minor inconvenience" },
  { value: 4,  label: "4 — Negligible impact" },
  { value: 3,  label: "3 — Noticeable but acceptable impact" },
  { value: 2,  label: "2 — Very minor issue" },
  { value: 1,  label: "1 — No noticeable impact" },
];

export const OCC_OPTIONS = [
  { value: 10, label: "10 — Almost certain (>1 in 2)" },
  { value: 9,  label: "9 — Likely (1 in 3)" },
  { value: 8,  label: "8 — Frequent (1 in 8)" },
  { value: 7,  label: "7 — Occasional (1 in 20)" },
  { value: 6,  label: "6 — Infrequent (1 in 80)" },
  { value: 5,  label: "5 — Rare (1 in 400)" },
  { value: 4,  label: "4 — Remote (1 in 2,000)" },
  { value: 3,  label: "3 — Unlikely (1 in 15,000)" },
  { value: 2,  label: "2 — Very Unlikely (1 in 150,000)" },
  { value: 1,  label: "1 — Practically impossible (<1 in 1.5M)" },
];

export const DET_OPTIONS = [
  { value: 10, label: "10 — Impossible to detect" },
  { value: 9,  label: "9 — Detection unlikely" },
  { value: 8,  label: "8 — Detection difficult" },
  { value: 7,  label: "7 — Low detection probability" },
  { value: 6,  label: "6 — Moderate detection probability" },
  { value: 5,  label: "5 — Reasonable detection methods exist" },
  { value: 4,  label: "4 — Detection likely with current controls" },
  { value: 3,  label: "3 — High likelihood of detection" },
  { value: 2,  label: "2 — Very high likelihood" },
  { value: 1,  label: "1 — Almost certain detection" },
];

export const DEP_SEVERITY_OPTIONS = ["Hard", "Soft", "Optional", "Boot-Only"];
