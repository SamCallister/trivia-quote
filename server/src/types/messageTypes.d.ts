import * as ws from 'ws';

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
	yourPlayerId: string;
}

interface GameRoomInfoMessage extends MessageData {
	msgType: "gameRoomInfo",
	value: GameRoomInfo
}

interface QuestionChoice {
	text: string;
	id: string;
}

interface QuestionGameData {
	text: string;
	id: string;
	answerId: string;
	author: string;
	choices: QuestionChoice[];
	authorChoices: QuestionChoice[];
	completeText: string;
	authorAnswerId: string;
}

interface GameData {
	[category: string]: QuestionGameData[]
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

type ModifiedDisplay = "lightsOut" | "splitBrain" | "memoryLoss";

type QuestionType = "quoteBlanks" | "authorBlank";

interface QuestionMessageValue {
	text: string;
	author: string;
	id: string;
	roundNumber: number;
	choices: Array<QuestionChoice>;
	questionPointTransforms?: QuestionPointTransforms;
	modifiedDisplay?: ModifiedDisplay;
	questionAfterEffects?: QuestionAfterEffects;
	questionType: QuestionType;
	completeText: string;
}

interface MessageData {
	msgType: string;
	delay: number;
	waitForBeforeSend?: Promise<any>; // eslint-disable-line
	waitForWithDelay?: Promise<any>; // eslint-disable-line
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
	questionPointTransforms?: QuestionPointTransforms;
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
	msgType: "startGame";
	value: StartGameMessageValue;
}

interface PlayerUpdateMessageValue {
	playerName: string;
	playerAvatar: string;
}

interface PlayerUpdateMessage extends MessageData {
	msgType: "updatePlayerInfo";
	value: PlayerUpdateMessageValue;
}

interface CategoryInfo {
	name: string;
	categoryId: string;
}

interface UserChoiceRoundMessageValue {
	titleText: string;
	playerName: string;
	playerAvatar: string;
	text: string;
	isChoosingPlayer: boolean;
	categories: CategoryInfo[];
	chosenPlayer: string;
}

interface UserChoiceRoundMessage extends MessageData {
	msgType: "userChoiceRound";
	value: UserChoiceRoundMessageValue;
}

interface UserRoundChoiceValue {
	categoryId: string;
}

interface UserRoundChoice extends MessageData {
	msgType: "userRoundChoice";
	value: UserRoundChoiceValue;
}

interface NewCategoryValue {
	gameDataPromise: Promise<GameData>
}

interface NewCategory extends MessageData {
	msgType: "newCategory";
	value: NewCategoryValue;
}

interface PointTransformer {
	(score: number): number;
}

interface TransformerInfo {
	transformer: PointTransformer;
	affectsCorrectAnswer: boolean;
}

interface QuestionPointTransforms {
	questionPointTransform: TransformerInfo;
	speedPointTransform: TransformerInfo;
}

interface AfterQuestionFunction {
	(data: PlayerRankingInfo[], playerId: string, correct: boolean): boolean;
}

interface QuestionAfterEffects {
	isPlayerImpacted: AfterQuestionFunction;
	modifiedDisplay: ModifiedDisplay;
}

// score impacts
// question display impacts

interface QuestionModifications {
	modifiedDisplay: ModifiedDisplay;
	questionPointTransforms: QuestionPointTransforms;
}

interface QuestionModifierMessageValue {
	titleText: string;
	text: string[];
	questionPointTransforms: QuestionPointTransforms;
	modifiedDisplay?: ModifiedDisplay;
	questionAfterEffects?: QuestionAfterEffects
}

interface QuestionModifierMessage extends MessageData {
	msgType: "questionModifierMessage";
	value: QuestionModifierMessageValue;
}

type SocketMessagesUnion = StaticRoundMessage | QuestionMessage | AnswerMessage | QuestionResultMessage | RankingMessage | FinalScoreMessage | GameRoomInfoMessage | StartGameMessage | PlayerUpdateMessage | UserChoiceRoundMessage | UserRoundChoice | NewCategory | QuestionModifierMessage;

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


type ServerMessageTypeUnion = StartGameMessage | PlayerUpdateMessage;

interface OnMessageFuncWrapped {
	(data: ws.MessageEvent): void;
}

interface SendFuncWrapped {
	(data: string): void;
}

interface OnCloseFuncWrapped {
	(data: ws.CloseEvent): void;
}

interface CloseFuncWrapped {
	(code?: number | undefined, data?: string | Buffer | undefined):void;
}

interface WrappedSocket {
	onmessage: OnMessageFuncWrapped | null;
	send: SendFuncWrapped;
	onclose: OnCloseFuncWrapped | null;
	close: CloseFuncWrapped | null;
}

interface Player {
	playerId: string;
	playerName: string;
	playerAvatar: string;
	isFakePlayer: boolean;
	socket: WrappedSocket;
	playerScore: number;
}

interface Players {
	[playerId: string]: Player;
}