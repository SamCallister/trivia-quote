import React from "react";
import "./App.css";
import Home from "./Home.jsx";
import Game from "./Game.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  const currentPath = document.location.pathname;

  return (
    <div className="blue-background">
      <BrowserRouter>
        <Routes>
          <Route path={currentPath} element={<Home></Home>} />
          <Route path={`${currentPath}/game`} element={<Game></Game>}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
