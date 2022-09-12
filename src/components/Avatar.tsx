import React from "react";
import { fromPairs } from "lodash";
import { ReactComponent as ManHoodie } from "../svg/man_hoodie.svg";
import { ReactComponent as WomanEarring } from "../svg/woman_earring.svg";
import { ReactComponent as WomanPurse } from "../svg/woman_purse.svg";
import { ReactComponent as ManBlueShirt } from "../svg/man_blue_shirt.svg";

const characters = [{
	element: <ManHoodie key={0}></ManHoodie>,
	avatarId: "manHoodie"
},
{
	element: <WomanEarring key={1}></WomanEarring>,
	avatarId: "womanEarring"
},
{
	element: <WomanPurse key={1}></WomanPurse>,
	avatarId: "womanPurse"
}, {
	element: <ManBlueShirt key={1}></ManBlueShirt>,
	avatarId: "manBlueShirt"
}];

const characterLookup = fromPairs(characters.map((c) => {
	return [c.avatarId, c.element];
}));

interface AvatarProps {
	avatarId: string;
};

function Avatar(props: AvatarProps) {
	return characterLookup[props.avatarId];
}

const avatarIds = characters.map((c) => { return c.avatarId });

export {
	Avatar,
	avatarIds
};