import React from "react";
import { take } from "lodash";
import styled from "styled-components";
import { Avatar } from "./components/Avatar";

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
  width: 18%;
  max-width: 100px;
`;


const RankNumberContainer = styled.div`
position:absolute;
left:-14px;
top:0px;
`;


const RowsContainer = styled.div`
	margin-top: 16px;
	width: 100%;
`;

const PlayerRow = styled.div`
	display: flex;
	align-items:center;
	margin-left: 36px;
	position: relative;
`;

const PlayerNameContainer = styled.span`
	margin-left: 8px;
`;


function Ranking(props: RankingProps) {
	const rankingArray: PlayerRankingInfo[] = take(props.ranking, maxNumberToShow);

	return (<div>
		<div>
			<RowsContainer>
				{rankingArray.map((rankingInfo, i) => {
					return (<PlayerRow key={i}>
						<RankNumberContainer>{i + 1}{numToSuffix[i + 1]}</RankNumberContainer>
						<PlayerContainer>
							<svg viewBox="0 0 100 100">
								<circle cx="50" cy="50" r="48" />
								<Avatar avatarId={rankingInfo.playerAvatar}></Avatar>
							</svg>
						</PlayerContainer>
						<PlayerNameContainer>{rankingInfo.playerName}</PlayerNameContainer>
					</PlayerRow>);
				})}
			</RowsContainer>

		</div>
	</div>);
}

export default Ranking;
