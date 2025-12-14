import { IRequest, Router } from 'itty-router';
const router = Router({
	base: '/api',
});
router.post('/shorten', async (req: IRequest, env: Env) => {
	const { url, path: shorten } = (await req.json()) as {
		url: string;
		path?: string;
	};
	let shortenKey = shorten || Math.random().toString(36).slice(2, 8);
	await env.SHORT_LINK.put(shortenKey, url);
	const result = {
		original: url,
		url: `${new URL(req.url).origin}/${shortenKey}`,
	};
	return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
});
router.get('/link/:path', async ({ params }, env: Env) => {
	const { path } = params;
	if (!path || path.trim() === '') {
		return new Response(JSON.stringify({ error: 'Path parameter is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const data = await env.SHORT_LINK.getWithMetadata(path);
	const result = {
		exists: data.value !== null,
		path,
		url: data,
	};
	return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
});
router.get('/links', async (req: IRequest, env: Env) => {
	const list = await env.SHORT_LINK.list();
	const origin = new URL(req.url).origin;

	// Batch KV requests to avoid hitting concurrent request limits
	const BATCH_SIZE = 50;
	const linksWithDetails = [];

	for (let i = 0; i < list.keys.length; i += BATCH_SIZE) {
		const batch = list.keys.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map(async (item) => {
				const value = await env.SHORT_LINK.get(item.name);
				return {
					path: item.name,
					destination: value,
					shortUrl: `${origin}/${item.name}`,
					metadata: item.metadata,
				};
			})
		);
		linksWithDetails.push(...batchResults);
	}

	return new Response(JSON.stringify({
		links: linksWithDetails,
		count: linksWithDetails.length
	}), {
		headers: { 'Content-Type': 'application/json' }
	});
});
router.all('*', () => new Response('Not Found.', { status: 404 }));
export default router;
