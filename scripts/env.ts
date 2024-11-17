/**
 * This is an initialization module for reading the environment variable files.
 *
 * This should be called (`import 'env'`) before calling the logger (`import logger from 'logger'`).
 *
 * The file read in is by default _.env_
 *
 * To specify a different environment file, set the environment variable `APP_ENV`.
 *
 * @module scripts/env
 */
import dotenv from 'dotenv';

export const envfile = `.env${
	process.env.APP_ENV ? '.' + process.env.APP_ENV : ''
}`;

dotenv.config({
	path: envfile,
});
