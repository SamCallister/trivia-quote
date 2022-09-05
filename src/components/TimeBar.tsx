import React from "react";
import styled from "styled-components";
import { useSpring, animated } from 'react-spring'


interface TimeBarProps {
	delay: number;
	stopBar: boolean;
}

const RectContainer = styled.div`
background-color: #D3D3D3;
height:100%;
`;

const SvgStyled = styled.svg`
height:28px;
width:100%;
`;
const widthOfRect = 100;

function TimeBar(props: TimeBarProps) {

	const { delay, stopBar } = props;
	const [styles, api] = useSpring(() => {
		return {
			from: { fill: "#228B22", width: widthOfRect },
			config: { duration: delay },
			to: {
				fill: "#DC143C",
				width: 0
			},
		}
	});

	if (stopBar) {
		api.pause();
	}

	return (<RectContainer><SvgStyled viewBox="0 0 100 7">
		<animated.rect style={styles} x="0" y="0" height="7" width={widthOfRect} fill="#228B22"></animated.rect>
	</SvgStyled></RectContainer>);
}

export default TimeBar;