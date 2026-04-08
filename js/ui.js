/* ==========================================================================
   TripSketch — ui.js
   All DOM rendering: cards, pagination, favorites, roadmap
   ========================================================================== */

const UI = (() => {
  'use strict';

  // ---------- Category emoji map ----------
  const CATEGORY_EMOJI = {
    natural:            '🌿',
    cultural:           '🏛️',
    foods:              '🍜',
    sport:              '⛺',
    interesting_places: '📍',
    architecture:       '🏰',
    historic:           '🏺',
    religion:           '🛕',
    beach:              '🏖️',
    waterfall:          '💧',
    mountain:           '🏔️',
    default:            '📍',
  };

  function getCategoryEmoji(kinds) {
    if (!kinds) return CATEGORY_EMOJI.default;
    const k = kinds.toLowerCase();
    return Object.entries(CATEGORY_EMOJI).find(([key]) => k.includes(key))?.[1] || CATEGORY_EMOJI.default;
  }

  function getCategoryLabel(kinds) {
    if (!kinds) return 'Attraction';
    const first = (kinds || '').split(',')[0]?.trim() || '';
    return first.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Attraction';
  }

  // ---------- Render stars ----------
  function renderStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      '★'.repeat(full) +
      (half ? '½' : '') +
      '☆'.repeat(empty)
    );
  }

  // ---------- Render crowd badge ----------
  function renderCrowdBadge(crowd) {
    const labels = { low: '🧘 Quiet', medium: '👫 Moderate', high: '🎉 Lively' };
    const label  = labels[crowd] || '📍 Unknown';
    return `<span class="card-crowd crowd-${crowd || 'low'}">${label}</span>`;
  }

  // ---------- Render single place card ----------
  function renderCard(place, isSaved = false) {
    const emoji    = getCategoryEmoji(place.kinds);
    const catLabel = getCategoryLabel(place.kinds);
    const heartCls = isSaved ? 'card-heart saved' : 'card-heart';
    const heartIcon= isSaved ? '❤️' : '🤍';

    // Use a data-emoji attribute + a clean onerror that swaps the img for a placeholder div
    const imgHTML = place.photo
      ? `<img class="card-img" src="${place.photo}" alt="${place.name}" loading="lazy" data-emoji="${emoji}" onerror="var w=this.parentElement;var d=document.createElement('div');d.className='card-img-placeholder';d.textContent=this.dataset.emoji;w.replaceChild(d,this)" />`
      : `<div class="card-img-placeholder">${emoji}</div>`;

    const descHTML = place.desc
      ? `<p class="card-desc">${place.desc.slice(0, 120)}${place.desc.length > 120 ? '…' : ''}</p>`
      : '';

    return `
      <div class="place-card" data-xid="${place.xid}" data-lat="${place.lat}" data-lon="${place.lon}">
        <div class="card-img-wrap">
          ${imgHTML}
          <span class="card-category">${catLabel}</span>
          <button class="${heartCls}" data-xid="${place.xid}" title="Save place" aria-label="Save ${place.name}">${heartIcon}</button>
        </div>
        <div class="card-body">
          <h3 class="card-name">${place.name}</h3>
          <div class="card-meta">
            <span class="card-rating">
              <span class="star">${renderStars(place.rating)}</span>
              ${place.rating}
            </span>
            ${renderCrowdBadge(place.crowd)}
          </div>
          ${descHTML}
        </div>
      </div>
    `;
  }

  // ---------- Render cards grid ----------
  function renderCards(places, savedIds = new Set()) {
    const grid = document.getElementById('cardsGrid');
    const empty = document.getElementById('emptyState');

    if (!places.length) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    // HOF: map each place to its card HTML, then join
    grid.innerHTML = places.map(p => renderCard(p, savedIds.has(p.xid))).join('');
  }

  // ---------- Render pagination ----------
  function renderPagination(totalPages, currentPage, onPageChange) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage   = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

    // HOF: Array.from + map to build page buttons
    const pageNums = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';

    container.innerHTML = `
      <button class="page-btn" data-page="${currentPage - 1}" ${prevDisabled}>‹</button>
      ${pageNums.map(n => `
        <button class="page-btn ${n === currentPage ? 'active' : ''}" data-page="${n}">${n}</button>
      `).join('')}
      <button class="page-btn" data-page="${currentPage + 1}" ${nextDisabled}>›</button>
    `;

    container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
    });
  }

  // ---------- Render favorites panel ----------
  function renderFavorites(favorites) {
    const list     = document.getElementById('favList');
    const count    = document.getElementById('favCount');
    const countEl  = count;

    if (!favorites.length) {
      list.innerHTML = `
        <div class="fav-empty">
          <p>💛 No saved places yet</p>
          <p class="fav-empty-sub">Tap the heart on any card to save it</p>
        </div>
      `;
      countEl.classList.remove('visible');
      countEl.textContent = '0';
      return;
    }

    countEl.textContent = favorites.length;
    countEl.classList.add('visible');

    list.innerHTML = favorites.map(p => `
      <div class="fav-item" data-xid="${p.xid}">
        <span class="fav-item-emoji">${getCategoryEmoji(p.kinds)}</span>
        <div class="fav-item-info">
          <p class="fav-item-name">${p.name}</p>
          <p class="fav-item-cat">${getCategoryLabel(p.kinds)}</p>
        </div>
        <button class="fav-item-remove" data-xid="${p.xid}" title="Remove">✕</button>
      </div>
    `).join('');
  }

  // ---------- Render roadmap panel ----------
  function renderRoadmap(favorites) {
    const body   = document.getElementById('roadmapBody');
    const footer = document.getElementById('roadmapFooter');

    if (!favorites.length) {
      body.innerHTML = '<p class="roadmap-empty">Save places first, then build your roadmap here.</p>';
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'block';

    // Distribute into days (3 places per day) using HOF: reduce
    const PLACES_PER_DAY = 3;
    const days = favorites.reduce((acc, place, i) => {
      const dayIndex = Math.floor(i / PLACES_PER_DAY);
      if (!acc[dayIndex]) acc[dayIndex] = [];
      acc[dayIndex].push(place);
      return acc;
    }, []);

    body.innerHTML = days.map((dayPlaces, dayIdx) => `
      <div class="roadmap-day">
        <p class="roadmap-day-title">📅 Day ${dayIdx + 1}</p>
        ${dayPlaces.map((p, stopIdx) => `
          <div class="roadmap-stop">
            <span class="roadmap-stop-num">${stopIdx + 1}</span>
            <div>
              <p class="roadmap-stop-name">${p.name}</p>
              <p class="roadmap-stop-cat">${getCategoryLabel(p.kinds)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  // ---------- Weather widget ----------
  function renderWeather(weather, city) {
    const widget = document.getElementById('weatherWidget');
    if (!weather) { widget.style.display = 'none'; return; }
    widget.style.display = 'block';
    document.getElementById('weatherIcon').textContent = weather.icon;
    document.getElementById('weatherCity').textContent = city;
    document.getElementById('weatherTemp').textContent = weather.temp;
    document.getElementById('weatherDesc').textContent = weather.desc;
  }

  // ---------- Loading state ----------
  function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
    document.getElementById('cardsGrid').style.display   = show ? 'none' : '';
    document.getElementById('pagination').style.display  = show ? 'none' : '';
  }

  // ---------- Results header ----------
  function updateResultsHeader(city, count) {
    document.getElementById('resultsTitle').innerHTML = `Places in <em>${city}</em>`;
    document.getElementById('resultsCount').textContent = `${count} spot${count !== 1 ? 's' : ''} found`;
  }

  // ---------- Toast ----------
  function showToast(message, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), duration);
  }

  // ---------- Public ----------
  return {
    renderCards,
    renderPagination,
    renderFavorites,
    renderRoadmap,
    renderWeather,
    showLoading,
    updateResultsHeader,
    showToast,
    getCategoryEmoji,
  };

})();
