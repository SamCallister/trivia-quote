import React from "react";
import { useState } from "react";
import styled from "styled-components";
import SvgButton from "./components/SvgButton";
import { useNavigate } from "react-router-dom";
import { device } from './service/deviceService';
import { avatarIds } from "./components/Avatar";
import { min, max, merge, findIndex } from "lodash";
import axios from "axios";
import MissingGameModel from './components/MissingGameModal';
import Player from "./components/Player";
import localPlayerInfo from "./service/localPlayerInfo";


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
  width: 70%;
`;


const ButtonContainer = styled.div`
  width: 80%;
  margin-bottom: 8px;
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

const JoinGameInput = styled.input`
margin-bottom:16px;
height: 32px;
font-size: 24px;
width: 60%;
text-align: center;
background-color: transparent;
border-left:none;
border-top:none;
border-right:none;
border-bottom:1px solid black;
outline:none;`;


function Home() {
  const [playerInfo, setPlayerInfo] = useState(localPlayerInfo.getPlayerInfo());
  const [avatarIndex, setAvatarIndex] = useState(
    findIndex(avatarIds, (avatarId) => avatarId === playerInfo.playerAvatar)
  );
  const [isMissingGameModalOpen, setMissingGameModalOpen] = useState(false);
  const [joinGameId, setJoinGameId] = useState("");
  const navigate = useNavigate();

  const clickCreateNewMultiplayer = () => {

    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
      }
    };
    // call server with post to make new game
    axios.post("/multiplayer-game", playerInfo, axiosConfig)
      .then((res) => {
        const gameRoomInfo = res.data as GameRoomInfoMessage;
        navigate(`/game/${gameRoomInfo.value.gameId}`, {
          state: gameRoomInfo,
        });
      });

    // server responds with roomId

    // when joining the roomId on the client setup a socket connection
    // with the server and attempt to join the game with a given roomID
  };

  const clickJoinGameInModal = () => {
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
      }
    };
    // call server with put to join existing game
    axios.put(`/multiplayer-game/${joinGameId}`, playerInfo, axiosConfig)
      .then((res) => {
        const gameRoomInfo = res.data as GameRoomInfoMessage;
        navigate(`/game/${gameRoomInfo.value.gameId}`, {
          state: gameRoomInfo,
        });
      })
      .catch((err) => {
        setMissingGameModalOpen(true);
      });
  };

  const moveCharIndex = (direction: number) => {
    const newCharIndex = avatarIndex + direction;
    const boundedCharIndex = min([max([newCharIndex, 0]), avatarIds.length - 1]);
    setPlayerInfo(merge({}, playerInfo, { playerAvatar: avatarIds[boundedCharIndex] }));
    setAvatarIndex(boundedCharIndex);
  };

  return (
    <Wrapper>
      <Title>Trivia Quote</Title>
      <PlayerContainer><Player></Player></PlayerContainer>
      <LowerContainer>
        <ButtonContainer>
          <SvgButton clickButtonHandler={clickCreateNewMultiplayer}>
            New Game
          </SvgButton>
        </ButtonContainer>
        <JoinGameInput type="text" onChange={(e) => setJoinGameId(e.target.value)} value={joinGameId} placeholder="enter game id"></JoinGameInput>
        <ButtonContainer>
          <SvgButton clickButtonHandler={clickJoinGameInModal}>
            Join Game
          </SvgButton>
        </ButtonContainer>
        <MissingGameModel isOpen={isMissingGameModalOpen}
          gameId={joinGameId}
          onClose={() => setMissingGameModalOpen(false)}></MissingGameModel>
      </LowerContainer>
    </Wrapper>
  );
}


export default Home;
