import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import Alert from 'react-bootstrap/Alert';

import { getFlashCookie } from '@src/utilities';

export const getServerSideProps: GetServerSideProps = async (context: any) => {
	const flash = getFlashCookie(context.req, context.res);

	return {
		props: {
			flash,
		},
	};
};

export default function Home(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<>
			<Head>
				<title>Minimum Next.js</title>
				<meta name="description" content="Minimum code to create a Next.js project." />
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
