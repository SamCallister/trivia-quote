#  "category": d["category"],
#         "text": d["template"],
#         "author": d["author"],
#         "id": str(uuid.uuid4()),
#         "choices":  json.dumps(final_choices + [answer_choice]),
#         "answerId": answer_choice_id
import json
from functools import reduce
import re

MAX_CHOICE_LENGTH = 23
MAX_QUESTION_LENGTH = 370
MAX_AUTHOR_LENGTH = 50
MIN_QUESTION_PER_CATEGORY = 5

def validate_ascii(s):
	try:
		s.encode('ascii')
	except Exception as e:
		print("non ascii character in string below")
		print(s)
		raise e

def validate_length(s, allowed_length):
	assert len(s) <= allowed_length, f"String '{s}' should be {allowed_length} characters or less"

def validate_choices(choices):
	num_words_per_choice = set(
		[len(c["text"].split(",")) for c in choices]
	)

	assert len(num_words_per_choice) == 1, f"Each choice should have the same number of words:{choices}"

def validate_blanks(s, choices):
	# should have {0}, {1} if there are 2 choices
	num_choices = len(choices[0]["text"].split(","))
	for i in range(num_choices):
		pattern = "\{" + str(i) + "\}"
		matches = re.findall(re.compile(pattern), s)
		assert len(matches) == 1, f"expected: {pattern} to be present in: {s}"


def validate_final_data(questions):
	# check for funky characters
	for q in questions:
		try:
			validate_ascii(q["text"])
		except:
			print("error validating question text for question", q)
			raise

		validate_length(q["text"], MAX_QUESTION_LENGTH)

		try:
			validate_ascii(q["author"])
		except:
			print("error validating question author for question", q)
			raise

		validate_length(q["author"], MAX_AUTHOR_LENGTH)

		choices = json.loads(q['choices'])
		for c in choices:
			try:
				validate_ascii(c["text"])
			except:
				print("error validating question author for choice", choices)
				raise
			validate_length(c["text"], MAX_CHOICE_LENGTH)

		validate_choices(choices)
		validate_blanks(q["text"], choices)

def validate_categories(df):
	# each category group should have at least 5 items
	counts_df = df.groupby(["category"])["category"].count()
	for category_name, count in counts_df.to_dict().items():
		assert count >= MIN_QUESTION_PER_CATEGORY, f"Expcted cateogry: {category_name} to have at least {MIN_QUESTION_PER_CATEGORY} questions but it only had {count}"
		assert category_name[0].isupper(), "expected category: {category_name} to be capitalized"

	

def validate_no_dupes(df):
	dupe_df = df["quote"].duplicated()
	assert dupe_df.sum() == 0, f"expected no duplicate questions, found {dupe_df.sum()}: {dupe_df[dupe_df.quote]}"


def validate_df(df):
	validate_categories(df)
	validate_no_dupes(df)