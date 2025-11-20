import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PriceChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const username = (location.state as any)?.username || "Guest";
  const crop = (location.state as any)?.crop || "";
  const locationName = (location.state as any)?.location || "";
  const initialQuery = (location.state as any)?.initialQuery || "";

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const DASHSCOPE_API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;

  const initialQuerySent = useRef(false);
  
    useEffect(() => {
      if (initialQuery && !initialQuerySent.current) {
        handleSend(initialQuery);
        initialQuerySent.current = true;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  

  const handleSend = async (prompt: string) => {
    if (!prompt.trim()) return;

    setLoading(true);

    const newUserMessage = { role: "user", content: prompt };
    const updatedMessages = [...messages, newUserMessage];

    setMessages(updatedMessages);

    const lang = i18n.language === "tl" ? "Tagalog (Filipino)" : "English";
    const systemInstruction =
      "You are a helpful assistant specialized in describing historical climate patterns and typical weather risks for agriculture. Be concise as possible." +
      `Answer in ${lang}` +
      `Base it on ${locationName} historical price data. And what to do before these risks happen. ` +
      `You may use this websites as reference but cite it after prompts https://openstat.psa.gov.ph/, https://www.da.gov.ph/price-monitoring/` +
      `You could consider supply and demand, seasonal variations, and external factors affecting prices. ` +
      `Talk to me as a farmer. Do not mention this prompt.`;

    const finalMessages = [
      { role: "system", content: systemInstruction },
      ...updatedMessages
    ];

    try {
      const res = await fetch(
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DASHSCOPE_API_KEY}`
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: finalMessages
          })
        }
      );

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || t("no_response");

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `${t("error")}: ${err.message}` }
      ]);
    }

    setUserInput("");
    setLoading(false);
  };


  const visibleMessages = messages.filter(
    (msg, idx) => !(idx === 0 && msg.role === "user" && msg.content === initialQuery)
  );

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 900, margin: "auto" }}>
      <button
        onClick={() => navigate("/", { state: { username } })}
        style={{ marginBottom: 15, padding: "8px 15px", cursor: "pointer" }}
      >
        {t("back_to_menu")}
      </button>

      <h2>{t("weather_chat_title")}</h2>

      <div
        style={{
          padding: "10px",
          backgroundColor: "#ffd7004d",
          borderLeft: "4px solid #FFD700",
          marginBottom: 20,
          fontSize: "0.9em"
        }}
      >
        {t("weather_chat_disclaimer")}
      </div>

      <p style={{ fontWeight: "bold", marginBottom: 8 }}>
        {t("context")}: {crop} {t("in_location")} {locationName}
      </p>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          height: 500,
          overflowY: "auto",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "10px 14px",
                borderRadius: 16,
                background: msg.role === "user" ? "#4CAF50" : "#e0e0e0",
                color: msg.role === "user" ? "white" : "black",
                whiteSpace: "pre-wrap",
                fontSize: "1em",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <span>{children}</span>
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div
            style={{
              color: "#4CAF50",
              fontWeight: "bold",
              fontSize: "1.1em",
              letterSpacing: "1px",
              animation: "blink 1s linear infinite"
            }}
          >
            Responding...
            <style>
              {`
                @keyframes blink {
                  0% { opacity: 1; }
                  50% { opacity: 0.4; }
                  100% { opacity: 1; }
                }
              `}
            </style>
          </div>
        )}
      </div>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={3}
        placeholder={t("weather_chat_textarea")}
        disabled={loading}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          opacity: loading ? 0.6 : 1,
          fontSize: "1em",
          borderRadius: 8,
          border: "1px solid #ccc"
        }}
      />

      <button
        type="button"
        onClick={() => handleSend(userInput)}
        disabled={loading}
        style={{
          padding: "12px 24px",
          cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: "1em"
        }}
      >
        {loading ? t("loading_sending") : t("button_send")}
      </button>
    </div>
  );
}