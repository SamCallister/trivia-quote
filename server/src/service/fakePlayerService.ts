import { uniqueId, noop, range, shuffle } from "lodash";
import { WrappedSocket } from "../types/messageTypes";
import { JoinGameMessage } from "../types/messageTypes";

function getFakePlayerJoinMessage(playerName:string, avatarId:string): JoinGameMessage {
    return {
        msgType: "joinGame",
        value: {
            playerName: playerName,
            playerId: uniqueId(),
            playerAvatar: avatarId,
            isFakePlayer: true
        }
    };
}

function getFakePlayers(numPlayers:number): JoinGameMessage[] {
    const playerNames = shuffle(["Joe", "Molly", "George", "Max", "Lex", "Yvette", "Sarah", "Leeroy", "Fish"]);
    const avatarIds = shuffle(["manHoodie", "womanEarring", "womanPurse", "manBlueShirt"]);

    return range(0, numPlayers).map(()=>{
        const playerName = `${playerNames.pop() || "Extra"} - bot`;
        const avatarId = avatarIds.pop() || "manHoodie";

        return getFakePlayerJoinMessage(playerName, avatarId);
    });
}

function getFakeSocket(): WrappedSocket {
    return {
		onmessage:() => noop(),
		send: () => noop(),
		onclose: () => noop(),
		close: () => noop()
	};
}

export default { getFakePlayers, getFakeSocket };