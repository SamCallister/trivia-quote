const playerNames = ["Joe"]

function getFakePlayer() {
    return {
        playerName: "sup",
        playerId: "434234",
        playerAvatar: "jane",
        socket: { onmessage: (msg: string) => { } }
    };
}

export default { getFakePlayer };