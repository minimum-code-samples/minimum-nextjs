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

import { COOKIE_AUTH_USER } from '@src/constants';
import { logger } from '@src/lib/server/logger';
import { HttpPayload, UnauthenticatedError } from '@src/types';
import { extractJwt } from '@src/utilities';

if (!process.env.JWT_AUDIENCE) {
	console.error(`Environment variable JWT_HMAC needs to be set for user authentication.`);
	process.exit(1);
}
const JWT_AUDIENCE: string[] = process.env.JWT_AUDIENCE.split(',').map((aud) => aud.trim());

if (!process.env.JWT_HMAC_KEY) {
	console.error(`Environment variable JWT_HMAC_KEY needs to be set for user authentication.`);
	process.exit(1);
}
const JWT_HMAC_KEY: string = process.env.JWT_HMAC_KEY;

if (!process.env.JWT_ISSUER) {
	console.error(`Environment variable JWT_ISSUER needs to be set for user authentication.`);
	process.exit(1);
}
const JWT_ISSUER: string = process.env.JWT_ISSUER;

if (!process.env.JWT_TTL_ACCESS) {
	console.error(`Environment variable JWT_TTL_ACCESS needs to be set for user authentication.`);
	process.exit(1);
}
const JWT_TTL_ACCESS: string = process.env.JWT_TTL_ACCESS;

/**
 * Removes the authentication cookie named using the constant `COOKIE_AUTH_USER`.
 *
 * @param req - The incoming request object from `context`.
 * @param res - The outgoing response object from `context`.
 */
export function clearAuthContext(req: IncomingMessage, res: ServerResponse): string | jwt.JwtPayload | null | void {
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
): Promise<jwt.JwtPayload> {
	const _name = 'getAuthContext';

	let authenticated = false;
	let jot;

	if (!mode || mode === 'cookie') {
		// First check cookie by default.
		jot = getCookie(COOKIE_AUTH_USER, { req, res });

		if (typeof jot === 'string' && jot) {
			authenticated = true;
		} else {
			logger.trace(`(${_name}) Invalid authentication cookie. (${jot})`);
		}
	}

	if (!authenticated && (!mode || mode === 'header')) {
		const bearer = req.headers.authorization;
		jot = extractJwt(bearer);

		if (jot) {
			authenticated = true;
		} else {
			logger.trace(`(${_name}) Invalid bearer token. (${bearer})`);
		}
	}

	if (typeof jot !== 'string' || !authenticated) {
		throw new UnauthenticatedError('JWT not found');
	}

	let decoded;
	try {
		decoded = await verifyJwt(jot);
		logger.trace(`(${_name}) Token is valid.`);
	} catch (err: any) {
		if (err instanceof TokenExpiredError) {
			logger.trace(`(${_name}) Token has expired. (${err})`);

			throw err; // Re-throw the error.
		}
		// Else.
		logger.trace(`(${_name}) JWT verification failed. (${err})`);

		throw new UnauthenticatedError('JWT verification failed');
	}

	if (!decoded || typeof decoded.payload === 'string') {
		logger.trace(`(${_name}) Failed to decode token.`);

		throw new UnauthenticatedError('JWT decoding failed');
	}

	return decoded.payload;
}

/**
 * Creates a JWT using environment credentials and the supplied arguments.
 *
 * @param sub - The `sub` field of the JWT. This is typically the UUID of the entity to authenticate.
 * @param name - The name of the user for convenience.
 */
export async function makeJwt(sub: string, name: string): Promise<string | undefined> {
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

type NextContextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * The wrapper function around a HTTP request handler to add authentication check.
 *
 * @param handler - The HTTP request handler.
 * @param mode - Whether to check for the JWT in the cookie or the header. If not specified, the cookies are checked before the headers.
 */
export function withAuth(handler: NextContextApiHandler, mode?: 'cookie' | 'header') {
	return async function (req: NextApiRequest, res: NextApiResponse) {
		try {
			await getAuthContext(req, res, mode);

			return handler(req, res);
		} catch (err: any) {
			if (err instanceof TokenExpiredError) {
				const hp: HttpPayload = {
					completed: false,
					message: 'Session expired.',
					status: 401,
				};
				res.status(401).json(hp);
				return;
			}

			if (err instanceof UnauthenticatedError) {
				const hp: HttpPayload = {
					completed: false,
					message: 'Authentication required.',
					status: 401,
				};
				res.status(401).json(hp);
				return;
			}

			const hp: HttpPayload = {
				completed: false,
				message: 'Authentication failure.',
				status: 500,
			};
			res.status(500).json(hp);
			return;
		}
	};
}
