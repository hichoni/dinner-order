// Original, locally synthesized music: no downloads, recordings or audio permissions.
// The visual draw is decorative and never changes anyone's avatar or menu.
const DamatdaPlay = (() => {
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = max => {
    const value = new Uint32Array(1), limit = Math.floor(4294967296 / max) * max;
    do { crypto.getRandomValues(value); } while (value[0] >= limit);
    return value[0] % max;
  };
  function draw(previous = []) {
    const pool = FOOD_CHARACTERS.map((_, index) => index), result = [];
    for (let slot = 0; slot < 3; slot++) {
      const eligible = pool.filter(index => index !== previous[slot]);
      const chosen = eligible[random(eligible.length)];
      result.push(chosen); pool.splice(pool.indexOf(chosen), 1);
    }
    return result;
  }
  let previous = [];
  try { const saved = JSON.parse(read('damatda-home-draw')); if (Array.isArray(saved)) previous = saved; } catch {}
  let choices = draw(previous), played = false, activeSpin = null;
  write('damatda-home-draw', JSON.stringify(choices));
  const shuffleIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m17 3 4 4-4 4M3 7h3c5 0 7 10 12 10h3m-4-4 4 4-4 4M3 17h3c2 0 3-1 4-3m4-4c1-2 2-3 4-3h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const soundIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path class="sound-waves" d="M16 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="sound-slash" d="m16 9 5 6m0-6-5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const settingsKey = 'damatda-audio-v2';
  function readSettings(raw = read(settingsKey)) {
    const legacyOn = read('damatda-sound') !== 'off';
    const defaults = {music:{enabled:legacyOn,volume:25},effects:{enabled:legacyOn,volume:70}};
    try {
      const value = JSON.parse(raw);
      for (const channel of ['music','effects']) {
        if (typeof value?.[channel]?.enabled === 'boolean') defaults[channel].enabled = value[channel].enabled;
        if (typeof value?.[channel]?.volume === 'number' && Number.isFinite(value[channel].volume)) defaults[channel].volume = Math.round(Math.min(100,Math.max(0,value[channel].volume)));
      }
    } catch {}
    return defaults;
  }
  let settings = readSettings(), context = null, music = null, effects = null, soundPanel = null;
  let clock = null, nextStep = 0, step = 0, unlocked = false, starting = null, unavailable = false;
  const voices = new Map();
  const channelOn = channel => settings[channel].enabled && settings[channel].volume > 0;
  const wantsAudio = () => channelOn('music') || channelOn('effects');
  const soundOn = () => wantsAudio() && context?.state === 'running' && !document.hidden;
  function soundButton(compact = false) {
    return `<button type="button" class="game-sound${compact ? ' compact' : ''}" data-game-sound data-sound-active="${soundOn()}" aria-label="소리 설정" aria-haspopup="dialog" aria-expanded="${Boolean(soundPanel)}">${soundIcon}<span>소리 설정</span></button>`;
  }
  function updateSound() {
    const on = soundOn();
    document.querySelectorAll('[data-game-sound]').forEach(button => {
      button.setAttribute('data-sound-active', String(on));
      button.setAttribute('aria-expanded', String(Boolean(soundPanel)));
      button.title = 'BGM · 효과음 개별 설정';
    });
    if (!soundPanel) return;
    for (const channel of ['music','effects']) {
      const option = settings[channel], row = soundPanel.querySelector(`[data-sound-row="${channel}"]`);
      const toggle = row.querySelector('[data-sound-toggle]'), slider = row.querySelector('input');
      toggle.setAttribute('aria-checked', String(option.enabled));
      toggle.querySelector('span').textContent = option.enabled ? 'ON' : 'OFF';
      row.dataset.enabled = String(option.enabled);
      slider.value = String(option.volume); slider.setAttribute('aria-valuetext', `${option.volume}%`);
      slider.style.setProperty('--volume', `${option.volume}%`);
      row.querySelector('output').textContent = `${option.volume}%`;
    }
    soundPanel.querySelector('[data-sound-preview]').disabled = !channelOn('effects') || unavailable;
    const notice = soundPanel.querySelector('.sound-notice');
    notice.hidden = !unavailable; notice.textContent = unavailable ? '이 브라우저에서는 소리를 재생할 수 없어요.' : '';
  }
  function openSoundPanel(trigger) {
    if (soundPanel) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'sound-panel'; dialog.setAttribute('aria-labelledby','sound-panel-title');
    const note = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18V6l11-3v12M9 9l11-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="6" cy="18" rx="3" ry="2.5" fill="currentColor"/><ellipse cx="17" cy="15" rx="3" ry="2.5" fill="currentColor"/></svg>';
    dialog.innerHTML = `<header><h2 id="sound-panel-title">소리 설정</h2><button type="button" class="sound-close" data-sound-close aria-label="소리 설정 닫기">×</button></header>${['music','effects'].map(channel => `<section class="sound-channel" data-sound-row="${channel}"><div class="sound-channel-head"><span class="sound-channel-icon">${channel === 'music' ? note : soundIcon}</span><div><h3>${channel === 'music' ? '배경음악' : '효과음'}</h3><small>${channel === 'music' ? 'BGM' : '버튼 · 담기 · 도착'}</small></div><button type="button" role="switch" class="sound-switch" data-sound-toggle="${channel}" aria-label="${channel === 'music' ? '배경음악' : '효과음'}" aria-checked="${settings[channel].enabled}"><span></span><i aria-hidden="true"></i></button></div><div class="sound-volume"><input type="range" id="sound-volume-${channel}" data-sound-volume="${channel}" min="0" max="100" step="1" value="${settings[channel].volume}" aria-label="${channel === 'music' ? '배경음악' : '효과음'} 볼륨"><output for="sound-volume-${channel}"></output></div>${channel === 'effects' ? '<button type="button" class="sound-preview" data-sound-preview><span aria-hidden="true">▷</span> 들어보기</button>' : ''}</section>`).join('')}<p class="sound-notice" role="status" hidden></p><button type="button" class="sound-done" data-sound-close>완료</button>`;
    document.body.append(dialog); soundPanel = dialog;
    dialog.addEventListener('close', () => {
      dialog.remove(); soundPanel = null; updateSound();
      (trigger.isConnected ? trigger : document.querySelector('[data-game-sound]'))?.focus({preventScroll:true});
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    updateSound(); dialog.showModal();
  }
  function stopVoices(bus) {
    for (const [voice, output] of voices) {
      if (bus && bus !== output) continue;
      try { voice.stop(); } catch {}
      voices.delete(voice);
    }
  }
  function applyLevels() {
    if (!context) return;
    for (const [channel, bus, maximum] of [['music',music,.4],['effects',effects,.6]]) {
      if (!bus) continue;
      const target = channelOn(channel) ? settings[channel].volume / 100 * maximum : 0;
      bus.gain.cancelScheduledValues(context.currentTime);
      bus.gain.setTargetAtTime(target,context.currentTime,.025);
      if (!channelOn(channel)) stopVoices(bus);
    }
  }
  function syncScheduler() {
    const needed = soundOn() && channelOn('music');
    if (!needed && clock !== null) { clearInterval(clock); clock = null; }
    if (needed && clock === null) {
      nextStep = context.currentTime + .04; schedule(); clock = setInterval(schedule,60);
    }
  }
  function saveSettings() {
    write(settingsKey,JSON.stringify(settings));
    applyLevels(); syncScheduler(); updateSound();
    if (wantsAudio()) return startSound();
    hush(); return Promise.resolve();
  }
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  function tone(midi, at, duration, volume, type = 'sine', bus = music, slide = 0) {
    if (!context || !bus) return;
    const osc = context.createOscillator(), envelope = context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency(midi), at);
    if (slide) osc.frequency.exponentialRampToValueAtTime(frequency(midi + slide), at + duration);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + (bus === effects ? .004 : .008));
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(envelope); envelope.connect(bus); voices.set(osc,bus);
    osc.onended = () => { voices.delete(osc); osc.disconnect(); envelope.disconnect(); };
    osc.start(at); osc.stop(at + duration + .025);
  }
  // Eight original two-bar phrases, with rests and a soft bass: a 34-second loop.
  const melody = [
    [76,0,79,81,0,79,76,0,74,0,72,0,76,0,79,0],
    [81,0,79,0,76,74,0,72,0,0,74,76,0,0,0,0],
    [77,0,81,0,84,0,81,79,0,77,0,76,0,0,74,0],
    [74,0,79,0,83,81,0,79,0,76,74,0,72,0,0,0],
    [76,0,79,0,84,0,83,81,0,79,0,76,0,74,72,0],
    [81,0,84,0,83,0,81,0,79,0,76,74,0,0,0,0],
    [77,0,79,81,0,84,0,81,79,0,77,0,76,0,74,0],
    [79,0,83,0,86,0,83,81,79,0,74,0,72,0,0,0]
  ];
  const roots = [48,45,53,43,48,45,53,43], stepLength = 60 / 112 / 2;
  function schedule() {
    if (!soundOn() || !channelOn('music')) return;
    if (nextStep < context.currentTime - .1) nextStep = context.currentTime + .025;
    while (nextStep < context.currentTime + .18) {
      const phrase = Math.floor(step / 16) % 8, beat = step % 16, note = melody[phrase][beat];
      if (note) { tone(note, nextStep, .2, .13, 'triangle'); tone(note + 12, nextStep, .13, .025); }
      if (beat % 4 === 0) tone(roots[phrase] + (beat === 8 ? 7 : 0), nextStep, .3, .2);
      if (beat % 4 === 2) tone(79, nextStep, .035, .035, 'sine', music, -22);
      nextStep += stepLength; step = (step + 1) % 128;
    }
  }
  function hush() {
    if (clock !== null) clearInterval(clock); clock = null;
    stopVoices();
    if (context && context.state !== 'closed') context.suspend().catch(() => {});
    updateSound();
  }
  async function startSound() {
    if (!wantsAudio() || document.hidden || unavailable) return;
    unlocked = true;
    if (starting) return starting;
    starting = (async () => {
      try {
        if (!context) {
          const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
          if (!Audio) { unavailable = true; return; }
          context = new Audio();
          music = context.createGain(); music.gain.value = 0; music.connect(context.destination);
          effects = context.createGain(); effects.gain.value = 0; effects.connect(context.destination);
          context.addEventListener('statechange', () => {
            if (context.state !== 'running' && clock !== null) { clearInterval(clock); clock = null; }
            updateSound();
          });
        }
        await context.resume();
        if (!wantsAudio() || document.hidden) { hush(); return; }
        applyLevels(); syncScheduler();
      } catch { /* An in-app browser may refuse audio; the app stays usable. */ }
      finally { updateSound(); }
    })();
    await starting; starting = null;
  }
  let lastTap = -1;
  function effect(kind = 'tap') {
    if (!soundOn() || !channelOn('effects')) return;
    const now = context.currentTime + .006;
    if (kind === 'tap' && now - lastTap < .065) return;
    if (kind === 'tap') lastTap = now;
    const notes = {tap:[79],add:[72,79],tick:[84],stop:[76,81],send:[72,76,79],success:[72,76,79,84],arrival:[79,84,88]};
    (notes[kind] || notes.tap).forEach((note, index) => tone(note, now + index * .075, kind === 'tick' ? .035 : .16, kind === 'tick' ? .06 : .13, 'sine', effects, kind === 'tap' ? 3 : 0));
  }
  function cardHTML(index) {
    const food = FOOD_CHARACTERS[index];
    return `<span class="food-reel-frame"><img class="food-mascot" src="${food.src}" alt="" decoding="async"></span>`;
  }
  function homeHTML() {
    return `<div class="home-play-tools"><span class="draw-caption">오늘은 뭐 담지?</span><div>${soundButton()}<button type="button" class="game-shuffle" data-game-shuffle aria-label="음식 캐릭터 조합 다시 뽑기">${shuffleIcon}<span>다시 뽑기</span></button></div></div><div class="scene-orders food-roulette" aria-label="오늘의 음식 캐릭터">${choices.map(index => `<div class="roulette-card"><span class="food-reel" aria-hidden="true"><span class="food-reel-strip">${cardHTML(index)}</span></span><b>${FOOD_CHARACTERS[index].name}</b><span class="reel-spark" aria-hidden="true">✦</span></div>`).join('')}</div><span class="roulette-announcement sr-only" role="status" aria-live="polite"></span>`;
  }
  function cancelSpin() {
    if (!activeSpin) return;
    for (const timer of activeSpin.timers) clearTimeout(timer);
    for (const animation of activeSpin.animations) animation.cancel();
    const root = activeSpin.root;
    root.querySelectorAll('.roulette-card').forEach((card, slot) => {
      card.querySelector('.food-reel-strip').innerHTML = cardHTML(choices[slot]);
      card.querySelector('b').textContent = FOOD_CHARACTERS[choices[slot]].name;
      card.classList.remove('rolling');
    });
    root.removeAttribute('aria-busy');
    const button = root.parentElement?.querySelector('[data-game-shuffle]');
    if (button) { button.disabled = false; button.classList.remove('spinning'); }
    activeSpin = null;
  }
  function spin(root, again = false) {
    if (!root || activeSpin?.root === root) return;
    cancelSpin();
    if (again) { choices = draw(choices); write('damatda-home-draw', JSON.stringify(choices)); }
    played = true;
    const state = activeSpin = {root, timers:[], animations:[]};
    const cards = [...root.querySelectorAll('.roulette-card')];
    const button = root.parentElement.querySelector('[data-game-shuffle]');
    const later = (fn, delay) => { state.timers.push(setTimeout(() => { if (activeSpin === state && root.isConnected) fn(); }, delay)); };
    if (button) { button.disabled = true; button.classList.add('spinning'); }
    root.setAttribute('aria-busy', 'true');
    const settle = slot => {
      const card = cards[slot], index = choices[slot];
      card.querySelector('.food-reel-strip').innerHTML = cardHTML(index);
      card.querySelector('b').textContent = FOOD_CHARACTERS[index].name;
      card.classList.remove('rolling'); card.classList.add('landed');
      if (!reduced()) effect(slot === 2 ? 'success' : 'stop');
    };
    const complete = () => {
      root.removeAttribute('aria-busy');
      if (button) { button.disabled = false; button.classList.remove('spinning'); }
      const status = root.parentElement.querySelector('.roulette-announcement');
      if (status) status.textContent = choices.map(index => FOOD_CHARACTERS[index].name).join(', ') + '. 다맛다!';
      activeSpin = null;
    };
    if (reduced() || !cards[0]?.animate) { cards.forEach((_, i) => settle(i)); complete(); return; }
    cards.forEach((card, slot) => {
      card.classList.remove('landed'); card.classList.add('rolling');
      const strip = card.querySelector('.food-reel-strip'), height = card.querySelector('.food-reel').clientHeight;
      const sequence = Array.from({length: 10 + slot * 3}, () => random(FOOD_CHARACTERS.length));
      sequence.push(choices[slot]); strip.innerHTML = sequence.map(cardHTML).join('');
      card.querySelector('b').textContent = '두구두구';
      const duration = 1000 + slot * 340;
      const animation = strip.animate([{transform:'translateY(0)'},{transform:`translateY(-${height * (sequence.length - 1)}px)`}], {duration, easing:'cubic-bezier(.12,.55,.14,1)', fill:'forwards'});
      state.animations.push(animation);
      later(() => { animation.cancel(); settle(slot); if (slot === 2) complete(); }, duration);
    });
    [0,90,190,310,460,640,850].forEach(delay => later(() => effect('tick'), delay));
  }
  function mount() {
    // Rendered summaries can update during a spin: replace the old animation, not the draw.
    cancelSpin();
    const root = document.querySelector('.food-roulette');
    const header = document.querySelector('#app .top');
    if (!root && header && !header.querySelector('[data-game-sound]')) header.insertAdjacentHTML('beforeend', soundButton(true));
    updateSound();
    if (root && !played) spin(root);
  }
  document.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const sound = event.target.closest('[data-game-sound]');
    if (sound) {
      startSound(); openSoundPanel(sound); return;
    }
    const toggle = event.target.closest('[data-sound-toggle]');
    if (toggle) {
      const channel = toggle.dataset.soundToggle;
      if (!['music','effects'].includes(channel)) return;
      settings[channel].enabled = !settings[channel].enabled;
      saveSettings().then(() => { if (channel === 'effects' && settings.effects.enabled) effect('add'); });
      return;
    }
    if (event.target.closest('[data-sound-close]')) { soundPanel?.close(); return; }
    if (event.target.closest('[data-sound-preview]')) { startSound().then(() => effect('add')); return; }
    if (event.target.closest('.sound-panel')) return;
    // Any deliberate first click unlocks audio; reload never circumvents autoplay policy.
    startSound();
    const shuffle = event.target.closest('[data-game-shuffle]');
    if (shuffle && !shuffle.disabled) { spin(document.querySelector('.food-roulette'), true); return; }
    const button = event.target.closest('button,a[href],summary');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    const action = button.dataset.act || '';
    if (/^(plus|qty-plus|sheet-add|sheet-done|sheet-save)$/.test(action)) effect('add');
    else if (/^send/.test(action)) effect('send');
    else effect('tap');
  }, true);
  document.addEventListener('input', event => {
    if (!event.isTrusted) return;
    const input = event.target.closest('[data-sound-volume]');
    if (!input || !['music','effects'].includes(input.dataset.soundVolume)) return;
    const value = Number(input.value); if (!Number.isFinite(value)) return;
    settings[input.dataset.soundVolume].volume = Math.round(Math.min(100,Math.max(0,value)));
    saveSettings();
  });
  document.addEventListener('change', event => {
    if (event.isTrusted && event.target.closest('[data-sound-volume="effects"]')) startSound().then(() => effect('tap'));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelSpin(); hush(); } else if (unlocked && wantsAudio()) startSound();
  });
  addEventListener('pagehide', () => { cancelSpin(); hush(); });
  addEventListener('pageshow', () => { if (unlocked && wantsAudio()) startSound(); });
  // Other open tabs share only the audio preference, not an AudioContext.
  addEventListener('storage', event => {
    if (event.key !== settingsKey) return;
    settings = readSettings(event.newValue);
    applyLevels(); syncScheduler(); updateSound();
    if (!wantsAudio()) hush(); else if (unlocked) startSound();
  });
  return {homeHTML, mount, effect};
})();
