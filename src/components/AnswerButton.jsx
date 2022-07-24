import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./AnswerButton.css";
import styled from "styled-components";

const Path = styled.path`
${({ state }) => {
		if (state == "selected") {
			return `stroke:#B8860B;
			stroke-width: 5px;`;
		} else {
			return `stroke:black;`;
		}
	}};
`;

const Text = styled.text`
text-anchor: start;
font-family: "News Cycle";
font-size: 20px;
fill: black;
stroke: black;
stroke-width: 0.1px;`;

const Svg = styled.svg`
	stroke-width: 0.5px;
	width: 100%;
`;


// <Path state={data.state} id="svg-button-outline" d="M359.794 53H22.0368L1 39.8219V14.8904L22.6212 1H360.379L382 14.8904V39.8219L360.379 53" />

function AnswerButton(props) {
	const { data, buttonClicked } = props;

	const clickHandler = () => {
		buttonClicked(data);
	}

	return (<Svg onClick={clickHandler} width="383" height="54" viewBox="0 0 383 54" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Text id="svg-button-text" x="25" y="33" stroke="black">{data.text}</Text>
		<Path state={data.state} id="svg-button-outline" d="M1 39.8219L22.0368 53H360.379L382 39.8219V14.8904L360.379 1H22.6212L1 14.8904V39.8219Z" />
	</Svg>);
}

AnswerButton.propTypes = {
	children: PropTypes.string,
};

export default AnswerButton;
