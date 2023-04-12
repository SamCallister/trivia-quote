interface LocalPlayerInfo {
	playerName: string;
	playerAvatar: string;
	visitedHelpPage?: boolean;
	wonAIGame?: boolean;
	wonHumanGame?: boolean;
	numWins?: number;
	finishedGame?: boolean;
}

interface GameRoomInfo {
	gameId: string;
	players: PlayerInfo[];
	isHost: boolean;
}