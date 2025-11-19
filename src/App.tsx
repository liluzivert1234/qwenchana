import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainMenu from "./pages/MainMenu";
import PriceChat from "./pages/PriceChat";
import WeatherChat from "./pages/WeatherChat";
import FarmingChat from "./pages/FarmingChat";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Assuming a Login page is at the root path */}
        <Route path="/" element={<Login />} />

        {/* YES! This is your main menu path */}
        <Route path="/menu" element={<MainMenu />} />

        {/* Dedicated Chat Pages */}
        <Route path="/chat/price" element={<PriceChat />} />
        <Route path="/chat/weather" element={<WeatherChat />} />
        <Route path="/chat/farming" element={<FarmingChat />} />

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
