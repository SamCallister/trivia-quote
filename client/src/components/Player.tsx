import React, { useState } from "react";
import styled from "styled-components";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { min, max, merge, findIndex } from "lodash";
import { Avatar, avatarIds } from "./Avatar";
import NamePlate from "./NamePlate";
import { useLocalStorage } from "../hooks/localStorage";
import localPlayerInfo from "../service/localPlayerInfo";

const PlayerContainer = styled.div`
  width: 100%;
  fill: white;
  stroke: black;
  display: flex;
`;

const OuterContainer = styled.div`
	width: 100%;
`

interface ArrowContainerProps {
	show: boolean;
};

interface PlayerChangeFunc {
	(data: PlayerInfo): void;
}

interface PlayerProps {
	onChange?: PlayerChangeFunc
}

const ArrowContainer = styled.div<ArrowContainerProps>`
  align-self: center;
  visibility: ${props => props.show ? "visible" : "hidden"};
  font-size: 24px;
`;

const LowerContainer = styled.div`
  justify-content: space-between;
  align-items: center;
  width: 100%;
  flex-direction: column;
  display: flex;
  margin-top: 10px;
`;

const PlateContainer = styled.div`
  width: 120%;
  position: relative;
  margin-bottom: 24px;
`;

localPlayerInfo
function Player(props: PlayerProps) {
	const playerArray = useLocalStorage("playerInfo",
		localPlayerInfo.getPlayerInfo());

	const playerInfo = playerArray[0] as PlayerInfo;
	const setPlayerInfo = playerArray[1];
	const [avatarIndex, setAvatarIndex] = useState(
		findIndex(avatarIds, (avatarId) => avatarId === playerInfo.playerAvatar)
	);

	const setPlayerInfoWrapper = (newPlayerInfo: PlayerInfo) => {
		if (props.onChange) {
			props.onChange(newPlayerInfo);
		}

		setPlayerInfo(newPlayerInfo);
	}

	const moveCharIndex = (direction: number) => {
		const newCharIndex = avatarIndex + direction;
		const boundedCharIndex = min([max([newCharIndex, 0]), avatarIds.length - 1]);
		setPlayerInfoWrapper(merge({}, playerInfo, { playerAvatar: avatarIds[boundedCharIndex] }));
		setAvatarIndex(boundedCharIndex);
	};


	return (
		<OuterContainer>
			<PlayerContainer>
				<ArrowContainer show={avatarIndex > 0}><FaArrowLeft onClick={moveCharIndex.bind(this, -1)}></FaArrowLeft></ArrowContainer>
				<svg viewBox="0 0 100 100">
					<circle cx="50" cy="50" r="48" />
					<Avatar avatarId={avatarIds[avatarIndex]}></Avatar>
				</svg>
				<ArrowContainer show={avatarIndex < avatarIds.length - 1}><FaArrowRight onClick={moveCharIndex.bind(this, 1)}></FaArrowRight></ArrowContainer>
			</PlayerContainer>
			<LowerContainer>
				<PlateContainer>
					<NamePlate value={playerInfo.playerName} inputChange={(v) => setPlayerInfoWrapper(
						merge({}, playerInfo, { playerName: v })
					)}></NamePlate>
				</PlateContainer>
			</LowerContainer>
		</OuterContainer>
	);
}

export default Player;