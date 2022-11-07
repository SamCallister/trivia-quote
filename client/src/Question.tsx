import React, { useState } from "react";
import TimeBar from "./components/TimeBar";
import styled from "styled-components";
import AnswerButton from "./components/AnswerButton";
import { merge, partial, isNil, isEmpty, head, isNull } from "lodash";
import questionTextService from './service/questionTextService';

const TimeBarContainer = styled.div`
	height: 28px;
`;

const TextOuter = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 85vh;
	align-items: center;
`;

const TextContainer = styled.div`
	margin-left: 24px;
	margin-right: 24px;
	margin-top: 48px;
	${props => props.theme.normalText};
`;

const AnswersOuterContainer = styled.div`
	padding-right: 24px;
	padding-left: 24px;
	padding-bottom: 64px;
	display: flex;
	flex-direction:column;
`;

const IndividualAnswerContainer = styled.div`
  `;

const ScoreContainer = styled.div`
text-align: end;
padding-right: 8px;
${(props) => props.theme.normalText};
`;

const ScoreUpdateContainer = styled.div`
${(props) => props.theme.normalText};
display: flex;
justify-content: center;
position: relative;
text-align: right;
`;

interface ShowUpdateProps {
	showUpdate: boolean;
}

const ScoreUpdate = styled.span<ShowUpdateProps>`
	color: #447B30;
	visibility: ${props => props.showUpdate ? "visible" : "hidden"};
	position: absolute;
	right: 8px;
`;

interface AnswerUnderlineProps {
	isAnswered: boolean;
}

const AnswerUnderline = styled.span<AnswerUnderlineProps>`
border-bottom: 1px solid black;
display:inline-block;
line-height:0.85;
text-indent: ${props => props.isAnswered ? 0 : "-100000000px"};
text-align: center;
`;

interface TimeoutMsgContainerProps {
	show: boolean;
}

const TimeoutMsgContainer = styled.span<TimeoutMsgContainerProps>`
color:#DC143C;
${props => props.theme.normalText};
visibility: ${props => props.show ? "visible" : "hidden"};
`;

const AuthorContainer = styled.div`
font-size:16px;
text-align:right;
margin-right:24px;
margin-top:16px;
color: black;`;

interface QuestionAnsweredFunc {
	(data: QuestionChoice, questionId: string): void;
}

interface QuestionProps {
	delay: number;
	text: string;
	author: string;
	score: string;
	scoreDelta: string;
	speedScoreDelta: string;
	questionId: string;
	correctAnswer: string;
	choices: QuestionChoice[];
	onChange: QuestionAnsweredFunc;
}

const CHAR_WIDTH = 0.6;
const SPEED_UP_TIMEBAR = 100;

function Question(props: QuestionProps) {

	const { delay, text, choices, score, onChange, questionId, correctAnswer, author } = props;
	// modify the question text here
	// if there are no answers provided then use <ul> with spaces computing max number of spaces
	// if there are answers provided then use <ul> with spaces around the word?
	//questionTextService.formatQuestionUnderlines(d.text, d.choices.map((v) => v.text))

	const [choiceIndex, setChoiceIndex] = useState(null);
	const [stateChoices, setChoices] = useState(choices);
	const [updatedWithAnswer, setUpdatecWithAnswer] = useState(false);
	const [gotAnswerCorrect, setAnswerCorrect] = useState(false);

	const isAnswered = !isNil(correctAnswer);
	const timeoutOccurred = isNull(choiceIndex) && isAnswered;

	const clickedAnswer = (selectedIndex: number) => {
		// mark as selected
		if (isNil(choiceIndex) && !timeoutOccurred) {
			const newChoices = stateChoices.map((d, i) => {
				if (selectedIndex === i) {
					return merge({}, d, { state: "selected" });
				} else {
					return d;
				}
			})
			setChoiceIndex(selectedIndex);
			setChoices(newChoices);
			onChange(stateChoices[selectedIndex], questionId);
		}
	};

	const numAnswers = head(choices).text.split(",").map((t: string) => t.trim()).filter((t: string) => !isEmpty(t)).length;

	const getQuestionText = (text: string, choices: QuestionChoice[], answers: string[], isAnswered: boolean) => {

		const splitArray = questionTextService.formatQuestionUnderlines(text, choices.map((d) => d.text), answers);
		return splitArray.map((d, i) => {
			const { text, isAnswer, numLetters } = d;

			if (isAnswer) {
				return (<AnswerUnderline key={i} style={{ width: `${numLetters * CHAR_WIDTH}em` }} isAnswered={isAnswered}>{text}</AnswerUnderline>);
			} else {
				return (<span key={i}>{text}</span>);
			}
		});
	};

	let questionText;
	if (!isAnswered) {
		questionText = getQuestionText(text, choices, Array(numAnswers).fill("X"), isAnswered);
	}

	if (isAnswered) {
		// question text fill the the answer
		const correctChoice = choices.find((d) => {
			return d.id === correctAnswer;
		});
		const correctAnswerArray = correctChoice.text.split(",").map((t) => t.trim()).filter((t) => !isEmpty(t))
		questionText = getQuestionText(text, choices, correctAnswerArray, isAnswered);
	}

	if (isAnswered && !updatedWithAnswer) {
		let oneIsCorrect = false;
		const updateChoices = stateChoices.map((d) => {
			const isCorrect = correctAnswer === d.id;
			const isSelected = d.state === "selected";

			if (isSelected && isCorrect) {
				oneIsCorrect = true;
				// green it
				return merge({}, d, { state: "correctSelected" });
			} else if (isSelected && !isCorrect) {
				// red it
				return merge({}, d, { state: "incorrect" });
			} else if (!isSelected && isCorrect) {
				// green it
				return merge({}, d, { state: "correctNotSelected" });
			} else {
				return d;
			}


		});
		setAnswerCorrect(oneIsCorrect);
		setUpdatecWithAnswer(true);
		setChoices(updateChoices);
	}

	// if choice index is null and correctAnswer is here then there was a timeout
	// {data.state === "correctSelected" && <ScoreText x="332" y="10">+100</ScoreText>} 447B30
	return (
		<div>
			<TimeBarContainer>
				<TimeBar delay={delay - SPEED_UP_TIMEBAR} stopBar={isAnswered}></TimeBar>
			</TimeBarContainer>
			<ScoreContainer>{score}</ScoreContainer>
			<ScoreUpdateContainer>
				<TimeoutMsgContainer show={timeoutOccurred}>⏳☹️⏳ too slow!</TimeoutMsgContainer>
				<ScoreUpdate showUpdate={gotAnswerCorrect}><div>+{props.scoreDelta}</div>{props.speedScoreDelta && (<div>🏎️ +{props.speedScoreDelta}</div>)}</ScoreUpdate>
			</ScoreUpdateContainer>
			<TextOuter>
				<div>
					<TextContainer>
						{questionText}
					</TextContainer>
					<AuthorContainer>
						~{author}
					</AuthorContainer>
				</div>
				<AnswersOuterContainer>
					{stateChoices.map((d, i) => {
						return (<IndividualAnswerContainer key={i}>
							<AnswerButton data={d}
								buttonClicked={partial(clickedAnswer, i)}></AnswerButton>
						</IndividualAnswerContainer>);
					})}
				</AnswersOuterContainer>
			</TextOuter>
		</div>
	);
}

export default Question;