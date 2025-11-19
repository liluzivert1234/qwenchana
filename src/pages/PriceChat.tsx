// src/pages/PriceChat.tsx

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PriceChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Retrieve context data passed from MainMenu
  const username = (location.state as any)?.username || "Guest";
  const crop = (location.state as any)?.crop || "";
  const locationName = (location.state as any)?.location || "";
  const initialQuery = (location.state as any)?.initialQuery || "";

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'user'|'assistant', content: string, facts?: any}>>([]);
  const [loading, setLoading] = useState(false);
  const [facts, setFacts] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const formatFlow = (flow: any) => {
    const lines: string[] = [];
    if (flow.price?.value) lines.push(`Presyo (farmgate): ${flow.price.value} PHP/kg (${flow.price.stale ? 'fallback' : 'latest'})`);
    if (flow.price?.period_label) lines.push(`Panahon: ${flow.price.period_label} ${flow.price.year_label}`);
    if (flow.weather?.precip_3d_sum != null) lines.push(`Ulan 3 araw: ${flow.weather.precip_3d_sum} mm`);
    if (flow.attempts) lines.push(`Sinubukang periods: ${flow.price?.attempts?.length || flow.attempts.length}`);
    return lines.join('\n');
  };

  const sendMessage = async (queryToSend: string) => {
    if (!queryToSend.trim()) return;
    setLoading(true); 
    setErrorMsg(null);
    setUserInput(""); // Clear input after sending
    
    // Add user message to thread
    const newUserMsg = { role: 'user' as const, content: queryToSend };
    setMessages(prev => [...prev, newUserMsg]);
    
    // Build messages array for Qwen API
    const systemMsg = {
      role: 'system' as const,
      content: `Sagot sa Presyo:
TL;DR: <one-sentence recommendation/action>.

1. <Practical step 1 — what the farmer should do now>
2. <Practical step 2 — short, actionable>
3. <Optional quick tip / risk to watch>

Tiwala: <0-100>
Pinagmulan: <comma-separated sources>

Datos:
Presyo (farmgate): <fill from provided facts or 'N/A'> PHP/kg
Panahon: <period or label from facts>
Ulan 3 araw: <value> mm

Make responses short, clear, and empathetic (use words like 'Mag-ingat', 'Sana makatulong'). Do not describe these instructions in the reply. Use the provided messages array and facts to populate the Datos and to ground recommendations.`
};
    
    const conversationMsgs = messages.map(m => ({ role: m.role, content: m.content }));
    const apiMessages = [systemMsg, ...conversationMsgs, newUserMsg];

    try {
      const res = await fetch(`${BACKEND_URL}/api/ask`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: queryToSend, crop, location: locationName, messages: apiMessages })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Request failed');
      } else {
        const llmText = data.qwen?.text || t('no_response');
        const structured = formatFlow(data);
        setFacts(data);
        
        // Add assistant message to thread
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `**Sagot sa Presyo:**\n${llmText}\n\n---\n**Datos:**\n${structured}`,
          facts: data
        }]);
      }
    } catch (e:any) { setErrorMsg(e.message); } finally { setLoading(false); }
  };

  // Auto-submit initial query when component mounts
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

      <h2>{t("price_chat_title")}</h2>

      <div style={{padding:'10px',background:'#ffd7004d',borderLeft:'4px solid #FFD700',marginBottom:'20px',fontSize:'0.85em'}}>
        {t('price_chat_disclaimer')} {facts?.price?.stale && <span style={{color:'#b00'}}> (Fallback sa mas lumang datos)</span>}
      </div>

      <p style={{ fontWeight: "bold" }}>
        {t("context")}: {crop} {t("in_location")} {locationName}
      </p>

      {(() => {
        const latestAssistant = [...messages].reverse().find(m => m.role === 'assistant');
        if (!latestAssistant) return null;
        return (
          <div style={{marginBottom:24}}>
            <h3>{t('response')}:</h3>
            <div style={{padding:'10px',border:'1px solid #ccc',borderRadius:4,whiteSpace:'pre-wrap'}}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{latestAssistant.content}</ReactMarkdown>
            </div>
          </div>
        );
      })()}

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={4}
        placeholder={t("price_chat_textarea")}
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
    </div>
  );
}
