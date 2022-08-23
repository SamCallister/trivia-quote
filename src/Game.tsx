import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import StaticRound from './StaticRound';
import styled from "styled-components";
import RoundIndicator from "./components/RoundIndicator";
import Question from "./Question";
import PropTypes from "prop-types";
import { getSinglePlayerSocket } from "./service/socketService";
import { initGame } from "./service/singlePlayerService";
import { isNull } from "lodash";

const IndicatorContainer = styled.div`
	position:fixed;
	bottom:0;
	left:0;
	width: 100%;
`;

function Game() {
	const [msgData, setMsgData] = useState(null);
	const [score, setScore] = useState(0);
	const [socket, setSocket] = useState(null);
	const numRounds = 3;

	useEffect(() => {
		axios("/data/single_player_questions.json")
			.then((res) => {
				const game = initGame(res.data);


				const socketOnMessage = (event: SocketMessage) => {
					const data = event.data;
					setMsgData(data);
				};
				const s: Socket = getSinglePlayerSocket(socketOnMessage);

				// join the game
				game.joinGame(s, {
					msgType: "joinGame",
					value: {
						playerName: "SomeName",
						playerId: "someId",
						playerAvatar: "jon"
					}
				});

				// have fake players join the game


				game.start();
				setSocket(s);

				return res.data;
			})
	}, []);

	const questionAnswered = (choice: QuestionChoice, questionId: string) => {
		socket.send({
			msgType: "answer",
			value: { answerId: choice.id, questionId }
		})
	};

	const getElements = (data: SocketMessagesUnion) => {
		if (isNull(data)) {
			return (<div>Loading...</div>)
		} else if (data.msgType === "staticRound") {
			return (
				<div>
					<StaticRound title={data.value.title} category={data.value.category}></StaticRound>
					<IndicatorContainer>
						<RoundIndicator numRounds={numRounds} roundNumber={data.value.roundNumber}></RoundIndicator>
					</IndicatorContainer>
				</div>);
		} else if (data.msgType === "question") {
			return (<div>
				<Question delay={data.delay} text={data.value.text} questionId={data.value.id} choices={data.value.choices} score={score.toLocaleString()}
					onChange={questionAnswered}></Question>
				<IndicatorContainer>
					<RoundIndicator numRounds={numRounds} roundNumber={data.value.roundNumber}></RoundIndicator>
				</IndicatorContainer>
			</div>);
		}
	};

	return (<div>{getElements(msgData)}</div>);
}

Game.propTypes = { socket: PropTypes.object };

export default Game;
