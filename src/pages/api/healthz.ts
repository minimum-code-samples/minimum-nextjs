import { NextApiRequest, NextApiResponse } from 'next';

import { HTTP_GET } from '@src/constants';
import { logger } from '@src/lib/server/logger';
import { HttpPayload } from '@src/types';

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
	logger.debug(`(${_name}) API requested.`);

	return res.status(200).json({
		status: 200,
	} satisfies HttpPayload);
}
