import { concat, keys, random, sampleSize, merge, forOwn, last, isUndefined, map, pickBy, isEmpty, sortBy, values, shuffle } from 'lodash';

interface GameData {
	[category: string]: [{
		text: string;
		id: string;
		answerId: string;
		choices: [{
			text: string;
			id: string;
		}];
	}]
}

interface Player {
	playerId: string;
	playerName: string;
	playerAvatar: string;
	isFakePlayer: boolean;
	socket: Socket;
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
}

interface PlayerToMessage {
	[playerId: string]: SocketMessagesUnion;
}

const questionsPerRound = 3;
const aiProbCorrect = 0.39;
const pointsPerQuestion = 100;
const ROUNDS_IN_GAME = 3;
const QUESTION_RESULT_DELAY = 2 * 1000;
const QUESTION_DELAY = 10 * 1000;

class SinglePlayerGame {
	gameData: GameData;
	topics: string[];
	currentRound: number;
	actions: SocketMessagesUnion[];
	eventLoopCount: number;
	currentMessage: SocketMessagesUnion;
	players: Players;
	questionHistory: Array<QuestionHistory>;


	constructor(gameData: GameData) {
		this.gameData = gameData;
		this.topics = keys(gameData);
		this.currentRound = 0;
		this.actions = [];
		this.eventLoopCount = 0;
		this.currentMessage = null;
		this.players = {};
		this.questionHistory = [];
	}

	answerMatchesCurrentMsgQuestion(questionId: string): boolean {
		return this.currentMessage && this.currentMessage.msgType === "question" && this.currentMessage.value.id === questionId;
	}

	checkAnswer(questionId: string, answerId: string, playerId: string) {
		// do we match the current question and have not already answered? if not ignore
		if (this.answerMatchesCurrentMsgQuestion(questionId)) {
			// mark the answer for the player
			const currentQuestion = last(this.questionHistory);
			if (isUndefined(currentQuestion.playerAnswers[playerId])) {
				currentQuestion.playerAnswers[playerId] = answerId;
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

	evaluateQuestionResult(currentQuestion: QuestionHistory) {
		// DUMMY message 1 will get made for each player
		this.actions.unshift({
			msgType: "questionResult",
			delay: QUESTION_RESULT_DELAY,
			value: {
				id: currentQuestion.id,
				answerId: currentQuestion.answerId,
				playerScoreDelta: 0,
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
		}
	}

	sendToClients(playerToMessage: PlayerToMessage) {
		forOwn(playerToMessage, (msg, playerId) => {
			const { socket } = this.players[playerId];
			socket.onmessage({ data: msg });
		})
	}

	randomTopic(): string {
		const end = this.topics.length - 1;
		const i = random(0, end);
		// mutate! topics
		const chosenTopic = this.topics.splice(i, 1)[0];

		return chosenTopic;
	}

	// builds round, adding messages to action queue
	setupRound(chosenTopic: string) {
		this.currentRound += 1;

		const questions = sampleSize(this.gameData[chosenTopic], questionsPerRound);

		// choose 3 questions
		const formattedQuestions: QuestionMessage[] = questions.map((d) => {
			return {
				msgType: "question",
				delay: QUESTION_DELAY,
				value: {
					text: d.text,
					id: d.id,
					choices: shuffle(d.choices.map((c) => {
						return merge({}, c, { text: c.text.split(",").join(", ") });
					})),
					roundNumber: this.currentRound
				},
				answerId: d.answerId
			};
		});

		const roundMsg: StaticRoundMessage = {
			msgType: "staticRound",
			delay: 1000,
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
			return merge.apply(this, map(this.players, (player, playerId) => {

				const currentQuestion = last(this.questionHistory);

				const correct = currentQuestion.playerAnswers[playerId] === currentQuestion.answerId;
				const playerScoreDelta = correct ? pointsPerQuestion : 0;
				player.playerScore += playerScoreDelta;
				const questionResultMessage = {
					delay: QUESTION_RESULT_DELAY,
					msgType: "questionResult",
					value: {
						id: currentQuestion.id,
						answerId: currentQuestion.answerId,
						playerScoreDelta: playerScoreDelta,
						playerScore: player.playerScore
					}
				}
				return { [playerId]: questionResultMessage };
			}));
		} else {
			return merge.apply(this, map(keys(this.players), (playerId: string) => {
				return { [playerId]: toSend };
			}));
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
			delay: 3000,
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
			delay: 5000,
			value: {
				ranking: rankingInfo,
				roundNumber: this.currentRound + 1
			}
		};
		this.actions.push(finalScoreMessage);
	}

	messageLoop() {
		// do the message
		if (this.actions.length > 0) {
			this.eventLoopCount += 1;
			const currentCount = this.eventLoopCount;
			const toSend = this.actions.shift();
			// track the current message number
			// if it has changed before set timeout is called, increment the number
			setTimeout(() => {
				// if question type message -> send the incorrect answer to the clients with their new score
				// unless they have answered already
				// if all the players answer -> 

				if (this.eventLoopCount == currentCount) {

					// if we get here there are players who have not answered the question before the timeout
					if (this.currentMessage.msgType === "question") {
						this.evaluateQuestionResult(last(this.questionHistory));
					}

					if (isEmpty(this.actions)) {
						if (this.currentRound < ROUNDS_IN_GAME) {
							// ranking page
							this.rankingsPage();

							// setup round
							this.setupRound(this.randomTopic());
						} else if (this.currentMessage.msgType !== "finalScore") {
							// game over
							this.finalScorePage();
						} else {
							return;
						}
					}

					this.messageLoop();
				}


			}, toSend.delay);

			this.currentMessage = toSend;
			// setup state for question type message
			this.preSendEffects(toSend);
			const playerToMsg = this.buildPlayerToMsg(toSend);
			this.sendToClients(playerToMsg);
		}
	}

	joinGame(socket: Socket, msgData: JoinGameMessage) {
		const { playerId, playerName, playerAvatar, isFakePlayer } = msgData.value;

		// call socket.onmessage to send messages to the client
		// the client will call socket.send to send message to the singlePlayer Service
		// really will have a bunch of sockets
		socket.send = (msg: SocketMessagesUnion) => {
			this.handleMessage(msg, playerId);
		};

		this.players[playerId] = { playerId, playerName, playerAvatar, isFakePlayer, socket, playerScore: 0 };
	}

	start() {
		const chosenTopic = this.randomTopic();
		this.setupRound(chosenTopic);
		this.messageLoop();
	}
}


function initGame(data: GameData) {
	// choose random topic and 3 questions
	const game = new SinglePlayerGame(data);

	return game;
};

export { initGame };