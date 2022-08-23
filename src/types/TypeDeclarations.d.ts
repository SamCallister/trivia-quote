declare module "snapsvg-cjs" {
	interface AnimateFunc {
		(attrs: ElementAttrs, delay: number): SnapElement;
	}
	interface AttrFunc {
		(attrs: ElementAttrs): SnapElement;
	}
	interface ElementAttrs {
		width?: number;
		fill?: string;
	}
	interface SnapElement {
		animate: AnimateFunc;
		attr: AttrFunc;
		hostname?: string;
		pathname?: string;
	}
	function placeholder(selector: string): SnapElement;
	export = placeholder;
}

declare module '*.svg' {
	const ReactComponent: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
	export { ReactComponent };
}