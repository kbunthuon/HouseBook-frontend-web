import '@testing-library/jest-dom';

// Provide a lightweight mock for canvas.getContext used by qrcode.react and other
// libraries during tests. JSDOM doesn't implement canvas drawing methods so
// some components will call getContext() and fail unless we stub it.
// The mock implements only the methods our code/tests need (toDataURL, measureText,
// basic drawing ops) and returns a minimal object.
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
	// @ts-ignore - adding a test-only shim
	HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
		return {
			fillRect: () => {},
			clearRect: () => {},
			getImageData: (_x: number, _y: number, _w: number, _h: number) => ({ data: [] }),
			putImageData: () => {},
			createImageData: () => [],
			setTransform: () => {},
			drawImage: () => {},
			save: () => {},
			restore: () => {},
			beginPath: () => {},
			moveTo: () => {},
			lineTo: () => {},
			closePath: () => {},
			stroke: () => {},
			translate: () => {},
			scale: () => {},
			rotate: () => {},
			arc: () => {},
			fillText: () => {},
			measureText: (_text: string) => ({ width: 0 }),
			toDataURL: () => '',
		} as any;
	};
}
