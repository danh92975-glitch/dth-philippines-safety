/* DTH Philippines Survival Dashboard — vanilla JS, no personal data leaves the device */
(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('dth_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('dth_' + k, JSON.stringify(v)); } catch { /* private mode */ } }
  };

  const S = {
    locations: [], emergency: {}, transport: {}, safety: {}, english: {}, tourist: [],
    checklist: {}, anchors: {}, map: null, markers: [], userMarker: null,
    filter: { anchor: 'wcc', radius: 30000, open: false, categories: new Set(), q: '' },
    englishCat: 'all', healthCat: 'all', touristCats: new Set(),
    weatherCache: null
  };

  const CATS = {
    accommodation:{icon:'🏠',label:'Accommodation',color:'#a78bfa'},
    workplace:{icon:'🏢',label:'Workplace',color:'#5eb8ff'},
    supermarket:{icon:'🛒',label:'Supermarkets',color:'#34d399'},
    convenience:{icon:'📱',label:'Convenience Stores',color:'#5eead4'},
    pharmacy:{icon:'💊',label:'Pharmacies',color:'#fbbf24'},
    hospital:{icon:'🏥',label:'Hospitals',color:'#ff6b6b'},
    clinic:{icon:'🩺',label:'Clinics',color:'#fb7185'},
    dental:{icon:'🦷',label:'Dental Clinics',color:'#f9a8d4'},
    police:{icon:'🚓',label:'Police Stations',color:'#60a5fa'},
    train:{icon:'🚇',label:'Train Stations',color:'#c084fc'},
    bus:{icon:'🚌',label:'Bus Stations',color:'#f472b6'},
    atm:{icon:'🏧',label:'ATMs',color:'#4ade80'},
    restaurant:{icon:'🍜',label:'Restaurants',color:'#fb923c'},
    cafe:{icon:'☕',label:'Cafes',color:'#d97706'},
    mall:{icon:'🏬',label:'Shopping Malls',color:'#38bdf8'},
    laundry:{icon:'🧺',label:'Laundry',color:'#e879f9'},
    attraction:{icon:'🏛',label:'Tourist Attractions',color:'#facc15'}
  };

  const haversine = (a, b) => {
    if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };
  const fmtKm = (km) => km == null ? 'Chưa xác minh' : km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`;
  const gmaps = (lat, lng, name) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name ? `${name} ${lat},${lng}` : `${lat},${lng}`)}`;
  const directions = (from, to) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
  const badge = (verified, date) => verified
    ? `<span class="badge verified" title="Nguồn: ${esc(date || '—')}">✓ Đã xác minh</span>`
    : `<span class="badge unverified">⚠ Cần xác minh</span>`;
  const srcLink = (url, label = 'Nguồn') => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : '<span class="muted tiny">Chưa có nguồn công khai</span>';

  function manilaNow() {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Manila', weekday:'short', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false}).formatToParts(new Date());
    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    return {weekday:p.weekday, hour:Number(p.hour)%24, minute:Number(p.minute), second:Number(p.second), total:Number(p.hour)%24*60+Number(p.minute)};
  }
  function openNow(hours) {
    if (!hours || !hours.trim()) return null;
    if (/24\s*\/\s*7/i.test(hours) || /open\s*24/i.test(hours)) return true;
    const dayMap = {Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:0};
    const now = manilaNow();
    const todayName = Object.keys(dayMap).find(k => dayMap[k] === now.weekday) || 'Mon';
    let anyKnown = false, result = false;
    for (const rule of hours.split(';')) {
      const r = rule.trim(); if (!r) continue;
      let days = [];
      const range = r.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:-(Mon|Tue|Wed|Thu|Fri|Sat|Sun))?/);
      if (range) {
        anyKnown = true;
        const a = dayMap[range[1]], b = range[2] ? dayMap[range[2]] : a;
        for (let i = a; ; i = (i+1)%7) { days.push(i); if (i === b) break; }
        if (!days.includes(now.weekday)) continue;
      }
      const times = [...r.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];
      if (times.length) {
        anyKnown = true;
        for (const t of times) {
          const from = +t[1]*60 + +t[2], to = +t[3]*60 + +t[4];
          if (from <= now.total && now.total < to) result = true;
        }
      } else if (/^Mo-Fr|^Sa|^Su/.test(r) && days.length) { anyKnown = true; }
    }
    return anyKnown ? result : null;
  }

  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  /* ---------- Routing ---------- */
  function show(view) {
    if (!$(`#view-${view}`)) view = 'dashboard';
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    if (location.hash !== '#/' + view) history.replaceState(null, '', '#/' + view);
    window.scrollTo({top:0, behavior:'instant' in window ? 'instant' : 'auto'});
    if (view === 'map' && S.map) setTimeout(() => S.map.invalidateSize(), 80);
  }
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { show(go.dataset.go); }
  });
  $('#nav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) show(b.dataset.view); });
  $('#top-sos').addEventListener('click', () => show('emergency'));
  window.addEventListener('hashchange', () => { const v = location.hash.replace('#/',''); if (v) show(v); });

  /* ---------- Clock, weather, offline ---------- */
  function tick() {
    const n = manilaNow();
    const hh = String(n.hour).padStart(2,'0'), mm = String(n.minute).padStart(2,'0'), ss = String(n.second).padStart(2,'0');
    $('#ph-clock').textContent = `${hh}:${mm}`;
    $('#dash-clock').textContent = `${hh}:${mm}:${ss}`;
    $('#dash-date').textContent = new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Manila',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  }
  const weatherText = {0:'Trời quang',1:'Chủ yếu quang',2:'Có mây',3:'Âm u',45:'Sương mù',48:'Sương mù',51:'Mưa phùn nhẹ',53:'Mưa phùn',55:'Mưa phùn dày',61:'Mưa nhỏ',63:'Mưa',65:'Mưa to',80:'Mưa rào',81:'Mưa rào vừa',82:'Mưa rào mạnh',95:'Sấm sét'};
  async function weather() {
    const box = $('#weather-box');
    const cached = LS.get('weather', null);
    const paint = (d, stale) => {
      $('#weather-temp').textContent = `${Math.round(d.temperature_2m)}°C`;
      $('#weather-desc').innerHTML = `${esc(weatherText[d.weather_code] || 'Xem bản tin thời tiết')} · độ ẩm ${d.relative_humidity_2m}% ${stale ? '· dữ liệu cũ' : ''}<br><span class="tiny">Nguồn: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · Manila 14.60°N 121.05°E</span>`;
    };
    if (cached && Date.now() - cached.at < 30*60*1000) paint(cached.data, false);
    if (!navigator.onLine) { if (!cached) $('#weather-desc').textContent = 'Offline — chưa có dữ liệu thời tiết đã lưu.'; return; }
    try {
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 7000);
      const u = 'https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,weather_code,relative_humidity_2m&timezone=Asia%2FManila';
      const r = await fetch(u, {signal:ctl.signal}); clearTimeout(timer);
      if (!r.ok) throw new Error('weather');
      const j = await r.json(); const data = j.current;
      LS.set('weather', {at:Date.now(), data}); paint(data, false);
    } catch {
      if (cached) paint(cached.data, true); else $('#weather-desc').textContent = 'Không tải được thời tiết — xem lại khi có mạng.';
    }
  }
  function netBanner() { $('#offline-banner').hidden = navigator.onLine; if (navigator.onLine) weather(); }
  window.addEventListener('online', netBanner); window.addEventListener('offline', netBanner);

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    const anchors = S.transport.anchors || {};
    $('#anchor-cards').innerHTML = Object.entries(anchors).map(([id,a]) => {
      const cat = CATS[a.category] || CATS.workplace;
      return `<article class="card anchor-card">
        <div class="anchor-top"><div><span class="tag" style="color:${cat.color}">${cat.icon} ${esc(a.short || id.toUpperCase())}</span><h3>${esc(a.name)}</h3><div class="addr">${esc(a.address || 'Chưa xác minh')}</div></div>${badge(a.verified, a.verifiedDate)}</div>
        <div class="kv"><span>Tọa độ</span><strong class="mono">${a.lat != null ? `${a.lat.toFixed(5)}, ${a.lng.toFixed(5)}` : 'Chưa xác minh'}</strong></div>
        <div class="anchor-actions">
          ${a.lat != null ? `<a class="btn primary sm" href="${gmaps(a.lat,a.lng,a.name)}" target="_blank" rel="noopener">Mở Google Maps</a>` : ''}
          ${id === 'wcc' ? `<button class="btn sm" data-go="transport" type="button">Đường đi →</button>` : `<button class="btn sm" data-go="map" type="button">Xem quanh đây</button>`}
        </div>
        <div class="tiny muted" style="margin-top:8px">${srcLink(a.source, 'Nguồn')} · ${esc(a.verifiedDate || '')}</div>
      </article>`;
    }).join('');

    const wcc = anchors.wcc || {};
    const near = S.locations.filter(p => p.lat != null).map(p => ({...p, km:haversine(wcc,p)})).filter(p => p.km != null).sort((a,b) => a.km-b.km).slice(0,6);
    $('#nearest-cards').innerHTML = near.map(p => {
      const c = CATS[p.category] || {};
      return `<article class="card mini-card"><span class="tag">${c.icon||'📍'} ${esc(c.label||p.category)}</span><strong>${esc(p.name)}</strong><small>${fmtKm(p.km)} từ WCC · ${openNow(p.hours)===true?'Đang mở':openNow(p.hours)===false?'Đang đóng':'Giờ chưa xác minh'}</small><button class="link-btn" data-place="${esc(p.id)}" type="button">Chi tiết →</button></article>`;
    }).join('') || '<p class="muted">Chưa có dữ liệu khoảng cách đã xác minh.</p>';

    const contacts = (S.emergency.contacts || []).slice(0,5);
    $('#dash-contacts').innerHTML = contacts.map(c => `<div class="contact-row"><span>${esc(c.name)}</span><a href="tel:${esc(String(c.number).replace(/[^\d+]/g,''))}">${esc(c.number)}</a></div>`).join('') || '<p class="muted">Chưa có số đã xác minh.</p>';

    const tasks = (S.checklist.dashboardTasks || []).map((t,i) => `<div class="task-row"><span class="task-num">${i+1}</span><div>${esc(t.text)}${t.view?` <button class="link-btn" data-go="${esc(t.view)}" type="button">Mở →</button>`:''}</div></div>`).join('');
    $('#dash-tasks').innerHTML = tasks;
    renderAlerts('#dash-alerts', true);
  }
  function renderAlerts(sel, compact = false) {
    const alerts = S.safety.alerts || [];
    $(sel).innerHTML = alerts.map(a => `<div class="alert ${a.level==='EMERGENCY'?'red':''}"><div><strong>[${esc(a.level)}] ${esc(a.title)}</strong> — ${esc(a.text)}${compact?'':`<div class="tiny muted" style="margin-top:4px">Phạm vi: ${esc(a.scope)} · Ngày: ${esc(a.date)} · ${srcLink(a.source,'Nguồn')}</div>`}</div></div>`).join('') || (compact ? '' : '<p class="muted">Không có cảnh báo nào được công bố kèm nguồn tại thời điểm cập nhật.</p>');
  }

  /* ---------- Safety ---------- */
  function renderSafety() {
    renderAlerts('#safety-alerts');
    const list = S.safety.scenarios || [];
    const draw = () => {
      const q = ($('#safety-search').value || '').toLowerCase().trim();
      $('#safety-list').innerHTML = list.filter(x => !q || (x.title+' '+x.titleVi+' '+(x.tags||[]).join(' ')).toLowerCase().includes(q)).map((x,i) => `
        <article class="safety-item" id="s-${i}">
          <button class="safety-head" type="button" aria-expanded="false">
            <div><h3>${esc(x.titleVi)} <span class="muted tiny">/ ${esc(x.title)}</span></h3><div class="sub">${esc(x.summary || '')}</div></div>
            <div style="display:flex;align-items:center;gap:8px"><span class="lvl ${esc((x.level||'low').toLowerCase())}">${esc(x.level)}</span><span class="arrow">⌄</span></div>
          </button>
          <div class="safety-body">
            <div class="safety-block"><h4>1. Dấu hiệu nhận biết</h4><ul>${(x.signs||[]).map(y=>`<li>${esc(y)}</li>`).join('')}</ul></div>
            <div class="safety-block"><h4>2. Tình huống thực tế</h4><p>${esc(x.scenario || '')}</p></div>
            <div class="safety-block"><h4>3. Phòng tránh trước</h4><ul>${(x.prevent||[]).map(y=>`<li>${esc(y)}</li>`).join('')}</ul></div>
            <div class="safety-block"><h4>4. Xử lý khi đang xảy ra</h4><ul>${(x.during||[]).map(y=>`<li>${esc(y)}</li>`).join('')}</ul></div>
            <div class="safety-block"><h4>5. Nơi liên hệ</h4><ul>${(x.contacts||[]).map(y=>`<li>${esc(y)}</li>`).join('')}</ul></div>
            <div class="tiny muted" style="margin-top:12px">Nguồn: ${srcLink(x.source, x.sourceLabel || 'Xem nguồn')} · cập nhật ${esc(x.verifiedDate || '—')}</div>
          </div>
        </article>`).join('');
      $$('#safety-list .safety-head').forEach(b => b.addEventListener('click', () => {
        const item = b.closest('.safety-item'); item.classList.toggle('open');
        b.setAttribute('aria-expanded', String(item.classList.contains('open')));
      }));
    };
    $('#safety-search').addEventListener('input', draw);
    draw();
  }

  /* ---------- Map ---------- */
  function markerIcon(p, anchor = false) {
    const c = CATS[p.category] || {};
    const icon = anchor ? '📍' : (c.icon || '📍');
    const color = anchor ? '#5eb8ff' : (c.color || '#94a3b8');
    return L.divIcon({className:'', html:`<div class="marker-dot" style="width:${anchor?34:26}px;height:${anchor?34:26}px;display:grid;place-items:center;background:${color};font-size:${anchor?17:13}px">${icon}</div>`, iconSize:[anchor?34:26,anchor?34:26], iconAnchor:[anchor?17:13,anchor?13:13]});
  }
  function placePanel(p) {
    const c = CATS[p.category] || {};
    const wcc = S.anchors.wcc || {}, fpt = S.anchors.fpt || {};
    const d1 = haversine(wcc,p), d2 = haversine(fpt,p);
    const status = openNow(p.hours);
    $('#place-panel').innerHTML = `<button class="close" type="button" aria-label="Đóng">×</button>
      <span class="tag" style="color:${c.color}">${c.icon||'📍'} ${esc(c.label||p.category)}</span>
      <h3>${esc(p.name)}</h3><div class="muted tiny">${esc(p.address || 'Địa chỉ chưa xác minh')}</div>
      <div style="margin-top:10px">${badge(p.verified, p.verifiedDate)}</div>
      <div class="kv"><span>Từ WCC</span><strong>${fmtKm(d1)}</strong></div>
      <div class="kv"><span>Từ FPT Software</span><strong>${fmtKm(d2)}</strong></div>
      <div class="kv"><span>Giờ mở cửa</span><strong>${esc(p.hours || 'Chưa xác minh')} ${status===true?'· đang mở':status===false?'· đang đóng':''}</strong></div>
      <div class="kv"><span>Điện thoại</span><strong>${p.phone?`<a href="tel:${esc(String(p.phone).replace(/[^\d+]/g,''))}">${esc(p.phone)}</a>`:'Chưa xác minh'}</strong></div>
      <div class="kv"><span>Giá / ghi chú</span><strong>${esc(p.price || p.notes || 'Chưa có')}</strong></div>
      ${p.rating?`<div class="kv"><span>Đánh giá</span><strong>${esc(p.rating)}</strong></div>`:''}
      <div class="panel-actions">
        ${p.lat!=null?`<a class="btn primary sm" href="${gmaps(p.lat,p.lng,p.name)}" target="_blank" rel="noopener">Google Maps</a>`:''}
        ${p.lat!=null?`<a class="btn sm" href="https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}" target="_blank" rel="noopener">OSM</a>`:''}
        ${p.website?`<a class="btn sm" href="${esc(p.website)}" target="_blank" rel="noopener">Website</a>`:''}
      </div>
      <div class="tiny muted" style="margin-top:10px">Nguồn: ${srcLink(p.source, 'Xem nguồn')} · xác minh ${esc(p.verifiedDate || '—')}</div>`;
    $('.close', $('#place-panel')).onclick = () => { $('#place-panel').hidden = true; };
    $('#place-panel').hidden = false;
  }
  function filteredPlaces() {
    const anchor = S.anchors[S.filter.anchor] || {};
    const q = S.filter.q.toLowerCase().trim();
    return S.locations.filter(p => {
      if (p.lat == null) return false;
      if (S.filter.categories.size && !S.filter.categories.has(p.category)) return false;
      if (q && !(p.name + ' ' + p.address + ' ' + (p.nameVi||'')).toLowerCase().includes(q)) return false;
      const d = haversine(anchor, p);
      if (d == null || d * 1000 > S.filter.radius) return false;
      const o = openNow(p.hours); if (S.filter.open && o !== true) return false;
      return true;
    }).map(p => ({...p, km:haversine(anchor,p)})).sort((a,b) => a.km - b.km);
  }
  function renderMapList() {
    const rows = filteredPlaces();
    $('#map-count').textContent = `${rows.length} địa điểm trong bán kính ${S.filter.radius/1000} km`;
    $('#map-list').innerHTML = rows.map(p => {
      const c = CATS[p.category] || {};
      return `<article class="card place-card"><div class="row"><span class="ico">${c.icon||'📍'}</span><span class="tag" style="color:${c.color}">${esc(c.label||p.category)}</span>${badge(p.verified,p.verifiedDate)}</div>
        <h3>${esc(p.name)}</h3><div class="addr">${esc(p.address || 'Địa chỉ chưa xác minh')}</div>
        <div class="tiny muted">${fmtKm(p.km)} từ ${esc(S.filter.anchor==='wcc'?'WCC':'FPT')} · ${p.hours ? esc(p.hours) : 'Giờ chưa xác minh'}</div>
        <div class="cta"><button class="btn sm" data-place="${esc(p.id)}" type="button">Chi tiết</button><a class="btn sm primary" href="${gmaps(p.lat,p.lng,p.name)}" target="_blank" rel="noopener">Maps ↗</a></div></article>`;
    }).join('') || '<p class="muted">Không có địa điểm phù hợp bộ lọc. Thử tăng bán kính.</p>';
    S.markers.forEach(m => m.remove()); S.markers = [];
    rows.forEach(p => {
      const m = L.marker([p.lat,p.lng], {icon:markerIcon(p)}).addTo(S.map);
      m.bindPopup(`<strong>${esc(p.name)}</strong><br>${esc(p.address||'')}<br>${fmtKm(p.km)} từ ${esc(S.filter.anchor==='wcc'?'WCC':'FPT')}<br>${srcLink(p.source,'Nguồn')}`);
      m.on('click', () => placePanel(p)); S.markers.push(m);
    });
  }
  function initMap() {
    S.anchors = S.transport.anchors || {};
    const a = S.anchors.wcc || {lat:14.6272,lng:121.0634}, b = S.anchors.fpt || {lat:14.5576,lng:121.0207};
    S.map = L.map('map', {zoomControl:true}).setView([(a.lat+b.lat)/2 - 0.015, (a.lng+b.lng)/2], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(S.map);
    ['wcc','fpt'].forEach(id => {
      const p = S.anchors[id]; if (!p || p.lat == null) return;
      L.marker([p.lat,p.lng], {icon:markerIcon(p,true), zIndexOffset:1000}).addTo(S.map)
        .bindPopup(`<strong>${esc(p.name)}</strong><br>${esc(p.address||'')}<br>${srcLink(p.source,'Nguồn')}`);
    });
    renderMapControls(); renderMapList();
    $('#map-search').addEventListener('input', e => { S.filter.q = e.target.value; renderMapList(); });
    $('#open-now').addEventListener('change', e => { S.filter.open = e.target.checked; renderMapList(); });
    $('#locate-btn').addEventListener('click', () => {
      if (!navigator.geolocation) return toast('Trình duyệt không hỗ trợ định vị.');
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        if (S.userMarker) S.userMarker.remove();
        S.userMarker = L.circleMarker([lat,lng], {radius:8,color:'#5eb8ff',fillOpacity:.8}).addTo(S.map).bindPopup('Vị trí của bạn (chỉ hiển thị trên máy này, không lưu hay gửi đi)');
        S.map.panTo([lat,lng]); toast('Đã xác định vị trí — không lưu lên server.');
      }, () => toast('Không cấp quyền định vị. Bạn vẫn dùng được bản đồ.'), {enableHighAccuracy:false, timeout:8000});
    });
  }
  function renderMapControls() {
    $('#anchor-chips').innerHTML = [['wcc','Gần WCC'],['fpt','Gần FPT Software']].map(([k,l]) => `<button class="chip ${S.filter.anchor===k?'active':''}" data-anchor="${k}" type="button">${l}</button>`).join('');
    $('#anchor-chips').onclick = e => { const b=e.target.closest('[data-anchor]'); if(!b)return; S.filter.anchor=b.dataset.anchor; renderMapControls(); renderMapList(); };
    $('#radius-chips').innerHTML = [500,1000,3000,5000,10000,30000].map(r => `<button class="chip ${S.filter.radius===r?'active':''}" data-radius="${r}" type="button">${r<1000?r+' m':r/1000+' km'}</button>`).join('');
    $('#radius-chips').onclick = e => { const b=e.target.closest('[data-radius]'); if(!b)return; S.filter.radius=+b.dataset.radius; renderMapControls(); renderMapList(); };
    $('#category-chips').innerHTML = Object.entries(CATS).map(([k,c]) => `<button class="chip ${S.filter.categories.has(k)?'active':''}" data-cat="${k}" type="button">${c.icon} ${c.label}</button>`).join('');
    $('#category-chips').onclick = e => { const b=e.target.closest('[data-cat]'); if(!b)return; const k=b.dataset.cat; S.filter.categories.has(k)?S.filter.categories.delete(k):S.filter.categories.add(k); renderMapControls(); renderMapList(); };
  }

  /* ---------- Transport ---------- */
  function renderTransport() {
    const t = S.transport;
    $('#transport-status').innerHTML = `<div class="notice">${esc(t.statusNote || 'Kiểm tra lại thông tin trước khi đi — giá vé và giờ tàu có thể thay đổi.')}</div>`;
    $('#route-map-link').href = directions((t.anchors?.wcc?.address || 'World Citi College, Aurora Blvd, Quezon City'), (t.anchors?.fpt?.address || 'Robinsons Summit Center, 6783 Ayala Avenue, Makati'));
    $('#route-steps').innerHTML = (t.steps || []).map(s => `<article class="step"><h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p>
      <div class="meta">${(s.meta||[]).map(m=>`<span class="tag">${esc(m)}</span>`).join('')}</div>
      ${s.source?`<div class="tiny muted" style="margin-top:7px">${srcLink(s.source,'Nguồn')} · ${esc(s.verifiedDate||'')}</div>`:''}</article>`).join('');
    const f = t.fares || {};
    $('#fare-table').innerHTML = `<div class="kv"><span>LRT-2 (Anonas → Cubao)</span><strong>${esc(f.lrt2 || 'Chưa xác minh')}</strong></div>
      <div class="kv"><span>MRT-3 (Cubao → Ayala)</span><strong>${esc(f.mrt3 || 'Chưa xác minh')}</strong></div>
      <div class="kv"><span>Giảm giá toàn hệ thống</span><strong>${esc(f.discount || 'Chưa xác minh')}</strong></div>
      <div class="kv"><span>Thẻ Beep (nếu cần)</span><strong>${esc(f.beepCard || 'Chưa xác minh')}</strong></div>
      <div class="kv"><span>Sinh viên Việt Nam</span><strong>${esc(f.foreignStudent || 'Không mặc định đủ điều kiện')}</strong></div>
      <div class="tiny muted" style="margin-top:9px">${srcLink(f.source,'Nguồn LRTA/DOTr')} · cập nhật ${esc(f.verifiedDate||'—')}</div>`;
    const calc = t.calculation || {};
    $('#fare-calc').innerHTML = `<div class="total-line"><span>1 chiều (LRT-2 + MRT-3)</span><strong class="mono">${esc(calc.oneWay || '—')}</strong></div>
      <div class="total-line"><span>Khứ hồi / ngày</span><strong class="mono">${esc(calc.daily || '—')}</strong></div>
      <div class="total-line"><span>40 ngày làm việc</span><strong class="mono">${esc(calc.total40 || '—')}</strong></div>
      <div class="total-line"><span>Quy đổi VNĐ</span><strong class="mono">${esc(calc.vnd || 'Tự nhập tỷ giá ở tab Checklist &amp; Budget')}</strong></div>
      ${calc.note?`<p class="tiny muted" style="margin-top:10px">${esc(calc.note)}</p>`:''}`;
    $('#transport-alternatives').innerHTML = (t.alternatives || []).map(a => `<article class="card"><span class="tag">${esc(a.mode)}</span><h3 style="margin:8px 0 4px;font-size:14px">${esc(a.title)}</h3><p>${esc(a.detail)}</p><div class="tiny muted">${srcLink(a.source,'Nguồn')}</div></article>`).join('');
    $('#transport-sources').innerHTML = (t.sources || []).map(s => `<div>· ${esc(s.label)}: ${srcLink(s.url, s.url)} <span class="tiny">(${esc(s.note||'')})</span></div>`).join('');
  }

  /* ---------- Shopping ---------- */
  const SHOP_CATS = ['supermarket','convenience','pharmacy','laundry','mall','atm','restaurant','cafe','mobile','hardware'];
  function renderShopping() {
    $('#shop-anchor-chips').innerHTML = [['wcc','Quanh WCC'],['fpt','Quanh FPT']].map(([k,l])=>`<button class="chip ${S.filter.anchor===k?'active':''}" data-shop="${k}" type="button">${l}</button>`).join('');
    $('#shop-anchor-chips').onclick = e => { const b=e.target.closest('[data-shop]'); if(!b)return; S.filter.anchor=b.dataset.shop; renderShopping(); };
    const anchor = S.anchors[S.filter.anchor] || {};
    const rows = S.locations.filter(p => SHOP_CATS.includes(p.category) && p.lat != null).map(p=>({...p,km:haversine(anchor,p)})).filter(p=>p.km<=5).sort((a,b)=>a.km-b.km);
    $('#shop-places').innerHTML = rows.map(p => {
      const c = CATS[p.category] || {icon:'🛍',label:p.category};
      return `<article class="card place-card"><div class="row"><span class="ico">${c.icon}</span><span class="tag">${esc(c.label)}</span>${badge(p.verified,p.verifiedDate)}</div>
        <h3>${esc(p.name)}</h3><div class="addr">${esc(p.address||'Chưa xác minh')}</div>
        <div class="tiny muted">${fmtKm(p.km)} · ${esc(p.hours||'Giờ chưa xác minh')}${p.price?` · ${esc(p.price)}`:''}</div>
        <div class="tiny muted">Cách đến: ${esc(p.transportNote||'Xem chỉ đường trong bản đồ')}</div>
        <div class="cta"><a class="btn sm primary" href="${gmaps(p.lat,p.lng,p.name)}" target="_blank" rel="noopener">Maps ↗</a>${srcLink(p.source,'Nguồn')}</div></article>`;
    }).join('') || '<p class="muted">Chưa có dữ liệu cửa hàng đã xác minh trong 5 km.</p>';
    const buy = S.checklist.buy || []; const checked = LS.get('buy', {});
    const all = buy.flatMap(g=>g.items);
    $('#buy-lists').innerHTML = buy.map(g => `<article class="card"><div class="group-head"><h3>${esc(g.title)}</h3><span class="badge subtle">${g.items.filter(i=>checked[i]).length}/${g.items.length}</span></div>
      <div class="progress"><i style="width:${g.items.length?100*g.items.filter(i=>checked[i]).length/g.items.length:0}%"></i></div>
      ${g.items.map(i=>`<label class="check-item ${checked[i]?'checked':''}"><input type="checkbox" data-buy="${esc(i)}" ${checked[i]?'checked':''}><label>${esc(i)}</label></label>`).join('')}</article>`).join('');
    $$('#buy-lists [data-buy]').forEach(cb => cb.addEventListener('change', () => { const v=LS.get('buy',{}); v[cb.dataset.buy]=cb.checked; LS.set('buy',v); renderShopping(); }));
    $('#reset-buy').onclick = () => { LS.set('buy',{}); renderShopping(); toast('Đã xóa danh sách mua sắm.'); };
  }

  /* ---------- Emergency ---------- */
  function renderEmergency() {
    $('#emergency-contacts').innerHTML = (S.emergency.contacts || []).map(c => {
      const num = String(c.number || '').replace(/[^\d+]/g,'');
      return `<article class="card contact-card ${c.critical?'critical':''}">
        <div class="name">${esc(c.name)}</div><div class="role">${esc(c.role)}</div>
        <div class="number">${esc(c.number)}</div>
        <div class="tiny">${badge(c.verified,c.verifiedDate)} ${esc(c.note||'')}</div>
        <div class="acts">${num?`<a class="btn danger sm" href="tel:${esc(num)}">📞 Gọi</a>`:''}
          ${c.mapQuery?`<a class="btn sm" href="${gmaps('','',c.mapQuery)}" target="_blank" rel="noopener">🗺 Bản đồ</a>`:''}
          ${c.website?srcLink(c.website,'Website'):''}</div>
        <div class="tiny muted" style="margin-top:6px">${srcLink(c.source,'Nguồn')} · ${esc(c.verifiedDate||'')}</div></article>`;
    }).join('');
    $('#emergency-procedures').innerHTML = (S.emergency.procedures || []).map(p => `<article class="card procedure"><div class="card-head"><h3>${esc(p.title)}</h3></div><ol>${(p.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="tiny muted" style="margin-top:8px">${srcLink(p.source,'Nguồn')}</div></article>`).join('');
  }

  /* ---------- English ---------- */
  function speak(text) {
    if (!('speechSynthesis' in window)) return toast('Trình duyệt không hỗ trợ phát âm thanh.');
    const u = new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=.85;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Đã copy câu tiếng Anh.'); }
    catch { const t=document.createElement('textarea'); t.value=text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast('Đã copy.'); }
  }
  function renderEnglish() {
    const cats = [...new Set((S.english.phrases||[]).map(p=>p.cat))];
    $('#english-chips').innerHTML = [['all','Tất cả'],...cats.map(c=>[c,c])].map(([k,l])=>`<button class="chip ${S.englishCat===k?'active':''}" data-ecat="${esc(k)}" type="button">${esc(l)}</button>`).join('');
    $('#english-chips').onclick = e => { const b=e.target.closest('[data-ecat]'); if(!b)return; S.englishCat=b.dataset.ecat; renderEnglish(); };
    const rows = (S.english.phrases||[]).filter(p=>S.englishCat==='all'||p.cat===S.englishCat);
    $('#english-list').innerHTML = rows.map(p=>`<article class="card phrase"><div class="en">${esc(p.en)}</div><div class="vi">${esc(p.vi)}</div><div class="pron">Phát âm: ${esc(p.pron)}</div>
      <div class="acts"><button type="button" data-speak="${esc(p.en)}">🔊 Nghe</button><button type="button" data-copy="${esc(p.en)}">⧉ Copy</button></div></article>`).join('');
    $$('#english-list [data-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.speak));
    $$('#english-list [data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy));
    $('#tagalog-list').innerHTML = (S.english.tagalog||[]).map(w=>`<article class="card word"><strong>${esc(w.word)}</strong><small>${esc(w.vi)} · ${esc(w.pron)}</small></article>`).join('');
  }

  /* ---------- Legal ---------- */
  function renderLegal() {
    $('#legal-sections').innerHTML = (S.legal?.sections || []).map(s=>`<article class="card"><div class="card-head"><h3>${esc(s.title)}</h3>${badge(s.verified,s.verifiedDate)}</div><ul style="padding-left:18px;color:#d7e2ed;font-size:13px;margin:0">${(s.items||[]).map(i=>`<li style="margin:5px 0">${esc(i)}</li>`).join('')}</ul><div class="tiny muted" style="margin-top:10px">${srcLink(s.source,'Nguồn')} · ${esc(s.verifiedDate||'')}</div></article>`).join('');
    const docs = S.checklist.docs || []; const checked = LS.get('docs',{});
    $('#doc-checklist').innerHTML = docs.map(d=>`<label class="check-item ${checked[d]?'checked':''}"><input type="checkbox" data-doc="${esc(d)}" ${checked[d]?'checked':''}><label>${esc(d)}</label></label>`).join('');
    $$('#doc-checklist [data-doc]').forEach(cb=>cb.addEventListener('change',()=>{const v=LS.get('docs',{});v[cb.dataset.doc]=cb.checked;LS.set('docs',v);renderLegal();}));
    $('#legal-sources').innerHTML = (S.legal?.sources||[]).map(s=>`<div>· ${esc(s.label)}: ${srcLink(s.url,s.url)}</div>`).join('');
  }

  /* ---------- Tourist ---------- */
  const TOURIST_FILTERS = {free:'Free',food:'Food',shopping:'Shopping',history:'Historical',parks:'Parks',night:'Night',weekend:'Weekend'};
  function renderTourist() {
    $('#tourist-chips').innerHTML = Object.entries(TOURIST_FILTERS).map(([k,l])=>`<button class="chip ${S.touristCats.has(k)?'active':''}" data-tf="${k}" type="button">${l}</button>`).join('') + '<button class="chip" id="tourist-reset" type="button">Xóa lọc</button>';
    $('#tourist-chips').onclick = e => {
      if(e.target.id==='tourist-reset'){S.touristCats.clear();renderTourist();return;}
      const b=e.target.closest('[data-tf]'); if(!b)return; const k=b.dataset.tf; S.touristCats.has(k)?S.touristCats.delete(k):S.touristCats.add(k); renderTourist();
    };
    const wcc = S.anchors.wcc || {};
    const rows = S.tourist.filter(p=>!S.touristCats.size || (p.tags||[]).some(t=>S.touristCats.has(t))).map(p=>({...p,km:haversine(wcc,p)}));
    $('#tourist-list').innerHTML = rows.map(p=>`<article class="card place-card">
      <div class="tourist-art ${esc(p.art||'')}"><span>${esc(p.icon||'🏛')}</span></div>
      <h3>${esc(p.name)}</h3><div class="addr">${esc(p.address||'')}</div>
      <div class="tiny muted">${fmtKm(p.km)} từ WCC · ${esc(p.duration||'')}</div>
      <div>${(p.tags||[]).map(t=>`<span class="tag">${esc(TOURIST_FILTERS[t]||t)}</span>`).join('')}</div>
      <div class="kv"><span>Giờ / trạng thái</span><strong>${esc(p.hours||'Chưa xác minh')}</strong></div>
      <div class="kv"><span>Chi phí</span><strong>${esc(p.cost||'Chưa xác minh')}</strong></div>
      <div class="tiny muted">${esc(p.note||'')}</div>
      <div class="cta">${p.lat!=null?`<a class="btn sm primary" href="${gmaps(p.lat,p.lng,p.name)}" target="_blank" rel="noopener">Maps ↗</a>`:''}${srcLink(p.source,'Nguồn')}</div></article>`).join('');
  }

  /* ---------- Health ---------- */
  const HEALTH_CATS = {all:'Tất cả',hospital:'Bệnh viện',emergency_hospital:'Cấp cứu',clinic:'Phòng khám',dental:'Nha khoa',pharmacy:'Nhà thuốc'};
  function renderHealth() {
    $('#health-chips').innerHTML = Object.entries(HEALTH_CATS).map(([k,l])=>`<button class="chip ${S.healthCat===k?'active':''}" data-hc="${k}" type="button">${l}</button>`).join('');
    $('#health-chips').onclick = e => { const b=e.target.closest('[data-hc]'); if(!b)return; S.healthCat=b.dataset.hc; renderHealth(); };
    const wcc = S.anchors.wcc || {};
    const rows = S.locations.filter(p=>['hospital','emergency_hospital','clinic','dental','pharmacy'].includes(p.category))
      .filter(p=>S.healthCat==='all'||p.category===S.healthCat)
      .map(p=>({...p,km:haversine(wcc,p)})).filter(p=>p.km!=null&&p.km<=30).sort((a,b)=>a.km-b.km);
    $('#health-list').innerHTML = rows.map(p=>`<article class="card place-card"><div class="row"><span class="ico">${CATS[p.category]?.icon||'🏥'}</span><span class="tag">${esc(HEALTH_CATS[p.category]||p.category)}</span>${badge(p.verified,p.verifiedDate)}</div>
      <h3>${esc(p.name)}</h3><div class="addr">${esc(p.address||'Chưa xác minh')}</div>
      <div class="tiny muted">${fmtKm(p.km)} từ WCC · ${esc(p.hours||'Giờ chưa xác minh')}</div>
      <div class="kv"><span>Điện thoại</span><strong>${p.phone?`<a href="tel:${esc(String(p.phone).replace(/[^\d+]/g,''))}">${esc(p.phone)}</a>`:'Chưa xác minh'}</strong></div>
      <div class="kv"><span>Cấp cứu</span><strong>${esc(p.emergency||'Chưa xác minh')}</strong></div>
      <div class="cta">${p.lat!=null?`<a class="btn sm primary" href="${gmaps(p.lat,p.lng,p.name)}" target="_blank" rel="noopener">Chỉ đường ↗</a>`:''}${srcLink(p.source,'Nguồn')}</div></article>`).join('') || '<p class="muted">Chưa có dữ liệu y tế đã xác minh trong 30 km.</p>';
  }

  /* ---------- Checklist & budget ---------- */
  function renderChecklist() {
    const groups = S.checklist.groups || []; const checked = LS.get('tasks',{});
    const all = groups.flatMap(g=>g.items);
    $('#checklist-groups').innerHTML = groups.map(g=>`<article class="card"><div class="group-head"><h3>${esc(g.title)}</h3><span class="badge subtle">${g.items.filter(i=>checked[i]).length}/${g.items.length}</span></div>
      <div class="progress"><i style="width:${g.items.length?100*g.items.filter(i=>checked[i]).length/g.items.length:0}%"></i></div>
      ${g.items.map(i=>`<label class="check-item ${checked[i]?'checked':''}"><input type="checkbox" data-task="${esc(i)}" ${checked[i]?'checked':''}><label>${esc(i)}</label></label>`).join('')}</article>`).join('');
    $$('#checklist-groups [data-task]').forEach(cb=>cb.addEventListener('change',()=>{const v=LS.get('tasks',{});v[cb.dataset.task]=cb.checked;LS.set('tasks',v);renderChecklist();}));

    const defaults = LS.get('budget',{rate:0,food:250,train:35,grab:200,shopping:1200,fun:1500,buffer:5000});
    const fields = [
      ['rate','Tỷ giá 1 PHP = ? VNĐ (tự nhập)'],['food','Tiền ăn / ngày (PHP)'],['train','Tiền tàu / ngày (PHP)'],
      ['grab','Grab / ngày (PHP)'],['shopping','Mua sắm / tuần (PHP)'],['fun','Vui chơi / tuần (PHP)'],['buffer','Dự phòng (PHP)']
    ];
    $('#budget-inputs').innerHTML = fields.map(([k,l])=>`<label class="field">${esc(l)}<input type="number" min="0" step="any" data-budget="${k}" value="${esc(defaults[k]??0)}" placeholder="${k==='rate'?'Tự nhập tỷ giá hiện hành':''}"></label>`).join('');
    const calcBudget = () => {
      const v = {...defaults};
      $$('#budget-inputs [data-budget]').forEach(i=>v[i.dataset.budget]=Math.max(0,Number(i.value)||0));
      LS.set('budget',v);
      const daily = v.food + v.train + v.grab, work = daily*40;
      const extras = (v.shopping + v.fun)*8 + v.buffer;
      const total = work + extras;
      $('#budget-summary').innerHTML = `<div class="total-line"><span>Chi phí hằng ngày</span><strong class="mono">${daily.toFixed(0)} PHP</strong></div>
        <div class="total-line"><span>40 ngày làm việc</span><strong class="mono">${work.toFixed(0)} PHP</strong></div>
        <div class="total-line"><span>Mua sắm + vui chơi (8 tuần) + dự phòng</span><strong class="mono">${extras.toFixed(0)} PHP</strong></div>
        <div class="total-line grand"><span>Tổng 8 tuần</span><strong class="mono">${total.toFixed(0)} PHP</strong></div>
        <div class="total-line"><span>Quy đổi VNĐ</span><strong class="mono">${v.rate?`${Math.round(total*v.rate).toLocaleString('vi-VN')} ₫`:'Chưa nhập tỷ giá'}</strong></div>
        <p class="tiny muted">Các số trên là ví dụ để bạn tự chỉnh, KHÔNG phải giá thị trường đã xác minh. Không lưu dữ liệu ngân hàng hay tài khoản cá nhân.</p>`;
    };
    $$('#budget-inputs input').forEach(i=>i.addEventListener('input',calcBudget));
    calcBudget();
  }

  /* ---------- Global place detail delegation ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-place]'); if (!b) return;
    const p = S.locations.find(x=>x.id===b.dataset.place); if (!p || p.lat == null) return;
    show('map');
    setTimeout(()=>{ placePanel(p); S.map.panTo([p.lat,p.lng]); S.map.invalidateSize(); },120);
  });

  /* ---------- Boot ---------- */
  async function loadJSON(name) {
    const r = await fetch(`assets/data/${name}.json`, {cache:'no-cache'});
    if (!r.ok) throw new Error(name); return r.json();
  }
  async function boot() {
    tick(); setInterval(tick,1000); netBanner();
    const names = ['locations','emergency','transport','safety','english','tourist','checklist','legal'];
    const results = await Promise.allSettled(names.map(loadJSON));
    const failed = results.filter(r=>r.status==='rejected');
    if (failed.length) { $('#load-error').hidden = false; console.warn('Dữ liệu chưa tải:', failed.map(f=>f.reason?.message)); }
    names.forEach((n,i)=>{ if(results[i].status==='fulfilled') {
      const v = results[i].value;
      S[n] = ((n === 'locations' || n === 'tourist') && !Array.isArray(v) && Array.isArray(v.places)) ? v.places : v;
    } });
    S.anchors = S.transport.anchors || {};
    const d = S.transport.dataDate || S.transport.verifiedDate || '—';
    $('#data-date').textContent = d; $('#footer-date').textContent = d;
    renderDashboard(); renderSafety(); renderTransport(); renderShopping(); renderEmergency(); renderEnglish(); renderLegal(); renderTourist(); renderHealth(); renderChecklist();
    if (window.L) initMap(); else $('#map-count').textContent = 'Không tải được Leaflet (cần Internet lần đầu).';
    const v = location.hash.replace('#/',''); if (v) show(v);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
    weather();
  }
  boot();
})();
