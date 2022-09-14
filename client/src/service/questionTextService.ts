import { fill, forEach, max, first } from 'lodash';

function formatQuestionUnderlines(text: string, choices: string[], answers: string[]) {

	// reducer that provides the max for each choice (can have multiple words on a given choice)
	const maxLengthForEachChoice = choices.map((d) => {
		return d.split(",");
	}).reduce((a, b) => {
		// pairwise max
		return a.map((v, i) => {
			return max([v, b[i].length]);
		});

	}, fill(Array(first(choices).split(",").length), 0));


	const splitArray = [];
	let currentText = text;
	forEach(maxLengthForEachChoice, (v, i) => {
		const [firstValue, secondValue] = currentText.split(`{${i}}`);
		// cases
		// X [] Y
		// [] Y
		// X []
		//result will always be 2
		if (firstValue === "") {
			splitArray.push({ isAnswer: true, text: answers[i], numLetters: v });
		} else {
			splitArray.push({ isAnswer: false, text: firstValue, numLetters: 0 });
			splitArray.push({ isAnswer: true, text: answers[i], numLetters: v });
		}
		currentText = secondValue;
	});

	// at the end
	if (currentText !== "") {
		splitArray.push({ isAnswer: false, text: currentText, numLetters: 0 });
	}


	// want to surround answers with underlines/spaces?
	// {text, isAnswer}
	return splitArray;
}



export default { formatQuestionUnderlines };