declare module '*.svg' {
	const ReactComponent: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
	export { ReactComponent };
}

interface UpdateLocalPlayerInfo {
	(localPlayerInfo: LocalPlayerInfo): void
  }