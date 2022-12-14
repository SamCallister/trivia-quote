import { v4 as uuidv4 } from 'uuid';
import { values, omit, forOwn, merge, keys, map } from 'lodash';
import * as ws from 'ws';
import gamePlay from './gamePlay';
import loggerService from './logger';

interface PlayerInfo {
	playerName: string;
	playerAvatar: string;
	playerId: string;
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
const COUNT_DOWN_SECONDS = 5;

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
			isHost: true,
			yourPlayerId: playerId
		},
		delay: 0,
		msgType: 'gameRoomInfo'
	};
}

function broadcastGameStateToAll(gameInfo: GameInfo): GameRoomInfoMessage {

	const currentGameInfo = {
		value: {
			gameId: gameInfo.gameId,
			players: values(gameInfo.players).map(p => omit(p, ["socket"])),
			isHost: false,
			yourPlayerId: ""
		},
		msgType: 'gameRoomInfo',
		delay: 0
	};

	values(gameInfo.players).map((playerValue) => {
		if (playerValue.socket) {
			const isHostValue = merge({}, currentGameInfo.value, { isHost: playerValue.isHost, yourPlayerId: playerValue.playerId });
			playerValue.socket.send(JSON.stringify(
				merge({}, currentGameInfo, { value: isHostValue})
			));
		}
	});

	return currentGameInfo as GameRoomInfoMessage;
}

// what happens when joining a game that is in progress?
function joinGame(gameId: string, playerId: string, playerInfo: PlayerInfo): GameRoomInfoMessage | null {
	// deal with missing game?
	const gameInfo = currentGames[gameId];

	if (!gameInfo) {
		return null;
	}

	gameInfo.players[playerId] = playerInfo;

	const currentGameInfo = broadcastGameStateToAll(gameInfo);

	currentGames[gameId] = gameInfo;

	// add playerId to current game info
	currentGameInfo.value.yourPlayerId = playerId;

	return currentGameInfo;
}

function addSocketToGame(gameId: string, playerId: string, socket: ws.WebSocket) {
	// deal with missing game?
	const gameInfo = currentGames[gameId];

	const playerInfo = gameInfo.players[playerId];
	// playerInfo is undefined here?

	playerInfo.socket = socket;

	playerInfo.socket.onmessage = (msg) => {
		if (msg.type == "message") {
			const parsedMsg = JSON.parse(msg.data as string) as ServerMessageTypeUnion;
			if (parsedMsg.msgType === "startGame") {
				// broadcast game start message
				forOwn(currentGames[gameId].players, (value) => {
					if (value.socket) {
						value.socket.send(JSON.stringify({
							msgType: "startGame",
							value: { countDownSeconds: COUNT_DOWN_SECONDS }
						}));
					}
				})

				if (playerInfo.socket) {
					playerInfo.socket.onmessage = null;
				}

				// init gamePlay
				gamePlay.initGame(
					gameId
				).then((newGame) => {

					forOwn(currentGames[gameId].players, (value, playerId) => {

						if (!value.socket) {
							throw new Error(`null or undefined socket for playerId:${playerId}`);
						}

						newGame.joinGame(
							value.socket, {
							msgType: "joinGame",
							value: {
								playerName: value.playerName,
								playerAvatar: value.playerAvatar,
								playerId: playerId
							}
						})
					})

					loggerService.getLogger().info(`starting game:${gameId}`);
					// change the socket close behavior to remove players from the game only
					map(newGame.players, (p) => {
						if(p.socket) {
							p.socket.onclose = () => {
								// remove player from the game
								delete newGame.players[p.playerId];
							}
						}
					});

					newGame.start((COUNT_DOWN_SECONDS + .1) * 1000);
					delete currentGames[gameId];
				});
			} else if (parsedMsg.msgType === "updatePlayerInfo") {
				// update the playerinfo in the game state
				const currentPlayerInfo = gameInfo.players[playerId];

				currentPlayerInfo.playerAvatar = parsedMsg.value.playerAvatar;
				currentPlayerInfo.playerName = parsedMsg.value.playerName;

				broadcastGameStateToAll(currentGames[gameId]);
			}
		}

	}

	playerInfo.socket.onclose = () => {

		const maybeCurrentGame = currentGames[gameId];
		if (maybeCurrentGame) {
			const maybePlayerInfo = maybeCurrentGame.players[playerId];
			delete maybeCurrentGame.players[playerId];

			if (maybePlayerInfo.isHost) {
				// close all sockets? -> client deals on close event the game was cancelled
				map(maybeCurrentGame.players, (v) => {
					if (v.socket) {
						v.socket.close();
					}
				});
				// delete game info
				delete currentGames[gameId];
			}
			else if (keys(maybeCurrentGame.players).length) {
				broadcastGameStateToAll(gameInfo);
			} else {
				// probably not reachable?
				delete currentGames[gameId];
			}

		}

		// set update message
	};


	currentGames[gameId] = gameInfo;
}

export default {
	createNewGame,
	joinGame,
	addSocketToGame
};