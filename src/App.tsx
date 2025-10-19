import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";
import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import GlobalContextProvider from "./context/GlobalContext";
import Game from "./Game";

export default function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);
  return (
    <div>
      <GlobalContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:id" element={<Game />} />
          </Routes>
        </BrowserRouter>
      </GlobalContextProvider>
    </div>
  );
}
