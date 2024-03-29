import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head />
			<link rel="icon" type="image/png" href="/favicon.png" />
			<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" />
			<link
				rel="stylesheet"
				href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap"
			/>

			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
