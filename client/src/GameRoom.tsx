import React, { useEffect } from "react";
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import TriviaQuoteModal from "./components/TriviaQuoteModal";
import localPlayerInfo from "./service/localPlayerInfo";
import SocketGameRoom from "./SocketGameRoom";
import { Title } from './components/Components';


const axiosConfig = {
	headers: {
		'Content-Type': 'application/json',
	}
};

// message types
// GameRoomInfo -> broadcasts info on players coming and going
// Game starting -> number of seconds to count down before the game starts
function GameRoom() {
	const { id } = useParams();
	const location = useLocation();
	const [gameRoomInfo, setGameRoomInfo] = useState(((location.state || {}) as GameRoomInfoMessage).value);
	
	const [missingGameId, setMissingGameId] = useState(null);
	const navigate = useNavigate();


	useEffect(() => {
		if (!gameRoomInfo) {
			const playerInfo = localPlayerInfo.getPlayerInfo();
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
		<SocketGameRoom gameId={id} gameRoomInfo={gameRoomInfo}></SocketGameRoom>
	);
}

export default GameRoom;