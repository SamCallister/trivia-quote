import { find, forOwn, sample } from "lodash";
import { Players } from "../types/messageTypes";

function determineFirstAnswer(aiPlayers: string[], humanPlayer: string, timeForHumanToAnswer: number): string {
	const probabilities = [{
		elapsedTime: 1000 * 5,
		prob: 0.95
	}, {
		elapsedTime: 1000 * 10,
		prob: 0.8
	}, {
		elapsedTime: 1000 * 15,
		prob: 0.35
	}, {
		elapsedTime: 1000 * 20,
		prob: 0.2
	}, {
		elapsedTime: 1000 * 25,
		prob: 0.05
	}];

	const prob = (find(probabilities, (v) => {
		return timeForHumanToAnswer < v.elapsedTime
	}) || { prob: 0.01 }).prob;

	return Math.random() <= prob ? humanPlayer : (sample(aiPlayers) || aiPlayers[0]);
}

function getAiAndHumanPlayerIds(playersMap:Players) {
	let humanPlayerId = "";
	const aiPlayerIds: string[] = [];

	forOwn(playersMap, (v) => {
		if(v.isFakePlayer) {
			aiPlayerIds.push(v.playerId);
		} else {
			humanPlayerId = v.playerId;
		}
	})

	return {humanPlayerId, aiPlayerIds}
}

export default { determineFirstAnswer, getAiAndHumanPlayerIds };