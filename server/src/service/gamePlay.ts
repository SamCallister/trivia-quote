import { concat, mapValues, keys, merge, forOwn, last, isUndefined, map, pickBy, isEmpty, sortBy, values, shuffle, first, sample, get, toPairs, flatMap } from 'lodash';
import * as ws from 'ws';
import constants from '../constants';
import buildGame from './buildGame';
import loggerService from './logger';
import modifiersService from './modifiers';
import logger from './logger';

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
	questionPointTransforms?: QuestionPointTransforms;
	questionAfterEffects?: QuestionAfterEffects;
}

interface PlayerToMessage {
	[playerId: string]: SocketMessagesUnion;
}


function delayPromise(timeToDelay: number) {
	return new Promise(resolve => setTimeout(resolve, timeToDelay))
}

interface QuestionImpactedPlayers {
	players: Set<string>;
	modifiedDisplay: ModifiedDisplay;
}

class SinglePlayerGame {
	currentRound: number;
	actions: SocketMessagesUnion[];
	eventLoopCount: number;
	currentMessage: SocketMessagesUnion | null;
	players: Players;
	questionHistory: Array<QuestionHistory>;
	seenCategories: string[];
	gameId: string;
	currentQuestionAfterEffects?: QuestionImpactedPlayers;

	constructor(gameId: string) {
		this.currentRound = 0;
		this.actions = [];
		this.eventLoopCount = 0;
		this.currentMessage = null;
		this.players = {};
		this.questionHistory = [];
		this.seenCategories = [];
		this.gameId = gameId;
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

	buildQuestionMessages(questions: QuestionGameData[]) {
		return this.addQuestionModifiers(
			flatMap(
				questions,
				this.formatQuestion.bind(this)
			)
		);
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
				this.actions = concat(this.actions,
					this.buildQuestionMessages(questions)
				);
			});

			// send out user round choice to everyone
			this.actions.unshift({
				msgType: "userRoundChoice",
				delay: constants.QUESTION_RESULT_DELAY,
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
			delay: constants.QUESTION_RESULT_DELAY,
			value: {
				id: currentQuestion.id,
				answerId: currentQuestion.answerId,
				playerScoreDelta: 0,
				playerSpeedScoreDelta: 0,
				playerScore: 0,
				questionPointTransforms: currentQuestion.questionPointTransforms
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

	// returns up to 2 QuestionMessages depending on if there is an author question or not
	formatQuestion(d: QuestionGameData): QuestionMessage[] {
		const blankQuestion: QuestionMessage = {
			msgType: 'question',
			delay: constants.QUESTION_DELAY,
			value: {
				text: d.text,
				questionType: 'quoteBlanks',
				author: d.author,
				id: d.id,
				choices: shuffle(d.choices.map((c) => {
					return merge({}, c, { text: c.text.split(",").join(", ") });
				})),
				roundNumber: this.currentRound,
				completeText: ""
			},
			answerId: d.answerId
		};

		if (d.authorChoices) {
			// need to remove the author if we are going to be asking it next
			blankQuestion.value.author = "";
			const authorQuestion: QuestionMessage = {
				msgType: 'question',
				delay: constants.QUESTION_DELAY,
				value: {
					text: d.text,
					questionType: 'authorBlank',
					author: "",
					id: `${d.id}-author`,
					choices: d.authorChoices,
					roundNumber: this.currentRound,
					completeText: d.completeText
				},
				answerId: d.authorAnswerId
			};

			return [blankQuestion, authorQuestion];
		} else {
			return [blankQuestion];
		}
	}

	addQuestionModifiers(questions: QuestionMessage[]) {
		// some probability that each question is modified
		// place the modifier messages in the array + put reference to modifier in the question message
		const messages: SocketMessagesUnion[] = [];
		const prob = constants.QUESTION_MODIFIED_PROBABILITY_BY_ROUND[this.currentRound] || constants.QUESTION_MODIFIED_PROBABILITY;
		questions.forEach((q) => {
			if (Math.random() < prob) {
				const modifier = modifiersService.getRandomModifier();
				messages.push(modifier);
				q.value.questionPointTransforms = modifier.value.questionPointTransforms;
				q.value.modifiedDisplay = modifier.value.modifiedDisplay;
				q.value.questionAfterEffects = modifier.value.questionAfterEffects;
			}

			messages.push(q);
		})

		return messages;
	}

	setupRandomRound() {
		return buildGame.getRandomCategories(1, constants.QUESTIONS_PER_CATEGORY, this.seenCategories)
			.then((gameData: GameData) => {
				this.currentRound += 1;
				const categoryAndQuestion = first(toPairs(gameData));

				if (!categoryAndQuestion) {
					throw new Error(`In setupRandomRound with null categoryAndQuestion`);
				}
				const [category, questions] = categoryAndQuestion;

				this.seenCategories.push(category);

				const questionActions = this.buildQuestionMessages(questions);

				const roundMsg: StaticRoundMessage = {
					msgType: "staticRound",
					delay: constants.ROUND_DELAY,
					value: {
						title: `Round ${this.currentRound}`,
						category: category,
						roundNumber: this.currentRound
					}
				};

				this.actions = concat(this.actions, [roundMsg], questionActions);
			});
	}

	preSendEffects(msg: SocketMessagesUnion) {
		if (msg.msgType === "question") {
			// setup question in the question history
			const questionEntry: QuestionHistory = {
				id: msg.value.id,
				answerId: msg.answerId,
				playerAnswers: {},
				questionPointTransforms: msg.value.questionPointTransforms,
				questionAfterEffects: msg.value.questionAfterEffects
			};

			// all the fake players answer
			const fakePlayers = pickBy(this.players, (player) => {
				return player.isFakePlayer;
			});

			forOwn(fakePlayers, (player, playerId) => {
				const aiPlayerAnswer = Math.random() <= constants.AI_PROB_CORRECT ? msg.answerId : "wrongAnswer";
				questionEntry.playerAnswers[playerId] = aiPlayerAnswer;
			});

			this.questionHistory.push(questionEntry);
		}
	}

	questionPointsLogic(correct: boolean, modAffectsCorrect: boolean, modFunc: PointTransformer, points: number,): number {
		if (modAffectsCorrect) {
			return modFunc(correct ? points : 0);
		} else {
			return correct ? points : modFunc(points);
		}
	}

	buildPlayerToMsg(toSend: SocketMessagesUnion): PlayerToMessage {

		if (toSend.msgType === "questionResult") {

			const currentQuestion = last(this.questionHistory);
			if (!currentQuestion) {
				throw new Error("expected currentQuestion to not be null or undefined");
			}
			// for each player check the question
			const result = map(this.players, (player, playerId) => {


				const identityInt = (n: number) => n;

				const correct = currentQuestion.playerAnswers[playerId] === currentQuestion.answerId;

				const playerScoreDeltaTransform = get(currentQuestion, 'questionPointTransforms.questionPointTransform.transformer', identityInt) as PointTransformer;
				const playerScoreAffectsCorrect = get(currentQuestion, 'questionPointTransforms.questionPointTransform.affectsCorrectAnswer', true) as boolean;

				// assumption -> getting it wrong means you always take the effect
				// on the score. So either 0 it out or make negative
				const playerScoreDelta = this.questionPointsLogic(
					correct,
					playerScoreAffectsCorrect,
					playerScoreDeltaTransform,
					constants.POINTS_PER_QUESTION
				);

				const playerSpeedPointTransform = get(currentQuestion, 'questionPointTransforms.speedPointTransform.transformer', identityInt) as PointTransformer;
				const playerSpeedPointAffectsCorrect = get(currentQuestion, 'questionPointTransforms.speedPointTransform.affectsCorrectAnswer', true) as boolean;
				const firstPlayerToAnswer = currentQuestion.firstAnswerPlayerId === playerId;

				const playerSpeedScoreDelta: number = firstPlayerToAnswer ? this.questionPointsLogic(
					correct,
					playerSpeedPointAffectsCorrect,
					playerSpeedPointTransform,
					(0.5 * constants.POINTS_PER_QUESTION)
				) : 0;

				player.playerScore += playerScoreDelta + playerSpeedScoreDelta;

				const questionResultMessage = {
					delay: constants.QUESTION_RESULT_DELAY,
					msgType: "questionResult",
					value: {
						id: currentQuestion.id,
						answerId: currentQuestion.answerId,
						playerScoreDelta: playerScoreDelta,
						playerScore: player.playerScore,
						playerSpeedScoreDelta: playerSpeedScoreDelta
					}
				};

				// deal with after effects
				if (currentQuestion.questionAfterEffects) {
					const affectedPlayers = new Set<string>();
					this.currentQuestionAfterEffects = {
						modifiedDisplay: currentQuestion.questionAfterEffects.modifiedDisplay,
						players: affectedPlayers
					};
					map(this.players, (player, playerId) => {
						const correct = currentQuestion.playerAnswers[playerId] === currentQuestion.answerId;

						const affected = currentQuestion.questionAfterEffects && currentQuestion.questionAfterEffects.isPlayerImpacted(
							[], playerId, correct
						);

						if (affected) {
							affectedPlayers.add(playerId);
						}

					});
				}

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
		} else if (toSend.msgType === "question" && this.currentQuestionAfterEffects) {
			const modifiedDisplay = this.currentQuestionAfterEffects.modifiedDisplay;
			const affectedPlayers = this.currentQuestionAfterEffects.players;
			const playerToMsgMap = mapValues(this.players, (player) => {
				return merge({}, toSend, {
					value: merge(
						{},
						toSend.value,
						{
							modifiedDisplay: affectedPlayers.has(player.playerId) ? modifiedDisplay : ""
						})
				});
			});
			this.currentQuestionAfterEffects = undefined;

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
			delay: constants.RANKING_DELAY,
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
			logger.getLogger().info("missing playerinfo in userChoice, returning");
			return;
		}

		const toSend = {
			msgType: "userChoiceRound",
			delay: constants.QUESTION_DELAY,
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

		// if there are no more players exit
		if (keys(this.players).length == 0) {
			logger.getLogger().info("No players left, exiting");
			return;
		}

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
				if (this.currentRound < constants.ROUNDS_IN_GAME) {
					// ranking page
					this.rankingsPage();
					// round 2 is winner's choice
					if (this.currentRound === 1) {
						this.userChoice(first(this.getRankingInfo()), "Winner's Choice");

					} else if (this.currentRound === 2) {
						this.userChoice(last(this.getRankingInfo()), "Loser's Choice");

					} else {
						// go get data
						this.setupRandomRound();
					}

				} else if (this.currentMessage.msgType !== "finalScore") {
					loggerService.getLogger().info(`game over:${this.gameId}`);
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
			this.messageLoop();
		}, delay);
	}
}


function initGame(gameId: string) {
	// choose random topic and 3 questions
	const game = new SinglePlayerGame(gameId);

	return game.setupRandomRound()
		.then(() => {
			return game;
		});
}

export default { initGame };