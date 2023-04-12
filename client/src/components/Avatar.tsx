import React from "react";
import { fromPairs, pick } from "lodash";
import { ReactComponent as ManHoodie } from "../svg/man_hoodie.svg";
import { ReactComponent as WomanEarring } from "../svg/woman_earring.svg";
import { ReactComponent as WomanPurse } from "../svg/woman_purse.svg";
import { ReactComponent as ManBlueShirt } from "../svg/man_blue_shirt.svg";
import { ReactComponent as QuestionPerson } from "../svg/question_person.svg";
import { ReactComponent as Dino } from "../svg/dino.svg";
import { ReactComponent as Star } from "../svg/star.svg";
import { ReactComponent as Fire } from "../svg/fire_ball.svg"
import { ReactComponent as Skull } from "../svg/skull.svg"
import { ReactComponent as Crown } from "../svg/crown.svg"

const characters = [{
	element: <ManHoodie key={0}></ManHoodie>,
	avatarId: "manHoodie"
},
{
	element: <WomanEarring key={1}></WomanEarring>,
	avatarId: "womanEarring"
},
{
	element: <WomanPurse key={2}></WomanPurse>,
	avatarId: "womanPurse"
}, {
	element: <ManBlueShirt key={3}></ManBlueShirt>,
	avatarId: "manBlueShirt"
}, {
	element: <QuestionPerson key={4}></QuestionPerson>,
	avatarId: "questionPerson",
	unlockLogic: (localPlayerInfo: LocalPlayerInfo) => {
		return localPlayerInfo.visitedHelpPage;
	},
	unlockMessage: "visit Help page"
}, {
	element: <Dino key={5}></Dino>,
	avatarId: "dino",
	unlockLogic: (localPlayerInfo: LocalPlayerInfo) => {
		return localPlayerInfo.finishedGame;
	},
	unlockMessage: "finish a game"
}, {
	element: <Star key={6}></Star>,
	avatarId: "star",
	unlockLogic: (localPlayerInfo: LocalPlayerInfo) => {
		return localPlayerInfo.wonAIGame;
	},
	unlockMessage: "win a single player game"
}, {
	element: <Fire key={7}></Fire>,
	avatarId: "fire",
	unlockLogic: (localPlayerInfo: LocalPlayerInfo) => {
		return (localPlayerInfo.numWins || 0) >= 3;
	},
	unlockMessage: "win 3 games"
}, {
	element: <Skull key={8}></Skull>,
	avatarId: "skull",
	unlockLogic: (localPlayerInfo: LocalPlayerInfo) => {
		return (localPlayerInfo.numWins || 0) >= 5;
	},
	unlockMessage: "win 5 games"
}, {
	element: <Crown key={9}></Crown>,
	avatarId: "crown",
	unlockLogic: (localPlayerInfo: LocalPlayerInfo) => {
		return (localPlayerInfo.numWins || 0) >= 10;
	},
	unlockMessage: "win 10 games"
}];

const characterLookup = fromPairs(characters.map((c) => {
	return [c.avatarId, { element: c.element, unlockLogic: c.unlockLogic, unlockMessage: c.unlockMessage }];
}));

interface AvatarProps {
	avatarId: string;
};

function Avatar(props: AvatarProps) {


	return characterLookup[props.avatarId].element;
}

function avatarUnlockInfo(avatarId: string) {
	return pick(characterLookup[avatarId], ["unlockLogic", "unlockMessage"]);
}

function isPlayerUnlocked(localPlayerInfo: LocalPlayerInfo) {
	return isPlayerUnlockedWithId(localPlayerInfo, localPlayerInfo.playerAvatar);
}

function isPlayerUnlockedWithId(localPlayerInfo: LocalPlayerInfo, avatarId: string) {
	const unlockLogic = characterLookup[avatarId].unlockLogic;

	if (!unlockLogic) {
		return true;
	}

	return unlockLogic(localPlayerInfo);
}

function getDefaultAvatarId() {
	return characters[0].avatarId;
}

const avatarIds = characters.map((c) => { return c.avatarId });

export {
	Avatar,
	avatarUnlockInfo,
	avatarIds,
	isPlayerUnlocked,
	isPlayerUnlockedWithId,
	getDefaultAvatarId
};