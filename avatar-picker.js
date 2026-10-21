// Confirmed profiles live in Firestore; local storage holds only unconfirmed drafts.
const AVATAR_TONE_NAMES = ['민트', '살구', '하늘', '라벤더', '레몬', '분홍'];
const avatarMemory = new Map();
const avatarStorageKey = () => 'mm-avatars-' + (S.roomId || 'local');
function validAvatar(value) {
  return value && Number.isInteger(value.food) && value.food >= 0 && value.food < FOOD_CHARACTERS.length
    && Number.isInteger(value.tone) && value.tone >= 0 && value.tone < AVATAR_TONES
    ? {food:value.food, tone:value.tone} : null;
}
function avatarChoices() {
  const key = avatarStorageKey();
  if (!avatarMemory.has(key)) {
    const stored = load(key, {}), clean = Object.create(null);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      for (const [name, value] of Object.entries(stored).slice(0, 240)) {
        const choice = validAvatar(value);
        if (choice && name.length <= 400) clean[name] = choice;
      }
    }
    avatarMemory.set(key, clean);
  }
  return avatarMemory.get(key);
}
function randomAvatarIndex(count) {
  const bytes = new Uint8Array(1), ceiling = 256 - (256 % count);
  do { crypto.getRandomValues(bytes); } while (bytes[0] >= ceiling);
  return bytes[0] % count;
}
function randomAvatar(previous = null, occupied = []) {
  const used = new Set(occupied.map(v => v.food * AVATAR_TONES + v.tone));
  const usedFoods = new Set(occupied.map(v => v.food));
  let candidates = [];
  for (let food=0; food<FOOD_CHARACTERS.length; food++) for (let tone=0; tone<AVATAR_TONES; tone++) {
    if ((!previous || food !== previous.food || tone !== previous.tone) && !used.has(food*AVATAR_TONES+tone)) candidates.push({food,tone});
  }
  if (!candidates.length) return randomAvatar(previous);
  if (!previous && usedFoods.size < FOOD_CHARACTERS.length) candidates = candidates.filter(v => !usedFoods.has(v.food));
  return candidates[randomAvatarIndex(candidates.length)];
}
function avatarChoice(name) {
  const shared=validAvatar(S.profiles?.get(answerId(name)));
  if(shared)return shared;
  const choices=avatarChoices(), key=answerId(name);
  if (!Object.hasOwn(choices,key)) {
    choices[key]=randomAvatar(null,Object.values(choices));
    save(avatarStorageKey(),choices);
  }
  return {...choices[key]};
}
function cacheAvatarChoice(name, value) {
  const choice=validAvatar(value);
  if (!choice) return false;
  const choices=avatarChoices(); choices[answerId(name)]=choice;
  save(avatarStorageKey(),choices);
  return true;
}
function tidyAvatarProfile(id, data) {
  const choice=validAvatar(data);
  if(!choice || typeof data.name!=='string' || !data.name.length || data.name.length>20 || answerId(data.name)!==id || typeof data.uid!=='string' || !data.uid.length || data.uid.length>128)return null;
  return {name:data.name,uid:data.uid,...choice};
}
function avatarOwner(name) {
  return S.answers.get(answerId(name))?.uid || S.profiles?.get(answerId(name))?.uid || '';
}
function canEditAvatar(name) {
  const owner=avatarOwner(name);
  return !!UID && !!S.room && (S.host || (!S.room.closed && (!owner || owner===UID)));
}
async function saveAvatarChoice(name,value) {
  const choice=validAvatar(value),roomId=S.roomId;
  if(!choice || !roomId || !S.profilesReady || !canEditAvatar(name))throw new Error('permission-denied');
  if(typeof navigator!=='undefined' && navigator.onLine===false)throw new Error('network unavailable');
  const profile={name,...choice,uid:S.host ? (avatarOwner(name)||UID) : UID};
  await FB.setDoc(FB.doc(DB,'dinnerRooms',roomId,'profiles',answerId(name)),{...profile,updatedAt:FB.serverTimestamp()});
  if(S.roomId!==roomId)return false;
  S.profiles.set(answerId(name),profile); cacheAvatarChoice(name,choice);
  return true;
}
let avatarPicker=null;
const avatarMigrationAttempts=new Set();
function migrateMyAvatar() {
  if(!S.who||!S.profilesReady||!S.answersReady||!canEditAvatar(S.who)||S.profiles.has(answerId(S.who)))return;
  if(avatarOwner(S.who)&&avatarOwner(S.who)!==UID)return;
  const choice=validAvatar(avatarChoices()[answerId(S.who)]),key=S.roomId+':'+answerId(S.who);
  if(!choice||avatarMigrationAttempts.has(key))return;
  avatarMigrationAttempts.add(key);
  saveAvatarChoice(S.who,choice).catch(()=>{});
}
const avatarDice = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>';
function avatarPickerHTML(picker) {
  const p=picker.draft;
  return `<section class="avatar-picker" role="dialog" aria-modal="true" aria-labelledby="avatarPickerTitle">
    <header class="ap-head"><h2 id="avatarPickerTitle">${esc(picker.name)}의 캐릭터</h2><button class="ap-close" data-avatar-action="cancel" aria-label="캐릭터 선택 닫기">${ICON.back}</button></header>
    <div class="ap-body">
      <div class="ap-machine"><div class="ap-stage"><div class="ap-portrait">${foodAvatar(p.food,p.tone)}</div><i class="ap-spark s1" aria-hidden="true">✦</i><i class="ap-spark s2" aria-hidden="true">✦</i><i class="ap-spark s3" aria-hidden="true">·</i></div>
        <div class="ap-machine-side"><span class="ap-result" role="status" aria-live="polite">${FOOD_CHARACTERS[p.food].name} · ${AVATAR_TONE_NAMES[p.tone]}</span><button class="ap-roll" data-avatar-action="roll">${avatarDice}<span>다시 뽑기</span></button><div class="ap-lights" aria-hidden="true"><i></i><i></i><i></i></div></div>
      </div>
      <div class="ap-colors"><span>배경색</span><div role="group" aria-label="캐릭터 배경색">${AVATAR_TONE_NAMES.map((name,i)=>`<button class="ap-color avatar-tone-${i}" data-avatar-tone="${i}" aria-label="${name}" aria-pressed="${p.tone===i}"><span aria-hidden="true">✓</span></button>`).join('')}</div></div>
      <div class="ap-grid-label"><b>직접 고르기</b><span>16종</span></div>
      <div class="ap-foods" role="group" aria-label="음식 캐릭터">${FOOD_CHARACTERS.map((food,i)=>`<button class="ap-food" data-avatar-food="${i}" aria-label="${food.name}" aria-pressed="${p.food===i}"><img src="${food.src}" alt="" width="56" height="56"><span>${food.name}</span></button>`).join('')}</div>
    </div>
    <footer class="ap-foot"><button class="ap-confirm" data-avatar-action="confirm">이 캐릭터로 담기 <span aria-hidden="true">↗</span></button><small class="ap-status" role="status" aria-live="polite">같이 먹는 사람들에게도 이렇게 보여요</small></footer>
  </section>`;
}
function openAvatarPicker(name) {
  name=String(name||'').trim().replace(/\s+/g,' ').slice(0,20);
  if (!name) { toast('이름을 적어 주세요'); return; }
  if (S.room.names.length && !S.room.freeJoin && !S.room.names.includes(name)) { toast('명단에 있는 이름만 고를 수 있어요'); return; }
  closeSheet();
  const bg=document.createElement('div'); bg.id='sheet'; bg.className='avatar-picker-bg';
  avatarPicker={name,roomId:S.roomId,draft:avatarChoice(name),rolling:false,saving:false,timer:0,trigger:document.activeElement,overflow:document.body.style.overflow,inert:$app.inert};
  bg.innerHTML=avatarPickerHTML(avatarPicker);
  bg.addEventListener('click',async e=>{
    if(e.target===bg){closeAvatarPicker();return;}
    const button=e.target.closest('button'); if(!button)return;
    const p=avatarPicker;if(!p)return;
    if(button.dataset.avatarAction==='cancel'){closeAvatarPicker();return;}
    if(p.rolling||p.saving)return;
    if(button.dataset.avatarAction==='roll'){if(canEditAvatar(p.name))rollAvatarPicker();return;}
    if(button.dataset.avatarAction==='confirm'){
      const {name,draft,roomId}=p;
      if(roomId!==S.roomId){closeAvatarPicker();return;}
      if(!S.profilesReady){syncAvatarPicker();return;}
      if(!canEditAvatar(name)){closeAvatarPicker(false);setWho(name);return;}
      p.saving=true;p.error='';syncAvatarPicker();
      try{
        const saved=await saveAvatarChoice(name,draft);
        if(avatarPicker!==p)return;
        if(!saved){closeAvatarPicker();return;}
        closeAvatarPicker(false);setWho(name);
      }catch(error){
        if(avatarPicker!==p)return;
        p.saving=false;p.error=/permission/.test(String(error.code||error.message))?'이름이 이미 선택됐어요. 다른 이름으로 골라 주세요.':'저장하지 못했어요. 연결을 확인하고 다시 눌러 주세요.';
        syncAvatarPicker();
      }
      return;
    }
    if(!canEditAvatar(p.name)||!S.profilesReady)return;
    if(button.hasAttribute('data-avatar-food'))p.draft.food=Number(button.dataset.avatarFood);
    if(button.hasAttribute('data-avatar-tone'))p.draft.tone=Number(button.dataset.avatarTone);
    updateAvatarPicker();
  });
  bg.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const buttons=[...bg.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  document.body.append(bg);document.body.style.overflow='hidden';$app.inert=true;
  syncAvatarPicker();
  bg.querySelector('[data-avatar-action="roll"]:not(:disabled), [data-avatar-action="confirm"]:not(:disabled), .ap-close').focus();
}
function syncAvatarPicker() {
  const p=avatarPicker,bg=document.querySelector('.avatar-picker-bg');if(!p||!bg)return;
  const editable=canEditAvatar(p.name),ready=S.profilesReady;
  if(!editable&&!p.rolling&&!p.saving){p.draft=avatarChoice(p.name);updateAvatarPicker();}
  for(const b of bg.querySelectorAll('[data-avatar-food],[data-avatar-tone],.ap-roll'))b.disabled=!ready||!editable||p.saving||p.rolling;
  const confirm=bg.querySelector('.ap-confirm');confirm.disabled=!ready||p.saving||p.rolling;
  confirm.textContent=p.saving?'같이 보는 중…':editable?'이 캐릭터로 담기 ↗':'이 이름으로 보기 ↗';
  bg.querySelector('.ap-status').textContent=p.error||S.profilesError||(!ready?'캐릭터를 불러오는 중…':p.saving?'캐릭터와 배경색을 저장하고 있어요':!editable?'이 캐릭터는 선택한 기기나 방장이 바꿀 수 있어요':'같이 먹는 사람들에게도 이렇게 보여요');
}
function updateAvatarPicker(announce=true) {
  const p=avatarPicker,bg=document.querySelector('.avatar-picker-bg');if(!p||!bg)return;
  bg.querySelector('.ap-portrait').innerHTML=foodAvatar(p.draft.food,p.draft.tone);
  if(announce)bg.querySelector('.ap-result').textContent=`${FOOD_CHARACTERS[p.draft.food].name} · ${AVATAR_TONE_NAMES[p.draft.tone]}`;
  for(const b of bg.querySelectorAll('[data-avatar-food]'))b.setAttribute('aria-pressed',String(Number(b.dataset.avatarFood)===p.draft.food));
  for(const b of bg.querySelectorAll('[data-avatar-tone]'))b.setAttribute('aria-pressed',String(Number(b.dataset.avatarTone)===p.draft.tone));
}
function rollAvatarPicker() {
  const p=avatarPicker,bg=document.querySelector('.avatar-picker-bg');if(!p||p.rolling||p.saving||!canEditAvatar(p.name)||!S.profilesReady||!bg)return;
  p.rolling=true;const result=randomAvatar(p.draft),delays=[65,65,75,85,95,115,145,190,250];let step=0;
  const panel=bg.querySelector('.avatar-picker');panel.classList.remove('is-revealed');panel.classList.add('is-rolling');panel.setAttribute('aria-busy','true');
  bg.querySelector('.ap-result').textContent='두구두구…';bg.querySelector('.ap-roll span').textContent='뽑는 중';
  for(const b of bg.querySelectorAll('button:not(.ap-close)'))b.disabled=true;
  const finish=()=>{
    if(avatarPicker!==p||!bg.isConnected)return;
    p.draft=result;p.rolling=false;updateAvatarPicker();
    panel.classList.remove('is-rolling');panel.classList.add('is-revealed');panel.removeAttribute('aria-busy');
    bg.querySelector('.ap-roll span').textContent='다시 뽑기';syncAvatarPicker();
    if (!bg.contains(document.activeElement)) bg.querySelector('.ap-roll').focus();
    if(!reduceMotion())buzz([15,35,25]);
  };
  if(reduceMotion()){finish();return;}
  const tick=()=>{
    if(avatarPicker!==p||!bg.isConnected)return;
    if(step===delays.length){finish();return;}
    p.draft=randomAvatar(p.draft);updateAvatarPicker(false);
    p.timer=setTimeout(tick,delays[step++]);
  };
  tick();
}
function closeAvatarPicker(restoreFocus=true) {
  const p=avatarPicker;if(!p)return;
  clearTimeout(p.timer);avatarPicker=null;document.querySelector('.avatar-picker-bg')?.remove();
  document.body.style.overflow=p.overflow;$app.inert=p.inert;
  if(restoreFocus&&p.trigger?.isConnected)p.trigger.focus();
}
