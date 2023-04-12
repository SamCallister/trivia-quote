import React, { useState } from "react";
import "./App.css";
import Home from "./Home";
import Contact from "./Contact";
import GameRoom from "./GameRoom";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { QueryClient, QueryClientProvider } from 'react-query';
import { useLocalStorage } from "./hooks/localStorage";
import localPlayerInfoService from "./service/localPlayerInfo";

const theme = {
  fonts: ["News Cycle"],
  h1: { fontSize: "48px" },
  h2: { fontSize: "36px" },
  h3: { fontSize: "24px" },
  normalText: { fontSize: "24px" },
  appContainerStyles: {
    maxWidth: "450px",
    margin: "auto"
  }
};

const queryClient = new QueryClient();

function App() {

  const [localPlayerInfo, setPlayerInfo] = useLocalStorage(
    localPlayerInfoService.PLAYER_INFO_KEY,
    localPlayerInfoService.getDefaultPlayer()
  );

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path={"/"} element={<Home localPlayerInfo={localPlayerInfo} updateLocalPlayerInfo={setPlayerInfo}></Home>} />
            <Route path={"/contact"} element={<Contact></Contact>} />
            <Route path={`/:id`} element={<GameRoom localPlayerInfo={localPlayerInfo} updateLocalPlayerInfo={setPlayerInfo}></GameRoom>}></Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
