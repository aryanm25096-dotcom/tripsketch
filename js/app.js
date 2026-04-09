/* ==========================================================================
   TripSketch — app.js
   Main controller: event handling, state, wiring everything together
   ========================================================================== */

(function () {
  'use strict';

  // ---------- State ----------
  let allPlaces     = [];   // full results from API
  let filteredPlaces= [];   // after filter/search/sort
  let currentPage   = 1;
  const PER_PAGE    = 12;

  let selectedCategory = 'interesting_places';
  let selectedCrowd    = 'any';
  let currentCity      = '';
  let currentGeo       = null;
  let mapInstance      = null;
  let mapMarkers       = [];
  let searchDebounceTimer = null;

  // ---------- Favorites (localStorage) ----------
  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('ts_favorites') || '[]'); }
    catch { return []; }
  }

  function saveFavorites(favs) {
    localStorage.setItem('ts_favorites', JSON.stringify(favs));
  }

  function getSavedIds() {
    return new Set(loadFavorites().map(f => f.xid));
  }

  function toggleFavorite(xid) {
    const favs    = loadFavorites();
    const place   = allPlaces.find(p => p.xid === xid);
    const idx     = favs.findIndex(f => f.xid === xid);

    if (idx === -1 && place) {
      favs.push(place);
      saveFavorites(favs);
      UI.showToast(`💛 Saved "${place.name}"`);
    } else {
      favs.splice(idx, 1);
      saveFavorites(favs);
      UI.showToast(`Removed from favorites`);
    }

    // Update heart button
    const btn = document.querySelector(`.card-heart[data-xid="${xid}"]`);
    if (btn) {
      const isSaved = idx === -1;
      btn.classList.toggle('saved', isSaved);
      btn.textContent = isSaved ? '❤️' : '🤍';
    }

    refreshPanels();
  }

  function refreshPanels() {
    const favs = loadFavorites();
    UI.renderFavorites(favs);
    UI.renderRoadmap(favs);
  }

  // ---------- Render current page ----------
  function renderCurrentPage() {
    const { items, totalPages } = Filter.paginate(filteredPlaces, currentPage, PER_PAGE);
    UI.renderCards(items, getSavedIds());
    UI.renderPagination(totalPages, currentPage, (page) => {
      currentPage = page;
      renderCurrentPage();
      window.scrollTo({ top: document.getElementById('resultsSection').offsetTop - 80, behavior: 'smooth' });
    });

    // Re-bind heart buttons after render
    bindHeartButtons();
  }

  function bindHeartButtons() {
    document.querySelectorAll('.card-heart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.xid);
      });
    });
  }

  // ---------- Apply filters & re-render ----------
  function applyAndRender() {
    const keyword = document.getElementById('keywordSearch').value;
    const sortBy  = document.getElementById('sortSelect').value;

    filteredPlaces = Filter.applyFilters(allPlaces, { keyword, crowd: selectedCrowd, sortBy });
    currentPage    = 1;

    UI.updateResultsHeader(currentCity, filteredPlaces.length);
    renderCurrentPage();
  }

  // ---------- Main search ----------
  async function doSearch(city) {
    if (!city || !city.trim()) {
      UI.showToast('Please enter a destination ✏️');
      return;
    }

    currentCity = city.trim();
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('searchPanel').style.marginBottom = '0';

    UI.showLoading(true);
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('cardsGrid').style.display    = 'none';
    document.getElementById('cardViewBtn').classList.add('active');
    document.getElementById('mapViewBtn').classList.remove('active');

    try {
      // Fetch places + weather in parallel
      const [result, weather] = await Promise.all([
        API.fetchPlaces(currentCity, selectedCategory),
        API.fetchWeather(currentCity),
      ]);

      allPlaces  = result.places;
      currentGeo = result.geo;

      UI.renderWeather(weather, currentCity);
      UI.showLoading(false);
      document.getElementById('cardsGrid').style.display = '';

      applyAndRender();

      // Scroll to results
      setTimeout(() => {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      UI.showLoading(false);
      document.getElementById('emptyState').style.display = 'block';
      document.getElementById('emptyState').querySelector('.empty-title').textContent = 'Something went wrong';
      document.getElementById('emptyState').querySelector('.empty-sub').textContent = err.message || 'Please try again';
      console.error(err);
    }
  }

  // ---------- Map view ----------
  function showMapView() {
    if (!allPlaces.length) return;

    document.getElementById('cardsGrid').style.display    = 'none';
    document.getElementById('mapContainer').style.display = 'block';
    document.getElementById('pagination').style.display   = 'none';

    const lat = currentGeo?.lat || filteredPlaces[0]?.lat || 20;
    const lon = currentGeo?.lon || filteredPlaces[0]?.lon || 78;

    if (!mapInstance) {
      mapInstance = L.map('map').setView([lat, lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);
    } else {
      mapInstance.setView([lat, lon], 13);
      mapMarkers.forEach(m => mapInstance.removeLayer(m));
      mapMarkers = [];
    }

    // HOF: map places to markers
    mapMarkers = filteredPlaces.map(place => {
      const marker = L.marker([place.lat, place.lon])
        .addTo(mapInstance)
        .bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 150px;">
            <strong style="font-family: 'Caveat', cursive; font-size: 1.1rem;">${place.name}</strong><br/>
            <span style="font-size: 0.75rem; color: #888;">${place.kinds?.split(',')[0]?.replace(/_/g,' ') || 'attraction'}</span><br/>
            <span style="font-size: 0.85rem;">⭐ ${place.rating}</span>
          </div>
        `);
      return marker;
    });

    setTimeout(() => mapInstance.invalidateSize(), 100);
  }

  function showCardView() {
    document.getElementById('cardsGrid').style.display    = '';
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('pagination').style.display   = '';
    renderCurrentPage();
  }

  // ---------- Share trip ----------
  function shareTrip() {
    const favs = loadFavorites();
    if (!favs.length) { UI.showToast('Save some places first!'); return; }

    const text = [
      '🗺️ My TripSketch',
      '',
      ...favs.map((p, i) => `${i + 1}. ${p.name} — ${p.kinds?.split(',')[0]?.replace(/_/g,' ') || 'attraction'} ⭐${p.rating}`),
      '',
      'Discovered on TripSketch ✏️'
    ].join('\n');

    navigator.clipboard.writeText(text)
      .then(() => UI.showToast('✅ Trip summary copied to clipboard!'))
      .catch(() => {
        // Fallback
        prompt('Copy your trip summary:', text);
      });
  }

  // ---------- Generate roadmap text ----------
  function generateRoadmap() {
    const favs = loadFavorites();
    if (!favs.length) return;

    const PLACES_PER_DAY = 3;
    const days = favs.reduce((acc, place, i) => {
      const dayIndex = Math.floor(i / PLACES_PER_DAY);
      if (!acc[dayIndex]) acc[dayIndex] = [];
      acc[dayIndex].push(place);
      return acc;
    }, []);

    const text = [
      '🛣️ TripSketch Itinerary',
      '',
      ...days.flatMap((dayPlaces, dayIdx) => [
        `📅 Day ${dayIdx + 1}`,
        ...dayPlaces.map((p, i) => `  ${i + 1}. ${p.name}`),
        ''
      ]),
      'Have an amazing trip! ✏️'
    ].join('\n');

    navigator.clipboard.writeText(text)
      .then(() => UI.showToast('📋 Itinerary copied!'))
      .catch(() => prompt('Your itinerary:', text));
  }

  // ---------- Panel helpers ----------
  function openPanel(panelId) {
    document.getElementById(panelId).classList.add('open');
    document.getElementById('panelOverlay').classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeAllPanels() {
    document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
    document.getElementById('panelOverlay').classList.remove('visible');
    document.body.style.overflow = '';
  }

  // ---------- Dark mode ----------
  function initTheme() {
    const saved = localStorage.getItem('ts_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ts_theme', next);
  }

  // ---------- Debounced search ----------
  function debounce(fn, delay) {
    return function (...args) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const debouncedFilter = debounce(applyAndRender, 350);

  // ---------- Chip helpers ----------
  function bindChipGroup(containerId, onSelect) {
    document.getElementById(containerId).addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll(`#${containerId} .chip`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      onSelect(chip.dataset.value);
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    refreshPanels();

    // Search button
    document.getElementById('searchBtn').addEventListener('click', () => {
      doSearch(document.getElementById('destinationInput').value);
    });

    // Enter key on input
    document.getElementById('destinationInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch(e.target.value);
    });

    // Surprise Me
    document.getElementById('surpriseBtn').addEventListener('click', () => {
      const dest = API.getSurpriseDestination();
      document.getElementById('destinationInput').value = dest;
      UI.showToast(`🎲 How about ${dest}?`);
      setTimeout(() => doSearch(dest), 600);
    });

    // Category chips
    bindChipGroup('categoryChips', (val) => {
      selectedCategory = val;
    });

    // Crowd chips
    bindChipGroup('crowdChips', (val) => {
      selectedCrowd = val;
      if (allPlaces.length) applyAndRender();
    });

    // Keyword search (debounced)
    document.getElementById('keywordSearch').addEventListener('input', debouncedFilter);

    // Sort
    document.getElementById('sortSelect').addEventListener('change', applyAndRender);

    // View toggle
    document.getElementById('cardViewBtn').addEventListener('click', () => {
      document.getElementById('cardViewBtn').classList.add('active');
      document.getElementById('mapViewBtn').classList.remove('active');
      showCardView();
    });

    document.getElementById('mapViewBtn').addEventListener('click', () => {
      document.getElementById('mapViewBtn').classList.add('active');
      document.getElementById('cardViewBtn').classList.remove('active');
      showMapView();
    });

    // Favorites panel
    document.getElementById('favToggle').addEventListener('click', () => {
      openPanel('favPanel');
    });

    document.getElementById('favClose').addEventListener('click', closeAllPanels);

    // Fav panel: remove item
    document.getElementById('favList').addEventListener('click', (e) => {
      const btn = e.target.closest('.fav-item-remove');
      if (!btn) return;
      toggleFavorite(btn.dataset.xid);
    });

    // Share button
    document.getElementById('shareBtn').addEventListener('click', shareTrip);

    // Roadmap panel
    document.getElementById('roadmapToggle').addEventListener('click', () => {
      openPanel('roadmapPanel');
    });

    document.getElementById('roadmapClose').addEventListener('click', closeAllPanels);

    document.getElementById('generateRoadmap').addEventListener('click', generateRoadmap);

    // Panel overlay click
    document.getElementById('panelOverlay').addEventListener('click', closeAllPanels);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  }

  // ---------- Start ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---------- Service Worker Registration ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('[Service Worker] Registered with scope:', registration.scope);
        })
        .catch(err => {
          console.warn('[Service Worker] Registration failed:', err);
        });
    });
  }

})();
