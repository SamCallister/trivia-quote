import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { device } from './service/deviceService';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  ${props => props.theme.appContainerStyles}
  margin:auto;
  position:relative;
  text-align:left;
`;

const HomeLinkContainer = styled.div`
position:absolute;
top:0px;
right:10px;
`;

const Title = styled.div`
  font-family: cursive;
  font-size: 64px;

  @media ${device.mobileS} { 
    font-size: 48px;
  }

  @media ${device.mobileM} { 
    font-size: 64px;
  }
`;

const Body = styled.div`
align-items: flex-start;
margin-left: 16px;
margin-right: 16px;
`;

export default function Contact() {

	return (
		<Wrapper>
			<HomeLinkContainer><Link to={"/"}>Home</Link></HomeLinkContainer>
			<Title>Contact</Title>
			<Body>
				<div>Email feedback or questions about the game to: <a href="mailto: contact@triviaquote.com">contact@triviaquote.com</a></div>
				<br></br>
				<div>Check out some of <a href="https://samcallister.github.io/projects">my other projects here.</a></div>
			</Body>
		</Wrapper>
	)
}