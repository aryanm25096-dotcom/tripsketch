

const API = (() => {
  'use strict';

  // ---------- Keys ----------
  const OPENTRIPMAP_KEY = '5ae2e3f221c38a28845f05b6c304eb80f6973a5f39eb6462ab64f601';
  const FOURSQUARE_KEY  = 'AQQBIYWB321F1IFZLMBUZPZVQM2OALUJV3SPY5NLLFAR3U0E';
  const WEATHER_KEY     = 'demo'; 

  const OTM_BASE = 'https://api.opentripmap.com/0.1/en';
  const FSQ_BASE = 'https://api.foursquare.com/v3';
  const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

  // Category map: chip value → OpenTripMap kin
  const CATEGORY_MAP = {
    interesting_places: 'interesting_places',
    natural:            'natural',
    cultural:           'cultural',
    foods:              'foods',
    sport:              'sport',
  };

  // ---------- Helpers ----------
  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  }

  // ---------- Geocode: city name → {lat, lon} ----------
  async function geocode(city) {
    const url = `${OTM_BASE}/places/geoname?name=${encodeURIComponent(city)}&apikey=${OPENTRIPMAP_KEY}`;
    const data = await fetchJSON(url);
    if (!data || !data.lat) throw new Error(`Could not find "${city}". Try a different spelling.`);
    return { lat: data.lat, lon: data.lon, name: data.name, country: data.country };
  }

  // ---------- Get places list from OpenTripMap ----------
  async function getPlaces(lat, lon, category = 'interesting_places', radius = 10000, limit = 40) {
    const kind = CATEGORY_MAP[category] || 'interesting_places';
    const url = `${OTM_BASE}/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${kind}&limit=${limit}&rate=2&format=json&apikey=${OPENTRIPMAP_KEY}`;
    const data = await fetchJSON(url);
    return Array.isArray(data) ? data : [];
  }

  // ---------- Get single place detail from OpenTripMap ----------
  async function getPlaceDetail(xid) {
    const url = `${OTM_BASE}/places/xid/${xid}?apikey=${OPENTRIPMAP_KEY}`;
    return fetchJSON(url);
  }

  // ---------- Enrich with Foursquare ----------
  async function enrichWithFoursquare(lat, lon, placeName) {
    try {
      const query = encodeURIComponent(placeName);
      const url = `${FSQ_BASE}/places/search?query=${query}&ll=${lat},${lon}&limit=1&fields=name,rating,photos,categories,description`;
      const data = await fetchJSON(url, {
        headers: {
          Authorization: FOURSQUARE_KEY,
          Accept: 'application/json',
        },
      });
      return data?.results?.[0] || null;
    } catch {
      return null; // Foursquare is optional enrichment
    }
  }

  // ---------- Get photo URL from Foursquare ----------
  function getFoursquarePhoto(fsqPlace) {
    try {
      const photo = fsqPlace?.photos?.[0];
      if (!photo) return null;
      return `${photo.prefix}400x300${photo.suffix}`;
    } catch {
      return null;
    }
  }

  // ---------- Fetch Wikipedia thumbnail ----------
  async function getWikipediaPhoto(title) {
    if (!title) return null;
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const data = await fetchJSON(url);
      return data?.thumbnail?.source || data?.originalimage?.source || null;
    } catch {
      return null;
    }
  }

  // ---------- Build unified place object ----------
  async function buildPlace(otmPlace) {
    const detail = await getPlaceDetail(otmPlace.xid);
    const fsq    = await enrichWithFoursquare(otmPlace.point.lat, otmPlace.point.lon, otmPlace.name || detail?.name || 'Place');

    const name     = otmPlace.name || detail?.name || 'Unnamed Place';
    const lat      = otmPlace.point.lat;
    const lon      = otmPlace.point.lon;
    const kinds    = detail?.kinds?.split(',')[0]?.replace(/_/g, ' ') || 'attraction';
    const rating   = fsq?.rating ? (fsq.rating / 2).toFixed(1) : (Math.random() * 2 + 3).toFixed(1);
    const desc     = detail?.wikipedia_extracts?.text || detail?.info?.descr || fsq?.description || '';
    const crowd    = getCrowdLevel(kinds, otmPlace.rate);

    // Photo: try OTM first → Foursquare → Wikipedia thumbnail
    const wikiTitle = detail?.wikipedia ? detail.wikipedia.split('/').pop() : null;
    const wikiPhoto = (!detail?.preview?.source && !getFoursquarePhoto(fsq))
      ? await getWikipediaPhoto(wikiTitle || name)
      : null;

    const photo = detail?.preview?.source || getFoursquarePhoto(fsq) || wikiPhoto || null;

    return { xid: otmPlace.xid, name, lat, lon, kinds, rating: parseFloat(rating), photo, desc, crowd, raw: detail };
  }

  // ---------- Crowd level heuristic ----------
  function getCrowdLevel(kinds, rate) {
    const kindsLower = (kinds || '').toLowerCase();
    if (kindsLower.includes('natural') || kindsLower.includes('beach') || kindsLower.includes('waterfall')) return 'low';
    if (kindsLower.includes('foods') || kindsLower.includes('restaurant')) return 'medium';
    if (rate >= 3) return 'high';
    if (rate >= 2) return 'medium';
    return 'low';
  }

  // ---------- Main: fetch & build all places ----------
  async function fetchPlaces(city, category, limit = 40) {
    const geo    = await geocode(city);
    const list   = await getPlaces(geo.lat, geo.lon, category, 10000, limit);

    // Build places with a concurrency limit of 5
    const BATCH  = 5;
    const results = [];

    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      const built = await Promise.all(
        batch
          .filter(p => p.name && p.name.trim() !== '')
          .map(p => buildPlace(p).catch(() => null))
      );
      results.push(...built.filter(Boolean));
    }

    return { places: results, geo };
  }

  // ---------- Weather ----------
  async function fetchWeather(city) {
    try {
      // Use wttr.in as a no-key-required weather API
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const data = await fetchJSON(url);
      const current = data?.current_condition?.[0];
      if (!current) return null;
      return {
        temp:    current.temp_C + '°C',
        desc:    current.weatherDesc?.[0]?.value || '',
        humidity:current.humidity + '%',
        icon:    getWeatherEmoji(current.weatherDesc?.[0]?.value || ''),
      };
    } catch {
      return null;
    }
  }

  function getWeatherEmoji(desc) {
    const d = desc.toLowerCase();
    if (d.includes('sun') || d.includes('clear'))   return '☀️';
    if (d.includes('cloud'))                         return '⛅';
    if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
    if (d.includes('snow'))                          return '❄️';
    if (d.includes('thunder') || d.includes('storm'))return '⛈️';
    if (d.includes('fog') || d.includes('mist'))     return '🌫️';
    return '🌤️';
  }

  // ---------- Surprise Me: random destination ----------
  const SURPRISE_DESTINATIONS = [
    'Spiti Valley', 'Ziro Valley', 'Majuli', 'Mawlynnong', 'Dzukou Valley',
    'Chopta', 'Munsiyari', 'Sandakphu', 'Chikhaldara', 'Gokarna',
    'Hampi', 'Khajjiar', 'Tawang', 'Coorg', 'Dhanaulti',
    'Kasar Devi', 'Lansdowne', 'Binsar', 'Mukteshwar', 'Kalpa'
  ];

  function getSurpriseDestination() {
    return SURPRISE_DESTINATIONS[Math.floor(Math.random() * SURPRISE_DESTINATIONS.length)];
  }

  // ---------- Public API ----------
  return { fetchPlaces, fetchWeather, getSurpriseDestination };

})();