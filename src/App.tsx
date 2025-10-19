import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GlobalContextProvider from "./context/GlobalContext";
import Game from "./Game";
import Home from "./Home";

export default function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  //test comment - remove late sds
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
