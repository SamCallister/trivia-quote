import pandas as pd
from collections import defaultdict
import json
from pathlib import Path
import uuid

def make_template(quote, answers):
    q = quote
    for i, a in enumerate(answers.split(',')):
        q = q.replace(a, f"{{{i}}}", 1)

    return q


df = pd.read_csv('data/quotes.csv')
records = df.dropna().to_dict('records')

l = [
    {**d, **{"template": make_template(d["quote"], d["hidden_words"])}}
    for d in records
]

c = defaultdict(list)
for d in l:
	choices = d["choices"].split("|")
	if len(choices) == 1:
		choices = choices[0].split(",")
	
	final_choices = [{"text": c, "id": str(uuid.uuid4())} for c in choices]
	answer_choice_id = str(uuid.uuid4())
	answer_choice = {"text": d["hidden_words"], "id":answer_choice_id}
	

	c[d["category"]].append({
		"text": d["template"],
		"id": str(uuid.uuid4()),
		"choices":final_choices + [answer_choice],
		"answerId": answer_choice_id
	})

Path("../../public/data/single_player_questions.json").write_text(json.dumps(c))

# { "Some_topic": [{:text, choices: [{:text, :id}]},