import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import StaticRound from './StaticRound';
import styled from "styled-components";
import RoundIndicator from "./components/RoundIndicator";
import Question from "./Question";
import Ranking from "./Ranking";
import PropTypes from "prop-types";
import { getSinglePlayerSocket } from "./service/socketService";
import fakePlayerService from "./service/fakePlayerService";
import { initGame } from "./service/singlePlayerService";
import { isNull, first } from "lodash";
import { useLocation, Link } from "react-router-dom";

const Title = styled.div`
font-size: ${props => props.theme.h1.fontSize};
margin-top: 36px;
text-align: center;
`;

const FinalScoreTitle = styled.div`
font-size: ${props => props.theme.h1.fontSize};
text-align: center;
margin-top:16px;
`;

const WinningPlayerContainer = styled.div`
font-size: ${props => props.theme.h3.fontSize};
text-align: center;
`;


const IndicatorContainer = styled.div`
	position:fixed;
	bottom:0;
	left:0;
	width: 100%;
`;

const ReturnHomeLink = styled.div`
position:absolute;
top:8px;
right:8px;`;

function Game() {
	const [msgData, setMsgData] = useState(null);
	const [score, setScore] = useState(0);
	const [socket, setSocket] = useState(null);
	const [prevQuestion, setPrevQuestion] = useState(null);
	const location = useLocation();

	const numRounds = 3;

	useEffect(() => {
		axios("/data/single_player_questions.json")
			.then((res) => {
				const game = initGame(res.data);

				const socketOnMessage = (event: SocketMessage) => {
					const data = event.data;

					if (data.msgType === "question") {
						setPrevQuestion(data);
					}

					if (data.msgType === "questionResult") {
						setScore(data.value.playerScore);
					}
					setMsgData(data);
				};
				const s: Socket = getSinglePlayerSocket(socketOnMessage);
				const playerName = (location.state as { playerName: string }).playerName;

				// join the game
				game.joinGame(s, {
					msgType: "joinGame",
					value: {
						playerName: playerName,
						playerId: "someId",
						playerAvatar: "jon"
					}
				});

				// have fake players join the game
				game.joinGame(fakePlayerService.getFakeSocket(), fakePlayerService.getFakePlayerJoinMessage());
				game.joinGame(fakePlayerService.getFakeSocket(), fakePlayerService.getFakePlayerJoinMessage());

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
		} else if (data.msgType === "question" || data.msgType === "questionResult") {
			return (<div key={prevQuestion.value.id}>
				<Question delay={prevQuestion.delay} text={prevQuestion.value.text} questionId={prevQuestion.value.id} choices={prevQuestion.value.choices} score={score.toLocaleString()} onChange={questionAnswered} correctAnswer={data.msgType === "questionResult" ? data.value.answerId : null}></Question>
				<IndicatorContainer>
					<RoundIndicator numRounds={numRounds} roundNumber={prevQuestion.value.roundNumber}></RoundIndicator>
				</IndicatorContainer>
			</div>);
		} else if (data.msgType === "ranking") {
			return (<div>
				<Title>Ranking</Title>
				<Ranking ranking={data.value.ranking}></Ranking>
				<IndicatorContainer>
					<RoundIndicator numRounds={numRounds} roundNumber={data.value.roundNumber}></RoundIndicator>
				</IndicatorContainer>
			</div>);
		} else if (data.msgType === "finalScore") {
			return (<div>
				<ReturnHomeLink>
					<Link to={"/"}>Home</Link>
				</ReturnHomeLink>
				<FinalScoreTitle>Final Score</FinalScoreTitle>
				<WinningPlayerContainer>{first(data.value.ranking).playerName} Wins!</WinningPlayerContainer>
				<Ranking ranking={data.value.ranking}></Ranking>
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
