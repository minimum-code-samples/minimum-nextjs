/**
 * Provides the functions for JWT authentication.
 *
 * This module performs a check on the necessary environment variables upon initialization.
 *
 * @module @src/lib/server/authentication
 */

import { deleteCookie, getCookie } from 'cookies-next';
import { IncomingMessage, ServerResponse } from 'http';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

import {
	COOKIE_AUTH_USER,
	ERROR_1001,
	ERROR_1002,
	ERROR_1003,
} from '@src/constants';
import logger from '@src/lib/server/logger';
import { AuthContext, HttpPayload, UnauthenticatedError } from '@src/types';
import { extractIp, extractJwt } from '@src/utilities';

if (!process.env.JWT_AUDIENCE) {
	console.error(
		`Environment variable JWT_HMAC needs to be set for user authentication.`
	);
	process.exit(1);
}
const JWT_AUDIENCE: string[] = process.env.JWT_AUDIENCE.split(',').map((aud) =>
	aud.trim()
);

if (!process.env.JWT_HMAC_KEY) {
	console.error(
		`Environment variable JWT_HMAC_KEY needs to be set for user authentication.`
	);
	process.exit(1);
}
const JWT_HMAC_KEY: string = process.env.JWT_HMAC_KEY;

if (!process.env.JWT_ISSUER) {
	console.error(
		`Environment variable JWT_ISSUER needs to be set for user authentication.`
	);
	process.exit(1);
}
const JWT_ISSUER: string = process.env.JWT_ISSUER;

if (!process.env.JWT_TTL_ACCESS) {
	console.error(
		`Environment variable JWT_TTL_ACCESS needs to be set for user authentication.`
	);
	process.exit(1);
}
const JWT_TTL_ACCESS: string = process.env.JWT_TTL_ACCESS;

/**
 * Removes the authentication cookie named using the constant `COOKIE_AUTH_USER`.
 *
 * @param req - The incoming request object from `context`.
 * @param res - The outgoing response object from `context`.
 */
export function clearAuthContext(
	req: IncomingMessage,
	res: ServerResponse
): string | jwt.JwtPayload | null | void {
	// Return the JWT in case it is needed.
	const jot = getCookie(COOKIE_AUTH_USER, { req, res });

	deleteCookie(COOKIE_AUTH_USER, { req, res });

	if (typeof jot !== 'string') {
		return;
	}

	return jwt.decode(jot);
}

/**
 * The function to retrieve and parse the JWT.
 *
 * @param req - The standard HTTP request.
 * @param res - The standard HTTP response.
 * @param mode - Whether to check for the JWT in the cookies or the request header. If not specified, the cookies are checked before the headers.
 *
 * @returns The JWT payload. When this is returned, the request is confirmed to be authenticated.
 *
 * @throws {UnauthenticatedError} Throws UnauthenticatedError if the JWT is not found, the verification failed, or the decoding failed.
 * @throws {TokenExpiredError} Throws TokenExpiredError if the JWT is parsed successfully and is determined to have expired.
 */
export async function getAuthContext(
	req: NextApiRequest,
	res: NextApiResponse,
	mode?: 'cookie' | 'header'
): Promise<AuthContext> {
	const _name = 'getAuthContext';
	const _ip = extractIp(req);

	let authenticated = false;
	let jot;

	if (!mode || mode === 'cookie') {
		// First check cookie by default.
		jot = getCookie(COOKIE_AUTH_USER, { req, res });

		if (typeof jot === 'string' && jot) {
			authenticated = true;
		} else {
			logger.debug(`Invalid authentication cookie. (${jot})`, _ip, _name);
		}
	}

	if (!authenticated && (!mode || mode === 'header')) {
		const bearer = req.headers.authorization;
		jot = extractJwt(bearer);

		if (jot) {
			authenticated = true;
		} else {
			logger.debug(`Invalid bearer token. (${bearer})`, _ip, _name);
		}
	}

	if (typeof jot !== 'string' || !authenticated) {
		throw new UnauthenticatedError('JWT not found');
	}

	let decoded;
	try {
		decoded = await verifyJwt(jot);
		logger.trace(`Token is valid.`, _ip, _name);
	} catch (err: any) {
		if (err instanceof TokenExpiredError) {
			logger.debug(`Token has expired. (${err})`, _ip, _name);

			throw err; // Re-throw the error.
		}
		// Else.
		logger.debug(`JWT verification failed. (${err})`, _ip, _name);

		throw new UnauthenticatedError('JWT verification failed');
	}

	if (!decoded || typeof decoded.payload === 'string') {
		logger.debug(`Failed to decode token.`, _ip, _name);

		throw new UnauthenticatedError('JWT decoding failed');
	}

	return {
		id: decoded.payload.sub ?? '',
		name: decoded.payload.name ?? '',
	};
}

/**
 * Creates a JWT using environment credentials and the supplied arguments.
 *
 * @param sub - The `sub` field of the JWT. This is typically the UUID of the entity to authenticate.
 * @param name - The name of the user for convenience.
 * @returns Returns a Promise that resolves with the token. It rejects with the error encountered, or with nothing if the token cannot be created.
 */
export async function makeJwt(sub: string, name: string): Promise<string> {
	const payload = {
		name,
		sub,
	};

	return new Promise((resolve, reject) => {
		jwt.sign(
			payload,
			JWT_HMAC_KEY,
			{
				audience: JWT_AUDIENCE,
				issuer: JWT_ISSUER,
				expiresIn: JWT_TTL_ACCESS.trim(),
				notBefore: 0, // Duration from now.
			},
			(err: Error | null, token?: string) => {
				if (err) {
					reject(err);
				} else if (!token) {
					reject();
				} else {
					resolve(token);
				}
			}
		);
	});
}

/**
 * Verifies that the supplied JWT is valid.
 *
 * @param jot - The JSON Web Token to verify.
 */
export async function verifyJwt(jot: string): Promise<jwt.Jwt | undefined> {
	return new Promise((resolve, reject) => {
		jwt.verify(
			jot,
			JWT_HMAC_KEY,
			{
				audience: JWT_AUDIENCE,
				issuer: JWT_ISSUER,
				complete: true, // Return the decoded payload.
			},
			(err, decoded) => {
				if (err) {
					reject(err);
				} else {
					resolve(decoded);
				}
			}
		);
	});
}

type NextContextApiHandler = (
	req: NextApiRequest,
	res: NextApiResponse
) => Promise<void>;

/**
 * The wrapper function around a HTTP request handler to add authentication check.
 *
 * @param handler - The HTTP request handler.
 * @param mode - Whether to check for the JWT in the cookie or the header. If not specified, the cookies are checked before the headers.
 */
export function withAuthHandler(
	handler: NextContextApiHandler,
	mode?: 'cookie' | 'header'
) {
	const _name = 'withAuthHandler';

	return async function (req: NextApiRequest, res: NextApiResponse) {
		const _ip = extractIp(req);
		try {
			await getAuthContext(req, res, mode);

			return handler(req, res);
		} catch (err: any) {
			if (err instanceof TokenExpiredError) {
				return res.status(403).json({
					status: 403,
					code: ERROR_1003,
				} satisfies HttpPayload);
			}

			if (err instanceof UnauthenticatedError) {
				return res.status(401).json({
					status: 401,
					code: ERROR_1002,
				} satisfies HttpPayload);
			}

			logger.error(
				`Failed to get auth context. (${err.toString()})`,
				_ip,
				_name
			);

			return res.status(500).json({
				status: 500,
				code: ERROR_1001,
			} satisfies HttpPayload);
		}
	};
}
