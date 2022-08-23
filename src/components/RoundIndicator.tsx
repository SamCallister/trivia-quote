import React from "react";
import styled from "styled-components";
import { range } from 'lodash';

interface RoundIndicatorProps {
	numRounds: number;
	roundNumber: number;
};

const Line = styled.line`
stroke-width: 0.5px;
stroke: black;`;

const FutureCircle = styled.circle`
	stroke: black;
	stroke-width: 0.5px;
	fill: white;
`;

const DoneCircle = styled.circle`
stroke: black;
stroke-width: 0.5px;
fill: green;`;

const CurrentCircle = styled.circle`
stroke-width:1px;
stroke:green;
fill: white;`;


function RoundIndicator(props: RoundIndicatorProps) {
	const { numRounds, roundNumber } = props;

	const start = 25;
	const end = 75;
	const totalDist = end - start;
	const isEven = numRounds % 2 === 0;
	const distBetweenCircles = totalDist / (numRounds - ((!isEven && 1) || 0));

	return (
		<svg viewBox="0 0 100 20">
			<Line x1="0" y1="10" x2="100" y2="10" />
			{range(numRounds).map((i) => {
				const spaceI = isEven ? i + 1 : i;
				if (i < roundNumber - 1) {
					return <DoneCircle key={i} r="3" cy="10" cx={start + (spaceI * distBetweenCircles)}></DoneCircle>
				} else if (i == roundNumber - 1) {
					return <CurrentCircle key={i} r="3" cy="10" cx={start + (spaceI * distBetweenCircles)}></CurrentCircle>
				} else {
					return <FutureCircle key={i} r="3" cy="10" cx={start + (spaceI * distBetweenCircles)}></FutureCircle>
				}
			})}
		</svg>);
}

export default RoundIndicator;