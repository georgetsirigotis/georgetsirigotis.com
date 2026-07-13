# georgetsirigotis.com

Static personal website for George Tsirigotis, built for GitHub Pages and the custom domain `georgetsirigotis.com`.

## Site contents

- `index.html` - single-page professional profile
- `styles.css` - responsive visual design
- `script.js` - footer year helper
- `assets/george-profile.png` - profile portrait
- `CNAME` - custom domain configuration

## GitHub Pages setup

1. Create a new public GitHub repository.
2. Recommended repository name: `georgetsirigotis.com`.
3. Upload the contents of this folder to the repository root.
4. In GitHub, open `Settings -> Pages`.
5. Set source to `Deploy from a branch`.
6. Select branch `main` and folder `/root`.
7. Save.
8. Keep the `CNAME` file in the repository root.
9. After deployment, confirm the site loads at `https://georgetsirigotis.com/`.

## Cloudflare DNS records for GitHub Pages

Add these records after GitHub Pages is enabled:

```text
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
CNAME  www    <your-github-username>.github.io
```

Proxy can be DNS only at first. After HTTPS is issued and stable, Cloudflare proxy can be enabled if desired.
