# Custom 404 Page Setup for DegenDuel

This setup provides a beautiful, branded 404 page that will be shown instead of the default nginx error page during builds and deployments.

## 📁 Files Created

- `404.html` - The custom 404 page with your logo and branding
- `nginx-custom-404-example.conf` - Example nginx configuration
- `scripts/deploy-with-404.sh` - Deployment script that ensures 404 page is available

## 🎨 Features

The custom 404 page includes:
- ✨ Your DegenDuel logo (automatically tries multiple logo locations)
- 🌙 Dark theme matching your site's aesthetic  
- 🎭 Animated background particles
- 💫 Pulsing logo animation
- 📱 Mobile responsive design
- 🔄 Auto-refresh every 10 seconds during maintenance
- 🎯 Branded messaging about system updates

## 🚀 Quick Setup

### Option 1: Automatic (Recommended)
Run the deployment script which handles everything:
```bash
./scripts/deploy-with-404.sh
```

### Option 2: Manual Setup
Copy the 404 page to your dist directories:
```bash
cp 404.html dist/
cp 404.html dist-dev/
```

## ⚙️ Nginx Configuration

Add this to your nginx configuration to use the custom 404 page:

```nginx
# Basic setup - add to your server block
error_page 404 /404.html;
error_page 500 502 503 504 /404.html;

location = /404.html {
    root /path/to/your/dist;  # Replace with your actual dist path
    internal;
}
```

For a complete example, see `nginx-custom-404-example.conf`.

## 🔧 Integration with Build Process

### Add to package.json scripts:
```json
{
  "scripts": {
    "build": "vite build && cp 404.html dist/",
    "build:dev": "vite build --mode development && cp 404.html dist-dev/",
    "deploy": "./scripts/deploy-with-404.sh"
  }
}
```

### For CI/CD pipelines:
```yaml
# Example for GitHub Actions
- name: Build with custom 404
  run: |
    npm run build
    cp 404.html dist/
    
- name: Deploy
  run: |
    # Your deployment commands here
    # The 404.html will be available during brief outages
```

## 🎯 How It Works

1. **During Normal Operation**: Your React app serves as usual
2. **During Build/Deploy**: If the main app is unavailable, nginx serves the custom 404 page
3. **Auto-Recovery**: The page refreshes every 10 seconds to automatically detect when your app is back online

## 🔍 Logo Detection

The 404 page automatically tries to load your logo from:
1. `/logo.png` (copied to dist root)
2. `/assets/logo.png` (fallback)
3. Shows gracefully even if logo fails to load

## 📱 Mobile Optimized

- Responsive design works on all screen sizes
- Touch-friendly interface
- Optimized animations for mobile performance

## 🎨 Customization

### Change the message:
Edit the subtitle in `404.html`:
```html
<p class="subtitle">
    Your custom message here<br>
    This will only take a moment.
</p>
```

### Modify colors:
Update the CSS variables in `404.html`:
```css
/* Change the primary brand color */
background: #your-color;
```

### Disable auto-refresh:
Remove or comment out the JavaScript at the bottom of `404.html`:
```javascript
// setTimeout(() => {
//     window.location.reload();
// }, 10000);
```

## 🚀 Testing

Test your custom 404 page:

1. **Local testing**: Open `404.html` directly in your browser
2. **Server testing**: Temporarily rename your `index.html` and visit your site
3. **Build testing**: Monitor your site during an actual deployment

## 📋 Checklist

- [ ] Custom 404 page created and styled
- [ ] Logo assets available in dist directories  
- [ ] Nginx configuration updated
- [ ] Build process includes 404 page copying
- [ ] Tested 404 page display
- [ ] Nginx configuration reloaded

## 💡 Tips

- Keep the 404 page lightweight (currently ~8KB) for fast loading
- Test the 404 page regularly to ensure it's working
- Monitor your deployment process to see the improvement
- Consider adding a status page URL if you have one

## 🆘 Troubleshooting

**404 page not showing?**
- Check nginx configuration syntax: `nginx -t`
- Verify file permissions: `chmod 644 404.html`
- Ensure nginx can read the dist directory

**Logo not loading?**
- Check if logo files exist in public/ directory
- Verify logo is copied to dist/ during build
- Check browser console for 404 errors on logo requests

**Page not refreshing?**
- Check browser console for JavaScript errors
- Verify the auto-refresh script is included

---

🎉 **Enjoy your branded maintenance page!** Your users will see a professional, on-brand experience even during brief outages. 