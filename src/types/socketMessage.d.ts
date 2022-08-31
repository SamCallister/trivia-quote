interface StaticRoundMessageValue {
	title: string;
	category: string;
	roundNumber: number;
}

interface QuestionChoice {
	text: string;
	state?: boolean;
	id: string;
}

interface QuestionMessageValue {
	text: string;
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


type SocketMessagesUnion = StaticRoundMessage | QuestionMessage | AnswerMessage | QuestionResultMessage | RankingMessage | FinalScoreMessage;

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