import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Minimum Next.js</title>
        <meta name="description" content="Minimum code to create a Next.js project." />
      </Head>
      <main className="mt-5">
        <h1 className="text-center">Minimum Next.js</h1>
        <div className="text-center">
          Built with <a href="https://nextjs.org">NEXT.js</a>
        </div>
      </main>
    </>
  );
}
