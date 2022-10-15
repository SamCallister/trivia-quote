interface PlayerInfo {
	playerName: string;
	playerAvatar: string;
  }
  
  interface GameRoomInfo {
	gameId: string;
	players: PlayerInfo[];
	isHost: boolean;
  }