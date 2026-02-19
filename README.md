6-Lane Castle Defense
Codex Implementation Specification
1. 엔진 아키텍처 규칙
1.1 분리 원칙

모든 게임 로직은 store/gameStore.ts에 위치

React 컴포넌트는 상태를 읽기만 한다

엔진 로직은 React에 의존하지 않는다

게임 루프는 store 내부에서 관리

2. 맵 및 라인 구조
2.1 라인 개수

총 6개 라인

각 라인은 독립적인 Grid 보유

각 라인은 spawn과 goal 좌표 보유

2.2 Grid 정의

크기: 32 x 32

2차원 배열

type Tile = {
  x: number
  y: number
  walkable: boolean
  towerId?: string
}

type Grid = Tile[][]

2.3 walkable 규칙

기본값: true

타워 완성 시: false

타워 파괴 시: true

건설 중 타워는 walkable 변경 금지

3. Worker 시스템
3.1 Worker 상태
type WorkerState =
  | "idle"
  | "moving"
  | "building"

3.2 Worker 구조
type Worker = {
  id: string
  lineId: number
  x: number
  y: number
  state: WorkerState
  target?: { x: number; y: number }
  buildStartTime?: number
}

3.3 Worker 행동 규칙
Build 요청 시:

target 설정

state → "moving"

Worker는 타일 단위 이동

도착 시:

state → "building"

buildStartTime 기록

건설 시간:

고정 2000ms

완료 시:

타워 생성

해당 타일 walkable = false

A* 경로 재검증

경로 없으면:

타워 제거

walkable 복원

4. 타워 시스템
type Tower = {
  id: string
  lineId: number
  x: number
  y: number
  hp: number
  completed: boolean
  workerId: string
}

4.1 타워 제약

Worker 1명당 타워 1개

업그레이드는 completed 상태에서만 가능

5. Pathfinding 시스템
5.1 알고리즘

A* 사용

휴리스틱: Manhattan distance

5.2 재탐색 조건

재탐색은 다음 이벤트에서만 발생:

타워 완성

타워 파괴

웨이브 시작

5.3 캐싱

각 라인마다 cachedPath 보유

모든 몬스터는 동일 path 사용

몬스터 개별 A* 금지

6. 몬스터 시스템
6.1 상태
type MonsterState =
  | "moving"
  | "attacking"

6.2 구조
type Monster = {
  id: string
  lineId: number
  x: number
  y: number
  hp: number
  damage: number
  state: MonsterState
  pathIndex: number
}

6.3 이동 규칙

state === "moving"

cachedPath[pathIndex]로 이동

pathIndex 증가

6.4 경로 없음 처리

A* 결과가 null이면:

state = "attacking"

6.5 공격 규칙

blocking tower 선택

tower.hp -= monster.damage

tower.hp <= 0이면 제거

제거 후 walkable 복원

경로 재탐색

7. 웨이브 시스템

웨이브 시작 시 각 라인 순환 스폰

몬스터는 spawn 위치에서 시작

goal 도달 시:

Life 감소

몬스터 제거

8. Hero 시스템

Hero는 캐슬 주변 스폰

Hero는 몬스터 공격 가능

Hero 진화는 store 내 수치 변경

9. Skill 시스템
type Skill = {
  cooldown: number
  lastUsed: number
}


사용 시 광역 데미지

처치 시 Gold 지급

10. 게임 루프
10.1 방식

requestAnimationFrame 사용

setInterval 사용 금지

10.2 루프 순서
updateWorkers()
updateMonsters()
updateTowers()
checkWaveEnd()

11. 금지 사항

매 프레임 A* 실행 금지

React state로 타일 변경 금지

픽셀 기반 이동 금지

몬스터 개별 경로 탐색 금지

walkable 즉시 변경 금지 (건설 중)

12. 성능 기준
항목	제한
Grid	32x32
몬스터	≤ 120 per line
Worker	≤ 3 per line
동시 Pathfinding	이벤트 기반
13. 반드시 지켜야 할 설계 원칙

타일 기반 Grid

Worker 상태 머신 유지

완성 시점 차단

Path 캐싱

엔진/UI 완전 분리

상태 변경은 store 내부에서만 수행

14. 구현 목표

Codex는 위 명세를 기준으로:

타입 정의

Grid 엔진

A* 구현

Worker 상태 머신

Monster 상태 머신

게임 루프

이벤트 기반 재탐색 구조

를 완전 구현해야 한다.

설명 없이 코드 중심으로 출력할 것.