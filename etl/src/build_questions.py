import pandas as pd
from collections import defaultdict
import json
from pathlib import Path
import uuid
from sqlalchemy import create_engine
from validate_questions import validate_final_data, validate_df


def make_template(quote, answers):
    q = quote
    for i, a in enumerate(answers.split(',')):
        q = q.replace(a, f"{{{i}}}", 1)

    return q


df = pd.read_csv('data/newQuotes.csv')
validate_df(df)
records = df.to_dict('records')

l = [
    {**d, **{"template": make_template(d["quote"], d["hidden_words"])}}
    for d in records
]

final_list = []
for d in l:
    assert isinstance(d["choices"],str) and len(d) > 0, "Expected row to have choices:" + str(d)
    choices = d["choices"].split("|")
    if len(choices) == 1:
        choices = choices[0].split(",")

    final_choices = [{"text": c, "id": str(uuid.uuid4())} for c in choices]
    answer_choice_id = str(uuid.uuid4())
    answer_choice = {"text": d["hidden_words"], "id": answer_choice_id}

    final_list.append({
        "category": d["category"],
        "text": d["template"],
        "author": d["author"],
        "id": str(uuid.uuid4()),
        "choices":  json.dumps(final_choices + [answer_choice]),
        "answerId": answer_choice_id
    })

validate_final_data(final_list)
final_df = pd.DataFrame(final_list)
p = Path("../server/questions.db")
sql_engine = create_engine(f"sqlite:///{p.absolute()}")
final_df.reset_index().to_sql('questions', sql_engine, if_exists='replace')