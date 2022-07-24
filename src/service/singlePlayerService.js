import { concat, forEach, keys, random, sampleSize, max, first, fill, repeat, merge, forOwn, uniqueId } from 'lodash';
import { getSinglePlayerSocket } from "./socketService";

function SinglePlayerGame(gameData) {
	this.gameData = gameData;
	this.topics = keys(gameData);
	this.currentRound = 0;
	this.actions = [];
	this.eventLoopCount = 0;
	this.currentMessage = null;
	this.players = {};
	this.questionHistory = {};
}

SinglePlayerGame.prototype.checkAnswer = function (questionId, answerId, playerId) {
	// do we match the current question? if not ignore
	if (this.currentMessage && questionId === this.currentMessage.value.id) {


	}

	// if we match the current question have we already answered? if so than ignore

	// have we not already answered? is it the right answer? update player score
}

SinglePlayerGame.prototype.handleMessage = function (msgData) {
	if (msgData.msgType === "answer") {
		// update score etc
		const { questionId, answerId } = msgData.value;
		SinglePlayerGame.prototype.checkAnswer(
			questionId,
			answerId
		);

		// because we are single player game
	}
}

SinglePlayerGame.prototype.sendToClient = function (msgInfo) {
	forOwn(this.players, (value) => {
		const { socket } = value;
		socket.onmessage({ data: msgInfo });
	})
}

const questionsPerRound = 3;

SinglePlayerGame.prototype.randomTopic = function () {
	const end = this.topics.length - 1;
	const i = random(0, end);
	// mutate! topics
	const chosenTopic = this.topics.splice(i, 1)[0];

	return chosenTopic;
}

function formatQuestionUnderlines(text, choices) {
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

SinglePlayerGame.prototype.setupRound = function (chosenTopic) {
	this.currentRound += 1;

	const questions = sampleSize(this.gameData[chosenTopic], questionsPerRound);

	// choose 3 questions
	const formattedQuestions = questions.map((d) => {
		return {
			msgType: "question",
			delay: 20 * 1000,
			value: {
				text: formatQuestionUnderlines(d.text, d.choices.map((v) => v.text)),
				id: d.id,
				choices: d.choices.map((c) => {
					return merge({}, c, { text: c.text.split(",").join(", ") });
				}),
				roundNunber: this.currentRound
			},
			answerId: d.answerId
		}
	});

	const roundMsg = {
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

SinglePlayerGame.prototype.messageLoop = function () {
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
		this.sendToClient(toSend);
	}

}

SinglePlayerGame.prototype.joinGame = function (socket, msgData) {
	const { playerId, playerName, playerAvatar, isFakePlayer } = msgData.value;

	// call socket.onmessage to send messages to the client
	// the client will call socket.send to send message to the singlePlayer Service
	// really will have a bunch of sockets
	socket.send = (msg) => {
		this.handleMessage(msg);
	};

	this.players[playerId] = { playerId, playerName, playerAvatar, isFakePlayer, socket };
};

SinglePlayerGame.prototype.start = function () {
	const chosenTopic = this.randomTopic();
	const { questions, round } = this.setupRound(chosenTopic);
	// priority queue of actions
	// round 1, questions ...
	// call next for each action? -> look for end state?
	this.actions = concat(this.actions, [round], questions);


	this.messageLoop();
};

function initGame(data) {
	// choose random topic and 3 questions
	const game = new SinglePlayerGame(data);

	return game;
};

export { initGame };