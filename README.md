# 🗺️ TripSketch

You know that feeling when you and your friends are planning a trip but every website just shows you the same crowded, overpriced places? Yeah. That's why I built this.

TripSketch helps you find **offbeat, budget-friendly spots** that actually match your vibe — and shows them in a way that feels like flipping through a travel sketchbook, not scrolling through a boring list.

🔗 **Live demo:** [aryanm25096-dotcom.github.io/tripsketch](https://aryanm25096-dotcom.github.io/tripsketch)

---

## 😤 The Problem

Me and my friends plan trips a lot. And every time we search for places, we get the same results — the same hill stations, the same cafes, the same "top 10 places to visit" articles. We wanted something that finds **less crowded, more local, actually affordable** options.

So I built TripSketch. You tell it where you want to go and what kind of trip you're looking for, and it finds real places — not just the tourist traps.

---

## 🌐 APIs Used

**OpenTripMap API** — Main data source. Finds hidden gems, local landmarks, and offbeat places by location and category.  
→ https://opentripmap.io/docs

**Foursquare Places API** — Enriches results with ratings, photos, and descriptions.  
→ https://developer.foursquare.com

**wttr.in** — No-key weather API. Shows current conditions at your destination.  
→ https://wttr.in

**Wikipedia REST API** — Fallback photo source when other APIs don't have an image.  
→ https://en.wikipedia.org/api/rest_v1

**Leaflet.js + OpenStreetMap** — Interactive map view with place markers.  
→ https://leafletjs.com

---

## ✨ Features

- **Cinematic landing page** — Scroll-driven frame animation (41 PNG frames, Studio Ghibli-style)
- **Destination search** — Enter any city worldwide; fetches real places via OpenTripMap
- **Category vibes** — Filter by All, Nature, Culture, Food, Adventure
- **Crowd filter** — Quiet / Moderate / Lively, determined by place type heuristics
- **Keyword search** — Debounced live filtering across name, category, description (Array HOFs only)
- **Sort** — By rating (high/low) or name (A–Z / Z–A)
- **Polaroid cards** — Place cards styled as a travel journal with tape effect
- **Image fallback chain** — OTM preview → Foursquare photo → Wikipedia thumbnail → emoji placeholder
- **Weather widget** — Real-time temperature + condition at searched destination
- **Map view** — Toggle to Leaflet map with clickable place markers
- **Favorites** — Save/unsave places; persists across sessions via localStorage
- **Trip Roadmap** — Auto-organises saved places into a day-by-day itinerary
- **Share Trip** — Copies a formatted trip summary to clipboard
- **Dark mode** — Full light/dark toggle, persists via localStorage
- **Surprise Me** — Picks a random offbeat Indian destination and searches it
- **Pagination** — 12 results per page
- **Responsive** — Works on mobile, tablet, and desktop
- **Throttling & Debouncing** — Optimized event listeners for scrolling and searching
- **Progressive Web App (PWA)** — Offline caching support and installability


## 🛠️ Tech Stack

No frameworks. No build tools. Nothing fancy.

| Layer | Tech |
|-------|------|
| Structure | HTML5 |
| Styling | Vanilla CSS (custom properties, CSS Grid, Flexbox) |
| Logic | Vanilla JavaScript (ES6+, IIFEs, Array HOFs) |
| Maps | Leaflet.js |
| Fonts | Caveat, Inter, Playfair Display (Google Fonts) |
| Storage | localStorage |
| Data | OpenTripMap, Foursquare, wttr.in, Wikipedia, OpenStreetMap |

**Constraint:** All search, filter, and sort logic uses only `.filter()`, `.sort()`, `.map()`, `.reduce()` — no `for` or `while` loops.

---

## 📁 Project Structure

```
tripsketch/
├── index.html          # Landing + app (SPA — single HTML file)
├── css/
│   ├── landing.css     # Cinematic landing page styles
│   └── explore.css     # App styles: journal/cream aesthetic + dark mode
├── js/
│   ├── landing.js      # Scroll + canvas frame animation engine
│   ├── api.js          # Fetch wrappers: OpenTripMap, Foursquare, wttr.in, Wikipedia
│   ├── filter.js       # Search / filter / sort using Array HOFs only
│   ├── ui.js           # DOM rendering: cards, pagination, panels, toast
│   └── app.js          # Main controller: state, event listeners, map, favorites
├── frames/             # 41 PNG animation frames (ezgif-frame-001.png … 041.png)
└── README.md
```

---

## 🚀 Running Locally

No installs. No setup.

```bash
git clone https://github.com/aryanm25096-dotcom/tripsketch.git
cd tripsketch
```

Open `index.html` in your browser — or use VS Code's **Live Server** extension for best results.

> The API keys in `api.js` are public demo keys included for convenience. Both OpenTripMap and Foursquare free tiers are sufficient for local development.

---

## 🌐 Deployment

Deployed via **GitHub Pages** directly from the `main` branch (no build step needed).

A `.nojekyll` file is included at the root so GitHub doesn't run Jekyll preprocessing, which would otherwise ignore the `frames/` directory (filenames with underscores).

To deploy your own fork:
1. Push to GitHub
2. Go to **Settings → Pages → Source → Deploy from branch → main / root**
3. Wait ~60 seconds → your site is live

---

## 📅 Milestones

| | Milestone | Status |
|--|-----------|--------|
| ✅ | Setup + planning + README | Done |
| ✅ | API integration (OpenTripMap + Foursquare + wttr.in) | Done |
| ✅ | Cinematic landing page with 41-frame scroll animation | Done |
| ✅ | Place cards, search, filter, sort (HOFs only) | Done |
| ✅ | Favorites, dark mode, Surprise Me, Map view | Done |
| ✅ | Trip Roadmap, Share to clipboard, Weather widget | Done |
| ✅ | Bug fixes, mobile responsive polish | Done |
| ✅ | Milestone 4: PWA, Throttling, and Final Deployment | Done |
