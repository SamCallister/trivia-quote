import React, { useEffect, useState } from "react";
import TimeBar from "./components/TimeBar";
import styled from "styled-components";
import AnswerButton from "./components/AnswerButton";
import { merge, partial, isNil, isEmpty, head, isNull } from "lodash";
import questionTextService from './service/questionTextService';
import { useSpring, animated, useSprings } from 'react-spring'
import useMeasure from 'react-use-measure';
import { use100vh } from 'react-div-100vh';

const TimeBarContainer = styled.div`
	height: 28px;
`;

const TextOuter = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
`;

const TextContainer = styled.div`
	margin-left: 24px;
	margin-right: 24px;
	margin-top: 48px;
	font-size: 20px;
`;

const AnswersOuterContainer = styled.div`
	padding-right: 24px;
	padding-left: 24px;
	padding-bottom: 64px;
	display: flex;
	flex-direction:column;
	z-index:2;
	position: relative;
`;

const IndividualAnswerContainer = styled.div`
  `;

const ScoreContainer = styled.div`
text-align: end;
padding-right: 8px;
${(props) => props.theme.normalText};
`;

const ScoreUpdateContainer = styled.div`
${(props) => props.theme.normalText};
display: flex;
justify-content: center;
position: relative;
text-align: right;
`;

interface ParentContainerProps {
	isLightsOut: boolean;
}

const ParentContainer = styled.div<ParentContainerProps>`
	${(props) => props.isLightsOut ? 'background-color:black' : ''};
	position: relative;
`;

interface ShowUpdateProps {
	showUpdate: boolean;
	negative: boolean;
}

const ScoreUpdate = styled.span<ShowUpdateProps>`
	color: ${props => props.negative ? "#DC143C" : "#447B30"};
	visibility: ${props => props.showUpdate ? "visible" : "hidden"};
	position: absolute;
	right: 8px;
`;

interface AnswerUnderlineProps {
	isAnswered: boolean;
}

const AnswerUnderline = styled.span<AnswerUnderlineProps>`
border-bottom: 1px solid black;
display:inline-block;
line-height:0.85;
text-indent: ${props => props.isAnswered ? 0 : "-100000000px"};
text-align: center;
`;

interface TimeoutMsgContainerProps {
	show: boolean;
}

const TimeoutMsgContainer = styled.span<TimeoutMsgContainerProps>`
color:#DC143C;
${props => props.theme.normalText};
visibility: ${props => props.show ? "visible" : "hidden"};
`;

const SplitBrainCover = styled.div`
	position: absolute;
	background-color: black;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	z-index: 20;
`;

const AuthorContainer = styled.div`
font-size:16px;
text-align:right;
margin-right:24px;
margin-top:16px;
color: black;`;

const QuestionTextContainer = styled.div`
	z-index: 2;
	position: relative;
`;

interface QuestionAnsweredFunc {
	(data: QuestionChoice, questionId: string): void;
}

interface QuestionProps {
	delay: number;
	text: string;
	author: string;
	score: string;
	scoreDelta: number;
	speedScoreDelta: number;
	questionId: string;
	correctAnswer: string;
	choices: QuestionChoice[];
	onChange: QuestionAnsweredFunc;
	modifiedDisplay?: string;
}

const CHAR_WIDTH = 0.6;
const SPEED_UP_TIMEBAR = 100;

function Question(props: QuestionProps) {

	const { delay, text, choices, score, onChange, questionId, correctAnswer, author } = props;

	const viewHeight = `${use100vh() * .85}px`;
	const [useMeasureRef, bounds] = useMeasure()
	const [choiceIndex, setChoiceIndex] = useState(null);
	const [stateChoices, setChoices] = useState(choices);
	const [updatedWithAnswer, setUpdatecWithAnswer] = useState(false);
	const [splitBrainSecondHalf, setSplitBrainSecondHalf] = useState(false);

	const isAnswered = !isNil(correctAnswer);
	const timeoutOccurred = isNull(choiceIndex) && isAnswered;
	const isLightsOut = props.modifiedDisplay == "lightsOut";
	const isSplitBrain = props.modifiedDisplay == "splitBrain";
	const isMemoryLoss = props.modifiedDisplay == "memoryLoss";
	const choiceSelected = isNil(choiceIndex);

	const [styles, lightsOutApi] = useSpring(() => {

		if (isLightsOut && bounds.height && choiceSelected) {
			return {
				from: {
					top: "28px",  // eslint-disable-next-line
					position: "absolute" as any,
					height: "200px",
					backgroundColor: "white",
					width: "100%"
				},
				config: { duration: 5000 },
				to: {
					top: `${bounds.height - 200}px`,
				},
				loop: { reverse: true },
			}
		}

	}, [useMeasureRef]);

	const [springs, springsApi] = useSprings(4, (index) => {
		return {
			from: { opacity: 1 }
		};
	});

	useEffect(() => {
		if (isSplitBrain) {
			// Cover the top then setTime to move it
			setTimeout(() => {
				setSplitBrainSecondHalf(true);
			}, props.delay / 2);
		} else if (isMemoryLoss) {
			// api start 
			springsApi.start((i) => {
				const oneFifth = delay / 5;
				return {
					delay: i * oneFifth,
					config: {
						duration: oneFifth
					},
					to: {
						opacity: 0
					}
				}
			});
		}
	}, [props.modifiedDisplay]);

	const cleanUpDisplay = () => {
		lightsOutApi.stop();
		springsApi.stop();

		springsApi.start({
			to: { opacity: 1 },
			config: { duration: 0 },
			delay: 0
		});
	};

	useEffect(() => {
		if (timeoutOccurred) {
			cleanUpDisplay();
		}
	}, [timeoutOccurred]);

	const clickedAnswer = (selectedIndex: number) => {
		// mark as selected
		if (choiceSelected && !timeoutOccurred) {
			cleanUpDisplay();
			const newChoices = stateChoices.map((d, i) => {
				if (selectedIndex === i) {
					return merge({}, d, { state: "selected" });
				} else {
					return d;
				}
			})
			setChoiceIndex(selectedIndex);
			setChoices(newChoices);
			onChange(stateChoices[selectedIndex], questionId);
		}
	};

	const numAnswers = head(choices).text.split(",").map((t: string) => t.trim()).filter((t: string) => !isEmpty(t)).length;

	const getQuestionText = (text: string, choices: QuestionChoice[], answers: string[], isAnswered: boolean) => {

		const splitArray = questionTextService.formatQuestionUnderlines(text, choices.map((d) => d.text), answers);
		return splitArray.map((d, i) => {
			const { text, isAnswer, numLetters } = d;

			if (isAnswer) {
				return (<AnswerUnderline key={i} style={{ width: `${numLetters * CHAR_WIDTH}em` }} isAnswered={isAnswered}>{text}</AnswerUnderline>);
			} else {
				return (<span key={i}>{text}</span>);
			}
		});
	};

	let questionText;
	if (!isAnswered) {
		questionText = getQuestionText(text, choices, Array(numAnswers).fill("X"), isAnswered);
	}

	if (isAnswered) {
		// question text fill the the answer
		const correctChoice = choices.find((d) => {
			return d.id === correctAnswer;
		});
		const correctAnswerArray = correctChoice.text.split(",").map((t) => t.trim()).filter((t) => !isEmpty(t))
		questionText = getQuestionText(text, choices, correctAnswerArray, isAnswered);
	}

	if (isAnswered && !updatedWithAnswer) {
		const updateChoices = stateChoices.map((d) => {
			const isCorrect = correctAnswer === d.id;
			const isSelected = d.state === "selected";

			if (isSelected && isCorrect) {
				// green it
				return merge({}, d, { state: "correctSelected" });
			} else if (isSelected && !isCorrect) {
				// red it
				return merge({}, d, { state: "incorrect" });
			} else if (!isSelected && isCorrect) {
				// green it
				return merge({}, d, { state: "correctNotSelected" });
			} else {
				return d;
			}


		});
		setUpdatecWithAnswer(true);
		setChoices(updateChoices);
	}

	const posScoreDelta = props.scoreDelta > 0;
	const negScoreDelta = props.scoreDelta < 0;
	const posSpeedScoreDelta = props.speedScoreDelta > 0;
	const negSpeedScoreDelta = props.speedScoreDelta < 0;

	return (
		<ParentContainer isLightsOut={isLightsOut && choiceSelected} ref={useMeasureRef}>
			{isLightsOut && choiceSelected && (<animated.div style={styles}></animated.div>)}
			<TimeBarContainer>
				<TimeBar delay={delay - SPEED_UP_TIMEBAR} stopBar={isAnswered}></TimeBar>
			</TimeBarContainer>
			<ScoreContainer>{score}</ScoreContainer>
			<ScoreUpdateContainer>
				<TimeoutMsgContainer show={timeoutOccurred}>⏳☹️⏳ too slow!</TimeoutMsgContainer>
				<ScoreUpdate showUpdate={props.scoreDelta !== 0 || negSpeedScoreDelta}
					negative={negScoreDelta || negSpeedScoreDelta}><div>{posScoreDelta ? "+" : ""}{props.scoreDelta && props.scoreDelta.toLocaleString()}</div>{props.speedScoreDelta != 0 ? (<div>🏎️ {posSpeedScoreDelta ? "+" : ""}{props.speedScoreDelta}</div>) : ""}</ScoreUpdate>
			</ScoreUpdateContainer>
			<TextOuter style={{ height: viewHeight }}>
				<QuestionTextContainer>
					<TextContainer>
						{questionText}
					</TextContainer>
					<AuthorContainer>
						~{author}
					</AuthorContainer>
					{isSplitBrain && splitBrainSecondHalf && (<SplitBrainCover></SplitBrainCover>)}
				</QuestionTextContainer>
				<AnswersOuterContainer>
					{stateChoices.map((d, i) => {
						return (<IndividualAnswerContainer key={i}>
							<animated.div style={springs[i]}>
								<AnswerButton data={d}
									buttonClicked={partial(clickedAnswer, i)}></AnswerButton>
							</animated.div>
						</IndividualAnswerContainer>);
					})}
					{isSplitBrain && !splitBrainSecondHalf && (<SplitBrainCover></SplitBrainCover>)}
				</AnswersOuterContainer>
			</TextOuter>
		</ParentContainer>
	);
}

export default Question;