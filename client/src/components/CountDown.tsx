import React, { useState } from "react";
import { useSpring, animated } from 'react-spring'


interface CountDownProps {
	seconds: number;
}


function CountDown(props: CountDownProps) {

	const { seconds } = props;

	const [reactSpringNum, setReactSpringNum] = useState(seconds);

	useSpring(() => ({
		immediate: false,
		config: { duration: seconds * 1000 },
		from: { num: seconds }, to: { num: 0 },
		onChange: (d) => {
			setReactSpringNum(Math.ceil(d.value.num));
		}
	}));

	return (<animated.div>
		{reactSpringNum}
	</animated.div>);
}

export default CountDown;