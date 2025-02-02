import { Application, Router } from 'https://deno.land/x/oak@v6.0.1/mod.ts';

import { React, ReactDOMServer } from './deps.ts';
import { ObsidianRouter, Cron } from './serverDeps.ts';
import { createDb } from './server/db/db.ts';
import resolvers from './server/resolvers.ts';
import types from './server/schema.ts';
import App from './client/app.tsx';
import { staticFileMiddleware } from './staticFileMiddleware.ts';

const PORT = 3000;
const app = new Application();
// Track response time in headers of responses
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get('X-Response-Time');
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set('X-Response-Time', `${ms}ms`);
});
// create and seed DB
// await createDb();

// Create Route
const router = new Router();

router.get('/', (ctx: any) => {
  try {
    const body = (ReactDOMServer as any).renderToString(<App />);
    ctx.response.body = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

        <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">

        <link rel="stylesheet" href="/static/style.css">


        <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    />
        <title>Obsidian</title>
      </head>
      <body class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-900" >
        <div  id="root">${body}</div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script  src="/static/client.js" defer></script>
      </body>
      </html>`;
  } catch (err) {
    console.log('error', err);
  }
});

// Bundle hydrated app
const { files, diagnostics } = await Deno.emit('./client/client.tsx', {
  bundle: 'esm',
});
// Router for serving bundle
const bundleRouter = new Router();
bundleRouter.get('/static/client.js', (context) => {
  context.response.headers.set('Content-Type', 'text/html');
  context.response.body = files['deno:///bundle.js'];
});

// Attach routes
app.use(router.routes());
app.use(staticFileMiddleware);
app.use(bundleRouter.routes());
app.use(router.allowedMethods());

interface ObsRouter extends Router {
  obsidianSchema?: any;
}
// Create GraphQL Router
const GraphQLRouter = await ObsidianRouter<ObsRouter>({
  Router,
  typeDefs: types,
  resolvers: resolvers,
  redisPort: 6379,
});
app.use(GraphQLRouter.routes(), GraphQLRouter.allowedMethods());

const cron = new Cron();

cron.add('*/30 * * * *', () => {
  console.log('It has been 30 minutes, the DB is refreshing');
  createDb();
});

cron.start();

app.addEventListener('listen', () => {
  console.log(`listening on localhost:${PORT}`);
});

await app.listen({ port: PORT });
