import React, { useState } from "react";
import TimeBar from "./components/TimeBar";
import styled from "styled-components";
import AnswerButton from "./components/AnswerButton";
import { merge, partial, isNil } from "lodash";

// Some text {0} {1}
// for each item in the array -> replace {index} with number of spaces equal to the longest answer
// fade in text?
// <u>Helloo here is some l&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;long text that we can seee</u>

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


function Question(props) {

	const { delay, text, choices, score, onChange, questionId } = props;

	const [choiceIndex, setChoiceIndex] = useState(null);
	const [stateChoices, setChoices] = useState(choices);

	const clickedAnswer = (selectedIndex, questionData) => {
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
			onChange({choice:stateChoices[selectedIndex], questionId});
		}
	};

	return (
		<div>
			<TimeBarContainer>
				<TimeBar delay={delay}></TimeBar>
			</TimeBarContainer>
			<ScoreContainer>{score}</ScoreContainer>
			<TextOuter>
				<TextContainer>
					{text}
				</TextContainer>
				<AnswersOuterContainer>
					{stateChoices.map((d, i) => {
						return (<IndividualAnswerContainer key={i}>
							<AnswerButton data={d} buttonClicked={partial(clickedAnswer, i)}>
							</AnswerButton>
						</IndividualAnswerContainer>);
					})}
				</AnswersOuterContainer>
			</TextOuter>
		</div>
	);
}

export default Question;