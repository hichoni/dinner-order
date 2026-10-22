# 다맛다 인수인계 — 2026-10-22

> **안동 생활권 확장 후속 작업:** [HANDOFF-ANDONG.md](HANDOFF-ANDONG.md)에 동네별 자료 확보, 검색·메뉴 펼침, 자동 가격·폐업 연동 조사와 검증 범위를 정리했다. 이 확장 작업은 검토용이며 아직 운영 배포하지 않았다. 아래 운영 SHA는 직전 배포 기록이다.

## 현재 상태

**BGM·효과음 개별 ON/OFF 및 볼륨 조절까지 운영 배포 완료.** 이 문서를 현재 구현 기준으로 읽는다. README와 이전 변경 문서의 캐릭터 수, 공유 이미지, 카카오 캐시 상태 등은 작업 당시의 기록이다.

| 항목 | 현재 기준 |
| --- | --- |
| 운영 앱 | <https://hichoni.github.io/dinner-order/> |
| 이번 버전 바로 열기 | <https://hichoni.github.io/dinner-order/?v=audio2> |
| 운영 저장소 / 브랜치 | `hichoni/dinner-order` / `main` |
| 원본 저장소 / 작업 브랜치 | `hichoni/app-gallery` / `claude/tender-tesla-aext4z` |
| 원본 앱 폴더 | `apps/dinner-order/room/` |
| 공개 앱 코드 커밋 | `289ff1581143f1f6cdf2974cae5f6d5afef684ab` |
| 원본 코드 커밋 | `656d8a201810f22529168724818a2c5ba6d855fc` |
| 배포 트리거 커밋 | `3b688f550893249ff338bf3c03403b1a6426a57d` |
| 배포 확인 | [GitHub Pages 실행 39687536766 성공](https://github.com/hichoni/dinner-order/actions/runs/39687536766) |
| 버전 표식 | `version.json`: `2026-10-22-independent-audio` |

위 SHA는 기능 배포 시점이다. 이 인수인계 문서와 README를 추가하는 후속 커밋은 기능 코드를 바꾸지 않는다. 원본 작업 브랜치의 변경을 `app-gallery/main`에 병합한 상태는 아니다.

## 빠르게 화면 보기

- [전체 화면 모음](https://hichoni.github.io/dinner-order/screens.html): 실제 방을 만들지 않고 화면별 비교.
- [모바일 첫 방문](https://hichoni.github.io/dinner-order/mobile.html?screen=home-empty&palette=sky)
- [모바일 이름 선택](https://hichoni.github.io/dinner-order/mobile.html?screen=who&palette=sky)
- [로딩·전송 모션](https://hichoni.github.io/dinner-order/motion.html)
- [음식 캐릭터·아이콘](https://hichoni.github.io/dinner-order/assets.html)

운영 `index.html`은 실제 Firebase에 연결한다. 공개 `preview.html`과 화면 모음의 예시는 브라우저 내부 모의 데이터로 동작한다. 실제 주문방으로 테스트 주문을 보내지 말 것.

## 브랜드와 UI 방향

- 이름은 **다맛다**. 각자 메뉴를 골라 담고 총무에게 보내는 서비스다. 첫 CTA는 `같이 담기 시작`.
- 민트·귤, 블루·레몬 두 테마. 투명한 글라스 카드, 읽기 쉬운 메뉴·가격, 작은 화면에서 적은 스크롤을 유지한다.
- 모바일 홈은 로고 카드가 먼저, 그 아래 같이 담기 버튼. 큰 소개 문구는 모바일에서 숨긴다. 모임이 없을 때는 빈 그릇을 보여준다.
- 귀엽고 동글동글한 음식 캐릭터. 팔다리는 붙이지 않는다. 불필요한 설명 문구를 늘리지 않는다.
- 방 생성의 모임 안내·마감·한턱 설정은 별도 펼치기 안에 숨기지 않는다.
- 주변 맛집은 안동 동네별로 찾도록 확장했다. 기존 **도청신도시 / 풍산읍**도 유지한다. [확장 인수인계](HANDOFF-ANDONG.md)의 확보 범위를 참고하고 수련원 중심 표현으로 되돌리지 않는다.
- 헤더의 개인 식별자는 `내 이름 · 이름`. 가게 이름처럼 오해하게 단독 노출하지 않는다.

## 완료된 기능

### 투명 로고·캐릭터

- 로고는 `assets/brand-mint-alpha-v1.png`, `assets/brand-sky-alpha-v1.png`의 실제 알파 채널 PNG다. `brandAsset()`이 테마별 파일을 선택한다.
- 헤더 로고는 이미지 한 장. 흰 사각형을 CSS 혼합 모드로 숨기는 방식은 제거했다. 오래된 `brand.png` 등을 다시 연결하지 않는다.
- 로딩·전송 애니메이션은 별도 SVG 기반. 큰 브랜딩 이미지를 확대하거나 잘라 붙인 로딩 화면으로 되돌리지 않는다.
- 음식 캐릭터 16종 × 배경색 6종. 밥, 치킨, 아이스티, 김밥, 면, 베이글, 커피, 떡볶이, 초밥, 아아, 식빵, 짜장면, 유부초밥, 우동, 탕수육, 짬뽕.
- 이름 선택 시 직접 캐릭터·배경색 선택과 랜덤 뽑기 지원. 확정된 선택은 다른 참여자·총무에게도 동일하게 보인다.

### 홈 룰렛

- `DamatdaPlay`가 16종에서 서로 다른 세 캐릭터를 뽑는다. 새 페이지 로드 시 이전과 각 자리의 음식이 다르게 나온다.
- 세 카드가 세로로 굴러가고 약 1.0 / 1.34 / 1.68초에 순서대로 멈춘다. `다시 뽑기`로 재실행.
- 모임 요약 갱신 등 일반 재렌더에서는 같은 조합을 유지한다. 실제 주문이나 사용자의 아바타는 바꾸지 않는다.
- `prefers-reduced-motion`에서는 움직임 없이 결과만 표시한다.

### BGM·효과음 — 이번 변경

- 홈과 내부 헤더의 **소리 설정** 버튼 → 글라스 설정창.
- **배경음악 / 효과음 각각 ON/OFF**, 각각 **0–100% 볼륨 슬라이더**.
- 기본값: **BGM 25%, 효과음 70%**. 음악 출력은 이전보다 작게, 효과음은 더 분명하게 조정했다.
- 효과음 `들어보기` 버튼. 효과음이 꺼졌거나 볼륨이 0이면 비활성화.
- 슬라이더는 즉시 적용·저장된다. 스위치를 껐다 켜도 그 채널의 볼륨을 기억한다. 볼륨 0은 무음이며 스위치 자체를 바꾸지는 않는다.
- BGM을 꺼도 효과음은 재생된다. 효과음을 꺼도 BGM은 이어진다. 두 채널 모두 무음이면 오디오 처리를 멈춘다.
- Web Audio로 직접 합성하는 약 34초, 112 BPM의 반복 음악. 외부 음악 파일이나 오디오 권한 요청을 쓰지 않는다.
- 일반 버튼, 담기, 전송, 완료, 도착, 룰렛에 서로 다른 효과음.
- 첫 실제 클릭/탭 이후에 오디오를 시작한다. 브라우저 자동 재생 제한을 우회하지 않는다.
- 탭이 숨겨지거나 페이지를 떠나면 정지. 돌아올 때에는 이미 활성화했던 채널만 재개한다. 여러 번 클릭해도 AudioContext·음악 타이머를 중복 생성하지 않는다.
- 설정창은 native `dialog`: Escape 닫기, 포커스 제한, 닫은 뒤 소리 버튼으로 포커스 복귀.

### 주문·알림

- `고르기 → 장바구니 → 보내기 전 확인 → 보내기` 흐름. 메뉴명·가격과 고정 하단 버튼의 가독성을 유지한다.
- 전송 성공을 확인한 뒤에만 마지막 `다맛다!`를 표시한다. 실패를 성공처럼 연출하지 않는다.
- 총무 화면에서 다른 참여자의 새 주문·수정을 실시간으로 알린다. 현재는 **열린 앱 안의 알림**이며 백그라운드 푸시는 구현하지 않았다.
- 가게별 요청사항 `storeReqs`를 장바구니·확인·제출 내역·집계·복사 메시지까지 유지한다.

## 저장 위치와 호환성

| 데이터 | 위치 / 의미 |
| --- | --- |
| 소리 설정 | localStorage `damatda-audio-v2` |
| 설정 형식 | `{music:{enabled:true,volume:25},effects:{enabled:true,volume:70}}` |
| 이전 음소거 | 새 설정이 없으면 기존 `damatda-sound=off`를 읽어 두 채널 모두 OFF로 시작 |
| 직전 홈 조합 | localStorage `damatda-home-draw` |
| 테마 | localStorage `damatda-palette` |
| 확정 아바타 | Firestore `dinnerRooms/{roomId}/profiles/{encodeURIComponent(name).slice(0,400)}` |
| 아바타 문서 | `{name,food,tone,uid,updatedAt}` |
| 주문 | Firestore `dinnerRooms/{roomId}/answers/...` |

소리·볼륨은 기기 환경설정이므로 해당 브라우저에 저장한다. **아바타는 기기 전용 설정이 아니다.** 서버 프로필을 우선하고 실시간으로 공유한다. 본인 또는 총무만 변경하며, 예전 본인 로컬 선택은 조건에 맞을 때 한 번 이관한다. 저장 실패나 저장 중 방 이동에서도 다른 방의 프로필을 덮어쓰지 않도록 처리했다.

이번 룰렛·사운드 작업은 Firestore 스키마·보안 규칙을 변경하지 않았다. 추후 규칙 수정 시에는 최신 운영 전체 규칙을 확인하고 해당 부분만 병합해야 한다. 오래된 브랜치의 루트 규칙 전체를 그대로 배포하지 않는다.

## 공유 미리보기

- 이미지: `assets/share-damatda-tight-v4.png` (1774 × 887).
- 이미지 문구: `얼른 담아! 우리끼리 먹는다?`
- 제목: `다맛다 — 총무도 밥 좀 먹자.`
- 설명: `“난 아무거나”는 메뉴에 없어요 😎 먹고 싶은 거 담아 보내!`
- 이미지·제목·설명에 같은 슬로건을 세 번 반복하지 않는다.
- 공유 링크의 `?v=damatda2`와 기존 방 해시/관리 키 처리를 유지한다.
- 앞선 공유 이미지 작업에서 기본 주소와 `?v=damatda2`의 카카오 캐시를 초기화하고 확인했다. 이번 사운드 변경에서는 OG 메타데이터를 바꾸지 않았으므로 캐시 초기화를 다시 하지 않았다.

## 코드와 빌드

### GitHub에서 이어서 작업할 때

원본 저장소의 위 작업 브랜치를 받아 `apps/dinner-order/room/`부터 읽는다.

| 원본 저장소 경로 | 역할 |
| --- | --- |
| `room.js` | 브랜딩·아바타·모션·DamatdaPlay를 포함한 앱 JS 전체 |
| `brand.css` | 브랜드 스타일을 합친 CSS |
| `preview/play.js`, `preview/play.css` | 룰렛·소리 설정의 분리된 구현 파일 |
| `preview/avatar-picker.js`, `preview/avatar-picker.css` | 아바타 선택 UI |
| `preview/brand-motion.js`, `preview/brand-motion.css`, `preview/motion.js` | 로딩·전송·도착 모션 |
| `preview/preview.html` | 모의 데이터를 사용하는 독립 미리보기 번들 |
| `assets/brand-icons.js` | 음식 목록, 아바타 렌더링, 아이콘 |
| `build.py` | 운영 `dist/index.html` 및 자산 생성 |
| `test/unit.test.mjs`, `test/play.test.mjs` | 앱 회귀 / 룰렛·오디오 테스트 |

저장소 루트에서:

```sh
node --check apps/dinner-order/room/room.js
node --test apps/dinner-order/room/test/unit.test.mjs apps/dinner-order/room/test/play.test.mjs
python3 apps/dinner-order/room/build.py
```

`build.py`는 같은 저장소의 `apps/dinner-order/src/config.json`, 스타일과 `site/vendor/firebase.js` 등을 사용하므로 room 폴더만 떼어 실행하지 않는다. 생성된 `room/dist/`의 파일과 자산 디렉터리를 공개 저장소에 함께 반영한다.

**현재 코드가 인라인 번들에 들어간다는 점에 주의:** 분리된 `preview/play.js`만 고쳐서는 이미 생성된 운영 `index.html`이나 미리보기 번들에 적용되지 않는다. `room.js`, `brand.css`, `preview/preview.html`도 함께 반영하고 빌드해야 한다. `build.py`는 이미 생성된 preview 페이지를 복사하며 미리보기 JS를 다시 조립하지 않는다.

### 현재 로컬 작업 폴더에서 이어갈 때

아래 경로는 이 대화의 작업 폴더 기준이다. `work/`의 편집·조립 도구는 로컬에 있으므로 다른 컴퓨터에 자동으로 존재한다고 가정하지 않는다.

| 로컬 경로 | 역할 |
| --- | --- |
| `work/damatda/source-room.js` | 앱 편집 원본 |
| `work/damatda/home.js` | 홈 템플릿; 빌드 때 기존 viewHome 부분을 교체 |
| `outputs/damatda-app/play.js`, `play.css` | 현재 룰렛·오디오 편집 원본 |
| `outputs/damatda-app/theme.css`, `motion.js` | 브랜드 배치와 공통 모션 |
| `work/damatda/build-preview.cjs` | 앱 JS·CSS 조립, 모의 미리보기 생성 |
| `work/damatda/release-v2.cjs` | 운영 index 번들·현재 공유 메타데이터 반영 |
| `work/damatda/prepare-release.cjs` | 미리보기와 자산을 release 폴더로 복사 |
| `work/damatda/deploy/release/` | 공개 저장소에 올릴 운영 파일 |
| `work/damatda/deploy/release-state.json` | 배포 기록 |
| `outputs/damatda-app/검증.txt` | 누적 검증 기록 |

```powershell
node work/damatda/build-preview.cjs
node --check outputs/damatda-app/source/room.js
node --check work/damatda/preview-check.mjs
Copy-Item outputs/damatda-app/source/room.js work/damatda/deploy/room/room.js
node --test work/damatda/deploy/room/test/unit.test.mjs work/damatda/deploy/room/test/play.test.mjs
node work/damatda/release-v2.cjs
node work/damatda/prepare-release.cjs
```

- 로컬 `outputs/damatda-app/index.html`은 **모의 앱**이다. 공개 저장소의 `index.html`로 덮어쓰지 않는다. 이것은 공개 `preview.html`로 배포한다.
- 진짜 운영 index는 `work/damatda/deploy/release/index.html`이다.
- 분리 편집 원본을 고친 뒤 조립한다. 생성된 `outputs/damatda-app/source/room.js`만 수정하면 다음 조립 시 덮어써진다.
- 로컬 미리보기 서버: `node work/damatda/serve.cjs` → `http://127.0.0.1:8788/`. 이미 8788 포트가 사용 중이면 중복 실행하지 않는다.

## 배포·검증 결과

- 원본 작업 브랜치와 공개 main에 각각 반영했다. GitHub의 현재 head를 읽고 `expected_sha`로 충돌을 방지했다.
- 파일 트리 반영 후 Contents API로 `version.json`을 갱신해 Pages 배포를 실행했다. Git 데이터 API로 ref만 갱신했을 때 배포가 자동 시작된다고 가정하지 않는다.
- 현재 기능 검증: 기존 앱 테스트 **30개**, 룰렛·오디오 테스트 **11개**, 총 **41개 통과**.
- 오디오 검증: 채널 독립, 볼륨 0, 설정 저장, 이전 음소거 호환, 첫 제스처 제한, 백그라운드 정지, 장시간 반복, 빠른 조작 시 중복 타이머 방지.
- 브라우저: 390px 모바일 설정창, 음악 OFF + 효과음 ON, 슬라이더 70→71, 새로고침 후 상태 유지, 들어보기, Escape 닫기와 포커스 복귀 확인. 확인 중 콘솔 오류 없음.
- 기본 설정을 BGM 25% / 효과음 70%로 되돌려 두었다. 실제 기기의 스피커·카카오 인앱 브라우저에서 느껴지는 음량은 사용자의 청취 피드백을 받아 조정할 수 있다.
- 이전 아바타 공유 변경에서는 앱 테스트 30개와 전체 규칙 에뮬레이터 테스트 10개를 통과했고 규칙 배포를 마쳤다. 이번 오디오 작업에서 규칙 테스트를 다시 실행한 것은 아니다.

## 이어서 작업할 때

1. 운영 버전과 원본 브랜치가 위 표 이후 바뀌었는지 먼저 확인한다.
2. UI 비교는 전체 화면 모음과 모의 앱을 사용한다. 실제 운영방의 주문 데이터에 테스트를 섞지 않는다.
3. 소리 관련 추가 수정은 `DamatdaPlay`와 `play.css`에 모으고 인라인 번들까지 함께 반영한다.
4. 사용자 기기에서 BGM·효과음의 기본 비율과 귀여운 느낌을 확인한다. 현재 미완료로 남긴 필수 기능은 없다.
5. 다음 정리 작업으로 로컬 조립 도구를 저장소 안의 재현 가능한 개발 파이프라인으로 옮기면 번들·미리보기의 수동 동기화를 줄일 수 있다. 이번 변경에서 이 구조 자체를 개편하지는 않았다.
