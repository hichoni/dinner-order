// Motion shared by the production room UI and the isolated design preview.
function brandAsset() { return document.documentElement.dataset.palette === 'sky' ? 'assets/brand-sky.png' : 'assets/brand.png'; }
function applyPalette(value) {
  const palette = value === 'sky' ? 'sky' : 'mint';
  document.documentElement.dataset.palette = palette;
  try { localStorage.setItem('damatda-palette', palette); } catch {}
  document.querySelectorAll('.brand-lockup img,.brand-art img').forEach(img => { img.src = brandAsset(); });
  document.querySelectorAll('[data-palette-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paletteChoice === palette)));
}
let flightOrigin = null;
document.addEventListener('click', event => {
  const button = event.target.closest('[data-act="plus"],[data-act="qty-plus"],[data-act="item"],[data-act="sheet-add"],[data-act="sheet-save"],[data-act="sheet-done"]');
  if (!button) return;
  const card = button.closest('.menu,.sheet');
  const rect = (card?.querySelector('.m-emo') || button).getBoundingClientRect();
  flightOrigin = {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
}, true);
function animateAddToCart() {
  if (reduceMotion()) return;
  const target = document.querySelector('.nav [data-t="cart"]') || document.querySelector('.cartbar');
  if (!target || !flightOrigin) return;
  const rect = target.getBoundingClientRect(), origin = flightOrigin;
  flightOrigin = null;
  const card = document.createElement('div');
  card.className = 'flying-menu'; card.setAttribute('aria-hidden', 'true');
  card.innerHTML = FOOD_ICONS.cup;
  card.style.left = `${origin.x - 23}px`; card.style.top = `${origin.y - 23}px`;
  document.body.append(card);
  const dx = rect.x + rect.width / 2 - origin.x, dy = rect.y + rect.height / 2 - origin.y;
  const animation = card.animate([
    {transform:'translate(0,0) rotate(-8deg) scale(1)',opacity:1},
    {transform:`translate(${dx*.45}px,${dy*.25-65}px) rotate(12deg) scale(.9)`,opacity:1,offset:.48},
    {transform:`translate(${dx}px,${dy}px) rotate(-5deg) scale(.25)`,opacity:.1}
  ], {duration:560,easing:'cubic-bezier(.22,.8,.32,1)',fill:'forwards'});
  animation.finished.then(() => { card.remove(); target.animate([{transform:'scale(1)'},{transform:'scale(1.13)'},{transform:'scale(1)'}],{duration:300}); }).catch(()=>card.remove());
}
let sendCurtain = null;
function sendingCurtain() {
  dismissSendCurtain(false);
  const el = document.createElement('section');
  el.className='send-curtain'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.setAttribute('aria-labelledby','sendingTitle'); el.tabIndex=-1;
  el.innerHTML=`<div class="send-panel">${brandMotion("sending")}<div class="send-logo-final" aria-hidden="true">${brandMotionWord()}<span>!</span></div><div role="status" aria-live="polite"><h2 id="sendingTitle">보내는 중…</h2><p class="send-message"></p></div><button type="button" class="send-finish" hidden>보낸 메뉴 보기 <span>→</span></button></div>`;
  document.body.append(el); sendCurtain=el; el.dataset.started=String(performance.now()); el.focus({preventScroll:true});
  const app = document.getElementById('app'); if(app)app.inert=true;
  el.querySelector('.send-finish').addEventListener('click',()=>dismissSendCurtain(true));
  el.addEventListener('keydown',event=>{if(event.key==='Escape'&&el.classList.contains('done'))dismissSendCurtain(true);if(event.key==='Tab'){event.preventDefault();(el.querySelector('.send-finish:not([hidden])')||el).focus();}});
}
function finishSendCurtain() {
  const el=sendCurtain;if(!el)return;
  const remaining=reduceMotion()?0:Math.max(0,2550-(performance.now()-Number(el.dataset.started)));
  if(remaining>0){setTimeout(()=>{if(sendCurtain===el)finishSendCurtain();},remaining);return;}
  el.classList.add('done');
  el.querySelector('#sendingTitle').textContent='다맛다!';
  el.querySelector('.send-message').textContent='방장에게 메뉴가 도착했어요.';
  const button=el.querySelector('.send-finish');button.hidden=false;
  if(reduceMotion())button.focus({preventScroll:true});
}
function dismissSendCurtain(restoreFocus = true) {
  if(!sendCurtain)return;sendCurtain.remove();sendCurtain=null;
  const app=document.getElementById('app');if(app)app.inert=false;
  if(restoreFocus){const target=document.querySelector('.sent-ok')||document.querySelector('.top h1');if(target){target.tabIndex=-1;target.focus({preventScroll:true});}}
}
let arrivalTimer = null;
function announceArrival(names, updated = false) {
  document.getElementById('arrivalNotice')?.remove();clearTimeout(arrivalTimer);
  const note=document.createElement('section');note.id='arrivalNotice';note.className='arrival-notice';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
  const display=names.length>1?`${names[0]}님 외 ${names.length-1}명`: `${names[0]}님`;
  note.innerHTML=`<div class="arrival-icon" aria-hidden="true">${FOOD_ICONS.bowl}</div><div><span class="arrival-eyebrow">${updated?'주문이 바뀌었어요':'방장님, 한 그릇 왔어요'}</span><b>${esc(display)}의 메뉴 ${updated?'수정!':'도착!'}</b><small>모인 메뉴에 ${updated?'변경사항을 반영했어요.':'차곡차곡 담아뒀어요.'}</small></div><button class="arrival-open" type="button">보기 →</button><button class="arrival-close" type="button" aria-label="도착 알림 닫기">×</button><div class="arrival-time"></div>`;
  document.body.append(note);
  note.querySelector('.arrival-open').onclick=()=>{go({tab:'sum'});note.remove();};
  note.querySelector('.arrival-close').onclick=()=>note.remove();
  arrivalTimer=setTimeout(()=>note.remove(),8500);
  S.bumpLive=true;bumpLive();
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-palette-choice]');if(button)applyPalette(button.dataset.paletteChoice);});
try { applyPalette(new URLSearchParams(location.search).get('palette')||localStorage.getItem('damatda-palette')||'sky'); } catch { applyPalette('sky'); }

document.addEventListener('click',event=>{const link=event.target.closest('a[href="#how"]');if(link){event.preventDefault();document.getElementById('how')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}});
