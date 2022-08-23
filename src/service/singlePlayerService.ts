import { concat, forEach, keys, random, sampleSize, max, first, fill, repeat, merge, forOwn, uniqueId, get, last, isUndefined } from 'lodash';

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

const questionsPerRound = 3;

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

	checkAnswer(questionId: string, answerId: string, playerId: string) {
		// do we match the current question and have not already answered? if not ignore
		if (this.currentMessage && questionId === get(this.currentMessage, 'value.id', null)) {
			// mark the answer for the player
			const currentQuestion = last(this.questionHistory);
			if (isUndefined(currentQuestion.playerAnswers[playerId])) {
				currentQuestion.playerAnswers[playerId] = answerId;
			}



			// change the question once everyone has answered, otherwise wait until the time expires
		}


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

			// because we are single player game
		}
	}

	sendToClient(msgInfo: SocketMessagesUnion) {
		forOwn(this.players, (value) => {
			const { socket } = value;
			socket.onmessage({ data: msgInfo });
		})
	}

	randomTopic(): string {
		const end = this.topics.length - 1;
		const i = random(0, end);
		// mutate! topics
		const chosenTopic = this.topics.splice(i, 1)[0];

		return chosenTopic;
	}

	setupRound(chosenTopic: string) {
		this.currentRound += 1;

		const questions = sampleSize(this.gameData[chosenTopic], questionsPerRound);

		// choose 3 questions
		const formattedQuestions: QuestionMessage[] = questions.map((d) => {
			return {
				msgType: "question",
				delay: 20 * 1000,
				value: {
					text: formatQuestionUnderlines(d.text, d.choices.map((v) => v.text)),
					id: d.id,
					choices: d.choices.map((c) => {
						return merge({}, c, { text: c.text.split(",").join(", ") });
					}),
					roundNumber: this.currentRound
				},
				answerId: d.answerId
			}
		});

		console.log('here are the formatted questions', formattedQuestions)

		const roundMsg: StaticRoundMessage = {
			msgType: "staticRound",
			delay: 1000,
			value: {
				title: `Round ${this.currentRound}`,
				category: chosenTopic,
				roundNumber: this.currentRound
			}
		};

		return {
			questions: formattedQuestions,
			round: roundMsg
		};
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
				if (this.eventLoopCount == currentCount) {
					this.messageLoop();
				}

				// if question type message -> send the incorrect answer to the clients with their new score
				// unless they have answered already
				// if all the players answer -> 
			}, toSend.delay);

			this.currentMessage = toSend;
			// setup state for question type message

			this.sendToClient(toSend);
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

		this.players[playerId] = { playerId, playerName, playerAvatar, isFakePlayer, socket };
	}

	start() {
		const chosenTopic = this.randomTopic();
		const { questions, round } = this.setupRound(chosenTopic);
		// priority queue of actions
		// round 1, questions ...
		// call next for each action? -> look for end state?
		this.actions = concat(this.actions, [round], questions);


		this.messageLoop();
	}
}

function formatQuestionUnderlines(text: string, choices: string[]) {
	let currentText = text;

	// reducer that provides the max for each choice (can have multiple words on a given choice)
	const maxLengthForEachChoice = choices.map((d) => {
		return d.split(",")
	}).reduce((a, b) => {
		// pairwise max
		return a.map((v, i) => {
			return max([v, b[i].length]);
		});

	}, fill(Array(first(choices).split(",").length), 0));

	// 
	forEach(maxLengthForEachChoice, (v, i) => {
		currentText = currentText.replace(`{${i}}`, repeat("_", v));
	})

	return currentText;
}


const gameInfo = {
	messages: [{
		msgType: "staticRound",
		delay: 1,
		value: {
			title: "Round 1",
			category: "Roman Quotes",
			roundNumber: 1
		}
	}, {
		msgType: "question",
		delay: 1000 * 100000,
		value: {
			text: "Some question text here. What do you think?",
			choices: [{ id: 0, text: "Answer One" }, { id: 1, text: "Answer Two" }, { id: 2, text: "Answer Three" }, { id: 3, text: "Answer Four" }],
			roundNumber: 1
		}
	}],
};


function initGame(data: GameData) {
	// choose random topic and 3 questions
	const game = new SinglePlayerGame(data);

	return game;
};

export { initGame };