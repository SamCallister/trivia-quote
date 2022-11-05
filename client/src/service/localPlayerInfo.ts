import { avatarIds } from "../components/Avatar";

const PLAYER_INFO_KEY = "playerInfo";

function getPlayerInfo(): PlayerInfo {
	return JSON.parse(localStorage.getItem(PLAYER_INFO_KEY)) || {
		playerName: "New Player",
		playerAvatar: avatarIds[0]
	};
}

function setPlayerInfo(playerInfo: PlayerInfo) {
	localStorage.setItem(PLAYER_INFO_KEY, JSON.stringify(playerInfo));
}

export default {
	getPlayerInfo,
	setPlayerInfo
}