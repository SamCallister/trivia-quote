import React from "react";
import { take } from "lodash";
import styled from "styled-components";
import PlayerView from "./components/PlayerView";
import ClientConstants from "./ClientConstants";

interface RankingProps {
	ranking: PlayerRankingInfo[]
}
interface SuffixMap {
	[index: number]: string;
}

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
left:-18px;
top:0px;
font-size:12px;
`;


const RowsContainer = styled.div`
	margin-top: 8px;
	width: 100%;
`;

const PlayerRow = styled.div`
	display: flex;
	align-items:center;
	margin-left: 36px;
	margin-right: 36px;
	position: relative;
`;

const PlayerNameContainer = styled.span`
	margin-left: 8px;
	display: flex;
	justify-content: space-between;
	width: 100%;
`;

function Ranking(props: RankingProps) {
	const rankingArray: PlayerRankingInfo[] = take(
		props.ranking,
		ClientConstants.MAX_NUM_PLAYERS_ON_RANKING_PAGE
	);

	return (<div>
		<div>
			<RowsContainer>
				{rankingArray.map((rankingInfo, i) => {
					return (<PlayerRow key={i}>
						<RankNumberContainer>{rankingInfo.rankNumber}{numToSuffix[rankingInfo.rankNumber] || "th"}</RankNumberContainer>
						<PlayerContainer>
							<PlayerView avatarId={rankingInfo.playerAvatar}></PlayerView>
						</PlayerContainer>
						<PlayerNameContainer><span>{rankingInfo.playerName}</span><span>{rankingInfo.playerScore.toLocaleString()}</span></PlayerNameContainer>
					</PlayerRow>);
				})}
			</RowsContainer>

		</div>
	</div>);
}

export default Ranking;
