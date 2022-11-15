import React from "react";
import { Avatar } from "./Avatar";

interface PlayerViewProps {
	avatarId: string;
}

function PlayerView(props: PlayerViewProps) {
	const { avatarId } = props;

	return (<svg viewBox="0 0 100 100">
		<circle cx="50" cy="50" r="48" />
		<Avatar avatarId={avatarId}></Avatar>
	</svg>);
}

export default PlayerView;
