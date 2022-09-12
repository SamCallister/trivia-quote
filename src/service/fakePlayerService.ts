import { uniqueId, random, noop, sample } from "lodash";
import { avatarIds } from "../components/Avatar";

const playerNames = ["Joe", "Molly", "George", "Max", "Lex", "Yvette"]

function getFakePlayerJoinMessage(): JoinGameMessage {
    return {
        msgType: "joinGame",
        value: {
            playerName: getRandomPlayerName(),
            playerId: uniqueId(),
            playerAvatar: sample(avatarIds),
            isFakePlayer: true
        }
    };
}

function getRandomPlayerName(): string {
    return `${playerNames[random(0, playerNames.length - 1)]} - bot`;
}

function getFakeSocket(): Socket {
    return { onmessage: (data) => { noop(data) } };
}

export default { getFakePlayerJoinMessage, getFakeSocket };