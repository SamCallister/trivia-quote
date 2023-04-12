import React, { useEffect } from "react";
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import TriviaQuoteModal from "./components/TriviaQuoteModal";
import localPlayerInfo from "./service/localPlayerInfo";
import SocketGameRoom from "./SocketGameRoom";
import { Title } from './components/Components';
import Cookies from "universal-cookie";
import ClientConstants from "./ClientConstants";
import { useLocalStorage } from "./hooks/localStorage";

const axiosConfig = {
	headers: {
		'Content-Type': 'application/json',
		'Cache-Control': 'no-cache',
		'Pragma': 'no-cache',
		'Expires': '0',
	}
};

interface GameRoomProps {
	localPlayerInfo: LocalPlayerInfo;
	updateLocalPlayerInfo: UpdateLocalPlayerInfo;
}

// message types
// GameRoomInfo -> broadcasts info on players coming and going
// Game starting -> number of seconds to count down before the game starts
function GameRoom(props: GameRoomProps) {
	const { id } = useParams();
	const location = useLocation();
	const [gameRoomInfo, setGameRoomInfo] = useState(((location.state || {}) as GameRoomInfoMessage).value);
	const [cookies, setCookies] = useState(new Cookies());

	const [missingGameId, setMissingGameId] = useState(null);
	const [playerInfo, setPlayerInfo] = useLocalStorage(localPlayerInfo.PLAYER_INFO_KEY, localPlayerInfo.getDefaultPlayer());
	const navigate = useNavigate();


	useEffect(() => {
		if (!gameRoomInfo) {
			cookies.set(ClientConstants.GAME_ID_COOKIE, id);

			axios.put(`/multiplayer-game/${id}`, playerInfo, axiosConfig)
				.then((res) => {
					const gameRoomInfoResponse = res.data as GameRoomInfoMessage;
					setGameRoomInfo(gameRoomInfoResponse.value);
				})
				.catch((err: AxiosError) => {
					console.error("Error joining game", err);
					setMissingGameId(id);
				});
		}

		// remove location state
		window.history.replaceState({}, document.title)

	}, []);

	if (!gameRoomInfo) {
		return (<div>
			{!missingGameId && (<Title>loading...</Title>)}
			<TriviaQuoteModal
				isOpen={!!missingGameId}
				text={`Game ${missingGameId} does not exist.`}
				onClose={() => {
					navigate('/');
				}}></TriviaQuoteModal>
		</div>);
	}

	return (
		<SocketGameRoom gameId={id} gameRoomInfo={gameRoomInfo} localPlayerInfo={props.localPlayerInfo} updateLocalPlayerInfo={props.updateLocalPlayerInfo}></SocketGameRoom>
	);
}

export default GameRoom;