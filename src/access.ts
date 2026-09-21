type SigningKey = JsonWebKey & { kid: string };

let cache: { keys: SigningKey[]; fetchedAt: number } | undefined;

async function signingKeys(teamDomain: string, refresh: boolean): Promise<SigningKey[]> {
	if (refresh || !cache || Date.now() - cache.fetchedAt > 3_600_000) {
		const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
		const { keys } = (await response.json()) as { keys: SigningKey[] };
		cache = { keys, fetchedAt: Date.now() };
	}
	return cache.keys;
}

const base64url = (part: string) =>
	Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const json = (part: string) => JSON.parse(new TextDecoder().decode(base64url(part)));

/**
 * Verifies a Cloudflare Access JWT: RS256 signature against the team's published keys,
 * issuer, audience and expiry. https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */
export async function verifyAccessJwt(token: string, teamDomain: string, audience: string): Promise<boolean> {
	const [header, payload, signature] = token.split('.');
	if (!header || !payload || !signature) return false;
	try {
		const { alg, kid } = json(header);
		if (alg !== 'RS256') return false;
		const jwk =
			(await signingKeys(teamDomain, false)).find((k) => k.kid === kid) ??
			(await signingKeys(teamDomain, true)).find((k) => k.kid === kid);
		if (!jwk) return false;
		const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
		const signed = new TextEncoder().encode(`${header}.${payload}`);
		if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, base64url(signature), signed))) return false;
		const claims = json(payload);
		const audiences: unknown[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
		return claims.iss === teamDomain && audiences.includes(audience) && claims.exp * 1000 > Date.now();
	} catch {
		return false;
	}
}
