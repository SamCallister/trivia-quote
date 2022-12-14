import React, { useState } from "react";
import styled from "styled-components";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { merge, findIndex } from "lodash";
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
`;

interface ArrowContainerProps {
	disabled?: boolean;
};

interface PlayerChangeFunc {
	(data: PlayerInfo): void;
}

interface PlayerProps {
	onChange?: PlayerChangeFunc;
	disabled?: boolean;
}

const ArrowContainer = styled.div<ArrowContainerProps>`
  align-self: center;
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
		if (props.disabled) {
			return;
		}

		let newCharIndex = avatarIndex + direction;
		if (newCharIndex < 0) {
			newCharIndex = avatarIds.length - 1;
		}

		if (newCharIndex >= avatarIds.length) {
			newCharIndex = 0;
		}

		setPlayerInfoWrapper(merge({}, playerInfo, { playerAvatar: avatarIds[newCharIndex] }));
		setAvatarIndex(newCharIndex);
	};

	const inputChangeFunc = (v:string) => {
		if (props.disabled) {
			return;
		}

		setPlayerInfoWrapper(
			merge({}, playerInfo, { playerName: v })
		)
	};


	return (
		<OuterContainer>
			<PlayerContainer>
				<ArrowContainer><FaArrowLeft onClick={moveCharIndex.bind(this, -1)}></FaArrowLeft></ArrowContainer>
				<svg viewBox="0 0 100 100">
					<circle cx="50" cy="50" r="48" />
					<Avatar avatarId={avatarIds[avatarIndex]}></Avatar>
				</svg>
				<ArrowContainer disabled={props.disabled}><FaArrowRight onClick={moveCharIndex.bind(this, 1)}></FaArrowRight></ArrowContainer>
			</PlayerContainer>
			<LowerContainer>
				<PlateContainer>
					<NamePlate disabled={props.disabled} value={playerInfo.playerName} inputChange={inputChangeFunc}></NamePlate>
				</PlateContainer>
			</LowerContainer>
		</OuterContainer>
	);
}

export default Player;