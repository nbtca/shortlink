# Cloudflare Access Setup Guide

This guide explains how to configure Cloudflare Access to secure the short link manager API and admin UI.

## Overview

After this setup:
- **`/admin`** - Protected admin UI (requires Cloudflare Access authentication)
- **`/api/*`** - Protected API endpoints (requires Cloudflare Access authentication or Bearer token)
- **`/{shortlink}`** - Public short link redirects (no authentication)

## Prerequisites

1. A Cloudflare account with your domain configured
2. Your Worker deployed to Cloudflare
3. Access to Cloudflare Zero Trust dashboard

## Step 1: Enable Cloudflare Zero Trust

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **Zero Trust** from the left sidebar (or visit https://one.dash.cloudflare.com/)
3. If first time, complete the Zero Trust onboarding

## Step 2: Create an Access Application

### Navigate to Access Applications

1. In Cloudflare Zero Trust dashboard, go to **Access** > **Applications**
2. Click **Add an application**
3. Select **Self-hosted**

### Configure Application Details

**Application Configuration:**
- **Application name**: `Short Link Manager`
- **Session Duration**: Choose based on your needs (e.g., 24 hours)
- **Application domain**:
  - Enter your Worker's domain (e.g., `shortlink.yourdomain.com`)

### Add Application Paths

You need to protect two paths:

**Path 1: Admin UI**
- **Subdomain**: (your worker subdomain)
- **Path**: `/admin`

**Path 2: API Endpoints**
- **Subdomain**: (your worker subdomain)
- **Path**: `/api`

> **Note**: Make sure to check "Include subpaths" for the `/api` path to protect all API endpoints.

### Identity Provider

Choose your preferred authentication method:

#### Option 1: Email OTP (One-Time Password)
- Simple, no external provider needed
- Users receive a code via email to authenticate

#### Option 2: Google Workspace
- Best for organizations using Google Workspace
- Allows restricting to specific domains

#### Option 3: Other Providers
- Azure AD
- Okta
- GitHub
- SAML
- And more...

**To configure:**
1. Go to **Settings** > **Authentication**
2. Click **Add new** under Login methods
3. Select your provider and follow the setup wizard
4. Return to your Application configuration

### Create Access Policy

1. After configuring the application, click **Next** to create policies
2. **Policy name**: `Allow authenticated users`
3. **Action**: `Allow`

**Configure Allow rules** (choose one):

**For organization/team access:**
- **Selector**: `Emails ending in`
- **Value**: `@yourdomain.com`

**For specific users:**
- **Selector**: `Emails`
- **Value**: Add specific email addresses

**For everyone (less secure):**
- **Selector**: `Everyone`

4. Click **Next** and then **Add application**

## Step 3: Configure CORS (Optional)

If you plan to call the API from other domains:

1. In your Access application settings, go to **CORS Settings**
2. Add allowed origins
3. Configure allowed methods and headers

## Step 4: Deploy and Test

### Deploy Your Worker

```bash
npm run deploy
```

### Test Authentication

1. **Visit the admin UI**: Navigate to `https://your-worker-domain.com/admin`
   - You should be redirected to Cloudflare Access login page
   - Authenticate with your chosen method
   - You should be redirected back to the admin UI

2. **Test the API**: Make a request to the API endpoints
   ```bash
   curl https://your-worker-domain.com/api/links
   ```
   - Without authentication, you should receive a 401 Unauthorized
   - After authenticating via the browser, the cookie/JWT will be sent automatically

3. **Test public redirects**: Navigate to `https://your-worker-domain.com/{any-shortlink}`
   - Should redirect without requiring authentication

## Authentication Methods

The Worker now supports **two authentication methods**:

### 1. Cloudflare Access (Primary)
- Automatic when configured via Cloudflare Zero Trust
- Worker checks for `Cf-Access-Jwt-Assertion` header
- No code changes needed in the worker

### 2. Bearer Token (Fallback)
- Useful for API automation, scripts, CI/CD pipelines
- Set the `TOKEN` environment variable in Worker settings
- Send requests with `Authorization: Bearer YOUR_TOKEN` header

**Example API call with Bearer token:**
```bash
curl -X POST https://your-worker-domain.com/api/shorten \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "path": "example"}'
```

## Advanced Configuration

### JWT Validation (Optional)

For enhanced security, you can validate the Cloudflare Access JWT:

1. Get your Access public keys from:
   ```
   https://YOUR_TEAM_NAME.cloudflareaccess.com/cdn-cgi/access/certs
   ```

2. Implement JWT verification in the Worker using a library like `@tsndr/cloudflare-worker-jwt`

3. Verify claims like:
   - Expiration (`exp`)
   - Audience (`aud`) - your application's Audience Tag
   - Email (`email`)

### Policy Fine-Tuning

You can create multiple policies with different rules:
- Allow access during business hours only
- Require specific countries
- MFA/2FA requirements
- Device posture checks (e.g., require corporate devices)

### Audit Logs

Monitor who's accessing your application:
1. Go to **Analytics & Logs** > **Access**
2. View authentication attempts, successful logins, and blocked requests

## Troubleshooting

### Issue: Getting 401 Unauthorized after configuring Cloudflare Access

**Solution**:
- Ensure the application paths in Cloudflare Access match exactly (`/admin` and `/api`)
- Check that "Include subpaths" is enabled for `/api`
- Clear browser cookies and try again

### Issue: API calls from scripts fail

**Solution**:
- Use Bearer token authentication for programmatic access
- Set `TOKEN` environment variable in Worker settings
- Include `Authorization: Bearer YOUR_TOKEN` in API requests

### Issue: Redirects stop working

**Solution**:
- Ensure you're not protecting the root path `/` in Cloudflare Access
- Only `/admin` and `/api` should be protected
- Short link redirects at `/{path}` should remain public

### Issue: Can't access admin UI after authentication

**Solution**:
- Check browser console for errors
- Verify the Worker is properly deployed
- Ensure CORS is configured if accessing from a different domain

## Environment Variables

Make sure these are set in Cloudflare Worker settings:

- **`SHORT_LINK`**: KV namespace binding (required)
- **`TOKEN`**: Bearer token for API-only access (optional, recommended for automation)

## Security Best Practices

1. **Use specific email domains** in Access policies instead of "Everyone"
2. **Enable MFA** for your identity provider
3. **Set appropriate session duration** (shorter = more secure)
4. **Regularly review Access logs** for suspicious activity
5. **Keep the Bearer token secret** - store in environment variables, never in code
6. **Rotate the Bearer token periodically** if used for automation
7. **Use device posture checks** if available for your plan

## Next Steps

- Set up [Cloudflare Access policies](https://developers.cloudflare.com/cloudflare-one/policies/access/) for fine-grained control
- Configure [Access logs](https://developers.cloudflare.com/cloudflare-one/analytics/logs/) for auditing
- Add [JWT validation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/) for enhanced security

## Resources

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Zero Trust Dashboard](https://one.dash.cloudflare.com/)
