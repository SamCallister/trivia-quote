import React from "react";
import "./App.css";
import Home from "./Home";
import Game from "./Game";
import GameRoom from "./GameRoom";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { QueryClient, QueryClientProvider } from 'react-query';

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
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path={"/"} element={<Home></Home>} />
            <Route path={`/singlePlayer`} element={<Game></Game>}></Route>
            <Route path={`/game/:id`} element={<GameRoom></GameRoom>}></Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
