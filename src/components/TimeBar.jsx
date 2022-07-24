import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import Snap from 'snapsvg-cjs';

const RectContainer = styled.div`
background-color: #D3D3D3;
height:100%;
`;

const SvgStyled = styled.svg`
height:28px;
width:100%;
`;


function TimeBar(props) {

	const { delay } = props;
	const svgRef = useRef(null);

	useEffect(() => {
		if (svgRef.current) {
			Snap("#timebar").animate({ width: 0 }, delay);
			setTimeout(() => {
				Snap("#timebar").attr({ fill: "#DE591C" });
			}, delay * 0.35);
			setTimeout(() => {
				Snap("#timebar").attr({ fill: "#DC143C" });
			}, delay * 0.65);
		}

		// animate the width of the bar

	}, [svgRef]);

	// time ticking down -> interval update until enough time passes
	// set state -> fill
	return (<RectContainer><SvgStyled viewBox="0 0 100 7">
		<rect ref={svgRef} id="timebar" x="0" y="0" height="7" width="100" fill="#228B22"></rect>
	</SvgStyled></RectContainer>);
}

export default TimeBar;