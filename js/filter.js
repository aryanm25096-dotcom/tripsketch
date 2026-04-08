/* ==========================================================================
   TripSketch — filter.js
   All search / filter / sort using Array HOFs only (no for/while loops)
   ========================================================================== */

const Filter = (() => {
  'use strict';

  // ---------- Search by keyword (HOF: filter) ----------
  function searchPlaces(places, keyword) {
    if (!keyword || keyword.trim() === '') return places;
    const kw = keyword.toLowerCase().trim();
    return places.filter(p =>
      (p.name  || '').toLowerCase().includes(kw) ||
      (p.kinds || '').toLowerCase().includes(kw) ||
      (p.desc  || '').toLowerCase().includes(kw)
    );
  }

  // ---------- Filter by crowd level (HOF: filter) ----------
  function filterByCrowd(places, crowd) {
    if (!crowd || crowd === 'any') return places;
    return places.filter(p => p.crowd === crowd);
  }

  // ---------- Sort (HOF: sort with comparator) ----------
  function sortPlaces(places, sortBy) {
    // Always return a new array — don't mutate
    const sorted = [...places];

    const comparators = {
      'rating-desc': (a, b) => b.rating - a.rating,
      'rating-asc':  (a, b) => a.rating - b.rating,
      'name-asc':    (a, b) => a.name.localeCompare(b.name),
      'name-desc':   (a, b) => b.name.localeCompare(a.name),
      'default':     (a, b) => 0,
    };

    const comparator = comparators[sortBy] || comparators['default'];
    return sorted.sort(comparator);
  }

  // ---------- Apply all filters together ----------
  function applyFilters(places, { keyword = '', crowd = 'any', sortBy = 'default' } = {}) {
    return sortPlaces(
      filterByCrowd(
        searchPlaces(places, keyword),
        crowd
      ),
      sortBy
    );
  }

  // ---------- Paginate (HOF: slice via map/reduce) ----------
  function paginate(places, page, perPage = 12) {
    const start = (page - 1) * perPage;
    const end   = start + perPage;
    return {
      items:      places.slice(start, end),
      totalPages: Math.ceil(places.length / perPage),
      total:      places.length,
      page,
    };
  }

  // ---------- Get unique categories from results (HOF: reduce) ----------
  function getCategories(places) {
    return places.reduce((acc, p) => {
      const cat = p.kinds?.split(',')[0]?.trim();
      if (cat && !acc.includes(cat)) acc.push(cat);
      return acc;
    }, []);
  }

  // ---------- Public ----------
  return { searchPlaces, filterByCrowd, sortPlaces, applyFilters, paginate, getCategories };

})();
