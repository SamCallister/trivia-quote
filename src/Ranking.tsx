import React from "react";
import { take } from "lodash";
import { ReactComponent as ManHoodie } from "./svg/man_hoodie.svg";
import styled from "styled-components";

interface RankingProps {
	ranking: PlayerRankingInfo[]
}
interface SuffixMap {
	[index: number]: string;
}

const maxNumberToShow = 3;
const numToSuffix: SuffixMap = {
	1: "st",
	2: "nd",
	3: "rd"
};

const PlayerContainer = styled.div`
  fill: white;
  stroke: black;
  width: 29%;
  max-width: 100px;
`;


const RankContainer = styled.div`
display:flex;
align-items:center;
flex-direction:column;`;

const RankNumberContainer = styled.div`
margin-right: 28%;
margin-bottom: -13px;
margin-top:8px;`;

const Score = styled.div`
font-size: ${props => props.theme.h3.fontSize};`;

function Ranking(props: RankingProps) {
	const rankingArray: PlayerRankingInfo[] = take(props.ranking, maxNumberToShow);

	return (<div>
		<div>
			{rankingArray.map((rankingInfo, i) => {
				return (<RankContainer key={i}>
					<RankNumberContainer>{i + 1}{numToSuffix[i + 1]}</RankNumberContainer>
					<PlayerContainer>
						<svg viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="48" />
							<ManHoodie></ManHoodie>
						</svg>
					</PlayerContainer>
					<div>{rankingInfo.playerName}</div>
					<Score>{rankingInfo.playerScore}</Score>
				</RankContainer>);
			})}
		</div>
	</div>);
}

export default Ranking;