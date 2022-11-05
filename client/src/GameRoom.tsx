import React, { useEffect } from "react";
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSpring, animated } from "react-spring";
import { Avatar } from "./components/Avatar";
import SvgButton from "./components/SvgButton";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import CountDown from "./components/CountDown";
import GameMultiplayer from "./GameMultiplayer";
import { debounce } from "lodash";
import axios, { AxiosError } from "axios";
import MissingGameModal from "./components/MissingGameModal";
import localPlayerInfo from "./service/localPlayerInfo";
import { device } from './service/deviceService';
import Player from "./components/Player";
import { useDebounce } from "./hooks/debounce";

const GameRoomContainer = styled.div`
	${props => props.theme.appContainerStyles}
	position: relative;
	display: flex;
  	flex-direction: column;
  	align-items: center;
  	${props => props.theme.appContainerStyles}
  	margin:auto;
`;


const RoomCode = styled.span`
font-size: 18px;
text-align: center;
`;

const InviteLink = styled.span`
font-size: 18px;
text-align: center;`

const Invite = styled.div`
font-size: 18px;
text-align: center;
margin-bottom:16px;
position:relative;
`;

const RoomCodeContainer = styled.div`
font-size: 18px;
text-align: center;
`;

const CopiedContainer = styled.span`
	position: absolute;
	margin-left: 6px;
	margin-top: 5px;
`;

const LinkCopiedContainer = styled.span`
	position: absolute;

	@media ${device.mobileS} { 
		right:-32px;
		top:-20px;
  	}

	  @media ${device.tablet} { 
		top:unset;
		right:unset;
		margin-left: 6px;
		margin-top: 5px;
  	}
	
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
	width: 100%;
`;

const UpperContainer = styled.div`
	min-height: 80vh;
	width: 100%;	
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
margin-left: 4px;
font-size: 24px;
`;

const PlayerSelectContainer = styled.div`
  width: 70%;
  margin: auto;
`;

const axiosConfig = {
	headers: {
		'Content-Type': 'application/json',
	}
};

const WEB_SOCKET_PREFIX = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';


// message types
// GameRoomInfo -> broadcasts info on players coming and going
// Game starting -> number of seconds to count down before the game starts
function GameRoom() {
	const { id } = useParams();

	const location = useLocation();
	const [gameRoomInfo, setGameRoomInfo] = useState(((location.state || {}) as GameRoomInfoMessage).value);
	const [gameStarting, setGameStarting] = useState({ starting: false, countDownSeconds: 0 });
	const [gameStarted, setGameStarted] = useState(false);
	const [missingGameId, setMissingGameId] = useState(null);
	const { sendMessage, lastJsonMessage, readyState, getWebSocket } = useWebSocket(`${WEB_SOCKET_PREFIX}://${window.location.hostname}:${window.location.port}/ws/${id}`);
	const navigate = useNavigate();

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

	useEffect(() => {
		if (!gameRoomInfo) {
			const playerInfo = localPlayerInfo.getPlayerInfo();
			axios.put(`/multiplayer-game/${id}`, playerInfo, axiosConfig)
				.then((res) => {
					const gameRoomInfoResponse = res.data as GameRoomInfoMessage;

					setGameRoomInfo(gameRoomInfoResponse.value);
				})
				.catch((err: AxiosError) => {
					setMissingGameId(id);
				});
		}
	}, []);

	const [playerInfo, setPlayerInfo] = useState(localPlayerInfo.getPlayerInfo());
	const debouncedPlayerInfo = useDebounce<PlayerInfo>(playerInfo, 500);

	useEffect(() => {
		const updatePlayerInfoMsg = {
			msgType: "updatePlayerInfo",
			value: {
				playerName: debouncedPlayerInfo.playerName,
				playerAvatar: debouncedPlayerInfo.playerAvatar
			}
		}
		sendMessage(JSON.stringify(updatePlayerInfoMsg));
	}, [debouncedPlayerInfo]);

	const [animationProps, api] = useSpring(() => {
		return {
			from: { opacity: 0 }
		}
	});
	const [animationPropsUrl, apiUrl] = useSpring(() => {
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
		} else if (gameRoomInfo && gameRoomInfo.isHost && readyState) {
			return (<ButtonContainer>
				<RoomCodeContainer>Room Code:
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
				</RoomCodeContainer>
				<Invite>invite:<InviteLink>{document.URL}<CopyToClipboard text={document.URL}
					onCopy={() => apiUrl.start({
						to: [
							{ opacity: 1 },
							{ opacity: 0 }
						],
						from: { opacity: 0 },
						config: { duration: 1000 }
					})}>
					<ClipboardSpan>⎘</ClipboardSpan>
				</CopyToClipboard>
					<LinkCopiedContainer>
						<animated.span style={animationPropsUrl}>Copied!</animated.span>
					</LinkCopiedContainer>
				</InviteLink></Invite>
				<SvgButton clickButtonHandler={startGame}>
					Start Game
				</SvgButton>
			</ButtonContainer>);
		}
	};

	const send = (msg: SocketMessagesUnion) => {
		sendMessage(JSON.stringify(msg));
	};

	const getElements = () => {
		if (!gameRoomInfo) {
			return (<div>
				{!missingGameId && (<span>loading...</span>)}
				<MissingGameModal
					gameId={missingGameId}
					isOpen={!!missingGameId}
					onClose={() => {
						navigate('/');
					}}></MissingGameModal>
			</div>);
		}

		if (gameStarted) {
			return (<GameMultiplayer currentMessage={(lastJsonMessage as unknown) as SocketMessagesUnion}
				send={send}></GameMultiplayer>);
		}

		return (
			<GameRoomContainer>
				<UpperContainer>
				<PlayerSelectContainer><Player onChange={setPlayerInfo}></Player></PlayerSelectContainer>
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
				</UpperContainer>
				<LowerContainer>
					{getLowerContainerContent()}
				</LowerContainer>
			</GameRoomContainer>);
	}

	return getElements();
}

export default GameRoom;