# Bubble Chamber — Math × Physics

검은 화면 위에 거품 상자(bubble chamber) 입자 궤적, 물리 수식, 파인만 다이어그램과 도표가 끊임없이 그려지는 생성형 애니메이션.

- **궤적** — 자기장 속 하전 입자가 에너지를 잃으며 감겨 드는 나선 (r = p/|q|B), 델타선, V자 붕괴
- **수식** — 슈뢰딩거·디랙·맥스웰·아인슈타인 방정식 등 50개 + 한 줄씩 전개되는 유도 9개 (KaTeX)
- **도식·도표 18종** — 파인만 다이어그램, 파동 묶음, 흑체복사, 조화진동자, 힉스 공명, 빛원뿔, 수소 준위, 위상공간, 전자기파, 블로흐 구, 이중슬릿, 오비탈 등

## 실행

- **브라우저**: `index.html` 을 열거나 `start.bat` 실행. 설치·서버·인터넷 불필요.
- **Windows exe**: PowerShell에서 `native\build.ps1` 실행 → `BubbleChamber_MathPhysics.exe` 생성 (단일 파일, 약 620KB).
  Windows에 기본 포함된 C# 컴파일러와 WebView2 런타임만 사용한다. `BubbleChamber_MathPhysics.exe /f` 는 전체화면으로 시작.

| 키 | 동작 |
|---|---|
| `F` | 전체화면 |
| `Space` | 일시정지 |
| 클릭 | 그 위치에 충돌 이벤트 |
| `↑` `↓` | 속도 (0.25×–4×) |

`index.html?warp=60` 처럼 열면 60초 진행된 상태에서 시작한다.

## 구조

| 파일 | 역할 |
|---|---|
| `js/core.js` | 유틸, 배치(Layout), 캔버스 수식 라벨, 점진적으로 그려지는 Sketch |
| `js/chamber.js` | 거품 상자 궤적 시뮬레이션 |
| `js/widgets.js` | 도식·도표 (`DEFS` 배열에 추가) |
| `js/equations.js` | 수식·유도 목록과 쓰기 애니메이션 |
| `js/main.js` | 스케줄러, 렌더 루프, 입력 |
| `native/` | WebView2 기반 Windows 호스트와 빌드 스크립트 |
| `vendor/` | KaTeX 0.16.11 (MIT) |

`native/lib` 의 WebView2 SDK DLL은 Microsoft의 라이선스(`WebView2-LICENSE.txt`)를 따른다.
