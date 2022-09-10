import React from "react";
import { useState } from "react";
import styled from "styled-components";
import { ReactComponent as ManHoodie } from "./svg/man_hoodie.svg";
import SvgButton from "./components/SvgButton";
import { useNavigate } from "react-router-dom";
import NamePlate from "./components/NamePlate";
import { device } from './service/deviceService';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  ${props => props.theme.appContainerStyles}
  margin:auto;
`;

const Title = styled.div`
  font-family: cursive;
  font-size: 64px;

  @media ${device.mobileS} { 
    font-size: 48px;
  }

  @media ${device.mobileM} { 
    font-size: 64px;
  }
`;

const PlayerContainer = styled.div`
  width: 60%;
  fill: white;
  stroke: black;
`;

const PlateContainer = styled.div`
  width: 95%;
  position: relative;
  margin-bottom: 24px;
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
  flex-direction: column;
  display: flex;
  margin-top: 10px;
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
          <NamePlate value={playerName} inputChange={(v) => setPlayerName(v)}></NamePlate>
        </PlateContainer>
        <ButtonContainer onClick={clickButton}>
          <SvgButton>
            Single Player
            <foreignObject></foreignObject>
          </SvgButton>
        </ButtonContainer>
      </LowerContainer>
    </Wrapper>
  );
}

export default Home;
