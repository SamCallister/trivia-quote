import { sample, identity, cloneDeep, concat } from 'lodash';
import constants from '../constants';
import { QuestionModifierMessage } from '../types/messageTypes';

const randomCurses: QuestionModifierMessage[] = [
	{
		msgType: 'questionModifierMessage',
		delay: constants.QUESTION_MODIFIER_DELAY,
		value: {
			titleText: "There goes the breaker...",
			text: ["🔦 Grab a flashlight 🔦"],
			questionPointTransforms: {
				questionPointTransform: {
					transformer: identity,
					affectsCorrectAnswer: true
				},
				speedPointTransform: {
					transformer: identity,
					affectsCorrectAnswer: true
				}
			},
			modifiedDisplay: "lightsOut"
		}
	}, {
		msgType: 'questionModifierMessage',
		delay: constants.QUESTION_MODIFIER_DELAY,
		value: {
			titleText: "Feeling discombobulated...",
			text: ["🧠 Split brain curse 🧠"],
			questionPointTransforms: {
				questionPointTransform: {
					transformer: identity,
					affectsCorrectAnswer: true
				},
				speedPointTransform: {
					transformer: identity,
					affectsCorrectAnswer: true
				}
			},
			modifiedDisplay: "splitBrain"
		}
	}, {
		msgType: 'questionModifierMessage',
		delay: constants.QUESTION_MODIFIER_DELAY,
		value: {
			titleText: "Where did I put that...",
			text: ["🥴 Memory loss curse 🥴"],
			questionPointTransforms: {
				questionPointTransform: {
					transformer: identity,
					affectsCorrectAnswer: true
				},
				speedPointTransform: {
					transformer: identity,
					affectsCorrectAnswer: true
				}
			},
			modifiedDisplay: "memoryLoss"
		}
	}
];

const onIncorrectCurses: QuestionModifierMessage[] = randomCurses.map((v) => {
	const d = cloneDeep(v);
	d.value.titleText = "If you get this question wrong...";

	if (!d.value.modifiedDisplay) {
		throw new Error("expected modified display on questions");
	}

	d.value.questionAfterEffects = {
		isPlayerImpacted: (data, playerId, correct) => !correct,
		modifiedDisplay: d.value.modifiedDisplay
	};
	d.value.modifiedDisplay = undefined;
	d.value.isConditional = true;

	return d;
});

const titleText = "Next question is...";
const pointModifiers: QuestionModifierMessage[] = [{
	msgType: 'questionModifierMessage',
	delay: constants.QUESTION_MODIFIER_DELAY,
	value: {
		titleText: titleText,
		text: ["🤑 Double Points! 🤑"],
		questionPointTransforms: {
			questionPointTransform: {
				transformer: (n: number) => n * 2,
				affectsCorrectAnswer: true
			},
			speedPointTransform: {
				transformer: identity,
				affectsCorrectAnswer: true
			}
		}
	}
}, {
	msgType: 'questionModifierMessage',
	delay: constants.QUESTION_MODIFIER_DELAY,
	value: {
		titleText: titleText,
		text: ["🤯 Triple Points! 🤯"],
		questionPointTransforms: {
			questionPointTransform: {
				transformer: (n: number) => n * 3,
				affectsCorrectAnswer: true
			},
			speedPointTransform: {
				transformer: identity,
				affectsCorrectAnswer: true
			}
		}
	}
}, {
	msgType: 'questionModifierMessage',
	delay: constants.QUESTION_MODIFIER_DELAY,
	value: {
		titleText: titleText,
		text: ["🏎️  Triple speed bonus! 🏎️ "],
		questionPointTransforms: {
			questionPointTransform: {
				transformer: identity,
				affectsCorrectAnswer: true
			},
			speedPointTransform: {
				transformer: (n: number) => n * 3,
				affectsCorrectAnswer: true
			}
		}
	}
}, {
	msgType: 'questionModifierMessage',
	delay: constants.QUESTION_MODIFIER_DELAY,
	value: {
		titleText: titleText,
		text: ["💀Negative Points on wrong answer💀"],
		questionPointTransforms: {
			questionPointTransform: {
				transformer: (n: number) => n * -1,
				affectsCorrectAnswer: false
			},
			speedPointTransform: {
				transformer: identity,
				affectsCorrectAnswer: true
			}
		}
	}
}];

function getElligibileModifiers(isLastQuestion: boolean) {
	// do not allow
	// lastQuestion is conditionalModifier
	if (isLastQuestion) {
		return concat(randomCurses, pointModifiers);
	}
	
	return concat(randomCurses, onIncorrectCurses, pointModifiers);
}


function getRandomModifier(isLastQuestion: boolean): QuestionModifierMessage {
	const elligibleModifiers = getElligibileModifiers(isLastQuestion);
	const chosen = sample(elligibleModifiers);


	if (!chosen) {
		throw new Error("Failed to choose random modifier");
	}

	return chosen as QuestionModifierMessage;
}

export default {
	getRandomModifier
}