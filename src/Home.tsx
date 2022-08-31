import React from "react";
import { useState } from "react";
import styled from "styled-components";
import { ReactComponent as ManHoodie } from "./svg/man_hoodie.svg";
import { ReactComponent as NamePlate } from "./svg/name_plate.svg";
import SvgButton from "./components/SvgButton";
import { useNavigate } from "react-router-dom";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.div`
  font-family: cursive;
  font-size: 64px;
`;

const PlayerContainer = styled.div`
  width: 60%;
  fill: white;
  stroke: black;
`;

const PlateContainer = styled.div`
  width: 95%;
  position: relative;
`;

const ButtonContainer = styled.div`
  width: 80%;
  #svg-button-text {
    text-anchor: middle;
    font-family: "News Cycle";
    font-size: 16px;
    fill: black;
    stroke: black;
    stroke-width: 0.1px;
  };
`;
const LowerContainer = styled.div`
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 300px;
  flex-direction: column;
  display: flex;
  margin-top: 10px;
`;
const NameInput = styled.input`
  position: absolute;
  margin: auto;
  text-align: center;
  left: 0;
  right: 0;
  width: 60%;
  top: 26px;
  font-size: 36px;
  background: none;
  border: none;
`;

function Home() {
  const [playerName, setPlayerName] = useState("Player 1");
  const navigate = useNavigate();

  const clickButton = () => {
    navigate("/singlePlayer", { state: { playerName } });
  };

  return (
    <Wrapper>
      <Title>Trivia Quote</Title>
      <PlayerContainer>
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" />
          <ManHoodie></ManHoodie>
        </svg>
      </PlayerContainer>
      <LowerContainer>
        <PlateContainer>
          <NamePlate></NamePlate>
          <NameInput
            value={playerName}
            onChange={(v) => setPlayerName(v.target.value)}
          ></NameInput>
        </PlateContainer>
        <ButtonContainer onClick={clickButton}>
          <SvgButton>Single Player</SvgButton>
        </ButtonContainer>
      </LowerContainer>
    </Wrapper>
  );
}

export default Home;
