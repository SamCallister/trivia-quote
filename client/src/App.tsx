import React from "react";
import "./App.css";
import Home from "./Home";
import Game from "./Game";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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
  const currentPath = document.location.pathname;

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Routes>
            <Route path={currentPath} element={<Home></Home>} />
            <Route path={`${currentPath}/singlePlayer`} element={<Game></Game>}></Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
