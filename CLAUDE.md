# CLAUDE.md — 혼자리 (honjari)

혼자 + 자리. 혼술바의 실시간 자리 상황을 보여주는 웹 서비스.
OriAlt(orialthq) 프로젝트. 배포: `orialthq.github.io/honjari`

## 절대 제약 (위반 금지)

- **완전 무료 유지.** Firebase Spark 플랜만 사용. Cloud Functions 절대 사용 금지 (결제수단 요구됨). 서버 코드 없음 — 모든 로직은 클라이언트에서 처리.
- **개인 노출 금지.** 사용자 개인은 서로에게 절대 보이지 않는다. 노출되는 것은 매장별 집계 인원수뿐. 성비 표시 없음. 위치 이력 저장 없음(체크인/아웃 시점만).
- **자동 체크인 금지.** GPS 오차(실내 20~50m) 때문에 반드시 사용자가 매장을 직접 확인 탭해야 체크인된다.

## 스택

- Vite + React + TypeScript
- Firebase Realtime Database (Spark) + Anonymous Auth
- GitHub Pages 배포 (GitHub Actions, `vite.config.ts`에 `base: '/honjari/'` 필수)
- 반경 계산: 클라이언트 Haversine (파일럿 매장 5~10개, venues 전체 fetch 후 계산)
- 상태관리: 외부 라이브러리 없이 React hooks. 규모상 충분.

## RTDB 스키마

```
venues/{venueId}        → { name, lat, lng, address, photoUrl, tags[], createdAt }
presence/{venueId}/{uid} → { at: serverTimestamp }
userStatus/{uid}        → { venueId, checkedInAt }
```

- 실시간 인원 = `presence/{venueId}`의 자식 개수. **별도 카운터 노드 만들지 말 것** (onDisconnect는 트랜잭션 불가 → 카운터 정합성 유지에 Functions가 필요해짐 → 제약 위반).
- venues 쓰기는 관리자 콘솔에서만. 클라이언트 코드에 venues 쓰기 로직 넣지 말 것.

## 체크인 로직 (순서 엄수)

1. `userStatus/{uid}` 조회 → 이전 체크인 있으면 이전 매장 presence 명시적 제거 (매장 갈아타기 시 onDisconnect가 발동 안 하므로 필수)
2. `presence/{venueId}/{uid}` set + `onDisconnect().remove()` 등록
3. `userStatus/{uid}` set + `onDisconnect().remove()` 등록

수동 체크아웃: 두 노드 모두 remove.

## 보안 규칙 (database.rules.json)

```json
{
  "rules": {
    "venues": { ".read": true, ".write": false },
    "presence": {
      "$venueId": {
        ".read": true,
        "$uid": { ".write": "$uid === auth.uid" }
      }
    },
    "userStatus": {
      "$uid": { ".read": "$uid === auth.uid", ".write": "$uid === auth.uid" }
    }
  }
}
```

## 화면 구성 (MVP)

1. **홈/후보 리스트**: 위치 권한 요청 → 주변 매장 가까운 순 카드 리스트 (매장명, 거리, 현재 인원) → "여기예요" 버튼
2. **체크인 확인 모달**: 매장 사진 + "○○ 맞으세요?" + "체크인하면 실시간 인원에 포함돼요" 문구 필수
3. **체크인 상태 화면**: 현재 매장 인원(실시간 구독) + "앱을 끄거나 자리를 뜨면 자동으로 체크아웃돼요" 안내 + 체크아웃 버튼
4. 매장 상세: 사진, 태그, 주소 (포토리뷰는 이후 이터레이션)

- 인원 3명 미만이면 숫자 대신 "한산함" 라벨 표시.

## 디자인 방향

- **다크 퍼스트.** 밤에 술집 골목에서 쓰는 서비스다. 어두운 배경(#111 계열) + 웜 앰버 액센트(#F5A623 계열), Pretendard.
- 모바일 퍼스트 단일 컬럼. 데스크톱은 최대폭 제한(480px 중앙 정렬)으로 충분.
- 카드 기반, 과한 장식 없이 정보(인원수) 가독성이 최우선.

## 컨벤션

- 커밋/코드 주석은 한국어 OK, 변수·함수명은 영어.
- Firebase 설정값은 `src/firebase.ts`에 (RTDB apiKey는 공개돼도 무방 — 보안은 rules가 담당. 단 `.env` 경유로 관리).
- 파일 구조: `src/components/`, `src/hooks/` (usePresence, useNearbyVenues 등), `src/lib/` (haversine 등 순수 함수).
- 배포는 main push 시 GitHub Actions 자동 배포.

## 로드맵 (이 레포의 현재 단계: Phase 1)

- Phase 1 (지금): 체크인 기반 실시간 인원 + 매장 정보
- Phase 2: 포토리뷰 → 매장 내 메이트 매칭 "술메이트" (옵트인)
- Phase 3: 업주 대시보드
