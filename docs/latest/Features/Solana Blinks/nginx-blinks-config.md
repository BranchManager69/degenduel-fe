# NGINX Configuration for Handling Solana Blinks URLs

To properly handle the Solana Blinks URLs in your NGINX configuration, add the following location block in your server configuration:

```nginx
# Handle Solana Blinks URLs
location ^~ /blinks/ {
    # First try to serve the requested URI directly (for API requests)
    try_files $uri @blinks_fallback;
}

# Fallback for Blinks URLs
location @blinks_fallback {
    # Serve the blinks.html file (which then redirects properly)
    root /path/to/degenduel-fe/dist;  # or /path/to/degenduel-fe/dist-dev for development
    try_files /blinks.html =404;
}

# Ensure API endpoints related to blinks are still accessible
location /api/blinks/ {
    # Your existing proxy configuration to the backend API
    proxy_pass http://your_backend_server/api/blinks/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # ... other proxy settings
}
```

## Explanation

1. The first location block catches all requests that start with `/blinks/`.
   It first tries to serve the exact URI if it exists (useful for static assets).

2. If the exact URI doesn't exist, it falls back to the `@blinks_fallback` named location.

3. The fallback location serves our special `blinks.html` file that:
   - Has proper HTML MIME type (eliminating the module script error)
   - Contains a redirect script that preserves the full blink path
   - Passes the path to the main application for processing

4. We ensure that the API endpoints related to blinks (`/api/blinks/...`) are still properly
   proxied to the backend server.

## Important Notes

1. Replace `/path/to/degenduel-fe/dist` with the actual path to your production build directory.
   For development, use `/path/to/degenduel-fe/dist-dev` instead.

2. Update the `proxy_pass` URL to match your actual backend server's address.

3. This configuration ensures proper MIME type handling while preserving all functionality.

4. After implementing this change, test the blinks functionality by:
   - Accessing a direct blink URL (e.g., `https://degenduel.me/blinks/join-contest?contestId=123`)
   - Using the Share Blink button feature to generate and test shareable links