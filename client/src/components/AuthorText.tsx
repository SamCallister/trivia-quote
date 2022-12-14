import React from "react";
import styled from "styled-components";
import { max, first} from "lodash";
import ClientConstants from "../ClientConstants";

interface AuthorProps {
	author: string;
	authorChoices: QuestionChoice[];
	correctAuthor: string;
	questionType: QuestionType;
}

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

function getMaxNumLetters(choices: QuestionChoice[]) {
	return max(choices.map(d => d.text.length));
}

function AuthorText(props: AuthorProps) {

	const isAnswered = !(props.correctAuthor == null || props.correctAuthor == "");
	const numLetters = getMaxNumLetters(props.authorChoices);

	if (props.questionType === "quoteBlanks") {
		return props.author !== "" ? <span>{`~${props.author}`}</span> : <span></span>;
	} else if (props.questionType === "authorBlank") {
		const authorText = isAnswered ? first(props.authorChoices.filter((d) => d.id === props.correctAuthor)).text : "S";

		return (<div>~<AnswerUnderline style={{ width: `${numLetters * ClientConstants.CHAR_WIDTH}em` }} isAnswered={isAnswered}>{authorText}</AnswerUnderline></div>)
	}

}

export default AuthorText;