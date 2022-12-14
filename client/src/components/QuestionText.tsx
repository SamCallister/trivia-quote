import React from "react";
import styled from "styled-components";
import { isEmpty, head } from "lodash";
import questionTextService from '../service/questionTextService';
import ClientConstants from "../ClientConstants";


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

interface QuestionTextProps {
	text: string;
	completeText: string;
	choices: QuestionChoice[];
	isAnswered: boolean;
	correctAnswer: string;
	questionType: QuestionType;
}

function QuestionText(props: QuestionTextProps) {

	const getQuestionText = (text: string, choices: QuestionChoice[], answers: string[], isAnswered: boolean) => {

		const splitArray = questionTextService.formatQuestionUnderlines(text, choices.map((d) => d.text), answers);
		return splitArray.map((d, i) => {
			const { text, isAnswer, numLetters } = d;

			if (isAnswer) {
				return (<AnswerUnderline key={i} style={{ width: `${numLetters * ClientConstants.CHAR_WIDTH}em` }} isAnswered={isAnswered}>{text}</AnswerUnderline>);
			} else {
				return (<span key={i}>{text}</span>);
			}
		});
	};

	const buildCorrectAnswerArray = () => {
		const correctChoice = props.choices.find((d) => {
			return d.id === props.correctAnswer;
		});
		return correctChoice.text.split(",").map((t) => t.trim()).filter((t) => !isEmpty(t))
	}

	if (props.questionType == "authorBlank") {
		return <div>{props.completeText}</div>
	} else {
		const numAnswers = head(props.choices).text.split(",").map((t: string) => t.trim()).filter((t: string) => !isEmpty(t)).length;

		const answersArray = props.isAnswered ? buildCorrectAnswerArray() : Array(numAnswers).fill("X");
		return (<div>{getQuestionText(props.text, props.choices, answersArray, props.isAnswered)}</div>);
	}

}

export default QuestionText;