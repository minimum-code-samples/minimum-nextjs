/**
 * Utility functions used by the frontend and backend.
 *
 * @module @src/utilities
 */

import { CookieValueTypes, deleteCookie, getCookie, setCookie } from 'cookies-next';
import { IncomingMessage, ServerResponse } from 'http';

import { COOKIE_FLASH, SEP } from '@src/constants';
import { ALERT_VARIANTS, AlertVariant, FlashMessage, UnauthenticatedError } from '@src/types';

/**
 * Wrapper function around `fetch` to make requests with JSON payloads.
 *
 * This function sets a default Content-type header with the value `application/json`.
 *
 * @param resource - The URL endpoint to make the AJAX request to.
 * @param options - The options to forward to `fetch`. To set headers, use the `headers` key for this parameter.
 */
export async function fetchJson(resource: string, options?: any): Promise<{ status: number; payload: any }> {
	const headers = new Headers();
	headers.set('content-type', 'application/json');

	if (options?.headers) {
		if (options.headers instanceof Headers) {
			options.headers.forEach((v: string, k: string) => {
				headers.set(k, v);
			});
		} else {
			for (const [k, v] of Object.entries(options.headers)) {
				if (typeof k === 'string' && typeof v === 'string') {
					headers.set(k, v);
				}
			}
		}
	}

	let opts = Object.assign({}, options, { headers });

	const resp = await fetch(resource, opts);

	if (resp.status === 204) {
		// 204 is generally used when the response is unexpectedly empty.
		return {
			status: resp.status,
			payload: null,
		};
	}

	const payload = await resp.json();

	if (resp.status === 401 || resp.status === 403) {
		throw new UnauthenticatedError(payload.data?.error?.name);
	}

	// Returns other statuses as-is along with the payload.
	return {
		status: resp.status,
		payload,
	};
}

/**
 * Gets the "flash" cookie to display messages for.
 *
 * The cookie is deleted after retrieval.
 *
 * @param req - The incoming request object from `context`. Optional, but must be specified for the server.
 * @param res - The outgoing response object from `context`. Optional, but must be specified for the server.
 * @returns Returns an object with the keys `message` and `variant`. If there is no such cookie, null is returned.
 */
export function getFlashCookie(req?: IncomingMessage, res?: ServerResponse): FlashMessage | null {
	let flash: CookieValueTypes = '';

	if (req && res) {
		flash = getCookie(COOKIE_FLASH, { req, res });
	} else {
		flash = getCookie(COOKIE_FLASH);
	}

	// Clear the cookie.
	if (req && res) {
		deleteCookie(COOKIE_FLASH, { req, res });
	} else {
		deleteCookie(COOKIE_FLASH);
	}

	if (typeof flash !== 'string') {
		return null;
	}

	return parseFlashString(flash);
}

/**
 * A type predicate type guard that checks if the string is a valid alert variant.
 *
 * @param s - The string to check for.
 */
export function isAlertVariant(s: string): s is AlertVariant {
	if (ALERT_VARIANTS.includes(s)) {
		return true;
	}
	return false;
}

/**
 * Creates the flash message along with the alert type separated by the constant `SEP`.
 *
 * @param message - The message to display.
 * @param variant - The variant of message to display. Default 'info'.
 */
export function makeFlashMesage(message: string, variant: AlertVariant = 'info'): string {
	return `${message}${SEP}${variant}`;
}

/**
 * Gets the message and type of alert from a string.
 *
 * @param value - The string value from the cookie.
 */
export function parseFlashString(value: string): FlashMessage {
	const parts = value.split(SEP);
	const message = parts[0] || '';
	let variant: AlertVariant = 'primary' satisfies AlertVariant;

	if (parts.length < 2) {
		return { message, variant };
	}

	let _v = parts[parts.length - 1] || '';
	if (!isAlertVariant(_v)) {
		return { message, variant };
	}

	return {
		message,
		variant: _v,
	};
}

/**
 * Specialized function to convert Date and undefined properties for serialization to the front-end code.
 *
 * Reference: https://www.reddit.com/r/nextjs/comments/uxnpbp/serialising_dates_in_getserversideprops/?rdt=62192
 *
 * @param from - The arbitrary object to convert.
 */
export function serializeBoundary(from: Object | null | undefined): any {
	const to: any = {};

	if (
		typeof from === 'string' ||
		typeof from === 'number' ||
		typeof from === 'boolean' ||
		typeof from === 'bigint' ||
		typeof from === 'symbol' ||
		from === null ||
		from === undefined
	) {
		return from;
	}
	// Else, 'object'.

	if (from instanceof Date) {
		return from.toISOString();
	}

	if (Array.isArray(from)) {
		return from.map((f) => serializeBoundary(f));
	}

	for (const [k, v] of Object.entries(from)) {
		if (v instanceof Date) {
			to[k] = v.toISOString();
		} else if (Array.isArray(v)) {
			to[k] = v.map((vee) => serializeBoundary(vee));
		} else if (typeof v === 'object') {
			to[k] = serializeBoundary(v);
		} else {
			to[k] = v;
		}
	}

	return to;
}

/**
 * Creates a cookie under the name specified by the constant `COOKIE_FLASH`.
 *
 * The message and type are combined into a string to store in the cookie.
 *
 * @param message - The message to display.
 * @param variant - The type of alert messages. See https://reactstrap.github.io/?path=/docs/components-alert--colors for the options.
 * @param req - The incoming request object from `context`. Optional, but must be specified for the server.
 * @param res - The outgoing response object from `context`. Optional, but must be specified for the server.
 */
export function setFlashCookie(
	message: string,
	variant: AlertVariant = 'info',
	req?: IncomingMessage,
	res?: ServerResponse
) {
	const m = makeFlashMesage(message, variant);

	if (req && res) {
		setCookie(COOKIE_FLASH, m, { req, res });
	} else {
		setCookie(COOKIE_FLASH, m);
	}
}