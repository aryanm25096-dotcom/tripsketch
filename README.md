# 🗺️ TripSketch

You know that feeling when you and your friends are planning a trip but every website just shows you the same crowded, overpriced places? Yeah. That's why I built this.

TripSketch helps you find **offbeat, budget-friendly spots** that actually match your vibe — and shows them in a way that feels like flipping through a travel sketchbook, not scrolling through a boring list.

---

## 😤 The Problem

Me and my friends plan trips a lot. And every time we search for places, we get the same results — the same hill stations, the same cafes, the same "top 10 places to visit" articles. We wanted something that finds **less crowded, more local, actually affordable** options.

So I built TripSketch. You tell it where you want to go and what kind of trip you're looking for, and it finds real places — not just the tourist traps.

---

## 🌐 APIs Used

**OpenTripMap API** — This is the main one. It's great for finding hidden gems, local landmarks, and offbeat places by location and category. Free to use.
→ https://opentripmap.io/docs

**Foursquare Places API** — Used to get richer details on each place — ratings, photos, price levels, and real tips from people who've actually been there. Also free.
→ https://developer.foursquare.com/docs

---

## ✨ What it does

- You fill out a quick form — where you're starting from, where you want to go, your budget, whether you're going solo or with friends, and how much crowd you can handle
- It fetches real places using the APIs above
- You can **search, filter, and sort** the results however you want
- Save your favorite spots so you don't lose them
- The whole thing looks like a hand-drawn travel journal — not a bootstrap template

### Features I'm building

- Trip vibe form to collect your preferences
- Place cards styled like polaroids / journal pages
- Search by name or keyword
- Filter by category (nature, food, culture, adventure) and crowd level
- Sort by rating, distance, or price
- Save favorites to localStorage so they stay even after you close the tab
- Dark mode because obviously
- Fully responsive — works on your phone too

### Bonus stuff (if I have time)
- Debounced search so it's not firing on every keystroke
- Pagination for when results are too many
- Weather preview at the destination

---

## 🛠️ Tech I'm using

Just the basics — no frameworks, no build tools, nothing fancy.

- **HTML + CSS + Vanilla JavaScript** — that's it
- **Fetch API** for calling OpenTripMap and Foursquare
- **Array HOFs** — `.filter()`, `.sort()`, `.map()`, `.find()` for all search/filter/sort logic (no for loops!)
- **localStorage** for saving favorites and dark mode preference
- **Caveat font** from Google Fonts — gives it that hand-drawn sketch feel

---

## 📁 How the code is organized

```
TripSketch/
├── index.html          # the main page
├── css/
│   └── style.css       # all styles + the doodle aesthetic
├── js/
│   ├── app.js          # main logic and event listeners
│   ├── api.js          # all API fetch functions
│   ├── filter.js       # search, filter, sort using HOFs
│   └── ui.js           # rendering cards and updating the DOM
├── assets/
│   └── icons/          # SVG icons for transport, categories etc
└── README.md
```

---

## 🚀 How to run it

No installs. No setup. Seriously.

1. Clone the repo
   ```bash
   git clone https://github.com/YOUR_USERNAME/tripsketch.git
   cd tripsketch
   ```

2. Add your API keys in `js/api.js`
   ```javascript
   const OPENTRIPMAP_KEY = 'your_key_here';
   const FOURSQUARE_KEY = 'your_key_here';
   ```
   Both are free — get them at opentripmap.io and developer.foursquare.com

3. Open `index.html` in your browser and you're good to go.
   (VS Code Live Server also works great)

---

## 📅 Project milestones

| | Milestone | Due |
|--|-----------|-----|
| ✅ | Setup + planning + this README | 23rd March |
| 🔲 | API integration + responsive UI | 1st April |
| 🔲 | Search, filter, sort, dark mode, favorites | 8th April |
| 🔲 | Final cleanup + deployment | 10th April |

---

# tripsketch
