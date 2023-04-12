import { avatarIds } from "../components/Avatar";

const PLAYER_INFO_KEY = "playerInfo";
const VISITED_HELP_PAGE_KEY = "visitedHelpPage";

function getDefaultPlayer(): LocalPlayerInfo {
	return {
		playerName: "New Player",
		playerAvatar: avatarIds[0]
	}
}

export default {
	getDefaultPlayer,
	PLAYER_INFO_KEY,
	VISITED_HELP_PAGE_KEY
}