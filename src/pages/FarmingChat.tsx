import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FarmingChat() {
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
    if (flow.price?.value) {
      lines.push(`Presyo (farmgate): ${flow.price.value} PHP/kg (${flow.price.stale ? 'posibleng luma' : 'sariwa'})`);
    }
    if (flow.weather?.precip_3d_sum != null) {
      lines.push(`Ulan (3 araw): ${flow.weather.precip_3d_sum} mm`);
    }
    if (flow.kb && flow.kb.length) {
      lines.push(`KB sanggunian: ${flow.kb.map((k: any) => k.source).join(', ')}`);
    }
    return lines.join('\n');
  };

  const sendMessage = async (queryToSend: string) => {
    if (!queryToSend.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    if (queryToSend !== initialQuery) setResponseText("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryToSend, crop, location: locationName })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Request failed');
      } else {
        const llmText = data.qwen?.text || t('no_response');
        const structured = formatFlow(data);
        setFacts(data);
        setResponseText(`**Sagot:**\n${llmText}\n\n---\n**Datos:**\n${structured}`);
      }
    } catch (e:any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
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

      <h2>{t("farming_chat_title")}</h2>

      <div style={{padding:'10px',background:'#ffd7004d',borderLeft:'4px solid #FFD700',marginBottom:'20px',fontSize:'0.85em'}}>
        {t('farming_chat_disclaimer')}<br/>
        {facts?.price?.stale && <span style={{color:'#b00'}}>Babala: Maaaring luma ang presyo, fallback sa nakaraang taon.</span>}
      </div>

      <p style={{ fontWeight: "bold" }}>
        {t("context")}: {crop} {t("in_location")} {locationName}
      </p>
      
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={4}
        placeholder={t("farming_chat_textarea")}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />
      <button
        onClick={() => sendMessage(userInput)}
        disabled={loading}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 4,
          marginBottom: 20,
        }}
      >
        {loading ? t("loading_sending") : t("button_send")}
      </button>
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
