import pandas as pd
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

def build_choice(author):
    return {
        "text":author,
        "id":str(uuid.uuid4())
    }


df = pd.read_csv('data/quotes_v1.csv')
# filter and validate
df = validate_df(df)
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

    author_choices_final = None
    author_answer_choice_id = None
    if isinstance(d["author_choices"], str):
        author_choices = [build_choice(c) for c in d["author_choices"].split(',')]
        author_answer_choice_id = str(uuid.uuid4())
        author_choices_final = author_choices + [{"text":d["author"], "id":author_answer_choice_id}]


    final_list.append({
        "category": d["category"],
        "text": d["template"],
        "author": d["author"],
        "id": str(uuid.uuid4()),
        "choices":  json.dumps(final_choices + [answer_choice]),
        "answerId": answer_choice_id,
        "authorAnswerId": author_answer_choice_id,
        "authorChoices": json.dumps(author_choices_final),
        "completeText": d["quote"]
    })

validate_final_data(final_list)
final_df = pd.DataFrame(final_list)
p = Path("../server/questions.db")
sql_engine = create_engine(f"sqlite:///{p.absolute()}")
final_df.reset_index().to_sql('questions', sql_engine, if_exists='replace')