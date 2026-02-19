# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

Web + Expo (React Native) 기반 디펜스 게임 UI 시스템 문서

1. 프로젝트 개요

이 문서는 모던 다크 테마 기반 디펜스 게임 UI 시스템 가이드입니다.
웹(Expo Web)과 모바일(iOS/Android)을 동시에 고려한 확장형 HUD 중심 설계를 목표로 합니다.

핵심 원칙

전투 중 가독성 최우선

고대비 다크 테마

네온 포인트 컬러

최소한의 장식, 최대한의 정보 효율

터치 중심 인터랙션

2. 디자인 방향성
키워드

Minimal

Tactical HUD

Neon Accent

Depth & Glass

High Contrast

목표

빠른 의사결정이 필요한 디펜스 장르에 최적화

복잡한 이펙트보다 정보 구조 명확성 우선

모바일과 웹 모두 동일한 경험 제공

3. 컬러 시스템
Primary Palette
역할	색상	HEX
Background	Deep Navy	#0F172A
Surface	Dark Slate	#1E293B
Primary Accent	Neon Cyan	#22D3EE
Secondary Accent	Violet	#8B5CF6
Danger	Red	#EF4444
Gold	Amber	#F59E0B
Text Primary	Off White	#F8FAFC
Text Secondary	Muted	#94A3B8
사용 규칙

Background는 항상 어둡게 유지

인터랙션 요소는 Neon Cyan 중심

경고는 Red

보상/골드는 Amber

등급 구분은 Violet 계열 활용

4. 타이포그래피
폰트 전략

Title: Semi-Bold

Numeric Stats: Bold

Description: Regular

권장 폰트

Inter

Space Grotesk

Orbitron (HUD 숫자 전용)

Expo 적용 예시
{
  fontFamily: 'Inter-Bold',
  fontSize: 18
}

5. 레이아웃 구조
기본 Game Screen 구조
--------------------------------
|   Wave 12     Gold 320      |
--------------------------------
|                              |
|          Game Map            |
|                              |
--------------------------------
| Hero | Skill | Shop | Auto  |
--------------------------------

구조 설명

상단: 게임 상태 정보

중앙: 맵 영역

하단: 주요 액션 버튼

Shop은 Bottom Sheet 형태

6. HUD 디자인 시스템
상단 정보 바

반투명 Glass 스타일

Blur + Border 사용

{
  backgroundColor: 'rgba(30,41,59,0.6)',
  borderColor: '#22D3EE',
  borderWidth: 1,
  borderRadius: 12
}

표시 항목

Wave

Gold

Life

Speed Toggle

Pause

7. 버튼 디자인 시스템
Primary Button

네온 단색 또는 그라디언트

Glow 효과

{
  backgroundColor: '#22D3EE',
  paddingVertical: 14,
  borderRadius: 14,
  shadowColor: '#22D3EE',
  shadowOpacity: 0.7,
  shadowRadius: 10
}

Secondary Button

Outline 스타일

배경 투명

{
  borderWidth: 1,
  borderColor: '#8B5CF6',
  backgroundColor: 'transparent'
}

인터랙션 애니메이션

Press 시 Scale 0.95 → 1

약 120ms duration

8. 영웅 카드 UI 시스템
카드 구성
[ 등급 프레임 ]
[ 캐릭터 이미지 ]
[ 이름 ]
[ DPS / Range ]
[ 진화 버튼 ]

등급별 프레임 색상
등급	색상
Common	Gray
Rare	Blue
Epic	Purple
Legendary	Gold
Mythic	Neon Gradient
디자인 원칙

카드 radius: 16

Surface 배경 사용

Shadow는 은은하게

9. 스킬 UI
구조

원형 버튼

쿨다운 Progress Ring

활성화 시 Pulse 애니메이션

구현 기술

react-native-svg

react-native-reanimated

10. 상점 UI (Shop Panel)
구조

Bottom Sheet Modal

화면 높이의 70~80%

배경 Blur 처리

카드 구성
[ 아이콘 ]
[ 이름 ]
[ 설명 ]
[ 가격 ]
[ 구매 버튼 ]

11. 애니메이션 가이드
이벤트	효과
버튼 클릭	Scale
영웅 소환	Glow + Particle
진화	빛 확산 + 화면 흔들림
보스 등장	화면 어둡게 + 경고 애니
원칙

과한 모션 금지

200ms~400ms 범위 유지

60fps 유지

12. 반응형 전략
모바일 기준

390px width 기준 설계

SafeAreaView 필수

웹 기준

최소 1280px 대응

중앙 고정형 레이아웃

HUD는 고정 포지션

레이아웃 규칙

Flex 기반 구성

고정 픽셀 최소화

퍼센트/비율 기반 설계

13. 테마 시스템 (Expo 적용)
export const theme = {
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#22D3EE',
    secondary: '#8B5CF6',
    danger: '#EF4444',
    gold: '#F59E0B',
    text: '#F8FAFC',
    muted: '#94A3B8'
  },
  radius: 14
}

14. 디자인 확장 전략

시즌별 UI 색상 변경

이벤트 기간 한정 HUD 스킨

진화 단계별 카드 프레임 변화

웨이브 증가에 따른 UI 포인트 색상 강화

15. UX 최적화 체크리스트

전투 중 텍스트 2줄 이상 금지

수치 강조는 Bold

터치 영역 최소 44px 이상

중요 버튼은 하단 중앙 배치

실수 방지 확인 팝업 최소화

16. 향후 확장

협동 모드 전용 HUD

PvP 랭킹 화면

로그라이크 모드 UI

글로벌 출시 대비 언어 확장 구조

결론

이 UI 가이드는 단순한 디자인 문서가 아니라
실제 구현 가능한 Expo 기반 게임 UI 시스템 설계 문서입니다.