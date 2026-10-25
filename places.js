// Public business directory. No geolocation, tracking, or server writes here.
const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normal = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
export const validPoint = s => typeof s.lat === 'number' && typeof s.lng === 'number' && Number.isFinite(s.lat) && Number.isFinite(s.lng) && s.lat >= 33 && s.lat <= 39 && s.lng >= 124 && s.lng <= 132;
export const inBounds = (s, b) => validPoint(s) && (!b || (s.lat >= b.south && s.lat <= b.north && s.lng >= b.west && s.lng <= b.east));
export function findPlaces(rows, query, category = '', bounds = null) {
  const words = String(query).trim().split(/\s+/).map(normal).filter(Boolean);
  return rows.filter(s => (!category || s.category === category) && (!bounds || inBounds(s, bounds)) && words.every(w => normal([s.name,s.city,s.area,s.address,s.category].join(' ')).includes(w)));
}
// Never attach a different branch's menu based on name alone.
export function matchMenu(place, catalog) {
  const address = value => normal(value).replace(/^경상북도/, '경북');
  if (!place.address || !place.name) return null;
  const matches = catalog.filter(s => normal(s.name) === normal(place.name) && address(s.address) === address(place.address));
  return matches.length === 1 ? matches[0] : null;
}
const cache = new Map();
export async function loadPlaceCity(city, fetcher = fetch) {
  if (!/^[a-f0-9]{12}\.json$/.test(city.file)) throw new Error('잘못된 가게 목록 주소입니다.');
  if (!cache.has(city.file)) {
    cache.set(city.file, (async () => {
      const response = await fetcher(`places/${city.file}`);
      if (!response.ok) throw new Error('가게 목록을 불러오지 못했어요.');
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length !== city.count || rows.some(s => !s.id || !s.name || s.city !== city.name)) throw new Error('가게 목록을 확인하지 못했어요.');
      return rows;
    })().catch(error => { cache.delete(city.file); throw error; }));
  }
  return cache.get(city.file);
}
let leafletLoading;
function loadLeaflet() {
  if (globalThis.L) return Promise.resolve(globalThis.L);
  if (!leafletLoading) leafletLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'vendor/leaflet/leaflet.js';
    script.onload = () => resolve(globalThis.L);
    script.onerror = () => { script.remove(); leafletLoading = null; reject(new Error('지도를 불러오지 못했어요. 목록으로도 가게를 고를 수 있어요.')); };
    document.head.append(script);
  });
  return leafletLoading;
}
const memory = {city: '안동시', query: '', category: ''};
export function mountPlaces(root, {catalog, onAdd, isAdded}) {
  const menuMatches=new Map();
  const menuFor=place=>{if(!menuMatches.has(place.id))menuMatches.set(place.id,matchMenu(place,catalog));return menuMatches.get(place.id);};
  let live = true, request = 0, rows = [], index, limit = 30, selected = null, busy = false;
  let map = null, layer = null, bounds = null, mapWanted = false;
  root.innerHTML = '<p role="status">경북 가게 목록을 불러오는 중…</p>';
  const $ = selector => root.querySelector(selector);
  const setStatus = text => { if (live && $('[data-status]')) $('[data-status]').textContent = text; };
  function drawList() {
    const matches = findPlaces(rows, memory.query, memory.category, bounds);
    $('[data-results]').innerHTML = matches.slice(0, limit).map(s => {
      const menu = menuFor(s), added = isAdded(s, menu);
      return `<article class="place-card"><div><b>${h(s.name)}</b><span>${h(s.category)} · ${h(s.area)}</span><small>${h(s.address)}</small><small class="place-menu-state">${menu ? `메뉴 ${menu.menuCount || menu.menu.length}개 있음` : '메뉴 직접 입력'}${added ? ' · 담은 가게' : ''}</small></div><button type="button" class="small-btn" data-place="${h(s.id)}">${added ? '보기' : '선택'}</button></article>`;
    }).join('') || '<p class="empty-line">이 조건에 맞는 가게가 없어요. 검색어나 지도 범위를 바꿔 보세요.</p>';
    $('[data-more]').hidden = matches.length <= limit;
    $('[data-more]').textContent = `30곳 더 보기 (${Math.min(limit,matches.length)}/${matches.length})`;
    setStatus(`${memory.city} · ${bounds ? '지도 안 ' : ''}${matches.length.toLocaleString('ko')}곳`);
    if (map && layer) {
      layer.clearLayers();
      const b = map.getBounds(), center = map.getCenter();
      const visible = findPlaces(rows,memory.query,memory.category).filter(s => inBounds(s,{south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()}));
      const nearest = visible.sort((a,b) => ((a.lat-center.lat)**2+(a.lng-center.lng)**2)-((b.lat-center.lat)**2+(b.lng-center.lng)**2)).slice(0,300);
      for (const s of nearest) globalThis.L.circleMarker([s.lat,s.lng],{radius:7,color:'#fff',weight:2,fillColor:'#067d78',fillOpacity:0.9}).addTo(layer).bindTooltip(h(s.name)).on('click',() => choose(s.id));
      $('[data-map-count]').textContent = visible.length > 300 ? `지도 안 ${visible.length.toLocaleString('ko')}곳 중 중심에 가까운 300곳 표시 · 확대하면 더 볼 수 있어요.` : `지도 안 ${visible.length.toLocaleString('ko')}곳 표시 · 점을 눌러 가게를 골라요.`;
    }
  }
  function choose(id) {
    selected = rows.find(s => s.id === id);
    if (!selected) return;
    const menu = menuFor(selected), added = isAdded(selected, menu);
    $('[data-editor]').innerHTML = `<div class="place-editor"><button class="text-btn" data-close type="button">닫기 ✕</button><h3>${h(selected.name)}</h3><p>${h(selected.address)}</p>${added ? '<p>이미 담은 가게예요. 방 만들기 또는 방 설정에서 메뉴를 수정할 수 있어요.</p>' : menu ? `<p>등록된 메뉴 ${menu.menuCount || menu.menu.length}개를 가져와요. 실제 가격과 판매 여부는 가게에 확인해 주세요.</p><button class="btn block" data-add type="button">등록 메뉴로 담기</button>` : '<p>이 가게의 메뉴·가격은 아직 없어요. 확인한 메뉴를 적으면 모임에 담을 수 있어요.</p><label class="field">메뉴 · 한 줄에 하나<textarea class="input" data-menu rows="5" maxlength="6000" placeholder="비빔밥 9000&#10;칼국수 8000"></textarea></label><small>가격을 모르면 메뉴 이름만 적으세요. 등록 후 수정할 수 있어요.</small><button class="btn block" data-add type="button">메뉴 적고 담기</button>'}<p role="status" data-editor-status></p></div>`;
    $('[data-editor]').scrollIntoView({block:'nearest',behavior:'smooth'});
    $('[data-menu]')?.focus({preventScroll:true});
  }
  async function changeCity() {
    const token = ++request;
    rows=[]; selected=null; bounds=null; limit=30; memory.category='';
    $('[data-editor]').innerHTML=''; $('[data-results]').innerHTML=''; $('[data-more]').hidden=true;
    $('[data-category]').innerHTML='<option value="">모든 음식 종류</option>';
    if (layer) layer.clearLayers();
    $('[data-retry]').hidden=true;
    setStatus('가게 목록을 불러오는 중…');
    try {
      const city=index.cities.find(c => c.name === memory.city);
      const data=await loadPlaceCity(city);
      if (!live || token !== request) return;
      rows=data;
      const cats=[...new Set(rows.map(s => s.category))].sort((a,b)=>a.localeCompare(b,'ko'));
      $('[data-category]').innerHTML='<option value="">모든 음식 종류</option>'+cats.map(c=>`<option>${h(c)}</option>`).join('');
      fitCity(); drawList();
    } catch (error) { if(live && token===request){setStatus(error.message+' 다시 시도해 주세요.');$('[data-retry]').hidden=false;} }
  }
  function fitCity() {
    const points=rows.filter(validPoint).map(s=>[s.lat,s.lng]);
    if(map && points.length) map.fitBounds(points,{padding:[20,20],maxZoom:13});
  }
  async function toggleMap() {
    mapWanted=!mapWanted;
    $('[data-map-toggle]').textContent=mapWanted?'지도 접기':'지도로 찾기';
    $('[data-map-toggle]').setAttribute('aria-expanded',String(mapWanted));
    $('[data-map-wrap]').hidden=!mapWanted;
    if(!mapWanted){bounds=null;map?.remove();map=null;layer=null;drawList();return;}
    $('[data-map-count]').textContent='지도를 불러오는 중…';
    try {
      const L=await loadLeaflet();
      if(!live || !mapWanted || map) return;
      map=L.map($('[data-map]'),{preferCanvas:true,scrollWheelZoom:false}).setView([36.3,128.8],8);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map).on('tileerror',()=>{$('[data-map-count]').textContent='지도 배경을 불러오지 못했어요. 아래 목록으로도 가게를 고를 수 있어요.';});
      layer=L.layerGroup().addTo(map);
      map.on('moveend',()=>{
        if(bounds){const b=map.getBounds();bounds={south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()};limit=30;}
        drawList();
      });
      fitCity();drawList();
    } catch(error){if(live)$('[data-map-count]').textContent=error.message;}
  }
  const click = async event => {
    const el=event.target.closest('button'); if(!el || !root.contains(el))return;
    if(el.hasAttribute('data-place'))choose(el.dataset.place);
    else if(el.hasAttribute('data-close')){selected=null;$('[data-editor]').innerHTML='';}
    else if(el.hasAttribute('data-more')){limit+=30;drawList();}
    else if(el.hasAttribute('data-retry'))changeCity();
    else if(el.hasAttribute('data-map-toggle'))toggleMap();
    else if(el.hasAttribute('data-bounds') && map){const b=map.getBounds();bounds={south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()};limit=30;drawList();}
    else if(el.hasAttribute('data-all')){bounds=null;limit=30;drawList();}
    else if(el.hasAttribute('data-add') && selected && !busy){
      const place=selected, menu=menuFor(place), text=$('[data-menu]')?.value || '';
      if(!menu && !text.trim()){$('[data-editor-status]').textContent='메뉴를 한 줄 이상 적어 주세요.';return;}
      busy=true;el.disabled=true;
      try{
        await onAdd(place,menu,text);
        if(live && selected===place){$('[data-editor-status]').textContent='모임에 담았어요.';el.textContent='담았어요 ✓';drawList();}
      }catch(error){if(live && selected===place){$('[data-editor-status]').textContent=error.message;el.disabled=false;}}
      finally{busy=false;}
    }
  };
  const input = event => {
    if(event.target.hasAttribute('data-search')){memory.query=event.target.value;limit=30;drawList();}
  };
  const change = event => {
    if(event.target.hasAttribute('data-city')){memory.city=event.target.value;changeCity();}
    if(event.target.hasAttribute('data-category')){memory.category=event.target.value;limit=30;drawList();}
  };
  async function start(){
    try{
      const response=await fetch('places/index.json');if(!response.ok)throw new Error();
      index=await response.json();if(!Array.isArray(index.cities) || index.cities.length!==22)throw new Error();
      if(!live)return;
      if(!index.cities.some(c=>c.name===memory.city))memory.city=index.cities[0].name;
      root.innerHTML=`<div class="places-intro"><b>경북 22개 시·군에서 찾아요</b><p>식당·카페 ${Number(index.count).toLocaleString('ko')}곳의 이름과 위치를 검색해요. 메뉴가 없는 가게는 직접 적어서 담을 수 있어요.</p></div><div class="places-filters"><label class="field">시·군<select class="input" data-city>${index.cities.map(c=>`<option value="${h(c.name)}"${c.name===memory.city?' selected':''}>${h(c.name)} · ${c.count.toLocaleString('ko')}곳</option>`).join('')}</select></label><label class="field">종류<select class="input" data-category><option value="">모든 음식 종류</option></select></label></div><label class="field">가게·주소 찾기<input class="input" type="search" data-search value="${h(memory.query)}" placeholder="가게 이름, 동네 또는 도로명"></label><button class="btn gray" data-map-toggle aria-expanded="false" type="button">지도로 찾기</button><section data-map-wrap hidden><div data-map class="places-map" aria-label="가게 위치 지도"></div><p class="hint" data-map-count></p><div class="places-map-tools"><button class="small-btn" data-bounds type="button">이 지도 안에서 찾기</button><button class="small-btn" data-all type="button">시·군 전체 보기</button></div><p class="hint">현재 위치 권한 없이, 지도를 움직여 원하는 주변을 찾으세요.</p></section><div data-editor></div><p role="status" data-status></p><button class="small-btn" data-retry type="button" hidden>다시 불러오기</button><div data-results></div><button class="btn gray block" data-more hidden type="button"></button><p class="places-source">가게 위치: <a href="https://www.data.go.kr/data/15083033/fileData.do" target="_blank" rel="noopener">소상공인시장진흥공단 상가정보</a> · ${h(index.date)} 기준 · 이용허락범위 제한 없음<br>실시간 영업 정보가 아니며 이전·폐업·업종 분류 오류가 있을 수 있어요. 방문·주문 전 가게에 확인해 주세요. 메뉴·가격은 별도 정보예요.</p>`;
      root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);
      await changeCity();
    }catch{if(live){root.innerHTML='<p role="alert">경북 가게 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p><button class="btn gray" type="button">다시 불러오기</button>';root.querySelector('button').onclick=start;}}
  }
  start();
  return ()=>{live=false;++request;map?.remove();root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);};
}
