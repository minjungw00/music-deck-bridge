# 설치 안내

[English](installation.en.md) · [문제 해결](troubleshooting.md)

로컬 브리지를 실행하는 **Stream Deck 플러그인과 Chrome 확장 프로그램을 모두 설치**해야 합니다. 네 설치 경로는 같은 PIN 연결 절차를 사용하며, 일반 YouTube Music 탭과 Chrome으로 설치한 앱(PWA)을 모두 지원합니다.

**권장 경로는 [GitHub Releases의 안정 패키지](https://github.com/minjungw00/music-deck-bridge/releases/latest)입니다.** Actions는 개발 빌드를 제공하며 스토어 승인은 아직 준비 중입니다. 사전 빌드 패키지를 설치할 때는 Node.js·npm·Python을 별도로 설치할 필요가 없습니다.

- [요구사항](#requirements)
- [방법 1: GitHub Releases](#method-1-github-releases)
- [방법 2: GitHub Actions](#method-2-github-actions)
- [방법 3: 소스에서 빌드](#method-3-build-from-source)
- [방법 4: 공식 스토어](#method-4-official-stores)
- [PIN 연결](#pairing)
- [업데이트](#updating)
- [설치 경로 전환](#switching-installation-methods)
- [삭제 및 초기화](#uninstalling)

<a id="requirements"></a>

## 요구사항

| 구성요소 | 요구사항 |
| --- | --- |
| Windows | 10 / 11 |
| Google Chrome | 116 이상 |
| Stream Deck 소프트웨어 | 7.1 이상; 플러그인용 Node.js 24 런타임 포함 |
| 장치 | 버튼 액션은 Stream Deck 키 모델 대상; 볼륨·현재 곡 다이얼은 Stream Deck + 필요 |

<a id="method-1-github-releases"></a>

## 방법 1: GitHub Releases

[최신 안정 릴리스](https://github.com/minjungw00/music-deck-bridge/releases/latest)를 사용하세요. 빌드 도구 없이 다음과 같이 설치합니다.

1. **Pre-release** 표시가 없는 최신 안정 릴리스를 열고 같은 릴리스의 두 파일을 다운로드합니다.
   - `io.github.minjungw00.musicdeckbridge.streamDeckPlugin`
   - `music-deck-bridge-chrome-<version>.zip`
2. `.streamDeckPlugin`을 더블클릭하고 Stream Deck에서 설치를 확인합니다. 액션 목록에 **Music Deck Bridge**가 표시되는지 확인하세요.
3. Chrome ZIP을 `%LOCALAPPDATA%\MusicDeckBridge\chrome-extension` 같은 고정 폴더에 압축 해제합니다. 설치 후에도 폴더를 유지하세요. 폴더 바로 안에 `manifest.json`이 있어야 하며, 한 단계 더 중첩된 폴더를 선택하면 안 됩니다.
4. `chrome://extensions`에서 **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 눌러 압축 해제한 폴더를 선택합니다. 필요하면 도구 모음에 고정하세요. Chrome의 [압축 해제 확장 프로그램 설치 안내](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-an-unpacked-extension)를 따르는 방식입니다.
5. [PIN 연결](#pairing)을 수행합니다.

GitHub가 자동 생성하는 **Source code** 압축 파일 대신 배포용 Chrome ZIP을 받으세요. ZIP을 Chrome에 드래그하거나 임의의 CRX를 설치하지 마세요.

<a id="method-2-github-actions"></a>

## 방법 2: GitHub Actions

개발 빌드는 최신 변경사항을 포함하지만 안정성을 보장하지 않습니다. 다운로드하려면 GitHub에 로그인해야 합니다. [GitHub의 기본 산출물 보존 기간은 90일](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)이지만 저장소 설정에 따라 짧아지거나 산출물이 만료·삭제될 수 있습니다. 영구 다운로드 경로가 아닙니다.

1. GitHub에 로그인하고 [CI 실행 목록](https://github.com/minjungw00/music-deck-bridge/actions/workflows/ci.yml)을 엽니다.
2. Windows와 Ubuntu 작업이 모두 통과한 **`main` 브랜치의 최근 성공한 CI 실행**을 선택합니다. Pull request 실행이나 다른 브랜치의 빌드를 선택하지 마세요.
3. **Artifacts**에서 `music-deck-bridge-dev-windows-<commit-sha>`를 다운로드합니다. Ubuntu 산출물은 패키징 검증용이며 Linux 설치를 지원한다는 뜻은 아닙니다.
4. 다운로드한 산출물 ZIP을 해제합니다. 내부에는 `.streamDeckPlugin`, 별도의 `music-deck-bridge-chrome-<version>.zip`, `BUILD-INFO.json`, `SHA256SUMS.txt`가 있습니다. `BUILD-INFO.json`에는 전체 커밋 SHA, 소스 ref, 버전, 플랫폼, 실행 URL이 기록됩니다. ref가 `refs/heads/main`인지 확인하고 오류 보고를 위해 파일을 보관하세요.
5. `.streamDeckPlugin`을 더블클릭해 설치합니다. **내부 Chrome ZIP도 별도로 압축 해제**하여 고정 폴더에 두고, `chrome://extensions`에서 **개발자 모드 → 압축해제된 확장 프로그램 로드**로 설치합니다. 바깥 산출물 폴더 대신 `manifest.json`이 있는 폴더를 선택하세요.
6. [PIN 연결](#pairing) 후 재생 제어를 확인합니다.

같은 개발 주기에서는 `X.Y.Z-dev`와 플랫폼용 숫자 버전을 고정합니다. 빌드는 정식 버전 증가 대신 SHA와 `BUILD-INFO.json`으로 구분하며, [버전 관리 정책](versioning.md)을 따릅니다. 여러 개발 빌드의 버전이 같을 수 있습니다. 커밋 SHA와 실행 URL로 빌드를 식별하세요. 두 구성요소는 같은 실행의 패키지를 사용하며, 개발 패키지는 자동 업데이트되지 않습니다.

<a id="method-3-build-from-source"></a>

## 방법 3: 소스에서 빌드

개발자·기여자용입니다. Git, **Node.js 24와 npm**을 설치한 뒤 실행합니다.

```sh
git clone https://github.com/minjungw00/music-deck-bridge.git
cd music-deck-bridge
npm ci --ignore-scripts
npm run build:plugin
```

공식 SDK를 포함한 독립 실행 번들 `bin/plugin.js`가 생성됩니다. **이 빌드와 폴더 수동 설치에는 Python이 필요하지 않습니다.**

1. 시스템 트레이 메뉴에서 Stream Deck을 완전히 종료합니다. 창만 닫으면 계속 실행될 수 있습니다. 기존 플러그인 폴더는 교체 전에 Plugins 디렉터리 밖에 백업하세요.
2. `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin` 폴더 전체를 `%APPDATA%\Elgato\StreamDeck\Plugins`에 복사합니다. 파일 탐색기 주소 표시줄에 경로를 붙여넣을 수 있으며, `%APPDATA%`는 사용자 로밍 앱 데이터 폴더입니다. 설치 후 매니페스트 위치는 다음과 같아야 합니다.

   ```text
   %APPDATA%\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin\manifest.json
   ```

3. 저장소 루트의 `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, `PRIVACY.md`를 설치된 플러그인 폴더에 복사한 뒤 Stream Deck을 다시 실행합니다.
4. `chrome://extensions`에서 **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**로 저장소의 `chrome-extension/` 폴더를 선택합니다. 폴더 안에 `manifest.json`이 있어야 합니다.
5. [PIN 연결](#pairing)을 수행합니다.

설치 패키지를 직접 만들려면 **Python 3.10 이상**(`python3`, `python`, Windows `py`)도 설치하고 다음을 실행합니다.

```sh
npm run build:streamdeck
npm run build:chrome
```

`dist/`에 릴리스와 같은 이름의 패키지가 생성됩니다. Stream Deck 패키징은 `npm ci`가 설치한 잠금 파일 고정 버전의 Elgato CLI를 사용합니다. 테스트·디버깅·릴리스 검증은 [개발 문서](development.md)를 참고하세요.

<a id="method-4-official-stores"></a>

## 방법 4: 공식 스토어

공개 스토어 설치 링크는 아직 없습니다. GitHub 패키지를 사용하세요.

| 구성요소 | 스토어 | 공개 전 설치 방법 |
| --- | --- | --- |
| Stream Deck 플러그인 | Elgato Marketplace | GitHub Release 패키지 사용 |
| Chrome 확장 프로그램 | Chrome 웹 스토어 | Chrome ZIP 압축 해제 후 로드 |

각 스토어에 공개된 뒤 검증한 제품 URL을 이 절에 추가합니다. Elgato Marketplace에서 플러그인을 설치하고 Chrome 웹 스토어에서 확장 프로그램을 추가한 뒤 [PIN 연결](#pairing)을 수행합니다. 양쪽 모두 출시되면 공식 스토어를 가장 먼저 안내합니다.

출시 시점이 다를 수 있습니다. 예를 들어 Chrome 스토어가 먼저 공개되면 확장 프로그램은 스토어에서, 플러그인은 GitHub Releases에서 설치할 수 있습니다. 각 구성요소는 하나만 활성화하고 [설치 경로 전환](#switching-installation-methods)을 따르세요.

<a id="pairing"></a>

## PIN 연결

1. Stream Deck에 Music Deck Bridge 버튼 또는 다이얼 액션을 배치합니다.
2. 액션을 선택한 뒤 설정에서 **PIN 생성**을 누릅니다.
3. Chrome 확장 프로그램 팝업에 6자리 PIN을 입력하고 **연결**을 누릅니다. PIN 유효 시간은 10분이며 한 번 사용하면 폐기됩니다.
4. [YouTube Music](https://music.youtube.com/)에서 곡을 재생하고 팝업의 **상태 확인**을 누릅니다.
5. 재생/일시정지, 이전/다음 곡, 음소거, 앨범 아트를 확인합니다. Stream Deck +에서는 볼륨·현재 곡 다이얼도 확인하세요. 볼륨은 한 칸당 1~5%p로 설정하며, 곡 이동은 한 칸당 한 곡, 한 이벤트당 최대 5곡까지 처리합니다.

일반 탭과 Chrome으로 설치한 YouTube Music 앱이 동시에 열리면 설치형 앱을 우선합니다.

Chrome 확장 프로그램을 삭제 후 재설치하면 확장의 연결 토큰이 지워집니다. 플러그인에 이전 인증 정보가 남아 있어도 새 PIN을 발급하여 다시 연결해야 합니다. 사용자 지정 포트를 사용한다면 팝업에서 먼저 같은 포트로 맞추세요. 기존 압축 해제 폴더의 파일을 갱신하고 새로고침하면 확장 저장소를 삭제하지 않고 업데이트할 수 있습니다.

### YouTube Music 실행과 곡 평가

Music Deck Bridge 액션 목록에서 **YouTube Music 실행**, **좋아요**, **싫어요**를 추가하세요.

- **YouTube Music 실행**은 선택된 기존 플레이어 창으로 이동합니다. Chrome 설치형 앱도 재사용하며, 플레이어가 없으면 Chrome 탭을 엽니다.
- **현재 곡**, **재생 / 일시정지**, 이전·다음 곡, 음소거, 곡 평가와 다이얼 입력은 플레이어가 없으면 YouTube Music을 열고, 조작부가 준비되면 원래 입력을 수행합니다. 재생 입력은 새로 열린 일시정지 플레이어를 재생하며, 이미 재생이 복원됐다면 그대로 유지합니다. **YouTube Music 실행**은 창을 열거나 이동하는 동작만 수행합니다. 복원할 곡이 없으면 사이트에서 로그인하거나 곡을 선택하세요.
- **좋아요**와 **싫어요**는 현재 곡의 평가 버튼을 조작합니다. 같은 버튼을 다시 누르면 해당 평가를 취소합니다. Chrome에서 직접 변경한 상태도 반영하며, 사이트에서 선택이 확인되면 채워진 손 모양을 보여 줍니다. 로그인된 플레이어와 사용 가능한 평가 버튼이 필요합니다. 재생/일시정지·좋아요·싫어요·실행 버튼에는 기본 제목을 표시하지 않습니다.

이 기능에는 서로 맞는 플러그인·확장 프로그램 빌드를 사용하세요. YouTube Music을 사용하는 Chrome 프로필에 확장 프로그램을 설치하고 PIN으로 연결합니다. Chrome을 완전히 종료한 상태에서는 표준 Windows 설치 경로의 Chrome을 실행하고, 연결된 확장 프로그램이 기존 YouTube Music 창을 찾거나 새 탭을 엽니다. 확장의 연결 정보가 없다면 먼저 새 PIN으로 다시 연결하세요. 다른 브라우저나 사용자 지정 Chrome 설치 경로는 실행 대상으로 지원하지 않습니다. 대기 중인 입력은 45초 뒤 만료됩니다. 사이트에 사용 가능한 조작부가 없다면 수행할 수 없으며, 새 PIN으로 연결하면 이전 대기 입력은 취소됩니다.

### 다이얼 조작과 화면 표시

- **볼륨 다이얼**: 회전하면 볼륨을 조절하고, 다이얼을 누르거나 스크린을 터치하면 음소거를 켜거나 끕니다. 아이콘은 실제 음소거 상태를 따릅니다.
- **현재 곡 다이얼**: 회전하면 이전/다음 곡으로 이동하고, 다이얼 누르기와 스크린 터치는 모두 재생/일시정지합니다. 재생 중에는 일시정지 아이콘, 일시정지 중에는 재생 아이콘을 표시합니다.

현재 곡 버튼의 액션 설정에서 **곡 이름 표시**, **가수명 표시**, **배경 표시**를 각각 선택할 수 있습니다. 곡 이름과 가수명은 기본적으로 표시하고, 배경은 기본적으로 숨깁니다. **가수명 위치**는 **곡 이름 아래**(기본값) 또는 **곡 이름에 이어서**를 선택하세요. **텍스트 표시**는 **말줄임**(기본값) 또는 **왼쪽으로 스크롤**을 지원합니다. 배경을 켜면 버튼 하단의 텍스트 뒤에 검은 띠를 표시합니다.

현재 곡 다이얼의 액션 설정에서 **화면 표시**를 **아이콘 + 곡 이름** 또는 **앨범 이미지**로 선택하세요. 앨범 이미지에서는 **이미지 맞춤**을 **상하에 맞추기**(기본값) 또는 **좌우에 맞추기**로 선택할 수 있습니다. 원본 비율을 유지하며 높이 또는 너비에 맞추고, 화면 밖으로 넘치는 부분은 자릅니다. **곡 이름 표시**를 켜면 이미지 하단에 곡 이름을 표시합니다. 기본값은 숨김입니다. 곡 이름을 표시할 때에는 **가수명 표시**, **배경 표시**를 각각 켜거나 끌 수 있습니다. 두 옵션의 기본값은 꺼짐입니다. 가수명을 켜면 **가수명 위치**에서 **곡 이름 아래** 또는 **곡 이름에 이어서**(기본값)를 선택할 수 있습니다. **텍스트 표시**는 **말줄임**(기본값) 또는 **왼쪽으로 스크롤**을 지원합니다. 설정은 다이얼별로 저장되며, 이미지가 없거나 불러오는 중이면 재생 상태 아이콘을 표시합니다. 기존 액션도 현재 곡 다이얼로 표시됩니다.

### 포트 변경

기본 포트는 `17864`입니다. 액션 설정 또는 확장 프로그램 팝업에서 사용하지 않는 `1024~65535` 정수로 변경할 수 있습니다. 모든 플러그인 액션이 같은 포트를 사용합니다. 연결된 Chrome은 변경을 따라가며, 연결이 끊겼거나 절전 상태였다면 양쪽 포트를 수동으로 맞추세요.

<a id="updating"></a>

## 업데이트

설치본 변경 전 Stream Deck 프로필을 백업하세요. `%APPDATA%\MusicDeckBridge`는 유지합니다. 인증 정보(`auth.json`)와 공통 포트(`config.json`)는 플러그인과 별도로 저장됩니다. 일반적인 업데이트에서는 이 파일들과 Stream Deck 프로필을 유지합니다. 확장 프로그램 ID가 바뀌면 새 PIN 연결이 필요합니다.

| 설치 출처 | 업데이트 방법 |
| --- | --- |
| GitHub Releases | 같은 릴리스의 두 패키지를 다운로드합니다. 플러그인 버전이 더 높으면 기존 설치본 위에 아래 방법으로 패키지를 설치하고, Chrome은 기존 폴더에서 갱신합니다. |
| GitHub Actions | 다른 성공한 `main` 실행에서 패키지를 받고 SHA를 기록합니다. 플러그인 버전이 더 높으면 일반 패키지 설치를 사용하고, 같은 버전의 개발 빌드 교체에는 아래 복구·파일 교체 절차가 필요할 수 있습니다. 자동 업데이트는 지원하지 않습니다. |
| 소스 | 원하는 리비전을 받은 뒤 `npm ci --ignore-scripts`, `npm run build:plugin`을 실행합니다. Stream Deck을 종료하고 라이선스 문서와 함께 플러그인 폴더를 교체한 뒤 다시 실행합니다. |
| 공식 스토어 공개 후 | 각 스토어의 업데이트 기능을 사용하고 두 구성요소 모두 갱신됐는지 확인합니다. |

압축 해제한 Chrome 확장 프로그램은 **폴더 절대 경로를 유지**하며 기존 폴더의 내용을 새 파일로 교체합니다. 소스 설치라면 같은 저장소 경로를 갱신하세요. `chrome://extensions`에서 **새로고침**을 누르고 필요하면 YouTube Music도 새로고침합니다. 새 버전마다 별도 확장 프로그램으로 로드하지 마세요.

<a id="package-updates"></a>

### 더 높은 버전의 플러그인 패키지 설치

1. 프로필 백업과 함께 설치된 플러그인 폴더와 `%APPDATA%\MusicDeckBridge`를 비공개로 백업하고, [다운로드 체크섬](#다운로드-파일-검증)을 확인합니다.
2. 기존 플러그인을 설치된 상태로 두고 더 높은 버전의 `.streamDeckPlugin`을 더블클릭합니다. Stream Deck에서 설치를 완료합니다. 일반 업데이트에 개발자 모드나 수동 플러그인 중지는 필수 절차가 아닙니다.
3. 실제 설치 버전이 목표 버전으로 바뀌었는지 확인한 뒤 기존 페어링·공통 포트·액션·프로필을 확인합니다. Chrome은 위 안내대로 같은 폴더에서 갱신하고 새로고침합니다. 일반 업데이트를 위해 페어링을 초기화하지 마세요.

패키지가 거부되면 오류·실제 설치 버전·호스트 로그를 기록한 뒤 아래 복구 절차를 사용하세요. 같은 버전이나 이전 버전의 패키지는 이미 설치된 것으로 처리될 수 있습니다. 의도적인 개발 빌드 교체나 다운그레이드에는 백업 후 파일 교체를 사용합니다.

<a id="replacing-plugin-files"></a>

### 설치 실패 시 플러그인 파일 교체로 복구

설치가 거부됐거나 버전이 더 높지 않은 개발 빌드를 의도적으로 교체할 때 사용하는 복구 절차입니다. 매번 업데이트할 때 필요한 절차는 아닙니다.

이 상황에서 패키지를 업데이트하려면 다음 절차를 사용하세요.

1. Stream Deck 프로필과 설치된 플러그인 폴더를 백업합니다. `%APPDATA%\MusicDeckBridge`도 비공개 위치에 백업합니다. 설치 오류를 조사 중이라면 파일 교체 전에 `%APPDATA%\Elgato\StreamDeck\logs\StreamDeck*.log`와 대응하는 JSON 로그, 플러그인 내부 `logs` 폴더가 있으면 함께 보관하세요. PIN·토큰이나 가리지 않은 개인 정보는 공유하지 마세요.
2. 창만 닫지 말고 **시스템 트레이 메뉴에서 Stream Deck을 완전히 종료**합니다. 플러그인 폴더를 연 탐색기·터미널도 닫으세요. 폴더 이동이 계속 접근 거부되면 반복 삭제하지 말고 열린 핸들·권한을 조사하며 백업을 유지합니다.
3. `%APPDATA%\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin` 폴더만 **Plugins 밖의 백업 위치로 이동**합니다. 이름을 바꾼 복사본도 `Plugins` 안에는 남기지 않습니다.
4. `%APPDATA%\MusicDeckBridge\auth.json`, `config.json`, Stream Deck 프로필과 기존 Chrome 확장 프로그램은 유지합니다. 파일 교체이므로 **연결 해제나 확장 프로그램 삭제·초기화를 하지 않습니다.**
5. Stream Deck을 실행한 뒤 새로 받은 `.streamDeckPlugin`을 더블클릭합니다. 설치 성공을 확인하고, 설치된 매니페스트의 `Version`이 목표 버전인지 확인합니다(릴리스 `X.Y.Z`는 `X.Y.Z.0`). 다운로드 완료나 이전 액션의 복구만으로 업데이트 성공을 판단하지 마세요.
6. 같은 Chrome 확장 프로그램 폴더를 새 파일로 갱신하고 새로고침합니다. 기존 인증·양쪽 포트·액션 설정·프로필 유지와 재생 제어를 확인합니다.

설치에 실패하면 Stream Deck을 완전히 종료하고, 불완전한 새 플러그인 폴더가 있으면 `Plugins` 밖으로 옮긴 뒤 백업 폴더를 원래 경로에 복원하고 재실행합니다. 필요하면 Chrome도 같은 확장 폴더에 이전 파일을 복원하고 새로고침합니다. 인증·포트·프로필은 유지하세요. 실제 설치 버전과 설치 로그를 확인하며, `Failed to fetch` 해결을 위해 반복 설치나 PIN 초기화부터 진행하지 마세요.

확장 프로그램에 `Failed to fetch`가 표시되면 [문제 해결](troubleshooting.md)을 따르세요. 페어링을 변경하기 전에 Stream Deck 실행 여부, 실제 설치 버전과 양쪽 포트를 확인합니다.

### 다운로드 파일 검증

Actions 빌드와 Releases에는 `SHA256SUMS.txt`가 포함됩니다. 릴리스 패키지와 함께 다운로드하거나 Actions 산출물에서 압축 해제하세요. 패키지 폴더에서 PowerShell을 열고 실행합니다.

```powershell
Get-FileHash -Algorithm SHA256 -Path .\*.streamDeckPlugin, .\music-deck-bridge-chrome-*.zip
```

각 파일의 해시를 `SHA256SUMS.txt`에서 같은 파일명의 행과 비교합니다. 대소문자는 무관합니다. 개발 빌드의 `BUILD-INFO.json`도 `Get-FileHash -Algorithm SHA256 .\BUILD-INFO.json`으로 확인할 수 있습니다. 해시가 다르면 설치 전에 같은 릴리스·실행에서 다시 다운로드하세요.

<a id="switching-installation-methods"></a>

## 설치 경로 전환

모든 플러그인은 UUID `io.github.minjungw00.musicdeckbridge`를 사용하므로 한 버전만 설치합니다. 압축 해제 설치판과 스토어 확장 프로그램은 ID가 다를 수 있습니다. 두 확장 프로그램이 동시에 연결되면 인증이 서로 교체되어 제어가 중단될 수 있습니다.

| 전환 | 절차 |
| --- | --- |
| Actions → Releases | 안정 패키지의 플러그인 버전이 더 높으면 일반 업데이트로 설치하고, 같거나 낮으면 백업 후 파일 교체를 사용합니다. 기존 Chrome 폴더를 같은 위치에서 갱신한 뒤 새로고침합니다. |
| Releases → Actions | 같은 `main` 빌드의 두 패키지로 교체합니다. 수동 업데이트가 필요하고 안정성은 보장하지 않습니다. |
| GitHub → Elgato Marketplace | 승인 후 프로필과 플러그인을 백업하고 Stream Deck을 종료한 뒤 아래 방법으로 기존 플러그인 폴더를 제거합니다. 다시 실행하여 Marketplace 플러그인을 설치하고 기존 액션·설정을 확인합니다. |
| 압축 해제 Chrome → Chrome 웹 스토어 | Stream Deck과 기존 확장 프로그램이 연결된 상태에서 **해제** 성공을 확인한 뒤 기존 확장 프로그램을 삭제합니다. 승인된 스토어판을 설치하고 새 PIN으로 연결합니다. |
| 소스 → 배포 패키지 | 개발용 플러그인·확장 프로그램 사용을 중단하고 원하는 플러그인 패키지로 교체합니다. Chrome은 같은 폴더를 갱신하거나 개발용 확장 프로그램을 해제·제거한 뒤 다른 설치본을 로드합니다. |

기존 확장 프로그램을 사용할 수 없으면 제거하거나 비활성화한 뒤 새 설치본을 연결하세요. 새 PIN 연결은 기존 서버 인증을 폐기합니다. 일반적인 전환에서 `%APPDATA%\MusicDeckBridge`와 Stream Deck 프로필은 유지하며 의도적으로 초기화할 때만 삭제합니다. 전환 후 공통 포트와 기존 액션을 다시 확인하세요.

<a id="uninstalling"></a>

## 삭제 및 초기화

Stream Deck을 실행하고 양쪽 포트를 맞춘 상태에서 확장 프로그램 팝업의 **해제**를 누릅니다. 서버와 Chrome 토큰을 폐기하고 대기 중인 명령을 종료합니다. 서버 인증 폐기에 실패하면 토큰을 유지하므로 연결 문제를 해결한 뒤 삭제 전에 재시도하세요. 포트 설정은 유지됩니다.

트레이에서 Stream Deck을 종료한 뒤 `%APPDATA%\Elgato\StreamDeck\Plugins`의 `io.github.minjungw00.musicdeckbridge.sdPlugin` 폴더를 제거하고 다시 실행합니다. Chrome 확장 프로그램은 `chrome://extensions`에서 별도로 삭제하며, 이후 압축 해제 폴더도 지울 수 있습니다.

**완전 초기화**하려면 Stream Deck을 종료한 상태에서 `%APPDATA%\MusicDeckBridge\auth.json`, `config.json`도 삭제하세요. Stream Deck 액션 설정·프로필은 별도로 관리합니다. 데이터 보존은 [개인정보 문서](../PRIVACY.md)를 참고하세요.
