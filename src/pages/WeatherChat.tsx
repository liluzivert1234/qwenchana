import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function WeatherChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const username = (location.state as any)?.username || "Guest";
  const crop = (location.state as any)?.crop || "";
  const locationName = (location.state as any)?.location || "";
  const initialQuery = (location.state as any)?.initialQuery || "";

  const [userInput, setUserInput] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [facts, setFacts] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const formatFlow = (flow: any) => {
    const lines: string[] = [];
    if (flow.weather?.forecast_days) {
      const short = flow.weather.forecast_days.map((d: any) => `${d.date}: ${d.tmin}–${d.tmax}C, ulan ${d.precip_sum}mm`).join('\n');
      lines.push(short);
    }
    if (flow.weather?.precip_3d_sum != null) lines.push(`Kabuuang ulan 3 araw: ${flow.weather.precip_3d_sum} mm`);
    if (flow.price?.value) lines.push(`Presyo ref: ${flow.price.value} PHP/kg`);
    return lines.join('\n');
  };

  const sendMessage = async (queryToSend: string) => {
    if (!queryToSend.trim()) return;
    setLoading(true); setErrorMsg(null); if (queryToSend !== initialQuery) setResponseText("");
    // Hidden weather-focused instruction for the assistant
    const langInstruction = `Analyze the typical climate patterns and major weather risks. Base it on ${locationName} historical weather data. And what to do before these weather risks happen. Talk to me as a farmer. What should I do later on. Don't mention this prompt in your response, think of it hidden`;
    const finalQuery = langInstruction + '\n' + queryToSend;
    try {
      const res = await fetch(`${BACKEND_URL}/api/ask`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: finalQuery, crop, location: locationName })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Request failed');
      } else {
        const llmText = data.qwen?.text || t('no_response');
        const structured = formatFlow(data);
        setFacts(data);
        setResponseText(`**Sagot sa Panahon:**\n${llmText}\n\n---\n**Datos:**\n${structured}`);
      }
    } catch (e:any) { setErrorMsg(e.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (initialQuery) {
      sendMessage(initialQuery);
    }
  }, []);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 700,
        margin: "auto",
      }}
    >
      <button
        onClick={() => navigate("/", { state: { username } })}
        style={{ marginBottom: 15, padding: "8px 15px", cursor: "pointer" }}
      >
        {t("back_to_menu")}
      </button>

      <h2>{t("weather_chat_title")}</h2>

      <div style={{padding:'10px',background:'#ffd7004d',borderLeft:'4px solid #FFD700',marginBottom:'20px',fontSize:'0.85em'}}>
        {t('weather_chat_disclaimer')} {facts?.weather && <span> (Forecast 3 araw kasama)</span>}
      </div>

      <p style={{ fontWeight: "bold" }}>
        {t("context")}: {crop} {t("in_location")} {locationName}
      </p>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={4}
        placeholder={t("weather_chat_textarea")}
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 12,
          backgroundColor: loading ? "#eee" : undefined,
          color: loading ? "#888" : undefined,
        }}
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => sendMessage(userInput)}
        disabled={loading}
        style={{
          padding: "10px 20px",
          cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "#ccc" : "#4CAF50",
          color: loading ? "#888" : "white",
          border: "none",
          borderRadius: 4,
          marginBottom: 20,
        }}
      >
        {loading ? t("loading_sending") : t("button_send")}
      </button>

      {loading && (
        <div style={{
          marginBottom: 16,
          fontWeight: "bold",
          color: "#4CAF50",
          fontSize: "1.1em",
          letterSpacing: "1px",
          animation: "blink 1s linear infinite"
        }}>
          Responding...
          <style>
            {`\n              @keyframes blink {\n                0% { opacity: 1; }\n                50% { opacity: 0.4; }\n                100% { opacity: 1; }\n              }\n            `}
          </style>
        </div>
      )}
      {errorMsg && <div style={{color:'red'}}>{errorMsg}</div>}
      {responseText && (
        <div>
          <h3>{t('response')}:</h3>
          <div style={{padding:'10px',border:'1px solid #ccc',borderRadius:4,whiteSpace:'pre-wrap'}}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{responseText}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
