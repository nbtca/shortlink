# ShortLink

A simple and powerful URL shortener built with Cloudflare Workers, featuring a RESTful API for creating and managing short links.

## Features

- 🚀 **Fast & Scalable**: Built on Cloudflare Workers for global edge deployment
- 🔗 **Custom Short Paths**: Create custom short links or use auto-generated ones
- 🔐 **Secure API**: Token-based authentication for API access
- 📊 **Link Management**: List and retrieve information about existing short links
- 🌐 **Global CDN**: Leverages Cloudflare's global network for fast redirects

## Quick Start

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Cloudflare account
- Wrangler CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nbtca/shortlink.git
cd shortlink
```

2. Install dependencies:
```bash
npm install
```

3. Configure your environment (see [Configuration](#configuration) section)

4. Start development server:
```bash
npm run dev
```

5. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Configuration

### Environment Variables

You need to configure the following in your Cloudflare Workers dashboard:

#### KV Namespace
1. Go to **Workers & Pages** > **KV**
2. Create a new namespace called `SHORT_LINK`
3. In your worker settings, bind it under **Settings** > **Variables** > **KV Namespace Bindings**:
   - Variable name: `SHORT_LINK`
   - KV namespace: Select your created namespace

#### Environment Variables
In **Settings** > **Variables**, add:
- `TOKEN`: Your API authentication token (choose a secure random string)

### Local Development

For local development, create a `wrangler.toml` file (if not already configured) with your KV namespace bindings.

## API Documentation

All API endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Create Short Link

**POST** `/api/shorten`

Create a new short link.

**Request Body:**
```json
{
  "url": "https://example.com/very-long-url",
  "path": "custom-path"  // Optional: custom short path
}
```

**Response:**
```json
{
  "original": "https://example.com/very-long-url",
  "url": "https://your-domain.com/abc123"
}
```

### Get Link Information

**GET** `/api/link/{path}`

Retrieve information about a specific short link.

**Response:**
```json
{
  "exists": true,
  "path": "abc123",
  "url": {
    "value": "https://example.com/very-long-url",
    "metadata": null
  }
}
```

### List All Links

**GET** `/api/links`

Get a list of all short links.

**Response:**
```json
{
  "keys": [
    {
      "name": "abc123",
      "expiration": null,
      "metadata": null
    }
  ],
  "list_complete": true,
  "cursor": null
}
```

## Usage Examples

### Using cURL

Create a short link:
```bash
curl -X POST https://your-domain.com/api/shorten \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url"}'
```

Create a custom short link:
```bash
curl -X POST https://your-domain.com/api/shorten \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url", "path": "my-link"}'
```

### Using the Short Link

Once created, visit the short link in your browser:
```
https://your-domain.com/abc123
```

This will redirect you to the original URL with a 301 permanent redirect.

## Project Structure

```
├── src/
│   ├── index.ts       # Main worker entry point
│   ├── router.ts      # API route definitions
│   ├── proxy.ts       # Proxy functionality (commented out)
│   ├── redirect.ts    # Redirect functionality (commented out)
│   └── ab-test.ts     # A/B testing functionality (commented out)
├── wrangler.toml      # Cloudflare Workers configuration
├── package.json       # Node.js dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## Development

### Local Development
```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`

### Deployment
```bash
npm run deploy
```

This deploys your worker to Cloudflare's edge network.

### Scripts

- `npm run dev` - Start local development server
- `npm run start` - Alias for dev
- `npm run deploy` - Deploy to Cloudflare Workers

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing path for redirect)
- `401` - Unauthorized (missing or invalid Authorization header)
- `403` - Forbidden (invalid token)
- `404` - Not Found (short link doesn't exist)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/nbtca/shortlink/issues) on GitHub.