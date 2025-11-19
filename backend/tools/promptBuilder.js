// Prompt builder for Qwen
// Assembles Tagalog empathetic context given fetched data.

function line(val, label) {
  return val == null ? `` : `- ${label}: ${val}`;
}

export function buildPrompt({ crop, location, priceData, weatherData, techniquesData, kbChunks = [], userQuery }) {
  const priceLine = priceData?.value ? `${priceData.value.toFixed(2)} PHP/kg` : "walang datos";
  const precipLine = weatherData?.precip_3d_sum != null ? `${weatherData.precip_3d_sum} mm (3-araw)` : "walang datos";
  const techLine = techniquesData?.techniques?.[0]?.title ? techniquesData.techniques[0].title : "walang teknik ngayon";

  const kbLines = kbChunks.map(c => `*KB* ${c.text.replace(/\n+/g,' ').slice(0,300)} (pinagmulan: ${c.source})`);

  const contextBlock = [
    line(crop, "Pananim"),
    line(location, "Lokasyon"),
    line(priceLine, "Presyo (farmgate, tantiya)"),
    line(precipLine, "Ulan"),
    line(techLine, "Teknik na halimbawa"),
    ...kbLines
  ].filter(Boolean).join("\n");

  return `Ikaw ay isang maunawaing AI na tumutulong sa magsasaka. Sumagot sa mainit at malinaw na Tagalog.
Gumawa ng maikling TL;DR (1 pangungusap), pagkatapos ay 3 numbered na hakbang na praktikal.
Ipakita sa dulo ang 'Tiwala:' (estimate 0-100) at banggitin ang pinagmulan: PSA OpenSTAT, Open-Meteo, Local PDF Guides.

KONTEKSTO:\n${contextBlock}\n\nTanong ng magsasaka: ${userQuery}\n\nSagutan ngayon:`;
}
