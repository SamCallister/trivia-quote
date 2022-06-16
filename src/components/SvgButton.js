import { ReactComponent as Button } from "../svg/button.svg";
import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";

function SvgButton(props) {
  const { children } = props;
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.getElementById("svg-button-text").innerHTML = children;
    }
  }, [svgRef]);

  return <Button ref={svgRef}></Button>;
}

SvgButton.propTypes = {
  children: PropTypes.element,
};

export default SvgButton;
