import { useState, useEffect } from "react";

function getStorageValue(key: string, defaultValue: object) {
	// getting stored value
	const saved = localStorage.getItem(key);
	if (saved) {
		try {
			return JSON.parse(saved);
		} catch (err) {
			console.error(`failure to parse saved local storage value:${saved} at key:${key} into json`);
			return defaultValue;
		}
	}

	return defaultValue;
}

export const useLocalStorage = (key: string, defaultValue: object) => {
	const [value, setValue] = useState(() => {
		return getStorageValue(key, defaultValue);
	});

	useEffect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
};