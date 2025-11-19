import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FarmingChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const username = (location.state as any)?.username || "Guest";
  const crop = (location.state as any)?.crop || "";
  const locationName = (location.state as any)?.location || "";
  const initialQuery = (location.state as any)?.initialQuery || "";

  const [userInput, setUserInput] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const DASHSCOPE_API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;

    useEffect(() => {
  if (initialQuery) {
    sendMessage(initialQuery);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const sendMessage = async (queryToSend: string) => {
    if (!queryToSend.trim()) return;

    setLoading(true);
    if (queryToSend !== initialQuery) {
      setResponseText("");
    }

    const lang = i18n.language === "tl" ? "Tagalog (Filipino)" : "English";
    const langInstruction = `Answer the entire request ENTIRELY in ${lang}. `;
    const finalQuery = langInstruction + queryToSend;

    try {
      const res = await fetch(
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: [
              {
                role: "system",
                content:
                  "You are a highly knowledgeable agricultural extension expert. Be concise as possible while providing detailed general advice on crop management, planting, fertilization, and pest management.",
              },
              { role: "user", content: finalQuery },
            ],
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        const reply = data.choices?.[0]?.message?.content || t("no_response");
        setResponseText(reply);
      } else {
        setResponseText(
          `${t("error")}: ${data.error?.message || t("request_failed")}`
        );
      }
    } catch (err: any) {
      setResponseText(`${t("error")}: ${err.message}`);
    }

    setLoading(false);
  };

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

      <div
        style={{
          padding: "10px",
          backgroundColor: "#ffd7004d",
          borderLeft: "4px solid #FFD700",
          marginBottom: "20px",
          fontSize: "0.9em",
        }}
      >
        {t("farming_chat_disclaimer")}
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


      {responseText && (
        <div>
          <h3>{t("response")}:</h3>
          <div
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {responseText}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
