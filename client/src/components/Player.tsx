import React, { useState } from "react";
import styled from "styled-components";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { merge, findIndex, isUndefined, filter, pick } from "lodash";
import { Avatar, avatarIds, avatarUnlockInfo, isPlayerUnlockedWithId } from "./Avatar";
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
	(data: AvatarInfo): void;
}

interface PlayerProps {
	onChange?: PlayerChangeFunc;
	disabled?: boolean;
	localPlayerInfo: LocalPlayerInfo;
	onlyUnlocked?: boolean;
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

const SvgContainer = styled.div`
  position: relative;	
`;

const DisabledPlayer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: grey;
  opacity: 0.8;
  display: flex;
`;

const DisabledPlayerLabel = styled.div`
  background-color: white;
  border: 1px solid black;
  margin: auto;
  text-align: center;
  padding: 6px;
  font-size: 24px;
  margin-left: 1em;
  margin-right: 1em;
  width: 100%;
`;

function Player(props: PlayerProps) {
	const filteredAvatarIds = props.onlyUnlocked ?
		filter(avatarIds, (avatarId) => isPlayerUnlockedWithId(props.localPlayerInfo, avatarId))
		: avatarIds;

	const [avatarIndex, setAvatarIndex] = useState(
		findIndex(filteredAvatarIds, (avatarId) => avatarId === props.localPlayerInfo.playerAvatar)
	);

	const setPlayerInfoWrapper = (newPlayerInfo: AvatarInfo) => {
		if (props.onChange) {
			props.onChange(newPlayerInfo);
		}
	}

	const moveCharIndex = (direction: number) => {
		if (props.disabled) {
			return;
		}

		let newCharIndex = avatarIndex + direction;
		if (newCharIndex < 0) {
			newCharIndex = filteredAvatarIds.length - 1;
		}
0
		if (newCharIndex >= filteredAvatarIds.length) {
			newCharIndex = 0;
		}

		setPlayerInfoWrapper(merge(pick(props.localPlayerInfo, ['playerName', 'playerAvatar']), { playerAvatar: filteredAvatarIds[newCharIndex] }));
		setAvatarIndex(newCharIndex);
	};

	const inputChangeFunc = (v: string) => {
		if (props.disabled) {
			return;
		}

		setPlayerInfoWrapper(
			merge(pick(props.localPlayerInfo, ['playerName', 'playerAvatar']), { playerName: v })
		);
	};

	const { unlockLogic, unlockMessage } = avatarUnlockInfo(filteredAvatarIds[avatarIndex]);
	const isUnlocked = (isUndefined(unlockLogic) || unlockLogic(props.localPlayerInfo));

	return (
		<OuterContainer>
			<PlayerContainer>
				<ArrowContainer><FaArrowLeft onClick={moveCharIndex.bind(this, -1)}></FaArrowLeft></ArrowContainer>
				<SvgContainer>
					<svg viewBox="0 0 100 100" width="100%">
						<circle cx="50" cy="50" r="48" />
						<Avatar avatarId={filteredAvatarIds[avatarIndex]}></Avatar>
					</svg>
					{!isUnlocked && (<DisabledPlayer><DisabledPlayerLabel>To Unlock:<br></br>{unlockMessage}</DisabledPlayerLabel></DisabledPlayer>)}
				</SvgContainer>
				<ArrowContainer disabled={props.disabled}><FaArrowRight onClick={moveCharIndex.bind(this, 1)}></FaArrowRight></ArrowContainer>
			</PlayerContainer>
			<LowerContainer>
				<PlateContainer>
					<NamePlate disabled={props.disabled} value={props.localPlayerInfo.playerName} inputChange={inputChangeFunc}></NamePlate>
				</PlateContainer>
			</LowerContainer>
		</OuterContainer>
	);
}

export default Player;