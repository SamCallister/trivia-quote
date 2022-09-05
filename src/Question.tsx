import React, { useState } from "react";
import TimeBar from "./components/TimeBar";
import styled from "styled-components";
import AnswerButton from "./components/AnswerButton";
import { merge, partial, isNil, isEmpty, head } from "lodash";
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
	margin-top: 48px;
	font-size: ${props => props.theme.normalText.fontSize};
`;


const AnswersOuterContainer = styled.div`
	padding-right: 24px;
	padding-left: 24px;
	padding-bottom: 36px;
	display: flex;
	flex-direction:column;
`;

const IndividualAnswerContainer = styled.div`
  `;

const ScoreContainer = styled.div`
text-align: end;
padding-right: 8px;
font-size: ${(props) => props.theme.normalText.fontSize};
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

interface QuestionAnsweredFunc {
	(data: QuestionChoice, questionId: string): void;
}

interface QuestionProps {
	delay: number;
	text: string;
	score: string;
	questionId: string;
	correctAnswer: string;
	choices: QuestionChoice[];
	onChange: QuestionAnsweredFunc;
}

const CHAR_WIDTH = 0.6;

function Question(props: QuestionProps) {

	const { delay, text, choices, score, onChange, questionId, correctAnswer } = props;
	// modify the question text here
	// if there are no answers provided then use <ul> with spaces computing max number of spaces
	// if there are answers provided then use <ul> with spaces around the word?
	//questionTextService.formatQuestionUnderlines(d.text, d.choices.map((v) => v.text))

	const [choiceIndex, setChoiceIndex] = useState(null);
	const [stateChoices, setChoices] = useState(choices);
	const [updatedWithAnswer, setUpdatecWithAnswer] = useState(false);

	const isAnswered = !isNil(correctAnswer);

	const clickedAnswer = (selectedIndex: number) => {
		// mark as selected
		if (isNil(choiceIndex)) {
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
		return splitArray.map((d) => {
			const { text, isAnswer, numLetters } = d;

			if (isAnswer) {
				return (<AnswerUnderline style={{ width: `${numLetters * CHAR_WIDTH}em` }} isAnswered={isAnswered}>{text}</AnswerUnderline>);
			} else {
				return text;
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
		const updateChoices = stateChoices.map((d) => {
			const isCorrect = correctAnswer === d.id;
			const isSelected = d.state === "selected";

			if (isSelected && isCorrect) {
				// green it
				return merge({}, d, { state: "correct" });
			} else if (isSelected && !isCorrect) {
				// red it
				return merge({}, d, { state: "incorrect" });
			} else if (!isSelected && isCorrect) {
				// green it
				return merge({}, d, { state: "correct" });
			} else {
				return d;
			}


		});
		setUpdatecWithAnswer(true);
		setChoices(updateChoices);
	}

	return (
		<div>
			<TimeBarContainer>
				<TimeBar delay={delay} stopBar={isAnswered}></TimeBar>
			</TimeBarContainer>
			<ScoreContainer>{score}</ScoreContainer>
			<TextOuter>
				<TextContainer>
					{questionText}
				</TextContainer>
				<AnswersOuterContainer>
					{stateChoices.map((d, i) => {
						return (<IndividualAnswerContainer key={i}>
							<AnswerButton data={d} buttonClicked={partial(clickedAnswer, i)}></AnswerButton>
						</IndividualAnswerContainer>);
					})}
				</AnswersOuterContainer>
			</TextOuter>
		</div>
	);
}

export default Question;