// /**
//  * Welcome to Cloudflare Workers! This is your first worker.
//  *
//  * - Run `npm run dev` in your terminal to start a development server
//  * - Open a browser tab at http://localhost:8787/ to see your worker in action
//  * - Run `npm run deploy` to publish your worker
//  *
//  * Learn more at https://developers.cloudflare.com/workers/
//  */

// // import handleProxy from './proxy';
// // import handleRedirect from './redirect';
// // Export a default object containing event handlers
// export default {
// 	// The fetch handler is invoked when this worker receives a HTTP(S) request
// 	// and should return a Response (optionally wrapped in a Promise)
// 	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
// 		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
// 		const url = new URL(request.url);
// 		// You can get pretty far with simple logic like if/switch-statements
// 		// switch (url.pathname) {
// 		// 	case '/redirect':
// 		// 		return handleRedirect.fetch(request, env, ctx);
// 		// 	case '/proxy':
// 		// 		return handleProxy.fetch(request, env, ctx);
// 		// }
// 		if (url.pathname.startsWith('/api/')) {
// 			// You can also use more robust routing
// 			return apiRouter.handle(request);
// 		}
// 		return new Response(
// 			`Try making requests to:
//       <ul>
//       <li><code><a href="/redirect?redirectUrl=https://example.com/">/redirect?redirectUrl=https://example.com/</a></code>,</li>
//       <li><code><a href="/proxy?modify&proxyUrl=https://example.com/">/proxy?modify&proxyUrl=https://example.com/</a></code>, or</li>
//       <li><code><a href="/api/todos">/api/todos</a></code></li>`,
// 			{ headers: { 'Content-Type': 'text/html' } }
// 		);
// 	},
// };
import apiRouter from './router';
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const { pathname } = url;
		if (url.pathname.startsWith('/api/')) {
			if (!env.TOKEN) {
				return new Response('please add "TOKEN" in "Worker > Settings > Variables"');
			}
			if (!request.headers.has('Authorization')) {
				return new Response('Authorization header is missing', { status: 401 });
			}
			const Authorization = request.headers.get('Authorization');
			if (!Authorization?.startsWith('Bearer ')) {
				return new Response('Authorization header is invalid. Only allow Bearer.', { status: 401 });
			}
			const token = Authorization.substring(7).trim();
			if (token !== env.TOKEN) {
				return new Response('Unauthorized', { status: 403 });
			}
			return apiRouter.handle(request, env);
		}
		let path = pathname.slice(1);
		const redirectURL = await env.SHORT_LINK.get(path);
		if (!redirectURL) {
			return new Response(`There is no defined URL for the path: '${path}', sorry :(`);
		}
		return Response.redirect(redirectURL, 301);
	},
};
