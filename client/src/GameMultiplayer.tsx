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
import { Title } from './components/Components';

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
	width: 100%;
	${props => props.theme.appContainerStyles}
`;

const GameContainer = styled.div`
	${props => props.theme.appContainerStyles}
	position: relative;
`;

const ReturnHomeLink = styled.div`
position:absolute;
top:-10px;
right:10px;`;

interface SendFunc {
	(data: SocketMessagesUnion): void;
}

interface GameMultiplayerProps {
	currentMessage: SocketMessagesUnion,
	send: SendFunc
}

function GameMultiplayer(props:GameMultiplayerProps) {
	const [score, setScore] = useState(0);
	const [prevQuestion, setPrevQuestion] = useState(null);
	const [msgData, setMsgData] = useState(null);


	const numRounds = 3;

	useEffect(() => {
		if (props.currentMessage.msgType === "question") {
			setPrevQuestion(props.currentMessage);
		}

		if (props.currentMessage.msgType === "questionResult") {
			setScore(props.currentMessage.value.playerScore);
		}

		setMsgData(props.currentMessage);
	}, [props.currentMessage]);
	
	const questionAnswered = (choice: QuestionChoice, questionId: string) => {
		props.send({
			msgType: "answer",
			delay: 0,
			value: { answerId: choice.id, questionId }
		});
	};

	const getElements = (data: SocketMessagesUnion) => {
		if (isNull(data)) {
			return (<Title>Loading...</Title>);
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
				<Question delay={prevQuestion.delay}
					text={prevQuestion.value.text}
					author={prevQuestion.value.author}
					questionId={prevQuestion.value.id} choices={prevQuestion.value.choices} score={score.toLocaleString()} onChange={questionAnswered} correctAnswer={data.msgType === "questionResult" ? data.value.answerId : null}></Question>
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

	return (<GameContainer>{getElements(msgData)}</GameContainer>);
}


export default GameMultiplayer;
