import { chain, merge } from 'lodash';
import * as sqlite3 from 'sqlite3';

// "category": d["category"],
// "text": d["template"],
// "author": d["author"],
// "id": str(uuid.uuid4()),
// "choices":  json.dumps(final_choices + [answer_choice]),
// "answerId": answer_choice_id

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
WHERE row_num <= 3
GROUP BY category
ORDER BY RANDOM() DESC
LIMIT 3`;

function buildGame(): Promise<GameData> {
	const db = new sqlite3.Database("questions.db", sqlite3.OPEN_READONLY);

	return new Promise((resolve, reject) => {
		db.all(chooseRandomCategories, (err, rows) => {


			if (err) {
				return reject(err);
			}


			// build game data out of rows
			const gameDataResult = Object.fromEntries(chain(rows)
				.map((r) => {

					const questionsData = JSON.parse(r.questions);
					const transformedQuestionsData = questionsData.map((d) => {
						return merge(
							d,
							{ choices: JSON.parse(d.choices) }
						)
					})

					return [r.category, transformedQuestionsData];
				})
				.value());


			// resolve promise with Gamedata
			return resolve(gameDataResult);
		});
	});

}

export default { buildGame };