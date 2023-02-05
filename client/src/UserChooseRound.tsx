import React, { useEffect, useState } from "react";
import styled from "styled-components";
import PlayerView from "./components/PlayerView";
import TimeBar from "./components/TimeBar";

const Title = styled.div`
font-size: ${props => props.theme.h1.fontSize};
margin-top: 16px;
`;

interface CategoryProps {
	isSelected: boolean;
}

const Category = styled.div<CategoryProps>`
font-size: 24px;
background-color: white;
outline: ${props => props.isSelected ? "5px solid #B8860B" : "1px solid black"};
padding: 16px;
margin-top: 14px;
margin-bottom: 5px;
width: 70%;
text-align:center;
cursor:default;
`;

const Container = styled.div`
	display:flex;
	justify-content:center;
	align-items:center;
	flex-direction: column;
`;

const PlayerContainer = styled.div`
  fill: white;
  stroke: black;
  width: 50%;
  max-width: 230px;
`;

const PlayerNameContainer = styled.div`
	font-size: 24px;
`;

const ChooseCategoryContainer = styled.div`
	margin-left:10.5%;
	align-self: self-start;
	font-size: 24px;
	margin-top: 24px;
`;

const TimeBarContainer = styled.div`
	height: 28px;
	width: 100%;
`;

interface ChoseRoundFunc {
	(categoryId: string): void;
}

interface UserChooseRoundProps {
	msgData: UserChoiceRoundMessage;
	choseRound: ChoseRoundFunc;
	chosenCategoryId: string;

}
// isChoosingPlayer -> allows for clicking
const SPEED_UP_TIMEBAR = 100;

function UserChooseRound(props: UserChooseRoundProps) {
	const { msgData } = props;
	const [selectedCategory, setSelectedCategory] = useState("");

	const clickHandler = (categoryId: string) => {
		if (!msgData.value.isChoosingPlayer || selectedCategory) {
			return;
		}

		setSelectedCategory(categoryId);
		props.choseRound(categoryId);
	};

	useEffect(() => {
		if (props.chosenCategoryId) {
			setSelectedCategory(props.chosenCategoryId);
		}

	}, [props.chosenCategoryId])

	return (<Container>
		<TimeBarContainer>
			<TimeBar delay={msgData.delay - SPEED_UP_TIMEBAR} stopBar={selectedCategory !== ""}></TimeBar>
		</TimeBarContainer>
		<Title>{msgData.value.titleText}</Title>
		<PlayerContainer><PlayerView avatarId={msgData.value.playerAvatar}></PlayerView></PlayerContainer>
		<PlayerNameContainer>{msgData.value.playerName}</PlayerNameContainer>
		<ChooseCategoryContainer>{msgData.value.text}</ChooseCategoryContainer>
		{msgData.value.categories.map((c, i) => {
			return (<Category key={i}
				onClick={clickHandler.bind(this, c.categoryId)}
				isSelected={selectedCategory === c.categoryId}>{c.name}</Category>);
		})}
	</Container>);
}

export default UserChooseRound;