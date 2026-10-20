# 🍽 메뉴 모으기

방을 만들고 링크를 단톡방에 보내면, 다들 이름을 고르고 메뉴를 담아 **보내기**. 방장은 모인 주문을 실시간으로 가게별·사람별로 보고,
가게에 보낼 주문 메시지를 복사해요. 학년 협의회 음료, 캠프 저녁(2026 가족발명메이커캠프) 수합용이에요.

- 주소: https://hichoni.github.io/dinner-order/
- `index.html`, `firebase.js` — 원본은 `hichoni/app-gallery` 의 `apps/dinner-order/room/` (`python3 apps/dinner-order/room/build.py` → `room/dist/`).
  설명·데이터 구조·Firebase 규칙은 거기 `room/README.md`.
- `classic.html` — 예전 판(파일 하나, 주문 코드를 카톡으로 모으기). 예전 `#s=` 링크는 자동으로 이리로 와요.
- `firebase.js` 는 Firebase JS SDK(Apache-2.0) 묶음이에요. 라이선스: `firebase-LICENSE.txt`.
