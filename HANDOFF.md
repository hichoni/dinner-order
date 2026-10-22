# 다맛다 인수인계 — 2026-10-22 공유 메뉴·집계·이름 선택

## 완료 상태

이름 확정 후 메뉴 진입, 직접 입력한 메뉴의 모임 내 공유, 사람별·가게별 집계 정리를 운영에 배포했다. Firestore 규칙을 먼저 배포한 뒤 GitHub Pages 앱을 반영했다.

| 항목 | 현재 기준 |
| --- | --- |
| 운영 앱 | https://hichoni.github.io/dinner-order/?v=shared3 |
| 운영 저장소 / 브랜치 | `hichoni/dinner-order` / `main` |
| 원본 저장소 / 작업 브랜치 | `hichoni/app-gallery` / `claude/tender-tesla-aext4z` |
| 원본 폴더 | `apps/dinner-order/room/` |
| 원본 기능 커밋 | `4ee9dc7c9e661a0eaf8379c0d7d545edc9af995e` |
| 공개 앱 기능 커밋 | `45ac6d2eb4bfa0f6b01db45dea2c3533497e02b3` |
| 앱 배포 커밋 | `b7b407db432b23839bb6463c3e17db94a8348efe` |
| Pages 검증 | [실행 39725500239 성공](https://github.com/hichoni/dinner-order/actions/runs/39725500239) |
| 운영 버전 표식 | `2026-10-22-shared-menus-compact` |
| Firebase 프로젝트 | `ai-invent`, Firestore 기본 데이터베이스 |
| 서버 규칙 적용 | 2026-10-22 13:59:31 KST |
| 운영 규칙 SHA-256 | `baba132888fb1244a78e87ae15de1976de307d82e1f0d3e1c1ef29d5e8548ac7` |

이후 문서 커밋은 기능 코드를 바꾸지 않는다. 원본의 기본 브랜치에 병합한 상태는 아니다. 원본 기본 브랜치 이름은 `claude/intelligent-heisenberg-cuxzte`이며, 그곳의 오래된 규칙으로 현재 운영 규칙을 덮어쓰지 말 것.

## 이름 선택 오류

기존 캐릭터 확정 로직이 여러 종류의 권한 오류를 모두 “이미 선택된 이름”으로 안내했다. 실패 원인을 구분하고 재시도 및 “캐릭터는 나중에 · 메뉴 보기” 경로를 추가했다. 프로필을 읽지 못한 경우에도 메뉴를 먼저 볼 수 있다. 저장이 승인되기 전에는 캐릭터가 공유된 것으로 확정하지 않는다. 비동기 저장 중 방이나 이름이 바뀌면 이전 응답으로 잘못 이동하지 않는다.

최초 신고 이름의 구체적 거절은 재현되지 않았다. 운영 전체 규칙에 profiles 권한이 존재했고, 에뮬레이터의 실제 확정 함수와 운영 앱의 별도 확인 이름으로 정상 저장·메뉴 이동을 확인했다. “서버 규칙이 빠져 있었다”는 결론으로 기록하지 않는다.

운영 확인 이름은 `동작확인_1022`이다. 캐릭터 프로필만 저장했으며 실제 주문을 전송하지 않았다. 이 프로필은 주문 집계에 포함되지 않는다. 사용자의 이름을 대신 선점하거나 기존 주문을 수정하지 않았다.

## 메뉴 직접 담기와 공유

화면 흐름: 메뉴 목록 → **찾는 메뉴가 없나요? / 메뉴 직접 담기 ＋** → 메뉴명·가격·수량 → **메뉴에 추가하고 담기**.

- 새 메뉴는 **해당 모임의 해당 가게**에 저장되고 모든 참여자의 메뉴에 실시간으로 합쳐진다. 다른 모임이나 전역 가게 카탈로그까지 바꾸지는 않는다.
- 공유 등록과 장바구니 추가까지만 한다. 최종 주문은 기존 보내기 동작이 필요하다.
- 같은 가게와 정규화된 메뉴명은 동일한 ID를 사용한다. 공백·대소문자·유니코드 표기 차이를 정규화한다. 기존 메뉴가 있거나 동시에 같은 메뉴를 추가하면 먼저 저장된 메뉴와 가격을 사용한다.
- 가격은 필수이며 정수 0–10,000,000원, 이름은 1–40자, 수량은 1–30개다.
- 예산 초과 메뉴는 공유 목록에 생길 수 있지만 본인 장바구니에는 넣지 않고 안내한다.
- 직접 추가 항목은 “직접 추가” 표시를 붙인다. 주문 취소나 장바구니 삭제가 공유 메뉴 자체를 삭제하지 않는다.
- 가게 설정을 저장할 때 파생된 공유 메뉴를 원본 메뉴 배열에 다시 넣지 않는다.
- 마감된 방에서는 직접 담기를 열지 않는다. 공유 규칙은 기존 방의 closed/명단 모델을 따른다.

저장 위치:

```text
dinnerRooms/{roomId}/sharedMenus/{menuId}
menuId = custom- + SHA256(가게 ID + 정규화 메뉴명)의 앞 30자리
{ storeId, storeIndex, name, price, uid, by, at }
```

참여자는 유효한 새 항목을 만들고 읽을 수 있다. 기존 항목 수정·덮어쓰기·삭제는 허용하지 않는다. 방장은 삭제할 수 있다. 가게 존재·가격·작성 UID·명단·closed 상태·서버 시간을 규칙으로 검증한다. 앱의 다른 권한을 완화하지 않았다.

## 집계 화면

- 사람별: 캐릭터·이름 / 메뉴와 수량 / 금액 / 삭제 아이콘을 짧은 행에 배치했다. 긴 메뉴와 요청사항은 필요한 만큼 줄바꿈한다.
- 삭제 아이콘은 접근성 이름·설명을 갖는다. 기존 두 번 확인 절차를 유지하고, 첫 클릭 때 아이콘 폭이 커지지 않는다.
- 가게별: **메뉴 옆에 고른 사람과 개인 수량**을 표시한다. 전체 명단을 보고 매칭할 필요가 없다.
- 동일 메뉴의 주문 당시 가격이 달라도 합계는 실제 주문 금액을 더한다.
- 가게별 요청사항·복사·예산·인쇄 기능을 유지했다. 모바일의 초대·참여 현황 여백도 줄였다.

## 검증 결과

앱·오디오·이름 선택·공유 메뉴 테스트 **55개**, 실제 운영 전체 규칙에 새 규칙을 합친 Firestore 에뮬레이터 테스트 **13개**, 총 **68개 통과**.

규칙 테스트에는 신규 프로필 확정 함수 → 메뉴 이동, 다른 참여자의 onSnapshot 수신, 잘못된 가격·가게·UID·명단·closed·시간 거부, 기존 항목 덮어쓰기·참여자 삭제 거부, 방장 삭제 허용이 포함된다.

로컬 모의 화면에서 메뉴 입력 → 공유 목록 노출 → 장바구니 추가를 확인했다. 모의 주문 수는 변하지 않았다. 데스크톱, 모바일 390px와 320px에서 집계를 검수했다. 운영에서는 캐릭터 확정 → 메뉴 이동, 메뉴별 사람 표시, 버전 표식, 오류 로그가 없는 것을 확인했다. 기존 주문은 8건 / 29,600원을 유지했다.

최초 제보 모임은 확인 시점에 표시 마감시간(10월 22일 오전 11:02)이 지나 있었다. 메뉴 진입은 가능하지만 새 주문/직접 담기에는 기존 마감 정책이 적용된다. 새 기능을 보려고 이 방의 마감을 임의로 바꾸지 않았다.

## 이어서 수정할 파일

| 원본 경로 | 역할 |
| --- | --- |
| `room.js` | 실제 앱 상태·Firebase 구독·장바구니·집계 |
| `preview/avatar-picker.js`, `avatar-picker.css` | 이름/캐릭터 확정, 오류 안내·복구 |
| `preview/shared-menu.js` | 공유 메뉴 정규화·저장·중복 처리·입력 UI |
| `preview/dense-shared.css` | 공유 메뉴와 촘촘한 집계·모바일 배치 |
| `brand.css`, `preview/theme.css` | 운영/미리보기 스타일 반영본 |
| `preview/preview.html` | Firebase에 쓰지 않는 모의 화면 |
| `rooms.rules` | dinnerRooms 관련 규칙 블록 |
| 저장소 루트 `firestore.rules` | 현재 전체 운영 규칙 + sharedMenus |
| `test/name-entry.test.mjs`, `shared-menu.test.mjs` | 이번 앱 회귀 검증 |
| `test/rules.test.mjs`, `runtime.mjs` | 전체 규칙·실제 확정 함수 통합 검증 |
| `build.py` | 전체 원본 저장소에서 dist 생성 |

별도 helper와 room.js·preview.html 안의 인라인 helper를 함께 수정한다. 공개 index.html의 모듈은 room.js와 같아야 한다. 공개 preview.html의 모의 Firebase 어댑터를 실제 Firebase 어댑터로 바꾸지 않는다.

## 빌드·테스트·배포

전체 원본 저장소에서:

```sh
node --test apps/dinner-order/room/test/unit.test.mjs apps/dinner-order/room/test/play.test.mjs apps/dinner-order/room/test/name-entry.test.mjs apps/dinner-order/room/test/shared-menu.test.mjs
python3 apps/dinner-order/room/build.py
```

build.py는 src 설정·공통 CSS·Firebase vendor·브랜드 에셋도 필요하다. 이번 로컬 작업 폴더는 필요한 파일을 가져온 부분 작업본이므로 여기서 build.py만 실행하면 누락 파일 오류가 날 수 있다. 이번에는 기존 공개 번들의 에셋·카탈로그를 유지하면서 모듈과 CSS를 동기화했다.

규칙 테스트는 Firebase 13.0.0, rules-unit-testing 6.0.0, firebase-tools 15.34.0, Java 21을 사용했다. 반드시 실제 최신 전체 규칙을 FULL_RULES로 지정하고 demo 프로젝트 에뮬레이터에 실행한다. 운영 데이터로 테스트하지 않는다.

재배포 순서:

1. 최신 운영 규칙과 소스 규칙을 비교한다. 다른 앱 규칙을 유지한 채 필요한 블록만 병합한다.
2. 앱 테스트와 전체 규칙 에뮬레이터 테스트를 통과시킨다.
3. `firebase deploy --project ai-invent --only firestore:rules`로 규칙을 먼저 배포하고 다시 읽어 일치를 확인한다.
4. 원본 작업 브랜치를 보존하고, 공개 dist 파일을 dinner-order/main에 반영한다. 같은 파일의 동시 변경을 확인하고 강제 덮어쓰지 않는다.
5. version.json의 버전·applicationCommit·sourceCommit을 갱신한다. Pages 실행 성공과 실제 공개 버전을 확인한다.
6. 실제 주문을 보내지 않는 범위에서 이름 진입·모인 메뉴를 확인한다.

현재 운영 규칙은 Firebase 콘솔 편집기의 MutationObserver 화면 오류 때문에 사용자가 승인한 Cloud Shell과 공식 Firebase CLI로 배포했다. Cloud Shell 인증 정보·토큰은 저장소/문서로 내보내지 않았다. 배포 전후 규칙 비교 및 게시 후 SHA-256 확인을 수행했다. API 참고: [Firebase Rules API](https://firebase.google.com/docs/reference/rules/rest).

규칙 이전 버전: `b5186ec5-882e-4f3e-91fd-febddea74af8`. 적용 버전: `c64d3ca0-14ed-44b5-abc2-707102eb89ed`. 롤백이 필요해도 다른 앱의 후속 변경이 있는지 먼저 비교한다. 앱만 이전 커밋으로 되돌려도 공유 메뉴 문서는 자동으로 사라지지 않는다.

## 기존 제품 방향 유지

투명 로고, 음식 캐릭터 16종 × 배경색 6종, 홈 룰렛, BGM·효과음 독립 ON/OFF와 볼륨, 두 테마를 유지했다. 기본 음량은 BGM 25%, 효과음 70%다. 별도 폰트/브랜드/카탈로그 재설계는 하지 않았다. 이전의 상세 배경은 [직전 인수인계](HANDOFF-2026-10-22-audio.md)에 보관한다.

## 이번 로컬 작업 기록

작업 폴더: `D:/WINDOWS/Documents/ChatGPT/다맛다`.

- `HANDOFF.md`: 이 문서. 원본 앱 폴더와 공개 저장소에도 같은 내용을 반영한다.
- `.review/firestore.production.before.rules`, `.review/firestore.production.fixed.rules`: 운영 원본·검증 후 규칙 백업.
- `.review/unit-final.log`, `.review/rules-final.log`: 통과 로그.
- `.review/prepare-release.cjs`: 이번 부분 작업본의 번들 동기화 스크립트.
- `.review/firebase-deploy.py`: 검증한 규칙과 현재 운영본을 비교한 뒤 공식 CLI로 배포하고 재확인한 스크립트.
- `release/dinner-order/`: 공개 저장소 작업본.
- `.test-tools/`: 로컬 테스트 전용 의존성·Java. 전역 설치하지 않았다.

.review, .test-tools, release는 로컬 .gitignore에 포함된다. 토큰·서비스 계정 키를 인수인계에 추가하지 않는다.
