/**
 * Provides the logging facility to store logs as local files.
 *
 * @module @src/lib/server/logger
 */

import fs from 'fs';
import pino, { type Level, type StreamEntry } from 'pino';
import pinoPretty from 'pino-pretty';

// Check if directory exists and create if not.
const logDir = process.env.PINO_LOG_DIR || 'logs';
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

if (!process.env.PINO_LOG_LEVEL) {
	console.error(`Environment variable PINO_LOG_LEVEL needs to be specified.`);
	process.exit(1);
}
const ll = process.env.PINO_LOG_LEVEL;
if (!_isPinoLevel(ll)) {
	console.error(`PINO_LOG_LEVEL must be of one of the values: "fatal", "error", "warn", "info", "debug", "trace".`);
	process.exit(1);
}

const logLevel: Level = ll as Level;

// Change the file opening to be synchronous when running in command line.
let sync = false;
if (process.env.APP_ENV === 'development') {
	sync = true;
}

const streams: StreamEntry[] = [{ level: logLevel, stream: pinoPretty({ colorize: true, sync: true }) }];

const logFile = process.env.PINO_LOG_FILE;
if (logFile) {
	streams.push({
		level: logLevel,
		stream: pino.destination({ dest: `${logDir}/${logFile}`, sync }),
	});
}

const errFile = process.env.PINO_ERROR_FILE;
if (errFile) {
	streams.push({
		level: 'error',
		stream: pino.destination({ path: `${logDir}/${errFile}`, sync }),
	});
}

const logger = pino(
	{
		level: logLevel,
		formatters: {
			level: (label) => {
				return { level: label.toUpperCase() };
			},
		},
	},
	pino.multistream(streams)
);

/**
 * Checks if the environment variable holds a valid log level value.
 *
 * @param level - The input string from the environment variable PINO_LOG_LEVEL.
 */
function _isPinoLevel(level: string): level is Level {
	switch (level) {
		case 'fatal': // fall-thru
		case 'error': // fall-thru
		case 'warn': // fall-thru
		case 'info': // fall-thru
		case 'debug': // fall-thru
		case 'trace': // fall-thru
			return true;
		default:
			return false;
	}
}

export { logger };
