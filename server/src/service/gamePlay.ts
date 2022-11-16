import { concat, mapValues, keys, random, sampleSize, merge, forOwn, last, isUndefined, map, pickBy, isEmpty, sortBy, values, shuffle, first, sample } from 'lodash';
import * as ws from 'ws';
import constants from '../constants';
import buildGame from './buildGame';


interface Player {
	playerId: string;
	playerName: string;
	playerAvatar: string;
	isFakePlayer: boolean;
	socket: ws.WebSocket;
	playerScore: number;
}

interface Players {
	[playerId: string]: Player;
}

interface PlayerAnswers {
	[playerId: string]: string;
}

interface QuestionHistory {
	id: string;
	answerId: string;
	playerAnswers: PlayerAnswers;
	firstAnswerPlayerId?: string;
}

interface PlayerToMessage {
	[playerId: string]: SocketMessagesUnion;
}

const aiProbCorrect = 0.39;
const pointsPerQuestion = 100;
const ROUNDS_IN_GAME = 3;
const QUESTION_RESULT_DELAY = 2 * 1000;
const QUESTION_DELAY = 20 * 1000;
const ROUND_DELAY = 2 * 1000;
const RANKING_DELAY = 3 * 1000;

function delayPromise(timeToDelay:number) {
	return new Promise(resolve => setTimeout(resolve, timeToDelay))
}

class SinglePlayerGame {
	gameData: GameData;
	topics: string[];
	currentRound: number;
	actions: SocketMessagesUnion[];
	eventLoopCount: number;
	currentMessage: SocketMessagesUnion | null;
	players: Players;
	questionHistory: Array<QuestionHistory>;
	seenCategories: string[];


	constructor(gameData: GameData) {
		this.gameData = gameData;
		this.topics = keys(gameData);
		this.currentRound = 0;
		this.actions = [];
		this.eventLoopCount = 0;
		this.currentMessage = null;
		this.players = {};
		this.questionHistory = [];
		this.seenCategories = [];
	}

	answerMatchesCurrentMsgQuestion(questionId: string): boolean {
		return this.currentMessage !== null && this.currentMessage.msgType === "question" && this.currentMessage.value.id === questionId;
	}

	checkAnswer(questionId: string, answerId: string, playerId: string) {
		// do we match the current question and have not already answered? if not ignore
		if (this.answerMatchesCurrentMsgQuestion(questionId)) {
			// mark the answer for the player
			const currentQuestion = last(this.questionHistory);

			if (isUndefined(currentQuestion)) {
				throw new Error("questionHistory is empty, expected at least one value")
			} else if (isUndefined(currentQuestion.playerAnswers[playerId])) {
				currentQuestion.playerAnswers[playerId] = answerId;
				if (!currentQuestion.firstAnswerPlayerId) {
					currentQuestion.firstAnswerPlayerId = playerId;
				}

			}

			// change the question once everyone has answered, otherwise wait until the time expires
			if (keys(currentQuestion.playerAnswers).length === keys(this.players).length) {
				// increment the message count so that the time run out message gets ignored
				this.eventLoopCount += 1;
				this.evaluateQuestionResult(currentQuestion);
				this.messageLoop();
			}
		}
	}

	userRoundChoice(categoryId: string, playerId: string) {
		// ensure currentMessage is expected
		if (this.currentMessage && this.currentMessage.msgType == "userChoiceRound" && playerId == this.currentMessage.value.chosenPlayer) {

			this.eventLoopCount += 1;
			this.seenCategories.push(categoryId);

			const waitForPromise = buildGame.getQuestionsForCategory(
				categoryId,
				constants.QUESTIONS_PER_CATEGORY,
			).then((questions: QuestionGameData[]) => {
				this.currentRound += 1;
				this.actions = concat(this.actions, questions.map(this.formatQuestion.bind(this)));
			});

			// send out user round choice to everyone
			this.actions.unshift({
				msgType: "userRoundChoice",
				delay: QUESTION_RESULT_DELAY,
				value: { categoryId: categoryId },
				waitForWithDelay: waitForPromise
			});

			this.messageLoop();
		}
	}

	evaluateQuestionResult(currentQuestion: QuestionHistory) {
		// DUMMY message 1 will get made for each player
		this.actions.unshift({
			msgType: "questionResult",
			delay: QUESTION_RESULT_DELAY,
			value: {
				id: currentQuestion.id,
				answerId: currentQuestion.answerId,
				playerScoreDelta: 0,
				playerSpeedScoreDelta: 0,
				playerScore: 0
			}
		});
	}

	handleMessage(socketMessage: SocketMessagesUnion, playerId: string) {
		if (socketMessage.msgType === "answer") {
			// update score etc
			const { questionId, answerId } = socketMessage.value;
			this.checkAnswer(
				questionId,
				answerId,
				playerId
			);
		} else if (socketMessage.msgType === "userRoundChoice") {
			const { categoryId } = socketMessage.value;
			this.userRoundChoice(categoryId, playerId);


		}
	}

	sendToClients(playerToMessage: PlayerToMessage) {
		forOwn(playerToMessage, (msg, playerId) => {
			const { socket } = this.players[playerId];

			socket.send(JSON.stringify(msg));
		})
	}

	randomTopic(): string {
		const end = this.topics.length - 1;
		const i = random(0, end);
		// mutate! topics
		const chosenTopic = this.topics.splice(i, 1)[0];

		return chosenTopic;
	}

	formatQuestion(d: QuestionGameData): QuestionMessage {
		return {
			msgType: 'question',
			delay: QUESTION_DELAY,
			value: {
				text: d.text,
				author: d.author,
				id: d.id,
				choices: shuffle(d.choices.map((c) => {
					return merge({}, c, { text: c.text.split(",").join(", ") });
				})),
				roundNumber: this.currentRound
			},
			answerId: d.answerId
		};
	}

	// builds round, adding messages to action queue
	setupRound(chosenTopic: string) {
		this.currentRound += 1;

		const questions = sampleSize(this.gameData[chosenTopic], constants.QUESTIONS_PER_CATEGORY);

		// choose 3 questions
		const formattedQuestions: QuestionMessage[] = questions.map(this.formatQuestion.bind(this));

		const roundMsg: StaticRoundMessage = {
			msgType: "staticRound",
			delay: ROUND_DELAY,
			value: {
				title: `Round ${this.currentRound}`,
				category: chosenTopic,
				roundNumber: this.currentRound
			}
		};

		this.actions = concat(this.actions, [roundMsg], formattedQuestions);
	}

	preSendEffects(msg: SocketMessagesUnion) {
		if (msg.msgType === "question") {
			// setup question in the question history
			const questionEntry: QuestionHistory = {
				id: msg.value.id,
				answerId: msg.answerId,
				playerAnswers: {}
			};

			// all the fake players answer
			const fakePlayers = pickBy(this.players, (player) => {
				return player.isFakePlayer;
			});

			forOwn(fakePlayers, (player, playerId) => {
				const aiPlayerAnswer = Math.random() <= aiProbCorrect ? msg.answerId : "wrongAnswer";
				questionEntry.playerAnswers[playerId] = aiPlayerAnswer;
			});

			this.questionHistory.push(questionEntry);
		}
	}

	buildPlayerToMsg(toSend: SocketMessagesUnion): PlayerToMessage {
		if (toSend.msgType === "questionResult") {
			// for each player check the question
			const result = map(this.players, (player, playerId) => {

				const currentQuestion = last(this.questionHistory);

				if (!currentQuestion) {
					throw new Error("expected currentQuestion to not be null or undefined");
				}

				const correct = currentQuestion.playerAnswers[playerId] === currentQuestion.answerId;
				const playerScoreDelta = correct ? pointsPerQuestion : 0;
				const firstPlayerToAnswer = currentQuestion.firstAnswerPlayerId === playerId;
				const playerSpeedScoreDelta = (correct && firstPlayerToAnswer) ? (0.5 * pointsPerQuestion) : 0;
				player.playerScore += playerScoreDelta + playerSpeedScoreDelta;

				const questionResultMessage = {
					delay: QUESTION_RESULT_DELAY,
					msgType: "questionResult",
					value: {
						id: currentQuestion.id,
						answerId: currentQuestion.answerId,
						playerScoreDelta: playerScoreDelta,
						playerScore: player.playerScore,
						playerSpeedScoreDelta: playerSpeedScoreDelta
					}
				};
				return { [playerId]: questionResultMessage };
			});

			return merge({}, ...result);
		} else if (toSend.msgType === "userChoiceRound") {
			const playerToMsgMap = mapValues(this.players, (player) => {
				return merge({}, toSend, {
					value: merge(
						{},
						toSend.value,
						{
							isChoosingPlayer: toSend.value.chosenPlayer === player.playerId
						})
				});
			});

			return playerToMsgMap;
		}
		else {
			const result = map(keys(this.players), (playerId: string) => {
				return { [playerId]: toSend };
			});
			return merge({}, ...result);
		}
	}

	getRankingInfo() {
		// go through players scores
		const orderedPlayers = sortBy(values(this.players), (p) => -p.playerScore);
		const rankingInfo: PlayerRankingInfo[] = orderedPlayers.map((p) => {
			return {
				playerName: p.playerName,
				playerAvatar: p.playerAvatar,
				playerId: p.playerId,
				playerScore: p.playerScore
			};
		});

		return rankingInfo
	}

	// add message to display the rankings page
	rankingsPage() {
		const rankingInfo = this.getRankingInfo();

		const rankingMsg: SocketMessagesUnion = {
			msgType: "ranking",
			delay: RANKING_DELAY,
			value: {
				ranking: rankingInfo,
				roundNumber: this.currentRound
			}
		};
		this.actions.push(rankingMsg);
	}

	finalScorePage() {
		const rankingInfo = this.getRankingInfo();
		const finalScoreMessage: SocketMessagesUnion = {
			msgType: "finalScore",
			delay: 0,
			value: {
				ranking: rankingInfo,
				roundNumber: this.currentRound + 1
			}
		};
		this.actions.push(finalScoreMessage);
	}

	userChoice(playerInfo: PlayerRankingInfo | undefined, title: string) {

		if (!playerInfo) {
			throw new Error("expected playerInfo to be defined when user choosing round");
		}

		const toSend = {
			msgType: "userChoiceRound",
			delay: QUESTION_DELAY,
			value: {
				titleText: title,
				playerName: playerInfo.playerName,
				playerAvatar: playerInfo.playerAvatar,
				text: "Choose the category:",
				categories: [],
				isChoosingPlayer: false,
				chosenPlayer: playerInfo.playerId
			}
		} as UserChoiceRoundMessage;

		const waitForPromise = buildGame.getRandomCategories(
			constants.NUM_CHOOSING_CATEGORIES,
			constants.QUESTIONS_PER_CATEGORY,
			this.seenCategories
		).then((gameData) => {

			const categories = map(gameData, (v, k) => {
				return {
					name: k,
					categoryId: k
				}
			});
			toSend.value.categories = categories;

		});

		toSend.waitForBeforeSend = waitForPromise;
		toSend.waitForWithDelay = waitForPromise.then(() => delayPromise(toSend.delay));

		this.actions.push(toSend);
	}

	afterMessageDelay(currentCount: number) {
		// if question type message -> send the incorrect answer to the clients with their new score
		// unless they have answered already
		// if all the players answer -> 

		if (this.eventLoopCount == currentCount) {

			// if we get here there are players who have not answered the question before the timeout
			if (!this || !this.currentMessage) {
				throw new Error("currentMessage is null or undefined.");
			} else if (this.currentMessage.msgType === "question") {
				const lastQuestion = last(this.questionHistory);

				if (!lastQuestion) {
					throw new Error("lastQuestion is null or undefined");
				} else {
					this.evaluateQuestionResult(lastQuestion);
				}
			} else if (this.currentMessage.msgType === "userChoiceRound") {
				// choose a random category
				const randomCategoryId = (sample(this.currentMessage.value.categories) || {}).categoryId;

				if (!randomCategoryId) {
					throw new Error(`Expected chosen category to not be null: ${this.currentMessage.value}`);
				}

				this.userRoundChoice(
					randomCategoryId,
					this.currentMessage.value.chosenPlayer
				);

				return;
			}
			// round 1 is random

			// round 3 is loser's choice
			if (isEmpty(this.actions)) {
				if (this.currentRound < ROUNDS_IN_GAME) {
					// ranking page
					this.rankingsPage();
					// round 2 is winner's choice
					if (this.currentRound === 1) {
						this.userChoice(first(this.getRankingInfo()), "Winner's Choice");

					} else if (this.currentRound === 2) {
						this.userChoice(last(this.getRankingInfo()), "Loser's Choice");

					} else {
						this.setupRound(this.randomTopic());
					}

				} else if (this.currentMessage.msgType !== "finalScore") {
					// game over
					this.finalScorePage();
				} else {
					return;
				}
			}

			this.messageLoop();
		}


	}

	messageLoop() {
		// if there is a promise here, wait for it, otherwise
		// resolve empty promise

		if (this.actions.length > 0) {
			this.eventLoopCount += 1;
			const currentCount = this.eventLoopCount;
			const toSend = this.actions.shift();
			if (!toSend) {
				throw new Error("toSend is null or undefined");
			}
			// track the current message number
			// if it has changed before set timeout is called, increment the number

			Promise.all([
				delayPromise(toSend.delay),
				toSend.waitForWithDelay || Promise.resolve()
			]).then(() => {
				this.afterMessageDelay(currentCount)
			});

			// settimeout by delay + promiseToWaitFor resolves

			this.currentMessage = toSend;
			// allow messages with promises
			(toSend.waitForBeforeSend || Promise.resolve()).then(() => {
				this.preSendEffects(toSend);
				const playerToMsg = this.buildPlayerToMsg(toSend);
				this.sendToClients(playerToMsg);
			});

		}
	}

	joinGame(socket: ws.WebSocket, msgData: JoinGameMessage) {
		const { playerId, playerName, playerAvatar, isFakePlayer } = msgData.value;

		// call socket.onmessage to send messages to the client
		// the client will call socket.send to send message to the singlePlayer Service
		// really will have a bunch of sockets
		socket.onmessage = (msg) => {
			const parsedMsg = JSON.parse(msg.data as string) as ServerMessageTypeUnion;
			this.handleMessage(parsedMsg, playerId)
		};

		const booleanIsFakePlayer = !!isFakePlayer;
		this.players[playerId] = { playerId, playerName, playerAvatar, isFakePlayer: booleanIsFakePlayer, socket, playerScore: 0 };
	}

	start(delay: number) {
		setTimeout(() => {
			const chosenTopic = this.randomTopic();
			this.setupRound(chosenTopic);
			this.messageLoop();
		}, delay);

	}
}


function initGame(data: GameData) {
	// choose random topic and 3 questions
	const game = new SinglePlayerGame(data);
	game.seenCategories = keys(data);

	return game;
}

export default { initGame };