import React, { useEffect } from "react";
import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import styled from "styled-components";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSpring, animated } from "react-spring";
import { Avatar } from "./components/Avatar";
import SvgButton from "./components/SvgButton";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import CountDown from "./components/CountDown";
import GameMultiplayer from "./GameMultiplayer";


const GameContainer = styled.div`
	${props => props.theme.appContainerStyles}
	position: relative;
`;

const Title = styled.div`
font-size: ${props => props.theme.h1.fontSize};
text-align: center;
margin-top:16px;
`;

const RoomCode = styled.div`
font-size: ${props => props.theme.h3.fontSize};
text-align: center;
`;

const CopiedContainer = styled.span`
	position: absolute;
	margin-left: 6px;
`;

const PlayerContainer = styled.div`
  fill: white;
  stroke: black;
  width: 29%;
  max-width: 60px;
  display: inline-block;
  margin-right: 8px;
`;

const PlayerRow = styled.div`
	display: flex;
	align-items:center;
	margin-left: 36px;
`;

const RowsContainer = styled.div`
	margin-top: 16px;
	min-height: 70vh;
`;

const LowerContainer = styled.div`
  justify-content: space-between;
  align-items: center;
  width: 100%;
  flex-direction: column;
  display: flex;
  margin-top: 10px;
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

const CountDownContainer = styled.div`
	display: flex;
	align-items: center;
	flex-direction: column;
	font-family: "News Cycle";
    font-size: 24px;
`

const ClipboardSpan = styled.span`
cursor: default;
`;

// message types
// GameRoomInfo -> broadcasts info on players coming and going
// Game starting -> number of seconds to count down before the game starts
function GameRoom() {
	const { id } = useParams();
	const location = useLocation();
	const [gameRoomInfo, setGameRoomInfo] = useState((location.state as GameRoomInfoMessage).value);
	const [gameStarting, setGameStarting] = useState({ starting: false, countDownSeconds: 0 });
	const [gameStarted, setGameStarted] = useState(false);
	// onCopy={() => this.setState({copied: true})} /multiplayer-game/:gameId ${id}
	const { sendMessage, lastJsonMessage, readyState, getWebSocket } = useWebSocket(`ws://${window.location.hostname}:${window.location.port}/ws/${id}`);

	useEffect(() => {
		if (lastJsonMessage !== null) {
			const socketMessage = (lastJsonMessage as unknown) as SocketMessagesUnion;

			if (socketMessage.msgType === "gameRoomInfo") {
				setGameRoomInfo(socketMessage.value);
			} else if (socketMessage.msgType === "startGame") {
				setGameStarting({
					starting: true,
					countDownSeconds: socketMessage.value.countDownSeconds
				});
				// need to transition to another UI
				// should we just pass the lastJsonMessage and sendMessage down to the component?
			} else {
				setGameStarted(true);
			}
		}

	}, [lastJsonMessage])

	const [animationProps, api] = useSpring(() => {
		return {
			from: { opacity: 0 }
		}
	});
	const startGame = () => {
		const startGame = { msgType: "startGame" };
		sendMessage(JSON.stringify(startGame));
	};

	const getLowerContainerContent = () => {
		if (gameStarting.starting) {
			return (<CountDownContainer>
				<div>starting in...</div>
				<CountDown seconds={gameStarting.countDownSeconds}></CountDown>
			</CountDownContainer>)
		} else if (gameRoomInfo.isHost && readyState) {
			return (<ButtonContainer onClick={startGame}>
				<SvgButton>
					Start Game
				</SvgButton>
			</ButtonContainer>);
		}
	};

	const send = (msg:SocketMessagesUnion) => {
		sendMessage(JSON.stringify(msg));
	};

	const getElements = () => {
		if (gameStarted) {
			return (<GameMultiplayer currentMessage={(lastJsonMessage as unknown) as SocketMessagesUnion}
			send={send}></GameMultiplayer>);
		}

		return (

			<GameContainer>
				<Title>Room Code</Title>

				<RoomCode>{id}<CopyToClipboard text={id}
					onCopy={() => api.start({
						to: [
							{ opacity: 1 },
							{ opacity: 0 }
						],
						from: { opacity: 0 },
						config: { duration: 1000 }
					})}>
					<ClipboardSpan>⎘</ClipboardSpan>
				</CopyToClipboard>
					<CopiedContainer>
						<animated.span style={animationProps}>Copied!</animated.span>
					</CopiedContainer>
				</RoomCode>
				<RowsContainer>
					{gameRoomInfo.players.map((p, i) => {
						return (<PlayerRow key={i}>
							<PlayerContainer>
								<svg viewBox="0 0 100 100">
									<circle cx="50" cy="50" r="48" />
									<Avatar avatarId={p.playerAvatar}></Avatar>
								</svg>
							</PlayerContainer>
							{p.playerName}
						</PlayerRow>);
					})}
				</RowsContainer>
				<LowerContainer>
					{getLowerContainerContent()}
				</LowerContainer>
			</GameContainer>);
	}

	return getElements();
}

export default GameRoom;