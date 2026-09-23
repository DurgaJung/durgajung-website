# Durga Jung Kunwar — Official Website

Static website prepared for Cloudflare Pages from the WordPress.com export and media backup.

## Cloudflare Pages settings
- Production branch: `main`
- Framework preset: None
- Build command: `exit 0`
- Build output directory: `/` (repository root)

The project must contain `index.html` at the repository root.

## Main files
- `index.html` — Home
- `about.html`
- `ministry.html`
- `books.html`
- `sermons.html`
- `software.html`
- `gallery.html`
- `contact.html`

The original WordPress site should remain online until this Cloudflare version is tested and the custom domain is connected.

## Licence and device tracking
After a customer installs Mero Mandali or Nepali Bible Quiz and the licence is verified, Admin → Sales and Admin → Licenses show the licence key and the Windows PC (`active_device_id`) it is bound to. Opening those pages, or the five-minute Worker cron, refreshes the record from the licence servers.

The `license_installs` D1 table is on the live `durgajung-admin-db`. Hard-refresh `/admin` after a Worker deploy so Sales and Licenses load the new page.
