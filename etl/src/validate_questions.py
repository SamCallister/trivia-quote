import json
import re
from collections import Counter

MAX_CHOICE_LENGTH = 23
MAX_QUESTION_LENGTH = 370
MAX_AUTHOR_LENGTH = 52
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

def validate_answer_matches(answerId, choices):
	assert len([c for c in choices if c["id"] == answerId]) == 1, f"expected once choice from choices:{choices} to match:{answerId}"


def validate_final_data(questions):
	# check for funky characters
	for q in questions:
		try:
			validate_ascii(q["text"])
		except:
			print("error validating question text for question", q)
			raise

		validate_length(q["text"], MAX_QUESTION_LENGTH)

		# try:
		# 	validate_ascii(q["author"])
		# except:
		# 	print("error validating question author for question", q)
		# 	raise

		validate_length(q["author"], MAX_AUTHOR_LENGTH)

		for choices, answerId in filter(lambda x: x[0], [
			(json.loads(q['choices']), q['answerId']),
			(json.loads(q['authorChoices']), q['authorAnswerId'])
		]):
			validate_answer_matches(answerId, choices)
			for c in choices:
				try:
					validate_ascii(c["text"])
				except:
					print("error validating question author for choice", choices)
					raise
				validate_length(c["text"], MAX_CHOICE_LENGTH)

			validate_choices(choices)

		validate_blanks(q["text"], json.loads(q['choices']))

def validate_categories(df):
	# each category group should have at least 5 items
	counts_df = df.groupby(["category"])["category"].count()
	categories_to_filter = []

	for category_name, count in counts_df.to_dict().items():
		if count < MIN_QUESTION_PER_CATEGORY:
			print(f"Expcted cateogry: {category_name} to have at least {MIN_QUESTION_PER_CATEGORY} questions but it only had {count}")
			categories_to_filter.append(category_name)

		assert category_name[0].isupper(), "expected category: {category_name} to be capitalized"

	print("category counts", sorted([(count, category) for category, count in Counter(df["category"]).items()]))
	print('total count', df.count())

	return df[~df["category"].isin(categories_to_filter)]

	

def validate_no_dupes(df):
	dupe_series = df["quote"].duplicated()
	assert dupe_series.sum() == 0, f"expected no duplicate questions, found {dupe_series.sum()}: {df['quote'][dupe_series]}"


def validate_df(df):
	validate_no_dupes(df)
	return validate_categories(df)