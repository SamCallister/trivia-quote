import React from "react";
import PropTypes from "prop-types";

function SvgButton(props) {
  const { children } = props;

  return (<svg viewBox="0 0 187 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text id="svg-button-text" x="93.5" y="28" stroke="black">{children}</text>
    <path d="M0.999649 35.3428L11.2144 47.0004H176.352L186 35.3428V13.2881L176.352 1.00041L11.2144 1.00003L0.713984 13.2877L0.999649 35.3428Z" stroke="black" />
  </svg>);
}

SvgButton.propTypes = {
  children: PropTypes.string,
};

export default SvgButton;
