# 도교육청 명커피 메뉴 최신화 — 2026-11-05

- 대상: `edu-myung-gbe` / 명커피 경상북도교육청점 (에듀카페).
- 근거: 사용자가 제공한 해당 매장의 메뉴판 사진. 2026-11-05는 제공·확인일이며 촬영일은 미상이다.
- 새 기본 목록은 음료 19종 / HOT·ICED 35개 선택 항목이다. 아메리카노 1,500원, 카페라떼 3,000원, 나머지 음료 3,500원. 매실·자몽·레몬 에이드는 ICED만 제공한다.
- 사진의 COFFEE / LOCAL SPECIAL / SIGNATURE / NON-COFFEE / TEA 다섯 분류를 유지한다. 사진에 없는 예전 에스프레소·헤이즐넛 아메리카노·카라멜 마끼아또·카페모카·녹차라떼·초코라떼·고구마라떼·허브티는 새 기본 목록에서 제외했다.
- 다른 1,291개 가게는 변경하지 않았다. 기존 방·제출 내역은 스냅샷을 유지하며 과거 내용 해시 상세 파일도 보존한다. Firestore 데이터·규칙은 수정하지 않는다.

## 파일

- `src/config.json`: 해당 지점만 교체, 전체 확인일 갱신.
- `data/menu-board-updates-20261105.json`: 메뉴·온도·가격·원본 분류와 사진 SHA-256, 제공일 기준을 기록.
- `data/myung-edu-baseline-20261105.json`: 직전 메뉴판 보관. 과거 감사 테스트는 이 스냅샷으로 검증한다.
- `room/assets/menu-boards/myung-edu-20261105.png`: 제공된 사진 원본. [메뉴판 사진](https://damatda.kr/assets/menu-boards/myung-edu-20261105.png).
- `room/build.py`와 `room/test/runtime.mjs`: 검토한 새 출처와 날짜를 기존 검증 목록에 합친다. 임의 URL은 허용하지 않는다.
- `room/test/myung-menu.test.mjs`: 19종·35개 온도 조합, 가격, ICED 전용 에이드, 원본 사진 해시, 출처 보존·위조 거부와 기존 방 스냅샷을 확인한다.

경로는 원본 `apps/dinner-order/` 기준이다. 공개 산출물은 `catalog-index.json`, `catalog.json`, `menu-category-index.json`, 새 해시 상세 파일과 사진, 새 출처를 포함한 `index.html`·`preview.html`, `app-version.json`이다. 기존 해시 상세 파일을 삭제하지 않는다.

## 검증·배포

- 관련 앱·검색·분류·가격 출처·이름 선택·공유 메뉴·기존 주문 보호 테스트 **129개 통과**.
- 원본/공개 카탈로그를 비교해 변경된 가게 ID가 `edu-myung-gbe` 한 곳뿐임을 확인했다.
- 전체 1,292곳, 선택 메뉴 27,023개(안내 행 포함 총 27,028행).
- 빌드 ID: `60b4c0f739dfc794`.
- 원본 기준: `hichoni/app-gallery`, `claude/tender-tesla-aext4z`, `597f65f63e6cadf288fda8b32a34b15ee2c3fd7a`.
- 공개 기준: `hichoni/dinner-order`, `main`, `ea391b9a5213ae7205057e14ea0f8323a98f6fe3`.
- 배포 후 커밋 정보는 운영 `version.json`, 현재 앱 빌드와 업데이트 문구는 `app-version.json`을 기준으로 확인한다.

전체 원본 저장소에서 `python apps/dinner-order/room/build.py`로 재생성한다. 자료 날짜를 현재 가격 보증으로 표시하지 않으며, 기존 방의 메뉴나 이미 제출한 금액을 자동으로 교체하지 않는다.
