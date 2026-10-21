// Animate the three actual approved logo cards, without changing the artwork.
let brandMotionId = 0;
function brandMotion(mode = 'loading') {
  const id='damatda-motion-'+(++brandMotionId),src=brandAsset();
  const crops=[
    'M136 448Q138 424 168 417L263 396Q298 390 311 424L337 541Q342 572 313 585L210 608Q173 615 159 573Z',
    'M321 414Q321 363 363 362L483 367Q520 370 521 411L515 550Q515 590 480 595L353 591Q317 590 315 554Z',
    'M532 435Q542 391 576 400L675 427Q707 439 696 480L675 566Q666 601 628 604L540 582Q513 573 516 545Z'
  ];
  return `<div class="brand-motion ${mode}" aria-hidden="true"><svg class="motion-cards" xmlns="http://www.w3.org/2000/svg" viewBox="95 330 660 350"><defs>${crops.map((d,i)=>`<clipPath id="${id}-${i}"><path d="${d}"/></clipPath>`).join('')}</defs>${crops.map((_,i)=>`<g class="motion-piece piece-${i}" style="--step:${i}"><image href="${src}" width="1536" height="1024" clip-path="url(#${id}-${i})"/></g>`).join('')}<path class="motion-tray" d="M132 563C153 646 258 642 423 640C592 639 674 645 720 552" fill="none" stroke="#00776f" stroke-width="27" stroke-linecap="round"/></svg><div class="motion-step-labels"><span style="--step:0">고르고</span><span style="--step:1">담아서</span><span style="--step:2">보내기</span></div></div>`;
}
function brandMotionWord(){
  const id='damatda-word-'+(++brandMotionId),src=brandAsset();
  return `<svg class="motion-word" xmlns="http://www.w3.org/2000/svg" viewBox="750 350 690 275"><defs>${[750,980,1200].map((x,i)=>`<clipPath id="${id}-${i}"><rect x="${x}" y="350" width="${i===0?230:i===1?220:240}" height="275"/></clipPath>`).join('')}</defs>${[0,1,2].map(i=>`<g style="--step:${i}"><image href="${src}" width="1536" height="1024" clip-path="url(#${id}-${i})"/></g>`).join('')}</svg>`;
}
function brandLoadingView(){
 return `<section class="brand-loading" role="status" aria-live="polite" aria-busy="true">${brandMotion('loading')}<h2>방을 여는 중<span class="loading-dots" aria-hidden="true">···</span></h2></section>`;
}
