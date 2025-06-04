import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Prevent React DevTools from initializing too early */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
                inject: () => {},
                onCommitFiberRoot: () => {},
                onScheduleFiberRoot: () => {},
                supportsFiber: true,
                onCommitFiberUnmount: () => {},
              };
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 