import {loadLeaflet,validPoint} from './places.js';
const h=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountMenuMap(root, initialStores, {isSelected,onToggle}) {
  let live=true,map=null,layer=null,rows=initialStores;
  root.innerHTML='<div class="places-map" data-menu-map aria-label="메뉴를 고를 가게 지도"></div><p class="hint" role="status" data-map-status>지도를 불러오는 중…</p><p class="hint">점을 누르면 가게를 담을 수 있어요. 메뉴와 가격은 아래 목록에서 확인하세요.</p>';
  const el=root.querySelector('[data-menu-map]'),status=root.querySelector('[data-map-status]');
  function draw(){
    if(!map || !layer)return;
    layer.clearLayers();
    const L=globalThis.L,points=rows.filter(validPoint);
    for(const s of points){
      const chosen=isSelected(s.id);
      const marker=L.marker([s.lat,s.lng],{title:s.name,icon:L.divIcon({className:'menu-map-point',html:`<span style="display:block;width:18px;height:18px;border:2px solid #fff;border-radius:50%;background:${chosen?'#287bc0':'#087d78'};box-shadow:0 1px 4px #2345"></span>`,iconSize:[18,18],iconAnchor:[9,9]})}).addTo(layer).bindTooltip(h(s.name)).bindPopup(`<b>${h(s.name)}</b><p>${h(s.address)}</p><p>메뉴 ${s.menuCount || s.menu.length}개</p><button class="small-btn" data-map-pick="${h(s.id)}" type="button">${chosen?'담은 가게 빼기':'이 가게 담기'}</button>`);
      const point=marker.getElement();
      if(point){point.setAttribute('role','button');point.setAttribute('tabindex','0');point.setAttribute('aria-label',s.name+' 지도에서 보기');point.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();marker.openPopup();}});}
    }
    status.textContent=`검색한 가게 ${rows.length}곳 중 위치를 확인한 ${points.length}곳을 표시해요.`;
  }
  loadLeaflet().then(L=>{
    if(!live)return;
    map=L.map(el,{scrollWheelZoom:false}).setView([36.5,128.7],9);
    // Leaflet stops popup clicks from bubbling, so bind the button directly.
    map.on('popupopen',event=>{
      const button=event.popup.getElement()?.querySelector('[data-map-pick]');
      button?.addEventListener('click',()=>{if(onToggle(button.dataset.mapPick)!==false){map.closePopup();draw();}});
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map).on('tileerror',()=>{status.textContent='지도 배경을 불러오지 못했어요. 아래 가게 목록에서 계속 고를 수 있어요.';});
    layer=L.layerGroup().addTo(map);draw();
    const points=rows.filter(validPoint).map(s=>[s.lat,s.lng]);if(points.length)map.fitBounds(points,{padding:[20,20],maxZoom:15,animate:false});
  }).catch(()=>{if(live)status.textContent='지도를 불러오지 못했어요. 아래 가게 목록에서 계속 고를 수 있어요.';});
  return {update(stores){rows=stores;draw();},destroy(){live=false;map?.remove();}};
}
