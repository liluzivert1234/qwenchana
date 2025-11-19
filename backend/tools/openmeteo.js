// Open-Meteo fetcher
// Retrieves daily forecast summary for next 3 days.

export async function fetchWeather({ lat, lon, timezone = "Asia/Manila" }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=3&timezone=${encodeURIComponent(timezone)}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const daily = json.daily || {};
    const out = [];
    if (daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        out.push({
          date: daily.time[i],
          tmax: daily.temperature_2m_max?.[i] ?? null,
          tmin: daily.temperature_2m_min?.[i] ?? null,
          precip_sum: daily.precipitation_sum?.[i] ?? null
        });
      }
    }
    const precip3d = out.reduce((a, r) => a + (r.precip_sum || 0), 0);
    return {
      ok: true,
      source: "open-meteo",
      lat,
      lon,
      forecast_days: out,
      precip_3d_sum: precip3d,
      raw: json
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
