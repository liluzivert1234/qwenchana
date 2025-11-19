// Orchestrator: Farmer query flow
// 1. Extract keywords
// 2. Fetch OpenSTAT price
// 3. Fetch weather (Open-Meteo)
// 4. Fetch techniques (Supabase)
// 5. Build prompt
// 6. Call Qwen

import { extractKeywords } from "./keyword.js";
import { fetchFarmgatePrice } from "./openstat.js";
import { fetchWeather } from "./openmeteo.js";
import { fetchTechniques } from "./supabaseTechniques.js";
import { buildPrompt } from "./promptBuilder.js";
import { searchKB, loadKB, buildLocalKB } from "./localKb.js";
import { callQwen } from "./qwenClient.js";

// Simple location -> lat/lon mapping (placeholder). In production, use geocoding or a stored table.
const LOCATION_COORDS = {
  antipolo: { lat: 14.6, lon: 121.1 },
  philippines: { lat: 12.8797, lon: 121.7740 }
};

function resolveCoords(location) {
  if (!location) return LOCATION_COORDS.philippines;
  return LOCATION_COORDS[location.toLowerCase()] || LOCATION_COORDS.philippines;
}

// Ensure KB is loaded once; build if missing (non-blocking fallback)
async function ensureKB() {
  // Always check disk for KB; build if missing. Avoid long-lived in-memory readiness flag
  try {
    if (!loadKB().length) {
      await buildLocalKB();
    }
  } catch (e) {
    console.warn('KB ensure failed:', e?.message || e);
  }
}

export async function runAskFlow({ message, crop, location }) {
  await ensureKB();
  // 1. Keyword extraction
  const kw = extractKeywords({ message, crop, location });

  // 2. OpenSTAT price
  const priceData = await fetchFarmgatePrice({ crop: kw.crop, location: kw.location || "philippines" });

  // 3. Weather
  const { lat, lon } = resolveCoords(kw.location || "philippines");
  const weatherData = await fetchWeather({ lat, lon });

  // 4. Techniques
  const techniquesData = await fetchTechniques({ crop: kw.crop || "rice" });

  // 5. KB retrieval (top chunks)
  const kbChunks = searchKB({ query: message, crop: kw.crop, topK: 3 });

  // 6. Prompt
  const prompt = buildPrompt({
    crop: kw.crop || "rice",
    location: kw.location || "Philippines",
    priceData,
    weatherData,
    techniquesData,
    kbChunks,
    userQuery: message
  });

  // 7. Qwen call
  const qwenResp = await callQwen({ prompt });

  // Fallback synthetic answer if model unavailable
  let finalQwen = qwenResp;
  if (!qwenResp.ok) {
    const lines = [];
    // TL;DR
    const priceStr = priceData?.value ? `${priceData.value} PHP/kg` : 'walang presyo';
    const ulanStr = weatherData?.precip_3d_sum != null ? `${weatherData.precip_3d_sum} mm ulan (3 araw)` : 'walang datos ng ulan';
    lines.push(`TL;DR: Batay sa nakuhang datos (${priceStr}, ${ulanStr}), mag-ingat sa susunod na hakbang at i-double check sa lokal na opisyal.`);
    // Steps (up to 3) derived heuristically
    const steps = [];
    if (weatherData?.precip_3d_sum > 50) steps.push('1. I-delay ang pag-ani hanggang humupa ang malakas na ulan.');
    else steps.push('1. Maaaring magpatuloy sa regular na gawain; bantayan pa rin ang kondisyon ng lupa.');
    if (priceData?.value) steps.push('2. Itala ang kasalukuyang farmgate price para maikumpara sa susunod na linggo.');
    if (techniquesData?.techniques?.length) steps.push(`3. Subukan: ${techniquesData.techniques[0].title}.`);
    lines.push(...steps);
    // Citations
    const cites = [];
    if (priceData?.value) cites.push('PSA OpenSTAT');
    if (weatherData?.precip_3d_sum != null) cites.push('Open-Meteo');
    if (kbChunks?.length) cites.push('Local KB');
    lines.push(`Tiwala (fallback): 40 | Pinagmulan: ${cites.join(', ')}`);
    finalQwen = { ok: true, text: lines.join('\n'), raw: { fallback: true, error: qwenResp.error } };
  }

  // Debug log to help trace why fallback may not be applied at runtime
  try {
    console.log('askFlow: qwenResp.ok=', !!qwenResp?.ok, 'finalQwen.ok=', !!finalQwen?.ok, 'finalQwen.raw.fallback=', !!finalQwen?.raw?.fallback);
  } catch (e) {
    console.warn('askFlow logging failed:', e?.message || e);
  }

  return {
    ok: true,
    keywords: kw,
    price: priceData,
    weather: weatherData,
    techniques: techniquesData,
    kb: kbChunks,
    prompt,
    qwen: finalQwen
  };
}
