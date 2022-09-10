import React from "react";
import PropTypes from "prop-types";
import "./AnswerButton.css";
import styled from "styled-components";

interface PathProps {
	state: string;
}

interface ButtonClickedFunc {
	(data: QuestionChoice): void;
}


interface AnswerButtonProps {
	buttonClicked: ButtonClickedFunc;
	data: QuestionChoice;
}

const Path = styled.path<PathProps>`
${({ state }) => {
		return {
			selected: `stroke:#B8860B;
			stroke-width: 5px;`,
			incorrect: `stroke:#DC143C;stroke-width: 5px;`,
			correctSelected: `stroke:#447B30;stroke-width: 5px;`,
			correctNotSelected: `stroke:#447B30;stroke-width: 5px;`
		}[state] || "stroke:black;";
	}};
`;



const Svg = styled.svg`
	stroke-width: 0.5px;
	width: 100%;
`;

const AnswerText = styled.div`
	cursor:default;
	${props => props.theme.normalText};
`;


function AnswerButton(props: AnswerButtonProps) {
	const { data, buttonClicked } = props;

	const clickHandler = () => {
		buttonClicked(data);
	}

	return (<Svg onClick={clickHandler} width="383" height="65" viewBox="0 0 383 65" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path state={data.state} id="svg-button-outline" d="M1 39.8219L22.0368 53H360.379L382 39.8219V14.8904L360.379 1H22.6212L1 14.8904V39.8219Z" />
		<foreignObject x="25" y="14" width="383" height="30"><AnswerText>
			{data.text}</AnswerText></foreignObject>
	</Svg>);
}

AnswerButton.propTypes = {
	children: PropTypes.string,
};

export default AnswerButton;
