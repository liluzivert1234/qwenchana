import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainMenu from "./pages/MainMenu";
import PriceChat from "./pages/PriceChat";
import WeatherChat from "./pages/WeatherChat";
import FarmingChat from "./pages/FarmingChat";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}> {/* <-- Add flex container */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/chat/price" element={<PriceChat />} />
            <Route path="/chat/weather" element={<WeatherChat />} />
            <Route path="/chat/farming" element={<FarmingChat />} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
