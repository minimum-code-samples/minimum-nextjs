import type { AppProps } from 'next/app';

import '@src/styles/globals.scss';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
