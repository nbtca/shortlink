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
            background: #f5f5f5;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
            font-size: 2.5em;
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
            border-color: #007bff;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }
        button:hover {
            background: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
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
            color: #007bff;
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
        .details-btn {
            background: #6c757d;
            padding: 6px 12px;
            font-size: 14px;
            margin-right: 10px;
        }
        .details-btn:hover {
            background: #5a6268;
        }
        .destination-cell {
            color: #666;
            font-style: italic;
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

        async function loadLinkDetails(path, rowElement) {
            const destCell = rowElement.querySelector('.destination-cell');
            const detailsBtn = rowElement.querySelector('.details-btn');

            if (destCell.textContent !== 'Click "Details" to load') {
                // Already loaded, toggle visibility
                const currentDisplay = destCell.style.display || 'table-cell';
                destCell.style.display = currentDisplay === 'none' ? 'table-cell' : 'none';
                detailsBtn.textContent = destCell.style.display === 'none' ? 'Details' : 'Hide';
                return;
            }

            destCell.innerHTML = '<em>Loading...</em>';
            detailsBtn.disabled = true;

            try {
                const linkInfo = await apiRequest(\`/link/\${path}\`);
                destCell.textContent = linkInfo.url.value || 'N/A';
                detailsBtn.textContent = 'Hide';
                detailsBtn.disabled = false;
            } catch (error) {
                destCell.innerHTML = \`<span style="color: red;">Error: \${error.message}</span>\`;
                detailsBtn.disabled = false;
            }
        }

        async function loadLinks() {
            const container = document.getElementById('linksContainer');
            container.innerHTML = '<div class="loading">Loading links...</div>';

            try {
                const data = await apiRequest('/links');

                if (!data.links || data.links.length === 0) {
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

                for (const link of data.links) {
                    const row = document.createElement('tr');

                    row.innerHTML = \`
                        <td><strong>\${link.path}</strong></td>
                        <td>
                            <a href="\${link.shortUrl}" target="_blank" class="link-url">\${link.shortUrl}</a>
                            <button class="copy-btn" onclick="copyToClipboard('\${link.shortUrl}')">Copy</button>
                        </td>
                        <td class="destination-cell">Click "Details" to load</td>
                        <td>
                            <button class="details-btn" onclick="loadLinkDetails('\${link.path}', this.parentElement.parentElement)">Details</button>
                            <a href="\${link.shortUrl}" target="_blank">
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

        // Make loadLinkDetails available globally
        window.loadLinkDetails = loadLinkDetails;

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
