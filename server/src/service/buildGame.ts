import { chain, first, merge } from 'lodash';
import * as sqlite3 from 'sqlite3';

interface GameRows {
	category: string;
	questions: string;
}

interface QuestionsForCategoriesResult {
	questions: string;
}

interface QuestionsData {
	text: string;
	author: string;
	id: string;
	choices: string;
	answerId: string;
}

function getRandomCategories(
	numCategories: number,
	questionsPerCategory: number,
	seenCategoryIds: string[]
): Promise<GameData> {

	const chooseRandomCategories = `
with added_random_row_num as (
	SELECT *,
	ROW_NUMBER() OVER (ORDER BY RANDOM()) as random_row_num
	FROM questions
)

, row_num_by_group as (
	SELECT *,
	ROW_NUMBER() OVER (PARTITION BY category ORDER BY random_row_num DESC) as row_num
	FROM added_random_row_num
)

SELECT category, JSON_GROUP_ARRAY(JSON_OBJECT(
	'text', text
	,'author', author
	,'id', id
	,'choices', choices
	,'answerId', answerId
)) as questions
FROM row_num_by_group 
WHERE row_num <= ${questionsPerCategory}
and category not in (${seenCategoryIds.map((c) => "'" + c + "'")
	.join(',')})
GROUP BY category
ORDER BY RANDOM() DESC
LIMIT ${numCategories}`;

	const db = new sqlite3.Database("questions.db", sqlite3.OPEN_READONLY);

	return new Promise((resolve, reject) => {
		db.all(chooseRandomCategories, (err: Error, rows: GameRows[]) => {

			if (err) {
				return reject(err);
			}

			// build game data out of rows
			const gameDataResult = Object.fromEntries(chain(rows)
				.map((r) => {

					const questionsData = JSON.parse(r.questions) as QuestionsData[];
					const transformedQuestionsData = questionsData.map((d: QuestionsData) => {
						return merge(
							d,
							{ choices: JSON.parse(d.choices) as QuestionChoice[] }
						);
					});

					return [r.category, transformedQuestionsData];
				})
				.value());


			// resolve promise with Gamedata
			return resolve(gameDataResult);
		});
	});

}

function getQuestionsForCategory(
	categoryId:string,
	questionsPerCategory: number):Promise<QuestionGameData[]> {
		const randomQuestionsForCategory = `
with added_random_row_num as (
	SELECT *,
	ROW_NUMBER() OVER (ORDER BY RANDOM()) as random_row_num
	FROM questions
)

, row_num_by_group as (
	SELECT *,
	ROW_NUMBER() OVER (PARTITION BY category ORDER BY random_row_num DESC) as row_num
	FROM added_random_row_num
)

SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
	'text', text
	,'author', author
	,'id', id
	,'choices', choices
	,'answerId', answerId
)) as questions
FROM row_num_by_group 
WHERE row_num <= ${questionsPerCategory} and category='${categoryId}'
GROUP BY category
ORDER BY RANDOM() DESC`;
const db = new sqlite3.Database("questions.db", sqlite3.OPEN_READONLY);

return new Promise((resolve, reject) => {
	db.all(randomQuestionsForCategory, (err: Error, rows: QuestionsForCategoriesResult[]) => {

		if (err) {
			return reject(err);
		}

		const firstRow = first(rows);

		if (!firstRow) {
			return reject(new Error(`No data found for category ${categoryId}`));
		}

		const questionsData = JSON.parse(firstRow.questions) as QuestionsData[];

		const transformedQuestionsData = questionsData.map((d: QuestionsData) => {
			return merge(
				d,
				{ choices: JSON.parse(d.choices) as QuestionChoice[] }
			);
		});

		return resolve(transformedQuestionsData);
	});
});
	}

export default { getRandomCategories, getQuestionsForCategory };