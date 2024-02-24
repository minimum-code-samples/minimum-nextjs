/**
 * Utility functions used by the frontend and backend.
 *
 * @module @src/utilities
 */

import { CookieValueTypes, deleteCookie, getCookie, setCookie } from 'cookies-next';
import { IncomingMessage, ServerResponse } from 'http';

import { COOKIE_FLASH, SEP } from '@src/constants';
import { ALERT_VARIANTS, AlertVariant, FlashMessage } from '@src/types';

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
