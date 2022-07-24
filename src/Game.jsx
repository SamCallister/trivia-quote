import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import StaticRound from './StaticRound.jsx';
import styled from "styled-components";
import RoundIndicator from "./components/RoundIndicator";
import Question from "./Question.jsx";
import PropTypes from "prop-types";
import { getSinglePlayerSocket } from "./service/socketService.js";
import { initGame } from "./service/singlePlayerService.js";

const IndicatorContainer = styled.div`
	position:fixed;
	bottom:0;
	left:0;
	width: 100%;
`;

function Game(props) {
	const [msgType, setMsgType] = useState("loading");
	const [score, setScore] = useState(0);
	const [socket, setSocket] = useState(null);
	const numRounds = 3;

	useEffect(() => {
		axios("/data/single_player_questions.json")
			.then((res) => {
				const s = getSinglePlayerSocket();
				const game = initGame(res.data);

				// join the game
				game.joinGame(s, {
					value: {
						playerName: "SomeName",
						playerId: "someId",
						playerAvatar: "jon"
					}
				});

				// have fake players join the game

				// setup socket
				s.onmessage = (event) => {
					const data = event.data;
					setMsgType(data);
				};

				game.start();
				setSocket(s);

				return res.data;
			})
	}, []);

	const questionAnswered = (choiceData) => {
		console.log('answered the question', choiceData);
		const {choice, questionId }  = choiceData;
		socket.send({
			msgType: "answer",
			value: { answerId: choice.id, questionId}
		})
	};

	const getElements = (data) => {
		const { msgType, value, delay } = data;

		if (msgType === "loading") {
			return (<div>Loading...</div>)
		} else if (msgType === "staticRound") {
			return (
				<div>
					<StaticRound title={value.title} category={value.category}></StaticRound>
					<IndicatorContainer>
						<RoundIndicator numRounds={numRounds} roundNumber={value.roundNumber}></RoundIndicator>
					</IndicatorContainer>
				</div>);
		} else if (msgType === "question") {
			return (<div>
				<Question delay={delay} text={value.text} questionId={value.id} choices={value.choices} score={score.toLocaleString()}
					onChange={questionAnswered}></Question>
				<IndicatorContainer>
					<RoundIndicator numRounds={numRounds} roundNumber={value.roundNumber}></RoundIndicator>
				</IndicatorContainer>
			</div>);
		}
	};

	return (<div>{getElements(msgType)}</div>);
}

Game.propTypes = { socket: PropTypes.object };

export default Game;
