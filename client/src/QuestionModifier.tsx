import React from "react";
import styled from "styled-components";

const QuestionModifierTitle = styled.div`
	font-size: 36px;
	text-align: center;
	margin-top: 36px;	
`;

const QuestionModifierTextRow = styled.div`
	font-size: 28px;
	text-align: center;
	margin-top: 8px;
`

interface QuestionModifierProps {
	titleText: string;
	text: string[];
}

function QuestionModifier(props: QuestionModifierProps) {

	return (<div>
		<QuestionModifierTitle>{props.titleText}</QuestionModifierTitle>
		{props.text.map((t, i) => {
			return (<QuestionModifierTextRow key={i}>{t}</QuestionModifierTextRow>);
		})}
	</div>);
}

export default QuestionModifier;