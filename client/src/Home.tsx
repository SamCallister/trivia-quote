import React from "react";
import { useState } from "react";
import styled from "styled-components";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import SvgButton from "./components/SvgButton";
import { useNavigate } from "react-router-dom";
import NamePlate from "./components/NamePlate";
import { device } from './service/deviceService';
import { Avatar, avatarIds } from "./components/Avatar";
import { min, max, merge, findIndex } from "lodash";
import { useLocalStorage } from "./hooks/localStorage";
import axios from "axios";
import MissingGameModel from './components/MissingGameModal';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

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
  width: 65%;
  fill: white;
  stroke: black;
  display: flex;
`;

interface ArrowContainerProps {
  show: boolean;
};

const ArrowContainer = styled.div<ArrowContainerProps>`
  align-self: center;
  visibility: ${props => props.show ? "visible" : "hidden"};
  font-size: 24px;
`;

const PlateContainer = styled.div`
  width: 95%;
  position: relative;
  margin-bottom: 24px;
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

const ButtonContainerModal = styled.div`
  width: 100%;
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

const ModalContent = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
`;

const ModalHeader = styled.h2`
  text-align:center;
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
  const playerArray = useLocalStorage("playerInfo",
    {
      playerName: "Player 1",
      playerAvatar: avatarIds[0]
    });
  const playerInfo = playerArray[0] as PlayerInfo;
  const setPlayerInfo = playerArray[1];
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
      <PlayerContainer>
        <ArrowContainer show={avatarIndex > 0}><FaArrowLeft onClick={moveCharIndex.bind(this, -1)}></FaArrowLeft></ArrowContainer>
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" />
          <Avatar avatarId={avatarIds[avatarIndex]}></Avatar>
        </svg>
        <ArrowContainer show={avatarIndex < avatarIds.length - 1}><FaArrowRight onClick={moveCharIndex.bind(this, 1)}></FaArrowRight></ArrowContainer>
      </PlayerContainer>
      <LowerContainer>
        <PlateContainer>
          <NamePlate value={playerInfo.playerName} inputChange={(v) => setPlayerInfo(
            merge({}, playerInfo, { playerName: v })
          )}></NamePlate>
        </PlateContainer>
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
