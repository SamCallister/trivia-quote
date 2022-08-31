import { uniqueId, random, noop } from "lodash";

const playerNames = ["Joe", "Molly", "George", "Max", "Lex", "Yvette"]

function getFakePlayerJoinMessage(): JoinGameMessage {
    return {
        msgType: "joinGame",
        value: {
            playerName: getRandomPlayerName(),
            playerId: uniqueId(),
            playerAvatar: "bob",
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