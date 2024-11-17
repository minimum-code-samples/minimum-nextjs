import { NextApiRequest, NextApiResponse } from 'next';

import { HTTP_GET } from '@src/constants';
import logger from '@src/lib/server/logger';
import { HttpPayload } from '@src/types';
import { extractIp } from '@src/utilities';

const _name = `pages/api/healthz`;

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	switch (req.method) {
		case HTTP_GET:
			await fn(req, res);
			break;
		default:
			res.status(404).end();
	}
}

async function fn(req: NextApiRequest, res: NextApiResponse) {
	const _ip = extractIp(req);
	logger.debug(`API requested.`, _ip, _name);

	return res.status(200).json({
		status: 200,
	} satisfies HttpPayload);
}
