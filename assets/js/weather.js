// 날씨·지진 탭 — Open-Meteo(JMA 모델) 날씨/지오코딩 + P2P지진정보 연동, 규칙 기반 챗봇 (AI 미사용)

const WEATHER_REGIONS = [
  { id:'tokyo',     name:'도쿄',           aliases:['도쿄','동경','tokyo'],              lat:35.6895, lon:139.6917 },
  { id:'osaka',     name:'오사카',         aliases:['오사카','osaka'],                   lat:34.6937, lon:135.5023 },
  { id:'kyoto',     name:'교토',           aliases:['교토','kyoto'],                     lat:35.0116, lon:135.7681 },
  { id:'fukuoka',   name:'후쿠오카',       aliases:['후쿠오카','fukuoka'],               lat:33.5904, lon:130.4017 },
  { id:'sapporo',   name:'삿포로',         aliases:['삿포로','sapporo'],                 lat:43.0618, lon:141.3545 },
  { id:'naha',      name:'오키나와(나하)', aliases:['오키나와','나하','okinawa','naha'], lat:26.2124, lon:127.6809 },
  { id:'nagoya',    name:'나고야',         aliases:['나고야','nagoya'],                  lat:35.1815, lon:136.9066 },
  { id:'hiroshima', name:'히로시마',       aliases:['히로시마','hiroshima'],             lat:34.3853, lon:132.4553 }
];

const WEATHER_CODE_MAP = {
  0:{label:'맑음',icon:'☀️'}, 1:{label:'대체로 맑음',icon:'🌤️'}, 2:{label:'부분적으로 흐림',icon:'⛅'}, 3:{label:'흐림',icon:'☁️'},
  45:{label:'안개',icon:'🌫️'}, 48:{label:'서리 안개',icon:'🌫️'},
  51:{label:'약한 이슬비',icon:'🌦️'}, 53:{label:'이슬비',icon:'🌦️'}, 55:{label:'강한 이슬비',icon:'🌧️'},
  56:{label:'약한 착빙 이슬비',icon:'🌧️'}, 57:{label:'강한 착빙 이슬비',icon:'🌧️'},
  61:{label:'약한 비',icon:'🌧️'}, 63:{label:'비',icon:'🌧️'}, 65:{label:'강한 비',icon:'🌧️'},
  66:{label:'약한 착빙 비',icon:'🌧️'}, 67:{label:'강한 착빙 비',icon:'🌧️'},
  71:{label:'약한 눈',icon:'🌨️'}, 73:{label:'눈',icon:'🌨️'}, 75:{label:'강한 눈',icon:'❄️'}, 77:{label:'싸락눈',icon:'🌨️'},
  80:{label:'약한 소나기',icon:'🌦️'}, 81:{label:'소나기',icon:'🌦️'}, 82:{label:'강한 소나기',icon:'⛈️'},
  85:{label:'약한 소나기눈',icon:'🌨️'}, 86:{label:'강한 소나기눈',icon:'❄️'},
  95:{label:'뇌우',icon:'⛈️'}, 96:{label:'우박 동반 뇌우',icon:'⛈️'}, 99:{label:'강한 우박 동반 뇌우',icon:'⛈️'}
};

const QUAKE_SCALE_MAP = {
  '-1':'정보없음', '10':'진도1', '20':'진도2', '30':'진도3', '40':'진도4',
  '45':'진도5약', '50':'진도5강', '55':'진도6약', '60':'진도6강', '70':'진도7'
};

const WEATHER_DAY_LABELS = ['오늘','내일','모레','글피'];

let _weatherInited = false;
let _weatherSelectedRegion = null;

function initWeatherPage(){
  if(!document.getElementById('weatherRegionButtons')) return;
  if(_weatherInited) return;
  _weatherInited = true;
  renderRegionButtons();
  bindWeatherEvents();
  fetchAndRenderEarthquakes();
}

function bindWeatherEvents(){
  document.getElementById('weatherRegionSearchBtn').addEventListener('click', handleWeatherRegionSearch);
  document.getElementById('weatherRegionSearch').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); handleWeatherRegionSearch(); }
  });
  document.getElementById('weatherChatSendBtn').addEventListener('click', sendWeatherChat);
  document.getElementById('weatherChatInput').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); sendWeatherChat(); }
  });
  document.getElementById('weatherQuakeRefreshBtn').addEventListener('click', fetchAndRenderEarthquakes);
}

function renderRegionButtons(){
  const wrap = document.getElementById('weatherRegionButtons');
  wrap.innerHTML = WEATHER_REGIONS.map(r =>
    `<button type="button" class="chip${_weatherSelectedRegion?.id===r.id ? ' blue' : ''}" data-region-id="${r.id}" style="cursor:pointer">${escapeHtml(r.name)}</button>`
  ).join('');
  wrap.querySelectorAll('[data-region-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const region = WEATHER_REGIONS.find(r => r.id === btn.dataset.regionId);
      if(region) selectWeatherRegion(region);
    });
  });
}

function getWeatherInfo(code){
  return WEATHER_CODE_MAP[code] || { label:'정보없음', icon:'❓' };
}

async function fetchWeatherData(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=4&models=jma_seamless`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`forecast http ${res.status}`);
  const data = await res.json();
  if(!data || !data.current || !data.daily) throw new Error('forecast malformed');
  return data;
}

async function selectWeatherRegion(region){
  _weatherSelectedRegion = region;
  renderRegionButtons();
  setWeatherCardLoading(region.name);
  try{
    const data = await fetchWeatherData(region.lat, region.lon);
    renderWeatherCard(region, data);
  }catch(err){
    console.warn('[weather] fetch failed', err);
    renderWeatherCardError(region.name);
  }
}

function setWeatherCardLoading(name){
  document.getElementById('weatherCardTitle').textContent = `${name} 날씨`;
  document.getElementById('weatherUpdatedAt').textContent = '';
  document.getElementById('weatherEmpty').style.display = 'none';
  document.getElementById('weatherCurrentBox').innerHTML = '<div class="empty">불러오는 중...</div>';
  document.getElementById('weatherForecastBox').innerHTML = '';
}

function renderWeatherCardError(name){
  document.getElementById('weatherCardTitle').textContent = `${name} 날씨`;
  document.getElementById('weatherCurrentBox').innerHTML = '';
  document.getElementById('weatherForecastBox').innerHTML = '';
  const empty = document.getElementById('weatherEmpty');
  empty.style.display = '';
  empty.textContent = '데이터 없음 — 날씨 정보를 불러오지 못했습니다.';
}

function renderWeatherCard(region, data){
  document.getElementById('weatherEmpty').style.display = 'none';
  document.getElementById('weatherCardTitle').textContent = `${region.name} 날씨`;
  document.getElementById('weatherUpdatedAt').textContent = data.current.time ? `업데이트 ${data.current.time.replace('T',' ')}` : '';

  const cur = data.current;
  const curInfo = getWeatherInfo(cur.weather_code);
  document.getElementById('weatherCurrentBox').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:6px 0 12px">
      <div style="font-size:34px">${curInfo.icon}</div>
      <div>
        <div style="font-size:22px;font-weight:800">${cur.temperature_2m}°C <span style="font-size:13px;font-weight:700;color:var(--text2)">${escapeHtml(curInfo.label)}</span></div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">습도 ${cur.relative_humidity_2m}% · 풍속 ${cur.wind_speed_10m}m/s · 강수 ${cur.precipitation}mm</div>
      </div>
    </div>`;

  const daily = data.daily;
  const days = daily.time.map((t,i) => ({
    label: WEATHER_DAY_LABELS[i] || t,
    code: daily.weather_code[i],
    max: daily.temperature_2m_max[i],
    min: daily.temperature_2m_min[i],
    pop: daily.precipitation_probability_max[i]
  }));
  document.getElementById('weatherForecastBox').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(${days.length},1fr);gap:6px">
      ${days.map(d => {
        const info = getWeatherInfo(d.code);
        return `<div style="text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:8px 4px">
          <div style="font-size:11px;color:var(--text2);font-weight:700">${escapeHtml(d.label)}</div>
          <div style="font-size:20px;margin:4px 0">${info.icon}</div>
          <div style="font-size:12px;font-weight:800">${d.max}° / ${d.min}°</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">☔ ${d.pop ?? '-'}%</div>
        </div>`;
      }).join('')}
    </div>`;
}

function findPresetRegion(query){
  const q = (query || '').trim();
  if(!q) return null;
  return WEATHER_REGIONS.find(r => r.aliases.some(a => q.includes(a) || a.includes(q))) || null;
}

async function geocodeRegion(query){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=ko&format=json`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`geocoding http ${res.status}`);
  const data = await res.json();
  const first = data && data.results && data.results[0];
  if(!first) return null;
  return { id:`geo-${first.id}`, name: first.name, lat: first.latitude, lon: first.longitude };
}

async function resolveRegionByQuery(query){
  const preset = findPresetRegion(query);
  if(preset) return preset;
  try{
    return await geocodeRegion(query);
  }catch(err){
    console.warn('[weather] geocode failed', err);
    return null;
  }
}

async function handleWeatherRegionSearch(){
  const input = document.getElementById('weatherRegionSearch');
  const query = input.value.trim();
  if(!query){ showToast('검색할 지역명을 입력하세요','error'); return; }
  const region = await resolveRegionByQuery(query);
  if(!region){ showToast('데이터 없음 — 지역을 찾을 수 없습니다','error'); return; }
  input.value = '';
  selectWeatherRegion(region);
}

function parseWeatherQuery(text){
  let dayIndex = 0;
  let matchedDayLabel = null;
  for(let i=0;i<WEATHER_DAY_LABELS.length;i++){
    if(text.includes(WEATHER_DAY_LABELS[i])){ dayIndex = i; matchedDayLabel = WEATHER_DAY_LABELS[i]; break; }
  }
  let regionText = matchedDayLabel ? text.split(matchedDayLabel).join('') : text;
  regionText = regionText.replace(/날씨|알려줘|보여줘|어때|궁금해|알려줄래|주세요|검색|\?|！|!|\.|,/g,'').trim();
  return { regionText, dayIndex, dayLabel: matchedDayLabel || '오늘' };
}

async function sendWeatherChat(){
  const input = document.getElementById('weatherChatInput');
  const text = input.value.trim();
  if(!text) return;
  input.value = '';
  appendChatUserMessage(text);

  const { regionText, dayIndex, dayLabel } = parseWeatherQuery(text);
  let region = findPresetRegion(regionText);
  if(!region && regionText){
    try{ region = await geocodeRegion(regionText); }
    catch(err){ console.warn('[weather] chat geocode failed', err); }
  }
  if(!region && !regionText && _weatherSelectedRegion){
    region = _weatherSelectedRegion;
  }
  if(!region){
    appendChatBotMessage('데이터 없음 — 지역을 인식하지 못했습니다. "오사카 내일 날씨"처럼 입력해 보세요.');
    return;
  }

  try{
    const data = await fetchWeatherData(region.lat, region.lon);
    const info = getWeatherInfo(data.daily.weather_code[dayIndex]);
    const max = data.daily.temperature_2m_max[dayIndex];
    const min = data.daily.temperature_2m_min[dayIndex];
    const pop = data.daily.precipitation_probability_max[dayIndex];
    appendChatBotMessage(`${region.name} ${dayLabel} — ${info.icon} ${info.label}, 최고 ${max}°C / 최저 ${min}°C, 강수확률 ${pop ?? '-'}%`);
  }catch(err){
    console.warn('[weather] chat fetch failed', err);
    appendChatBotMessage('데이터 없음 — 날씨 정보를 불러오지 못했습니다.');
  }
}

function appendChatUserMessage(text){
  const log = document.getElementById('weatherChatLog');
  const row = document.createElement('div');
  row.style.cssText = 'text-align:right;font-size:12px;color:var(--text2);margin-bottom:4px';
  row.textContent = text;
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

function appendChatBotMessage(text){
  const log = document.getElementById('weatherChatLog');
  const row = document.createElement('div');
  row.className = 'info';
  row.style.marginBottom = '10px';
  row.textContent = text;
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

async function fetchAndRenderEarthquakes(){
  const emptyEl = document.getElementById('weatherQuakeEmpty');
  const listEl = document.getElementById('weatherQuakeList');
  emptyEl.style.display = '';
  emptyEl.textContent = '불러오는 중...';
  listEl.innerHTML = '';
  try{
    const res = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=8');
    if(!res.ok) throw new Error(`quake http ${res.status}`);
    const data = await res.json();
    if(!Array.isArray(data) || !data.length){
      emptyEl.textContent = '데이터 없음';
      return;
    }
    renderEarthquakeList(data);
    emptyEl.style.display = 'none';
  }catch(err){
    console.warn('[weather] quake fetch failed', err);
    emptyEl.textContent = '데이터 없음 — 지진 정보를 불러오지 못했습니다.';
  }
}

function renderEarthquakeList(list){
  const listEl = document.getElementById('weatherQuakeList');
  listEl.innerHTML = list.map(item => {
    const eq = item.earthquake || {};
    const hypo = eq.hypocenter || {};
    const scale = QUAKE_SCALE_MAP[String(eq.maxScale)] || '정보없음';
    const mag = (typeof hypo.magnitude === 'number' && hypo.magnitude > 0) ? `M${hypo.magnitude}` : '규모 정보없음';
    const place = hypo.name || '진앙지 정보없음';
    const time = (eq.time || item.time || '정보없음').replace(/\//g,'.');
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--text)">${escapeHtml(place)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${escapeHtml(time)}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="chip warn" style="font-size:11px">${escapeHtml(scale)}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:3px">${escapeHtml(mag)}</div>
      </div>
    </div>`;
  }).join('');
}
