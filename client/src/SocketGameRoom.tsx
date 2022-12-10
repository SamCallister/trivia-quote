import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Player from "./components/Player";
import localPlayerInfo from "./service/localPlayerInfo";
import { Avatar } from "./components/Avatar";
import { useDebounce } from "./hooks/debounce";
import useWebSocket from 'react-use-websocket';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import CountDown from "./components/CountDown";
import { useSpring, animated } from "react-spring";
import GameMultiplayer from "./GameMultiplayer";
import SvgButton from "./components/SvgButton";
import { device } from './service/deviceService';
import TriviaQuoteModal from "./components/TriviaQuoteModal";
import { useNavigate } from "react-router-dom";
import { use100vh } from 'react-div-100vh'
import ClientConstants from "./ClientConstants";
import { Link } from "react-router-dom";
import HelpModal from "./components/HelpModal";

interface SocketGameRoomProps {
	gameId: string;
	gameRoomInfo: GameRoomInfoMessageValue;
}

const WEB_SOCKET_PREFIX = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';

const GameRoomContainer = styled.div`
	${props => props.theme.appContainerStyles}
	position: relative;
	display: flex;
  	flex-direction: column;
  	align-items: center;
  	${props => props.theme.appContainerStyles}
  	margin:auto;
`;

const PlayerSelectContainer = styled.div`
  width: 70%;
  margin: auto;
`;

const RowsContainer = styled.div`
	margin-top: 16px;
	width: 100%;
`;

const PlayerRow = styled.div`
	display: flex;
	align-items:center;
	margin-left: 36px;
`;

const PlayerContainer = styled.div`
  fill: white;
  stroke: black;
  width: 29%;
  max-width: 60px;
  display: inline-block;
  margin-right: 8px;
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

const UpperContainer = styled.div`
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

const ReturnHomeLink = styled.div`
position:absolute;
top:0px;
right:10px;`;

const HelpModalContainer = styled.div`
position:absolute;
top:0px;
left:10px;`;


function SocketGameRoom(props: SocketGameRoomProps) {
	const { gameId } = props;

	const viewHeight = `${use100vh() * .7}px`;
	const navigate = useNavigate();
	const [socketClosed, setSocketClosed] = useState(false);
	const { sendMessage, lastJsonMessage, readyState } = useWebSocket(
		`${WEB_SOCKET_PREFIX}://${window.location.hostname}:${window.location.port}/ws/${gameId}`,
		{
			onClose: (e) => {
				setSocketClosed(true);
			}
		}
	);
	const [playerInfo, setPlayerInfo] = useState(localPlayerInfo.getPlayerInfo());
	const [gameRoomInfo, setGameRoomInfo] = useState(props.gameRoomInfo);
	const [gameStarted, setGameStarted] = useState(false);
	const [gameStarting, setGameStarting] = useState({ starting: false, countDownSeconds: 0 });
	const [existingInterval, setExistingInterval] = useState(null);
	const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

	const send = (msg: SocketMessagesUnion) => {
		sendMessage(JSON.stringify(msg));
	};

	const debouncedPlayerInfo = useDebounce<PlayerInfo>(playerInfo, 500);

	const startGame = () => {
		const startGame = { msgType: "startGame" };
		sendMessage(JSON.stringify(startGame));
	};

	useEffect(() => {
		if (!gameStarted && !existingInterval) {
			// every 30 seconds
			const newInterval = window.setInterval(() => {
				sendMessage(JSON.stringify({
					msgType: "ping"
				}))
			}, ClientConstants.KEEP_ALIVE_INTERVAL);
			setExistingInterval(newInterval);
		} else {
			window.clearInterval(existingInterval);
		}
	}, [gameStarted]);

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
	const [animationPropsUrl, apiUrl] = useSpring(() => {
		return {
			from: { opacity: 0 }
		}
	});

	const getLowerContainerContent = () => {
		if (gameStarting.starting) {
			return (<CountDownContainer>
				<div>starting in...</div>
				<CountDown seconds={gameStarting.countDownSeconds}></CountDown>
			</CountDownContainer>)
		} else if (gameRoomInfo && readyState) {
			return (<ButtonContainer>
				<RoomCodeContainer>Room Code:
					<RoomCode>{gameId}<CopyToClipboard text={gameId}
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
				{gameRoomInfo.isHost && (<SvgButton clickButtonHandler={startGame}>
					Start Game
				</SvgButton>)}
			</ButtonContainer>);
		}
	};

	if (socketClosed) {
		const closeGameMessage = gameStarted ? "Game connection lost" : "Host closed the game";

		return (<TriviaQuoteModal
			isOpen={!!socketClosed}
			text={closeGameMessage}
			onClose={() => {
				navigate('/');
			}}></TriviaQuoteModal>);
	}

	if (gameStarted) {
		return (<GameMultiplayer currentMessage={(lastJsonMessage as unknown) as SocketMessagesUnion}
			send={send}></GameMultiplayer>);
	}

	return (<GameRoomContainer>
		<HelpModal
          open={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}></HelpModal>
		<ReturnHomeLink>
			<Link to={"/"}>Home</Link>
		</ReturnHomeLink>
		<HelpModalContainer><Link to={""} onClick={() => setIsHelpModalOpen(true)}>Help</Link></HelpModalContainer>
		<UpperContainer style={{ minHeight: viewHeight }}><PlayerSelectContainer><Player onChange={setPlayerInfo} disabled={gameStarting.starting}></Player></PlayerSelectContainer>
			<RowsContainer>
				{gameRoomInfo.players.filter((p) => {
					return p.playerId !== gameRoomInfo.yourPlayerId;
				})
					.map((p, i) => {
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
			</RowsContainer></UpperContainer>
		<LowerContainer>{getLowerContainerContent()}</LowerContainer></GameRoomContainer>);
}

export default SocketGameRoom;