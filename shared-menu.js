// Menus added by participants belong to this room, never to the source catalog.
const sharedMenuKey = name => String(name||'').normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g,'');
function tidySharedMenu(id,data) {
  if(!/^custom-[a-f0-9]{30}$/.test(id)||!data||typeof data.name!=='string'||!data.name.trim()||data.name.length>40
    ||typeof data.storeId!=='string'||!data.storeId||data.storeId.length>40||!Number.isInteger(data.price)||data.price<0||data.price>10000000
    ||typeof data.uid!=='string'||!data.uid||data.uid.length>128)return null;
  return {id,name:data.name,price:data.price,storeId:data.storeId,shared:true,by:str(data.by,20),uid:data.uid,desc:'',tags:[],img:'',emoji:''};
}
function mergeSharedMenus() {
  for(const store of S.room?.stores||[]) {
    store.menu=store.menu.filter(menu=>!menu.shared);
    const known=new Set(store.menu.map(menu=>menu.id));
    for(const menu of (S.sharedMenus||new Map()).values())if(menu.storeId===store.id&&!known.has(menu.id)){store.menu.push(menu);known.add(menu.id);}
  }
}
function editableRoomStores() {
  return (S.room?.stores||[]).map(store=>({...clone(store),menu:store.menu.filter(menu=>!menu.shared).map(menu=>clone(menu))}));
}
async function addSharedMenu(storeId,name,price) {
  const roomId=S.roomId,store=storeOf(storeId),by=S.who,storeIndex=S.room?.stores.findIndex(s=>s.id===storeId);
  name=String(name||'').trim().replace(/\s+/g,' ');
  if(!UID||!S.who||!roomId||!store)throw Error('이름과 가게를 먼저 선택해 주세요.');
  if(locked())throw Error('마감된 모임에는 메뉴를 추가할 수 없어요.');
  if(!name||name.length>40)throw Error('메뉴 이름을 40자 이내로 적어 주세요.');
  if(!Number.isInteger(price)||price<0||price>10000000)throw Error('메뉴판에 적힌 가격을 원 단위로 입력해 주세요.');
  const existing=store.menu.find(menu=>sharedMenuKey(menu.name)===sharedMenuKey(name));
  if(existing)return {item:ITEMS.get(existing.id),created:false};
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(storeId+'\n'+sharedMenuKey(name)));
  const id='custom-'+[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,30);
  if(S.roomId!==roomId||S.who!==by)return null;
  const ref=FB.doc(DB,'dinnerRooms',roomId,'sharedMenus',id);
  let current=await FB.getDoc(ref),data;
  if(current.exists())data=current.data();
  else {
    if(S.roomId!==roomId||S.who!==by)return null;
    data={storeId,storeIndex,name,price,uid:UID,by,at:FB.serverTimestamp()};
    try{await FB.setDoc(ref,data);}
    catch(error){
      if(!/permission/.test(String(error?.code||error?.message)))throw error;
      current=await FB.getDoc(ref);if(!current.exists())throw error;data=current.data();
    }
  }
  if(S.roomId!==roomId||S.route!=='room'||S.who!==by)return null;
  const clean=tidySharedMenu(id,data);if(!clean||clean.storeId!==storeId)throw Error('추가된 메뉴를 확인하지 못했어요. 다시 시도해 주세요.');
  S.sharedMenus.set(id,clean);reindex();
  return {item:ITEMS.get(id),created:!current.exists()};
}
function missingMenuButton(storeId=S.store) {
  if(!S.who||locked()||!storeOf(storeId))return '';
  return `<button class="missing-menu" data-act="shared-menu-open" data-id="${esc(storeId)}"><span>찾는 메뉴가 없나요?</span><b>메뉴 직접 담기 ＋</b></button>`;
}
function openSharedMenu(storeId) {
  const store=storeOf(storeId);if(!store||locked())return;
  closeSheet();const roomId=S.roomId,bg=document.createElement('div');bg.id='sheet';bg.className='sheet-bg';
  bg.innerHTML=`<section class="sheet shared-menu-sheet" role="dialog" aria-modal="true" aria-labelledby="sharedMenuTitle"><button class="sheet-x" data-act="item-close" aria-label="닫기">✕</button><div class="sheet-body"><span class="eyebrow">${esc(store.name)}</span><h2 id="sharedMenuTitle">메뉴 직접 담기</h2><p class="shared-menu-help">추가한 메뉴는 이 모임의 다른 사람도 담을 수 있어요.</p><form id="sharedMenuForm"><label class="field">메뉴 이름<input class="input" name="menuName" maxlength="40" value="${esc(S.menuQuery)}" placeholder="예: 아이스 모카 스무디" required></label><div class="shared-menu-inputs"><label class="field">가격(원)<input class="input" name="menuPrice" type="number" min="0" max="10000000" step="1" inputmode="numeric" placeholder="메뉴판 가격" required></label><label class="field">수량<input class="input" name="menuQty" type="number" min="1" max="30" step="1" value="1" inputmode="numeric" required></label></div><p class="shared-menu-error" role="alert"></p><button class="btn block" type="submit">메뉴에 추가하고 담기</button></form></div></section>`;
  let saving=false;
  bg.addEventListener('click',event=>{if(event.target===bg&&!saving)closeSheet();});
  bg.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();if(saving||S.roomId!==roomId)return;
    const form=event.currentTarget,button=form.querySelector('[type=submit]'),error=form.querySelector('[role=alert]');
    const qty=Number(form.elements.menuQty.value);if(!Number.isInteger(qty)||qty<1||qty>30){error.textContent='수량은 1~30개로 입력해 주세요.';return;}
    saving=true;button.disabled=true;button.textContent='함께 보는 메뉴에 추가 중…';error.textContent='';
    try {
      const result=await addSharedMenu(storeId,form.elements.menuName.value,Number(form.elements.menuPrice.value));
      if(!result||S.roomId!==roomId||!bg.isConnected)return;
      const item=result.item,next=Math.min(30,(S.cart[item.id]||0)+qty);
      closeSheet();S.menuQuery='';S.mfilter='all';S.store=storeId;
      if(!fitsBudget(item.id,next)){rerender();toast('메뉴를 공유했어요. 1인 예산을 초과해 장바구니에는 담지 못했어요.');return;}
      setQty(item.id,next);rerender();bumpCart();
      toast(result.created?'메뉴를 추가하고 담았어요. 다른 사람도 고를 수 있어요.':`이미 있는 메뉴로 담았어요 · ${price(item.price)}`);
    } catch(cause) {
      if(!bg.isConnected||S.roomId!==roomId)return;
      error.textContent=/permission/.test(String(cause?.code||cause?.message))?'메뉴를 추가하지 못했어요. 모임 상태를 확인하고 다시 시도해 주세요.':cause?.code?friendly(cause):String(cause?.message||cause);
    } finally {saving=false;if(bg.isConnected){button.disabled=false;button.textContent='메뉴에 추가하고 담기';}}
  });
  document.body.append(bg);bg.querySelector('[name=menuName]').focus();
}
