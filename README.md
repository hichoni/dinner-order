# 다맛다

> **[최신 인수인계 — 2026-10-22](HANDOFF.md)**: 투명 로고, 16종 공유 아바타, 홈 룰렛, BGM·효과음 개별 ON/OFF와 볼륨 조절까지 배포했습니다. 현재 구현, 원본 브랜치, 빌드·배포 방법과 41개 테스트 결과를 정리했습니다. 아래 날짜별 변경 내용은 당시의 기록입니다.

각자 고른 메뉴를 한곳에 모으는 서비스입니다.

- [앱 열기](https://hichoni.github.io/dinner-order/)
- [전체 화면](https://hichoni.github.io/dinner-order/screens.html)
- [로딩·전송 모션](https://hichoni.github.io/dinner-order/motion.html)
- [캐릭터·아이콘](https://hichoni.github.io/dinner-order/assets.html)

원본: hichoni/app-gallery의 apps/dinner-order/room/. 운영 index.html은 Firebase에 연결합니다. preview.html은 브라우저 안에서만 동작하는 예시입니다. classic.html은 이전 판으로 유지합니다.


## 2026-10-21 다맛다 모바일 브랜딩·모션

- 메뉴명 17px, 가격 16px. 짧은 메뉴 행과 고정 장바구니/보내기 유지.
- 홈·방 만들기·이름 선택·메뉴·장바구니·방 관리·설정의 모바일 배치 정리.
- 팔다리 없는 음식 아바타 6개, 기능 아이콘 8개. 민트·귤 / 블루·레몬 테마.
- 승인된 로고 세 카드가 순서대로 모이는 방 로딩·전송 모션. 서버 쓰기 성공 후 다맛다! 표시.
- screens.html: 10개 화면, motion.html: 로딩/전송/완료, assets.html: SVG 에셋 확인.
- preview.html은 Firebase와 연결하지 않는 예시 페이지. 운영 index.html은 실제 연결을 유지.
- 테스트: 앱 상태 15개 통과, 320/390px 메뉴·장바구니·이름 선택·전송 완료와 모션 재생/정지 확인.
- 기존 데이터 구조·보안 규칙·가게 카탈로그 변경 없음. 방장 도착 알림은 열린 화면 안에서 제공.
