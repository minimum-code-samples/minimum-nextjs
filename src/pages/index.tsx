import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import Alert from 'react-bootstrap/Alert';

import logger from '@src/lib/server/logger';
import { HttpPayload } from '@src/types';
import { extractIp, fetchJson, getFlashCookie } from '@src/utilities';
import { useEffect } from 'react';

const _name = 'src/pages/index';

export const getServerSideProps: GetServerSideProps = async (context: any) => {
	const _ip = extractIp(context.req);
	logger.trace(`Page requested.`, _ip, _name);

	const flash = getFlashCookie(context.req, context.res);

	return {
		props: {
			flash,
		},
	};
};

export default function Home(
	props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
	useEffect(() => {
		fetchJson('/api/healthz')
			.then((result: HttpPayload) => {
				console.log(`result`, result);
			})
			.catch((err) => {
				console.dir(err, { depth: 1 });
			});
	}, []);

	return (
		<>
			<Head>
				<title>Minimum Next.js</title>
				<meta
					name="description"
					content="Minimum code to create a Next.js project."
				/>
			</Head>
			<main className="mt-5 container-fluid">
				<h1 className="text-center">Minimum Next.js</h1>
				{props.flash && (
					<div className="my-4">
						<Alert variant={props.flash.variant}>{props.flash.message}</Alert>
					</div>
				)}
				<div className="text-center">
					Built with <a href="https://nextjs.org">NEXT.js</a>
				</div>
			</main>
		</>
	);
}
