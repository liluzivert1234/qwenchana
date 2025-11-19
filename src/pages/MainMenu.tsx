// src/pages/MainMenu.tsx

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Define the menu items
const menuItems = [
  {
    titleKey: "menu_prices",
    route: "/chat/price",
    initialQuery: "Current market price and historical trends for",
  },
  {
    titleKey: "menu_weather",
    route: "/chat/weather",
    initialQuery: "Typical climate and major weather risks for",
  },
  {
    titleKey: "menu_farming",
    route: "/chat/farming",
    initialQuery: "Best practice management advice for",
  },
];

export default function MainMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = (location.state as any)?.username || "Guest";

  const { t, i18n } = useTranslation();

  const [crop, setCrop] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const isFormComplete = crop.trim() !== "" && locationInput.trim() !== "";

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    if (!isFormComplete) return;

    const context = `${crop} in ${locationInput}`;
    const fullInitialQuery = `${item.initialQuery} ${context}?`;

    navigate(item.route, {
      state: {
        username,
        crop,
        location: locationInput,
        initialQuery: fullInitialQuery,
      },
    });
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "tl" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 800,
        margin: "auto",
        textAlign: "center",
      }}
    >
      <button
        onClick={toggleLanguage}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: "8px 15px",
          backgroundColor: "#333",
          color: "white",
          zIndex: 10,
        }}
      >
        {i18n.language === "en" ? "Tagalog 🇵🇭" : "English 🇺🇸"}
      </button>

      <h1 style={{ color: "#4CAF50", fontSize: "3.5em", marginBottom: 10 }}>
        Qwentory
      </h1>

  
      <h2>{"Welcome, Farmer!"}</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <input
          type="text"
          placeholder={t("placeholder_crop")}
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "1em",
            borderRadius: 4,
            border: "1px solid #ccc",
            width: "40%",
          }}
        />
        <input
          type="text"
          placeholder={t("placeholder_location")}
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "1em",
            borderRadius: 4,
            border: "1px solid #ccc",
            width: "40%",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          opacity: isFormComplete ? 1 : 0.4,
          pointerEvents: isFormComplete ? "auto" : "none",
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item.route}
            onClick={() => handleMenuClick(item)}
            style={{
              padding: "40px 20px",
              cursor: isFormComplete ? "pointer" : "not-allowed",
              background: isFormComplete ? "#4CAF50" : "#A5A5A5",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: "1.2em",
              fontWeight: "bold",
              transition: "background 0.3s",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) =>
              isFormComplete && (e.currentTarget.style.background = "#45a049")
            }
            onMouseOut={(e) =>
              isFormComplete && (e.currentTarget.style.background = "#4CAF50")
            }
          >
            {t(item.titleKey)}
          </div>
        ))}
      </div>
      {!isFormComplete && (
        <p style={{ color: "red", marginTop: "15px" }}>
          {t("warning_complete_fields")}
        </p>
      )}
    </div>
  );
}
