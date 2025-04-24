# NGINX Configuration Instructions for Solana Blinks

To properly handle Solana Blinks URLs, add the following configuration blocks to your NGINX config files.

## For Production Server (`/etc/nginx/sites-available/degenduel.me`)

Add the following configuration block **directly before** the `# SPA index.html` section:

```nginx
    # Handle Solana Blinks URLs
    location ^~ /blinks/ {
        # First try to serve the requested URI directly (for API requests)
        try_files $uri @blinks_fallback;
        
        # Enhanced NGINX Logging
        access_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-prod-access-log.log upstream_time;
        error_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-prod-error-log.log debug;
    }

    # Fallback for Blinks URLs
    location @blinks_fallback {
        # Serve the blinks.html file (which then redirects properly)
        root /home/websites/degenduel-fe/dist;
        try_files /blinks.html =404;
        
        # Never cache blinks HTML
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
        add_header Last-Modified $date_gmt;
        
        # Enhanced NGINX Logging
        access_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-prod-access-log.log upstream_time;
        error_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-prod-error-log.log debug;
    }
```

## For Development Server (`/etc/nginx/sites-available/dev.degenduel.me`)

Add the following configuration block **directly before** the `# SPA index.html` section:

```nginx
    # Handle Solana Blinks URLs
    location ^~ /blinks/ {
        # First try to serve the requested URI directly (for API requests)
        try_files $uri @blinks_fallback;
        
        # Enhanced NGINX Logging
        access_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-dev-access-log.log upstream_time;
        error_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-dev-error-log.log debug;
    }

    # Fallback for Blinks URLs
    location @blinks_fallback {
        # Serve the blinks.html file (which then redirects properly)
        root /home/websites/degenduel-fe/dist-dev;
        try_files /blinks.html =404;
        
        # Never cache blinks HTML
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
        add_header Last-Modified $date_gmt;
        
        # Enhanced NGINX Logging
        access_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-dev-access-log.log upstream_time;
        error_log /home/branchmanager/websites/degenduel/logs/nginx_logs/api-dev-error-log.log debug;
    }
```

## After Making Changes

After adding these configuration blocks, test the NGINX configuration with:

```bash
sudo nginx -t
```

If the test is successful, reload NGINX to apply the changes:

```bash
sudo systemctl reload nginx
```

## Testing the Blinks Functionality

Once the NGINX configuration is updated, test the Blinks functionality using:

1. Visit https://degenduel.me/blinks-tester.html (or https://dev.degenduel.me/blinks-tester.html)
2. Generate a test blink URL with parameters
3. Test the URL to verify it works correctly without MIME type errors

## Troubleshooting

If you encounter any issues:

1. Check NGINX error logs: `/home/branchmanager/websites/degenduel/logs/nginx_logs/api-prod-error-log.log`
2. Verify that `/home/websites/degenduel-fe/dist/blinks.html` exists and has the correct content
3. Confirm the browser console shows no errors related to MIME types when accessing a blink URL