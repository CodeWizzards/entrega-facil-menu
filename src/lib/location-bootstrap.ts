import { UF_BY_NAME, UFS } from "./place";

// Starts the lookup in the initial HTML without rendering any preview.
export const locationBootstrap = `(() => {
  const names = ${JSON.stringify(UF_BY_NAME)};
  const states = ${JSON.stringify(UFS)};
  const uf = value => {
    const raw = String(value || '').trim();
    const upper = raw.toUpperCase().replace(/^BR-/, '');
    return states.includes(upper) ? upper : names[raw.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase()] || '';
  };
  const cookie = name => {
    try {
      const part = document.cookie.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
      return part ? decodeURIComponent(part.slice(name.length + 1)).trim() : '';
    } catch { return ''; }
  };
  const city = cookie('localCidade');
  const state = uf(cookie('localEstado'));
  if (!window.__ipPlaceRaw) {
    if (city && state) {
      window.__ipPlaceRaw = Promise.resolve({ city, region: state, country_code: 'BR' });
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      window.__ipPlaceRaw = fetch('https://get.geojs.io/v1/ip/geo.json', {
        signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .catch(() => null).finally(() => clearTimeout(timer));
    }
  }
})();`;
