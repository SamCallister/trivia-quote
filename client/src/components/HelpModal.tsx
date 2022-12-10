/* eslint-disable react/no-children-prop */
import React from "react";
import TriviaQuoteModal from "./TriviaQuoteModal";
import ReactMarkdown from 'react-markdown';
import styled from "styled-components";

interface CloseFunctionInterface {
	(): void;
};

interface HelpModalProps {
	open: boolean;
	onClose: CloseFunctionInterface;
}

const MarkdownContainer = styled.div`
	margin-bottom:24px;
`;

const helpText = `
# Trivia Quote Gameplay

- A game is 3 rounds with 3 questions each
- The first player to answer gets bonus points if they answer correctly 🏎️
- Look out for questions worth double or triple points 🤑
- Watch out for curses 💀
`;


function HelpModal(props: HelpModalProps) {

	return (<TriviaQuoteModal
		isOpen={props.open}
		onClose={() => props.onClose()}>
		<MarkdownContainer><ReactMarkdown children={helpText}></ReactMarkdown></MarkdownContainer>
	</TriviaQuoteModal>);
}

export default HelpModal;