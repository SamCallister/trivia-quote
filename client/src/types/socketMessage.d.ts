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
	playerSpeedScoreDelta: number;
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

interface CategoryInfo {
	name: string;
	categoryId: string;
}

interface UserChoiceRoundMessage extends MessageData {
	msgType: "userChoiceRound";
	value: {
		titleText: string;
		playerName: string;
		playerAvatar: string;
		text: string;
		isChoosingPlayer: boolean;
		categories: CategoryInfo[]
	}
}

interface UserRoundChoiceValue {
	categoryId: string;
}

interface UserRoundChoice extends MessageData {
	msgType: "userRoundChoice";
	value: UserRoundChoiceValue;
}

interface PointTransformer {
	(score: number): number;
}

interface QuestionPointTransforms {
	questionPointTransform:PointTransformer;
	speedPointTransform:PointTransformer;
}

interface QuestionModifierMessageValue {
	titleText:string;
	text:string[];
	questionPointTransforms:QuestionPointTransforms
}

interface QuestionModifierMessage extends MessageData {
	msgType: "questionModifierMessage";
	value: QuestionModifierMessageValue;
}

type SocketMessagesUnion = StaticRoundMessage | QuestionMessage | AnswerMessage | QuestionResultMessage | RankingMessage | FinalScoreMessage | GameRoomInfoMessage | StartGameMessage | UserChoiceRoundMessage | UserRoundChoice | QuestionModifierMessage;

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