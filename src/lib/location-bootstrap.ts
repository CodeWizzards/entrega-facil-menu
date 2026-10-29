import { UF_BY_NAME, UFS } from "./place";

// Runs in the initial HTML. The shadow root is deliberately outside React's
// ownership, so showing a result before hydration cannot mismatch its markup.
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
  if (!customElements.get('ip-location-preview')) {
    customElements.define('ip-location-preview', class extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;
        const root = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = ':host{display:block;font:inherit;color:var(--foreground)}.preview{box-sizing:border-box;display:grid;gap:4px;padding:16px 18px;border:1px solid var(--border);border-radius:18px;background:var(--secondary)}span{font-size:11px;line-height:1.5;color:var(--muted-foreground)}strong{display:block;font-size:18px;line-height:1.4;font-weight:700;overflow-wrap:anywhere}strong:empty{display:none}';
        const label = document.createElement('span');
        label.textContent = 'Identificando sua região…';
        const value = document.createElement('strong');
        const preview = document.createElement('div');
        preview.className = 'preview';
        preview.append(label, value);
        root.append(style, preview);
        Promise.resolve(window.__ipPlaceRaw).then(data => {
          if (!this.isConnected) return;
          const region = uf(data && data.region);
          if (data && data.country_code === 'BR' && typeof data.city === 'string' && data.city.trim() && region) {
            label.textContent = 'Você está em';
            value.textContent = data.city.trim() + ', ' + region;
          } else {
            label.textContent = 'Informe sua cidade para continuar.';
          }
        });
      }
    });
  }
})();`;
