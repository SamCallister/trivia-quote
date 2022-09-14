import React from "react";
import styled from "styled-components";

const Title = styled.div`
font-size: ${props => props.theme.h1.fontSize};
margin-top: 36px;
`;

const Category = styled.div`
font-size: ${props => props.theme.h2.fontSize};
background-color: white;
border: 1px solid black;
padding: 16px;
margin-top: 16px;
width: 70%;
text-align:center;
`;

const Container = styled.div`
	display:flex;
	justify-content:center;
	align-items:center;
	flex-direction: column;
`;

interface StaticRoundProps {
	title: string;
	category: string;
}



function StaticRound(props: StaticRoundProps) {
	const { title, category } = props;

	return (<Container><Title>{title}</Title>
		<Category>{category}</Category>
	</Container>);
}

export default StaticRound;