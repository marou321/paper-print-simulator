# PeachyPrint — Visual Paper Format & Print DPI Simulator

A modern, pastel pink & butter-yellow interactive web application for simulating ISO 216 paper sizes (**A5, A4, A3, A2, A1, A0**), checking live print resolution (DPI) with dynamic **green-to-red pixelation warnings**, and exporting print-ready **PNG, JPEG, or true physical-size ISO PDF** files.

## Features

- **Source Sheet & Target Sheet Simulation**
  - Upload your own image (click, drag & drop, or `Ctrl+V` clipboard paste) or choose from 5 built-in sample print sheets (ranging from 72 DPI screen graphics to 300 DPI A3/A4/A5 posters).
  - Choose both **Source Sheet** (`A5–A0`, Portrait/Landscape) and **Target Sheet** (`A5–A0`, Portrait/Landscape), keeping the source sheet’s proportions intact inside the target canvas (for example, placing an **A4** sheet inside an **A2** target sheet).
  - Drag the source sheet anywhere inside the target sheet (with magnetic center snap guides), resize proportionally from all 4 corner handles, or fine-tune with the scale slider and keyboard arrow/`+`/`-` keys.
- **Live Pixelation Detection & Dynamic Green-to-Red Border**
  - Calculates effective print DPI in real time from native image pixels, simulated physical sheet size, and chosen print profile (`Standard ≥ 150 DPI`, `Fine Art ≥ 240 DPI`, `Wall Poster ≥ 100 DPI`).
  - Displays a **Green border** when sharp & print-ready, switching to a pulsing **Red border + warning badge + one-click “Snap to Safe Size”** as soon as scaling drops below safe print resolution.
  - Optional live pixelation preview and 3× hover Print Loupe magnifier.
- **Export & Print-Ready Output**
  - Export composed target sheets as **PNG**, **JPEG**, or **true ISO physical-size PDF** (with exact millimeter `/MediaBox` dimensions and optional corner crop marks).
- **AdSense-Ready Structure & Educational Guide**
  - Includes the Google AdSense script in `<head>` across all pages, `ads.txt`, `robots.txt`, `sitemap.xml`, an interactive ISO A0–A5 guide & DPI handbook, and `/about`, `/contact`, and `/privacy` pages.
  - **100% browser-local image processing** — uploaded images never leave the user's device.

## Run Locally

Requires **Node.js 18+** (zero external npm dependencies needed!):

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: PeachyPrint ISO paper & print DPI simulator"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploy on Render

### Option A: One-Click Blueprint (`render.yaml` — Node Web Service)
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New → Blueprint** and select your repository.
3. Render automatically detects `render.yaml`, starts `npm start`, and verifies `/api/health`.

### Option B: Render Static Site (Always-On Free Tier)
Because every route (`/`, `/about`, `/contact`, `/privacy`) maps directly to an `index.html` inside `public/`, you can also deploy as a **Render Static Site**:
- **Build Command:** *(leave blank)*
- **Publish Directory:** `public`

## Project Structure

```text
├── package.json
├── server.js               # Zero-dependency Node HTTP server (clean routes, gzip, /api/health, /api/contact)
├── render.yaml             # Render Blueprint configuration
├── .gitignore
├── README.md
└── public/
    ├── index.html          # Main simulator + ISO A0–A5 & DPI educational guide
    ├── about/index.html    # /about
    ├── contact/index.html  # /contact
    ├── privacy/index.html  # /privacy
    ├── 404.html
    ├── ads.txt
    ├── robots.txt
    ├── sitemap.xml
    ├── assets/favicon.svg
    ├── css/styles.css      # Pastel pink & yellow responsive theme
    └── js/
        ├── paper-data.js   # ISO 216 specs & effective DPI math engine
        ├── samples.js      # Built-in 72–300 DPI sample sheet generator
        ├── pdf-export.js   # Pure-JS true-size ISO PDF 1.4 exporter
        └── simulator.js    # Interactive drag/resize/loupe/export controller
```
