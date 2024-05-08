/**
 * Types used in the application.
 *
 * @module @src/types
 */

/**
 * The categories of alert.
 */
export const ALERT_VARIANTS = [
	'primary',
	'secondary',
	'success',
	'danger',
	'warning',
	'info',
	'light',
	'dark',
];
export type AlertVariant = (typeof ALERT_VARIANTS)[number];

/**
 * The type to aid in the rendering of the alert.
 */
export interface AlertBody {
	body: JSX.Element;
	variant: AlertVariant;
}

/**
 * The authentication context to attach to a HTTP request.
 */
export interface AuthContext {
	id: string;
	name: string;
}

/**
 * Describes an error where the authentication has expired.
 */
export class ExpiredAuthError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'ExpiredAuthError';

		// Maintains proper stack trace for where the error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, UnauthenticatedError);
		}
	}
}

/**
 * The error class to throw when a HTTP response code is non-2xx.
 *
 * The `toString()` method is overridden to return the status code. The `body` member is also returned if available.
 */
export class FetchError extends Error {
	status: number = 0;
	body: any;

	constructor(message: string, status: number, body?: any) {
		super();
		this.name = 'FetchError';

		this.message = message;
		this.status = status;

		if (body) {
			this.body = body;
		}
	}

	toString(): string {
		if (!this.body) {
			return `${this.name}: ${this.message} (${this.status})`;
		}

		return `${this.name}: ${this.message} (${this.status}:${JSON.stringify(
			this.body
		)})`;
	}
}

/**
 * The type definition for flash messages.
 */
export interface FlashMessage {
	message: string;
	variant: AlertVariant;
}

type HttpPayloadData = {
	status: number;
	payload?: any;
};

type HttpPayloadMessage = {
	status: number;
	code: string;
	message?: string;
};

/**
 * The payload to send for HTTP responses.
 */
export type HttpPayload =
	| HttpPayloadData
	| HttpPayloadMessage
	| (HttpPayloadData & HttpPayloadMessage);

/**
 * Describes an error with failed authentication.
 */
export class UnauthenticatedError extends Error {
	status: number = 0;

	constructor(message: string) {
		super();
		this.name = 'UnauthenticatedError';

		// Maintains proper stack trace for where the error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, UnauthenticatedError);
		}

		this.message = message;
	}
}
