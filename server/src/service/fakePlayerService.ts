import { uniqueId, random, noop, sample } from "lodash";
import { WrappedSocket } from "../types/messageTypes";
import { JoinGameMessage } from "../types/messageTypes";

const playerNames = ["Joe", "Molly", "George", "Max", "Lex", "Yvette"]
const avatarIds = ["manHoodie", "womanEarring", "womanPurse", "manBlueShirt"]

function getFakePlayerJoinMessage(): JoinGameMessage {
    return {
        msgType: "joinGame",
        value: {
            playerName: getRandomPlayerName(),
            playerId: uniqueId(),
            playerAvatar: sample(avatarIds) || "manHoodie",
            isFakePlayer: true
        }
    };
}

function getRandomPlayerName(): string {
    return `${playerNames[random(0, playerNames.length - 1)]} - bot`;
}

function getFakeSocket(): WrappedSocket {
    return {
		onmessage:() => noop(),
		send: () => noop(),
		onclose: () => noop(),
		close: () => noop()
	};
}

export default { getFakePlayerJoinMessage, getFakeSocket };