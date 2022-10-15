import { v4 as uuidv4 } from 'uuid';
import { values, omit, forOwn, merge } from 'lodash';
import * as ws from 'ws';

interface PlayerInfo {
	playerName: string;
	playerAvatar: string;
	socket?: ws.WebSocket;
	isHost: boolean;
}

interface PlayerIdToPlayer {
	[playerId: string]: PlayerInfo;
}

interface GameInfo {
	gameId: string;
	players: PlayerIdToPlayer;
}

interface CurrentGames {
	[gameId: string]: GameInfo;
}

const GAME_ID_LENGTH = 5;
const currentGames: CurrentGames = {};

function makeGameId() {
	const longId = uuidv4();

	return longId.slice(0, GAME_ID_LENGTH);
}

function createNewGame(playerId: string, playerInfo: PlayerInfo): GameRoomInfoMessage {
	const gameId = makeGameId();

	currentGames[gameId] = {
		gameId,
		players: { [playerId]: playerInfo }
	};

	return {
		value: {
			gameId,
			players: [playerInfo],
			isHost: true
		},
		msgType: 'gameRoomInfo'
	};
}

// what happens when joining a game that is in progress?
function joinGame(gameId: string, playerId: string, playerInfo: PlayerInfo): GameRoomInfoMessage {
	// deal with missing game?
	const gameInfo = currentGames[gameId];

	gameInfo.players[playerId] = playerInfo;

	const currentGameInfo = {
		value: {
			gameId,
			players: values(gameInfo.players).map(p => omit(p, ["socket"])),
			isHost: false
		},
		msgType: 'gameRoomInfo'
	};

	// broadcast out that a new player joined
	values(gameInfo.players).map((playerValue) => {
		if (playerValue.socket) {
			const isHostValue = merge({}, currentGameInfo.value, {isHost: playerValue.isHost});
			playerValue.socket.send(JSON.stringify(
				merge({}, currentGameInfo, {value:isHostValue})
			));
		}
	})
	currentGames[gameId] = gameInfo;

	return currentGameInfo as GameRoomInfoMessage;
}

function addSocketToGame(gameId: string, playerId: string, socket: ws.WebSocket) {
	// deal with missing game?
	const gameInfo = currentGames[gameId];

	const playerInfo = gameInfo.players[playerId];
	playerInfo.socket = socket;

	if (playerInfo.isHost) {
		playerInfo.socket.onmessage = (msg) => {
			if (msg.type == "message") {
				const parsedMsg = JSON.parse(msg.data as string) as ServerMessageTypeUnion;
				if (parsedMsg.msgType == "startGame") {
					// broadcast game start message
					forOwn(currentGames[gameId].players, (value) => {
						if (value.socket) {
							value.socket.send(JSON.stringify({
								msgType: "startGame",
								value: { countDownSeconds: 5 }
							}));
						}
					})

					if (playerInfo.socket) {
						playerInfo.socket.onmessage = null;
					}
				}
			}

		}
	}
	currentGames[gameId] = gameInfo;
}

export default {
	createNewGame,
	joinGame,
	addSocketToGame
};