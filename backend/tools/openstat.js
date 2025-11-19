// Enhanced OpenSTAT (PXWeb) farmgate price fetcher with dynamic metadata mapping
// Dataset: Cereals: Farmgate Prices (0032M4AFN01.px)
// Improvements:
//  - Fetch metadata once (codes + labels)
//  - Map location & crop names to codes via fuzzy match (strip dots, case-insensitive)
//  - Attempt latest monthly price (current year, going backwards) before falling back to annual
//  - Provide period & year labels, stale flag, and reasoning

const DATASET_ID = "0032M4AFN01.px";
const DATASET_BASE = `https://openstat.psa.gov.ph:443/PXWeb/api/v1/en/DB/2M/NFG/${DATASET_ID}/`;

let _metaCache = null;

async function fetchMetadata() {
  if (_metaCache) return _metaCache;
  const res = await fetch(DATASET_BASE);
  const json = await res.json();
  _metaCache = json; // { title, variables: [...] }
  return json;
}

function normalizeLabel(label) {
  return label.replace(/\.+/g, "").trim().toLowerCase();
}

function yearToCode(year) { // 2010->0 ... 2025->15
  return String(Math.min(Math.max(year, 2010), 2025) - 2010);
}

function periodIndexToLabel(meta, periodCode) {
  const periodVar = meta.variables.find(v => v.code === "Period");
  return periodVar ? periodVar.valueTexts[Number(periodCode)] : null;
}

function yearCodeToLabel(meta, yearCode) {
  const yearVar = meta.variables.find(v => v.code === "Year");
  return yearVar ? yearVar.valueTexts[Number(yearCode)] : null;
}

function findCodeByLabel(meta, variableCode, searchLabel) {
  if (!searchLabel) return null;
  const variable = meta.variables.find(v => v.code === variableCode);
  if (!variable) return null;
  const target = normalizeLabel(searchLabel);
  for (let i = 0; i < variable.valueTexts.length; i++) {
    const lbl = normalizeLabel(variable.valueTexts[i]);
    if (lbl.includes(target)) return variable.values[i];
  }
  return null;
}

function buildQuery({ commodityCode, geolocationCode, yearCode, periodCode }) {
  return {
    query: [
      { code: "Geolocation", selection: { filter: "item", values: [geolocationCode] } },
      { code: "Commodity", selection: { filter: "item", values: [commodityCode] } },
      { code: "Year", selection: { filter: "item", values: [yearCode] } },
      { code: "Period", selection: { filter: "item", values: [periodCode] } }
    ],
    response: { format: "json" }
  };
}

async function queryValue({ commodityCode, geolocationCode, yearCode, periodCode }) {
  const body = buildQuery({ commodityCode, geolocationCode, yearCode, periodCode });
  const res = await fetch(DATASET_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  const dataEntry = json.data && json.data[0];
  let rawValue = dataEntry ? dataEntry.values[0] : null;
  let valueNumeric = rawValue && rawValue !== ".." ? parseFloat(rawValue) : null;
  return { rawValue, valueNumeric };
}

export async function fetchFarmgatePrice({ crop, location }) {
  const meta = await fetchMetadata();

  // Resolve codes from labels; fallback to common defaults
  const commodityCode = findCodeByLabel(meta, "Commodity", crop) || "1"; // Palay Other Variety default
  const geolocationCode = findCodeByLabel(meta, "Geolocation", location) || "000000000"; // PHILIPPINES default

  const now = new Date();
  const currentYearCode = yearToCode(now.getFullYear());
  // period codes 0..11 months, 12 annual. We'll try months backwards.
  let chosenYearCode = currentYearCode;
  let chosenPeriodCode = null;
  let foundValue = null;
  let foundRaw = null;
  let attempts = [];

  // Try current year monthly going backwards from last completed month
  const lastMonthIndex = Math.max(0, now.getMonth() - 1); // if January -> try December previous year after loop
  for (let m = lastMonthIndex; m >= 0; m--) {
    const { rawValue, valueNumeric } = await queryValue({ commodityCode, geolocationCode, yearCode: chosenYearCode, periodCode: String(m) });
    attempts.push({ yearCode: chosenYearCode, periodCode: String(m), rawValue });
    if (valueNumeric != null) {
      chosenPeriodCode = String(m);
      foundValue = valueNumeric;
      foundRaw = rawValue;
      break;
    }
  }

  let stale = false;
  // If not found, try previous year December (11) then annual (12) previous year
  if (foundValue == null) {
    const prevYear = now.getFullYear() - 1;
    const prevYearCode = yearToCode(prevYear);
    // December previous year
    const decTry = await queryValue({ commodityCode, geolocationCode, yearCode: prevYearCode, periodCode: "11" });
    attempts.push({ yearCode: prevYearCode, periodCode: "11", rawValue: decTry.rawValue });
    if (decTry.valueNumeric != null) {
      chosenYearCode = prevYearCode;
      chosenPeriodCode = "11";
      foundValue = decTry.valueNumeric;
      foundRaw = decTry.rawValue;
      stale = true;
    } else {
      // Annual previous year
      const annualTry = await queryValue({ commodityCode, geolocationCode, yearCode: prevYearCode, periodCode: "12" });
      attempts.push({ yearCode: prevYearCode, periodCode: "12", rawValue: annualTry.rawValue });
      if (annualTry.valueNumeric != null) {
        chosenYearCode = prevYearCode;
        chosenPeriodCode = "12";
        foundValue = annualTry.valueNumeric;
        foundRaw = annualTry.rawValue;
        stale = true;
      }
    }
  }

  const periodLabel = chosenPeriodCode != null ? periodIndexToLabel(meta, chosenPeriodCode) : null;
  const yearLabel = yearCodeToLabel(meta, chosenYearCode);
  const commodityLabel = (() => {
    const varC = meta.variables.find(v => v.code === "Commodity");
    if (!varC) return null;
    const idx = varC.values.indexOf(commodityCode);
    return idx >= 0 ? varC.valueTexts[idx] : null;
  })();
  const geoLabel = (() => {
    const varG = meta.variables.find(v => v.code === "Geolocation");
    if (!varG) return null;
    const idx = varG.values.indexOf(geolocationCode);
    return idx >= 0 ? varG.valueTexts[idx] : null;
  })();

  return {
    ok: true,
    source: "psa-openstat",
    dataset_id: DATASET_ID,
    crop,
    location,
    commodity_code: commodityCode,
    commodity_label: commodityLabel,
    geolocation_code: geolocationCode,
    geolocation_label: geoLabel,
    year_code: chosenYearCode,
    year_label: yearLabel,
    period_code: chosenPeriodCode,
    period_label: periodLabel,
    value: foundValue,
    raw: foundRaw,
    stale,
    units: "PHP/kg",
    attempts
  };
}
