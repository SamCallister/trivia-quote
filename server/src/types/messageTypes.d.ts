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

interface GameData {
	[category: string]: [{
		text: string;
		id: string;
		answerId: string;
		author: string;
		choices: [{
			text: string;
			id: string;
		}];
	}]
}

interface StaticRoundMessageValue {
	title: string;
	category: string;
	roundNumber: number;
}

interface QuestionChoice {
	text: string;
	state?: string;
	id: string;
}

interface QuestionMessageValue {
	text: string;
	author: string;
	id: string;
	roundNumber: number;
	choices: Array<QuestionChoice>;
}

interface MessageData {
	msgType: string;
	delay: number
}

interface AnswerMessageValue {
	questionId: string;
	answerId: string;
}

interface JoinGameMessageValue {
	playerId: string;
	playerName: string;
	playerAvatar: string
	isFakePlayer?: boolean;
}

interface JoinGameMessage {
	msgType: 'joinGame';
	value: JoinGameMessageValue;
}

interface StaticRoundMessage extends MessageData {
	msgType: 'staticRound';
	value: StaticRoundMessageValue;
}

interface AnswerMessage extends MessageData {
	msgType: 'answer';
	value: AnswerMessageValue;
}

interface QuestionMessage extends MessageData {
	msgType: 'question';
	value: QuestionMessageValue;
	answerId: string;
}

interface QuestionResultMessageValue {
	id: string;
	answerId: string;
	playerScoreDelta: number;
	playerScore: number;
}

interface QuestionResultMessage extends MessageData {
	msgType: 'questionResult';
	value: QuestionResultMessageValue;
}

interface PlayerRankingInfo {
	playerId: string;
	playerName: string;
	playerAvatar: string;
	playerScore: number;
}

interface PlayerInfo {
	playerName: string;
	playerAvatar: string;
}

interface RankingMessageValue {
	ranking: PlayerRankingInfo[];
	roundNumber: number;
}

interface RankingMessage extends MessageData {
	msgType: 'ranking';
	value: RankingMessageValue;
}

interface FinalScoreMessage extends MessageData {
	msgType: 'finalScore';
	value: RankingMessageValue;
}

interface GameRoomInfoMessageValue {
	players: PlayerInfo[];
	isHost?: boolean;
	gameId: string;
}

interface GameRoomInfoMessage extends MessageData {
	msgType: 'gameRoomInfo';
	value: GameRoomInfoMessageValue;
}

interface StartGameMessageValue {
	countDownSeconds: number;
}

interface StartGameMessage extends MessageData {
	msgType: "startGame"
	value: StartGameMessageValue;
}

type SocketMessagesUnion = StaticRoundMessage | QuestionMessage | AnswerMessage | QuestionResultMessage | RankingMessage | FinalScoreMessage | GameRoomInfoMessage | StartGameMessage;

interface SocketMessage {
	data: SocketMessagesUnion;
}

interface OnMessageFunc {
	(data: SocketMessage): void;
}

interface SocketSendFunc {
	(data: SocketMessagesUnion): void;
}

interface Socket {
	onmessage: OnMessageFunc;
	send?: SocketSendFunc;
}

interface QuestionData {
	text: string;
	state: string;
}


type ServerMessageTypeUnion = StartGameMessage;