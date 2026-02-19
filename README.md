# 6-Lane Castle Defense (Expo + React Native)

스타크래프트 유즈맵 감성의 **라인 디펜스 + RTS 워커 건설 시스템**을 목표로 만든 Expo 프로젝트입니다.

현재 구현은 아래 핵심 컨셉을 포함합니다.

- 6개 라인 중 하나를 선택해 전장 확인
- 모든 라인은 중앙 캐슬로 수렴
- 몬스터가 캐슬 도달 시 Life 감소
- Worker 구매 → 이동 → 건설 → 타워 완성
- 타워 완성 시점에만 길 차단 반영
- 경로 막힘 시 건설 자동 취소(롤백)
- 하단 탭(BATTLE / SHOP / WORKERS) 기반 UI

---

## 1. 프로젝트 개요

- Framework: Expo + React Native + TypeScript
- State: 커스텀 external store (`useSyncExternalStore`)
- UI: 다크 테마 HUD, 전장, 미니맵, 하단 탭 패널
- 핵심 설계: 엔진 로직(스토어)과 화면(UI) 분리

---

## 2. 현재 구현된 게임 시스템

### 2.1 라인/맵 구조

- 라인은 총 6개
- 메인 화면에는 **선택된 라인 1개만 표시**
- 어떤 라인을 선택해도 표시상 캐슬이 화면 하단에 오도록 좌표 변환
- 좌하단 미니맵에서 전체 라인 구조를 축소 표시

### 2.2 Grid 기반 RTS 건설

- 라인마다 32x32 타일 Grid
- 타일 데이터
  - `x`, `y`
  - `walkable`
  - `towerId`
- Worker 상태 머신
  - `idle`
  - `moving`
  - `building`

### 2.3 Worker Build 파이프라인

1. Worker 선택
2. Build Mode 진입
3. 타일 클릭으로 건설 요청
4. 요청 시 가상 차단 경로 검증 (사전 path check)
5. Worker가 타일로 이동
6. 도착 후 2초 건설
7. 완료 시 타일 차단(`walkable=false`)
8. 완료 후 경로 재검증 실패 시 타워 제거 + 타일 복원

> 즉, **건설 중에는 길을 막지 않고**, 완성 시점에만 길 차단을 확정합니다.

### 2.4 타워/업그레이드 제약

- Worker 1명당 타워 1개
- Shop에서 Worker 구매
- 선택 Worker의 타워 업그레이드 가능

### 2.5 몬스터/웨이브

- 웨이브 시작 시 라인 순환 스폰
- 몬스터는 cachedPath 기반 이동
- 경로 없으면 `attacking` 상태로 타워 공격
- 타워 파괴 시 타일 복원 + 경로 재탐색
- 캐슬 도달 시 Life 감소

### 2.6 Hero/Skill

- Hero는 캐슬 주변에서 스폰
- Hero 진화 가능
- Skill은 쿨다운 기반 광역 데미지 + 처치 골드 지급

---

## 3. UI/UX 구성

### 상단

- HUD: Wave / Gold / Life

### 중앙

- 선택 라인 전장
- 타워, 워커, 몬스터, 경로 점, 캐슬 표시

### 좌하단

- 미니맵(전체 라인 축소)

### 하단

- Bottom Tabs: `BATTLE`, `SHOP`, `WORKERS`
- 탭에 따라 하단 패널 전환
  - BATTLE: 웨이브/스킬/히어로 카드
  - SHOP: Worker 구매, Build, 업그레이드, Hero 관련 액션
  - WORKERS: Worker 선택 및 Build Mode 제어

---

## 4. 주요 파일 구조

```txt
src/
  components/
    Battlefield.tsx   # 선택 라인 전장 렌더
    HUD.tsx           # 상단 HUD
    HeroCard.tsx      # 히어로 카드
    MiniMap.tsx       # 좌하단 미니맵
    PrimaryButton.tsx # 공통 버튼
    ShopPanel.tsx     # SHOP 탭 패널
    SkillButton.tsx   # 스킬 버튼
  screens/
    GameScreen.tsx    # 전체 화면 조합 및 탭 전환
  store/
    gameStore.ts      # 게임 엔진/상태/루프
  theme/
    theme.ts          # 디자인 토큰
App.tsx               # 앱 엔트리
```

---

## 5. 실행 방법

```bash
npm install
npx expo start
```

- Web: `npx expo start --web`
- iOS: `npx expo run:ios`
- Android: `npx expo run:android`

---

## 6. 현재 우선순위 TODO

- Worker 이동 경로 시각화(프리뷰 라인)
- 건설 중 프로그레스 UI 고도화
- 타워 타입 확장(범위/공속/특수효과)
- 몬스터 타입 확장(보스/저항)
- 라인별 유저 정보/점수 표현
- 엔진 테스트 코드(순수 함수 레벨)

---

## 7. 설계 원칙 요약

- 타일 기반 Grid
- Worker 상태 머신
- 완성 시점 차단
- 이벤트 기반 경로 재탐색
- 엔진/UI 분리

위 원칙을 유지하며 기능을 확장하면, Expo/Web 환경에서도 안정적으로 RTS형 디펜스 시스템을 발전시킬 수 있습니다.
