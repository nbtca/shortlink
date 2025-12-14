export const adminHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Short Link Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: white;
            margin-bottom: 30px;
            text-align: center;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        input[type="text"], input[type="url"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus, input[type="url"]:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        .links-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .links-table th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
        }
        .links-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        .links-table tr:hover {
            background: #f9f9f9;
        }
        .link-url {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        .link-url:hover {
            text-decoration: underline;
        }
        .message {
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        .copy-btn {
            background: #28a745;
            padding: 6px 12px;
            font-size: 14px;
            margin-left: 10px;
        }
        .copy-btn:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 Short Link Manager</h1>

        <div class="card">
            <h2 style="margin-bottom: 20px;">Create New Short Link</h2>
            <form id="createForm">
                <div class="form-group">
                    <label for="url">Destination URL *</label>
                    <input type="url" id="url" name="url" placeholder="https://example.com" required>
                </div>
                <div class="form-group">
                    <label for="path">Custom Path (optional)</label>
                    <input type="text" id="path" name="path" placeholder="my-link (leave empty for random)">
                </div>
                <button type="submit">Create Short Link</button>
            </form>
            <div id="createMessage"></div>
        </div>

        <div class="card">
            <h2 style="margin-bottom: 20px;">Existing Links</h2>
            <button onclick="loadLinks()" style="margin-bottom: 20px;">Refresh List</button>
            <div id="linksContainer">
                <div class="loading">Loading links...</div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin + '/api';

        async function apiRequest(endpoint, options = {}) {
            const response = await fetch(API_BASE + endpoint, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Request failed');
            }

            return response.json();
        }

        function showMessage(elementId, message, type) {
            const el = document.getElementById(elementId);
            el.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
            setTimeout(() => {
                el.innerHTML = '';
            }, 5000);
        }

        async function loadLinks() {
            const container = document.getElementById('linksContainer');
            container.innerHTML = '<div class="loading">Loading links...</div>';

            try {
                const data = await apiRequest('/links');

                if (!data.keys || data.keys.length === 0) {
                    container.innerHTML = '<div class="empty-state">No short links created yet.</div>';
                    return;
                }

                const table = document.createElement('table');
                table.className = 'links-table';
                table.innerHTML = \`
                    <thead>
                        <tr>
                            <th>Short Path</th>
                            <th>Short URL</th>
                            <th>Destination</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="linksTableBody">
                    </tbody>
                \`;

                container.innerHTML = '';
                container.appendChild(table);

                const tbody = document.getElementById('linksTableBody');

                for (const item of data.keys) {
                    const linkInfo = await apiRequest(\`/link/\${item.name}\`);
                    const row = document.createElement('tr');
                    const shortUrl = \`\${window.location.origin}/\${item.name}\`;

                    row.innerHTML = \`
                        <td><strong>\${item.name}</strong></td>
                        <td>
                            <a href="\${shortUrl}" target="_blank" class="link-url">\${shortUrl}</a>
                            <button class="copy-btn" onclick="copyToClipboard('\${shortUrl}')">Copy</button>
                        </td>
                        <td>\${linkInfo.url.value || 'N/A'}</td>
                        <td>
                            <a href="\${shortUrl}" target="_blank">
                                <button>Visit</button>
                            </a>
                        </td>
                    \`;
                    tbody.appendChild(row);
                }
            } catch (error) {
                container.innerHTML = \`<div class="error">Error loading links: \${error.message}</div>\`;
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
            }).catch(err => {
                alert('Failed to copy: ' + err);
            });
        }

        document.getElementById('createForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const url = document.getElementById('url').value;
            const path = document.getElementById('path').value;

            try {
                const result = await apiRequest('/shorten', {
                    method: 'POST',
                    body: JSON.stringify({
                        url: url,
                        path: path || undefined
                    }),
                });

                showMessage('createMessage', \`✓ Short link created: <a href="\${result.url}" target="_blank" class="link-url">\${result.url}</a>\`, 'success');

                document.getElementById('createForm').reset();

                setTimeout(() => {
                    loadLinks();
                }, 1000);
            } catch (error) {
                showMessage('createMessage', \`✗ Error: \${error.message}\`, 'error');
            }
        });

        // Load links on page load
        loadLinks();
    </script>
</body>
</html>
`;
