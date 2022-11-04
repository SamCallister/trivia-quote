import React, { useState } from "react";
import Modal from 'react-modal';
import styled from "styled-components";
import { FaRegWindowClose } from "react-icons/fa";
import SvgButton from "./SvgButton";

interface OnCloseFunc {
    (): void;
};

interface MissingGameModalProps {
	isOpen: boolean;
	gameId: string;
	onClose: OnCloseFunc;
};

const CloseWindowContainer = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
`;
const ModalHeader = styled.h2`
  text-align:center;
`;

const ModalContent = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
`;

const ButtonContainerModal = styled.div`
  width: 100%;
  margin-bottom: 8px;
  #svg-button-text {
    text-anchor: middle;
    font-family: "News Cycle";
    font-size: 16px;
    fill: black;
    stroke: black;
    stroke-width: 0.1px;
  };
`;

const customStyles = {
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
	},
};

function MissingGameModal(props: MissingGameModalProps) {

	const closeModal = () => {
		props.onClose();
	}

	return (<Modal
		isOpen={props.isOpen}
		style={customStyles}
		ariaHideApp={false}>
		<CloseWindowContainer>
			<FaRegWindowClose onClick={closeModal}></FaRegWindowClose>
		</CloseWindowContainer>
		<ModalHeader>Game {props.gameId} does not exist.</ModalHeader>
		<ModalContent>
			<ButtonContainerModal >
				<SvgButton clickButtonHandler={closeModal}>
					Ok
				</SvgButton>
			</ButtonContainerModal>
		</ModalContent>
	</Modal>);
}

export default MissingGameModal;