# 혼자리 (honjari)

혼자 + 자리. 혼술바의 실시간 자리 상황을 보여주는 웹 서비스.

**Live**: https://orialthq.github.io/honjari/

## 어떻게 동작하나

- 주변 혼술바를 가까운 순으로 보여주고, 매장에 도착한 사용자가 직접 "여기예요"를 눌러 체크인한다 (GPS 오차 때문에 자동 체크인 없음).
- 실시간 인원 = 그 매장에 체크인한 사람 수. 개인은 서로에게 절대 보이지 않고, 매장별 집계 숫자만 노출된다. 3명 미만이면 숫자 대신 "한산함"으로 표시.
- 앱을 끄거나 자리를 뜨면 자동 체크아웃(RTDB onDisconnect). 네트워크가 잠깐 끊겼다 돌아오면 자동으로 재체크인된다.

## 스택

- Vite + React + TypeScript (외부 상태관리 없음)
- Firebase Realtime Database (Spark 무료 플랜) + Anonymous Auth — 서버 코드 없음
- GitHub Pages 자동 배포 (main 푸시 시 GitHub Actions)

## 개발

```bash
npm install
npm run dev
```

`.env` 없이 실행하면 **mock 모드**로 동작한다 (Firebase 없이 인메모리 데이터, 헤더에 MOCK 배지). 실제 Firebase에 연결하려면 `.env.example`을 `.env`로 복사해 값을 채운다.

배포는 main 푸시 시 자동. Firebase 설정값은 repo Variables(`VITE_FIREBASE_*`)로 주입된다.

## 구조

```
src/
  hooks/        useNearbyVenues(위치+거리), usePresence(체크인/아웃), useVenueCount(실시간 인원)
  components/   VenueCard, VenueDetail, CheckInModal, CheckedInScreen
  lib/          haversine, format, mockDb
seed/venues.json     RTDB venues 노드 임포트용 시드
database.rules.json  RTDB 보안 규칙
```

자세한 제약과 설계 원칙은 [CLAUDE.md](CLAUDE.md) 참고.
