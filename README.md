# Nutrinance — demo website

A single-page, no-backend website for Nutrinance. Just open `index.html` in a browser.

```
index.html      all the content (sections in order, top to bottom)
styles.css      all styling (brand colours are at the very top)
script.js       menu, tabs, filters, slider, WhatsApp links
assets/         logo + placeholder images (all swappable)
```

## 1. Set the WhatsApp number  ← do this first

Open `script.js`, line 8:

```js
var WHATSAPP_NUMBER = "919999999999";
```

Replace with Vrushika's number: country code + number, **digits only** (no `+`, no spaces).
India example: `919876543210`.

That one line powers every "Book" button, every "Enquire" link, the floating chat
button, and the appointment form.

## 2. Replace the images

Every image is a placeholder SVG. Drop in real photos with the **same file name**
(or keep your own name and update the `src` in `index.html`):

| File | Where it shows |
|---|---|
| `assets/logo.svg` | header logo (top-left) |
| `assets/logo-white.svg` | footer logo (white version) |
| `assets/photos/hero-main.svg` | big hero portrait |
| `assets/photos/hero-food.svg` | small hero food photo |
| `assets/photos/story.svg` | Our Story portrait |
| `assets/photos/transform-1..3.svg` | transformation photos |
| `assets/recipes/*.svg` | 16 recipe photos |

If the new file is a `.jpg` or `.png`, search `index.html` for the old filename and
change the extension.

## 3. Replace the dummy content

Everything below is **placeholder text written for the demo** — swap for real details:

- **Testimonials** — 6 reviews in the `<!-- REVIEWS -->` section (names, cities, results)
- **Numbers** — `2,500+ clients`, `4.9 rating`, `92%`, `8+ years` (hero, rating bar, story badge)
- **Our Story** — written in Vrushika's voice, needs her real background and qualifications
- **Email** — `hello@nutrinance.in` in the footer
- **Transformation stats** — `-12 kg`, `-8 inches`, `+6 kg`
- **Announcement bar** — the top strip about September openings

## 4. Change the colours

Top of `styles.css`, in `:root`. Green, pink and white are already set from the brief.

## Going live
Any static host works — Netlify (drag the folder in), Vercel, GitHub Pages or
regular cPanel hosting. No server, no database, nothing to configure.

## Previewing locally
Double-click `index.html`, or run a tiny local server:

```
node server.js
```

then open http://localhost:5599. `server.js` and `.claude/` are development
helpers only — safe to delete before handing the folder over.
