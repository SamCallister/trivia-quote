interface MessageData {
	msgType: string;
}

interface StartGameMessage extends MessageData {
	msgType: "startGame"
}

interface GameRoomInfo {
	gameId: string;
	players: PlayerInfo[];
	isHost: boolean;
}

interface GameRoomInfoMessage extends MessageData {
	msgType: "gameRoomInfo",
	value: GameRoomInfo
}


type ServerMessageTypeUnion = StartGameMessage;