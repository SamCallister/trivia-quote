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

type SocketMessagesUnion = StaticRoundMessage | QuestionMessage | AnswerMessage;

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