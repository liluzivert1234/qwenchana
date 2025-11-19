// src/pages/WeatherChat.tsx

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function WeatherChat() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve context data passed from MainMenu
  const username = (location.state as any)?.username || "Guest";
  const crop = (location.state as any)?.crop || "";
  const locationName = (location.state as any)?.location || "";
  const initialQuery = (location.state as any)?.initialQuery || "";

  const [userInput, setUserInput] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const DASHSCOPE_API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;

  const sendMessage = async (queryToSend: string) => {
    if (!queryToSend.trim()) return;

    setLoading(true);
    if (queryToSend !== initialQuery) {
      setResponseText("");
    }

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
                  "You are a helpful assistant specialized in describing historical climate patterns and typical weather risks for agriculture.",
              },
              { role: "user", content: queryToSend },
            ],
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        const reply = data.choices?.[0]?.message?.content || "No response.";
        setResponseText(reply);
      } else {
        setResponseText(`Error: ${data.error?.message || "Request failed"}`);
      }
    } catch (err: any) {
      setResponseText("Error: " + err.message);
    }

    setLoading(false);
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
        onClick={() => navigate("/menu", { state: { username } })}
        style={{ marginBottom: 15, padding: "8px 15px", cursor: "pointer" }}
      >
        ← Back to Main Menu
      </button>

      <h2>☀️ Weather Assistant</h2>

      {/* ⚠️ CRITICAL DISCLAIMER */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "#ffd7004d",
          borderLeft: "4px solid #FFD700",
          marginBottom: "20px",
          fontSize: "0.9em",
        }}
      >
        ⚠️ **DATA ALERT:** This assistant is currently using **base Qwen's
        general knowledge**. The weather information provided is **NOT** from
        real-time APIs and reflects historical/typical climate, not the current
        forecast.
      </div>

      <p style={{ fontWeight: "bold" }}>
        Context: {crop} in {locationName}
      </p>
      <p>Logged in as: {username}</p>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={4}
        placeholder="Ask a follow-up question (e.g., 'What is the risk of frost in this area?')..."
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
        {loading ? "Sending..." : "Send Message"}
      </button>
      {responseText && (
        <div>
          <h3>Response:</h3>
          <div style={{ whiteSpace: "pre-wrap" }}>{responseText}</div>
        </div>
      )}
    </div>
  );
}
