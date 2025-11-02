import '@testing-library/jest-dom';
// Removed stray opening code fence
import { vi } from 'vitest';
// Always stub HTMLCanvasElement.prototype.getContext in tests. JSDOM's
// implementation throws "Not implemented" when components (like QR code
// renderers) call getContext. Replacing it with a safe stub prevents noisy
// errors and keeps tests deterministic.

// Always stub HTMLCanvasElement.prototype.getContext in tests. JSDOM's
// implementation throws "Not implemented" when components (like QR code
// renderers) call getContext. Replacing it with a safe stub prevents noisy
// errors and keeps tests deterministic.
if (typeof HTMLCanvasElement !== 'undefined') {
	// Preserve original if present (in case other tests rely on it).
	const _origGetContext = (HTMLCanvasElement.prototype as any).getContext;

	// @ts-ignore - test shim
	HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
		try {
			// If the original exists and works, try it first.
			if (_origGetContext) return _origGetContext.call(this);
		} catch (e) {
			// ignore and fall through to stub
		}

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

// Lightweight global fetch stub used in tests to avoid noisy "fetch failed"
// logs. It returns an empty array for JSON responses. If a test needs to
// assert fetch behavior it should override this stub with a more specific
// mock.
if (typeof globalThis.fetch === 'undefined') {
	// @ts-ignore - test shim
	globalThis.fetch = async () => ({ ok: true, json: async () => [] } as any);
}

// Provide a fake access token and long-lived expiry for unit tests so that
// ApiClient.authenticatedRequest does not attempt to refresh tokens (which
// would hit network / non-mocked endpoints). Individual tests that need to
// exercise auth behaviour should override these values explicitly.
try {
	const ACCESS_KEY = 'housebook_access_token';
	const EXPIRES_KEY = 'housebook_expires_at';
	if (!sessionStorage.getItem(ACCESS_KEY)) {
		sessionStorage.setItem(ACCESS_KEY, 'test-access-token');
	}
	// Expires in 1 hour from now
	if (!sessionStorage.getItem(EXPIRES_KEY)) {
		const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
		sessionStorage.setItem(EXPIRES_KEY, String(expiresAt));
	}
} catch (e) {
	// sessionStorage may not be available in some environments; ignore failures
}

// QueryClientProvider is intentionally not provided globally here; tests
// that need react-query behavior should use the `render` helper from
// `frontend_web/src/test-utils.tsx` which wraps UI in a QueryClientProvider.
