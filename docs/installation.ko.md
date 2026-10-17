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
| 장치 | 버튼 액션은 Stream Deck 키 모델 대상; 볼륨·곡 이동 다이얼은 Stream Deck + 필요 |

<a id="method-1-github-releases"></a>

## 방법 1: GitHub Releases

**v1.0.0**부터 제공하는 [최신 안정 릴리스](https://github.com/minjungw00/music-deck-bridge/releases/latest)를 사용하세요. 빌드 도구 없이 다음과 같이 설치합니다.

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
3. **Artifacts**에서 `music-deck-bridge-dev-windows-<commit-sha>`를 다운로드합니다. 이전 실행은 `packages-windows-latest`라는 이름을 사용하며 실행 페이지에서 SHA를 확인할 수 있습니다. Ubuntu 산출물은 패키징 검증용이며 Linux 설치를 지원한다는 뜻은 아닙니다.
4. 다운로드한 산출물 ZIP을 해제합니다. 내부에는 `.streamDeckPlugin`과 별도의 `music-deck-bridge-chrome-<version>.zip`이 있으며, 새 빌드는 `BUILD-INFO.json`, `SHA256SUMS.txt`도 포함합니다. `BUILD-INFO.json`에는 전체 커밋 SHA, 소스 ref, 버전, 플랫폼, 실행 URL이 기록됩니다. ref가 `refs/heads/main`인지 확인하고 오류 보고를 위해 파일을 보관하세요.
5. `.streamDeckPlugin`을 더블클릭해 설치합니다. **내부 Chrome ZIP도 별도로 압축 해제**하여 고정 폴더에 두고, `chrome://extensions`에서 **개발자 모드 → 압축해제된 확장 프로그램 로드**로 설치합니다. 바깥 산출물 폴더 대신 `manifest.json`이 있는 폴더를 선택하세요.
6. [PIN 연결](#pairing) 후 재생 제어를 확인합니다.

여러 개발 빌드의 버전이 같을 수 있습니다. 커밋 SHA와 실행 URL로 빌드를 식별하세요. 두 구성요소는 같은 실행의 패키지를 사용하며, 개발 패키지는 자동 업데이트되지 않습니다.

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

**승인·공개 준비 중이며 실제 설치 링크는 아직 없습니다.** 두 구성요소의 출시 상태는 각각 관리합니다.

| 구성요소 | 스토어 | 상태 |
| --- | --- | --- |
| Stream Deck 플러그인 | Elgato Marketplace | 준비 중; 현재는 GitHub Release 패키지 사용 |
| Chrome 확장 프로그램 | Chrome 웹 스토어 | 준비 중; 현재는 Chrome ZIP 압축 해제 후 사용 |

각 스토어에 공개된 뒤 검증한 제품 URL을 이 절에 추가합니다. Elgato Marketplace에서 플러그인을 설치하고 Chrome 웹 스토어에서 확장 프로그램을 추가한 뒤 [PIN 연결](#pairing)을 수행합니다. 양쪽 모두 출시되면 공식 스토어를 가장 먼저 안내합니다.

출시 시점이 다를 수 있습니다. 예를 들어 Chrome 스토어가 먼저 공개되면 확장 프로그램은 스토어에서, 플러그인은 GitHub Releases에서 설치할 수 있습니다. 각 구성요소는 하나만 활성화하고 [설치 경로 전환](#switching-installation-methods)을 따르세요.

<a id="pairing"></a>

## PIN 연결

1. Stream Deck에 Music Deck Bridge 버튼 또는 다이얼 액션을 배치합니다.
2. 액션을 선택한 뒤 설정에서 **PIN 생성**을 누릅니다.
3. Chrome 확장 프로그램 팝업에 6자리 PIN을 입력하고 **연결**을 누릅니다. PIN 유효 시간은 10분이며 한 번 사용하면 폐기됩니다.
4. [YouTube Music](https://music.youtube.com/)에서 곡을 재생하고 팝업의 **상태 확인**을 누릅니다.
5. 재생/일시정지, 이전/다음 곡, 음소거, 앨범 아트를 확인합니다. Stream Deck +에서는 볼륨·곡 이동 다이얼도 확인하세요. 볼륨은 한 칸당 1~5%p로 설정하며, 곡 이동은 한 칸당 한 곡, 한 이벤트당 최대 5곡까지 처리합니다.

일반 탭과 Chrome으로 설치한 YouTube Music 앱이 동시에 열리면 설치형 앱을 우선합니다.

### 포트 변경

기본 포트는 `17864`입니다. 액션 설정 또는 확장 프로그램 팝업에서 사용하지 않는 `1024~65535` 정수로 변경할 수 있습니다. 모든 플러그인 액션이 같은 포트를 사용합니다. 연결된 Chrome은 변경을 따라가며, 연결이 끊겼거나 절전 상태였다면 양쪽 포트를 수동으로 맞추세요.

<a id="updating"></a>

## 업데이트

설치본 변경 전 Stream Deck 프로필을 백업하세요. `%APPDATA%\MusicDeckBridge`는 유지합니다. 인증 정보(`auth.json`)와 공통 포트(`config.json`)는 플러그인과 별도로 저장됩니다. 일반적인 업데이트에서는 이 파일들과 Stream Deck 프로필을 유지합니다. 확장 프로그램 ID가 바뀌면 새 PIN 연결이 필요합니다.

| 설치 출처 | 업데이트 방법 |
| --- | --- |
| GitHub Releases | 같은 릴리스의 두 패키지를 다운로드합니다. 기존 플러그인은 아래 파일 교체 절차를 따르고, Chrome은 기존 폴더에서 갱신합니다. |
| GitHub Actions | 다른 성공한 `main` 실행에서 두 패키지를 받아 아래 방법으로 교체하고 SHA를 기록합니다. 자동 업데이트는 지원하지 않습니다. |
| 소스 | 원하는 리비전을 받은 뒤 `npm ci --ignore-scripts`, `npm run build:plugin`을 실행합니다. Stream Deck을 종료하고 라이선스 문서와 함께 플러그인 폴더를 교체한 뒤 다시 실행합니다. |
| 공식 스토어 공개 후 | 각 스토어의 업데이트 기능을 사용하고 두 구성요소 모두 갱신됐는지 확인합니다. |

압축 해제한 Chrome 확장 프로그램은 **폴더 절대 경로를 유지**하며 기존 폴더의 내용을 새 파일로 교체합니다. 소스 설치라면 같은 저장소 경로를 갱신하세요. `chrome://extensions`에서 **새로고침**을 누르고 필요하면 YouTube Music도 새로고침합니다. 새 버전마다 별도 확장 프로그램으로 로드하지 마세요.

<a id="replacing-plugin-files"></a>

### 설정을 보존하며 플러그인 파일 교체

기존 플러그인이 있는 상태에서 새 패키지를 실행하는 방식은 이 프로젝트에서 성공 검증되지 않았습니다. 첫 v1.0.1 시도에서는 “플러그인을 설치할 수 없습니다”가 표시됐고, Stream Deck 재실행 후 이전 버전의 기능이 복구됐습니다. v0.5.1 → v1.0.0은 기존 플러그인 파일을 제거하고 재설치한 결과이며 덮어쓰기 성공 기록이 아닙니다.

이후 설치 성공·SDK 연결 로그와 개발자의 정상 동작 보고는 파일 교체를 통한 복구를 뒷받침합니다. 설정 보존 항목별 측정과 롤백 실증은 아직 남아 있으므로 아래 백업을 먼저 수행하세요.

이 상황에서 패키지를 업데이트하려면 다음 절차를 사용하세요.

1. Stream Deck 프로필과 설치된 플러그인 폴더를 백업합니다. `%APPDATA%\MusicDeckBridge`도 비공개 위치에 백업합니다. 설치 오류를 조사 중이라면 파일 교체 전에 `%APPDATA%\Elgato\StreamDeck\logs\StreamDeck*.log`와 대응하는 JSON 로그, 플러그인 내부 `logs` 폴더가 있으면 함께 보관하세요. PIN·토큰이나 가리지 않은 개인 정보는 공유하지 마세요.
2. 창만 닫지 말고 **시스템 트레이 메뉴에서 Stream Deck을 완전히 종료**합니다. 플러그인 폴더를 연 탐색기·터미널도 닫으세요. 폴더 이동이 계속 접근 거부되면 반복 삭제하지 말고 열린 핸들·권한을 조사하며 백업을 유지합니다.
3. `%APPDATA%\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin` 폴더만 **Plugins 밖의 백업 위치로 이동**합니다. 이름을 바꾼 복사본도 `Plugins` 안에는 남기지 않습니다.
4. `%APPDATA%\MusicDeckBridge\auth.json`, `config.json`, Stream Deck 프로필과 기존 Chrome 확장 프로그램은 유지합니다. 파일 교체이므로 **연결 해제나 확장 프로그램 삭제·초기화를 하지 않습니다.**
5. Stream Deck을 실행한 뒤 새로 받은 `.streamDeckPlugin`을 더블클릭합니다. 설치 성공을 확인하고, 설치된 매니페스트의 `Version`이 목표 버전인지 확인합니다(v1.0.1은 `1.0.1.0`). 다운로드 완료나 이전 액션의 복구만으로 업데이트 성공을 판단하지 마세요.
6. 같은 Chrome 확장 프로그램 폴더를 새 파일로 갱신하고 새로고침합니다. 기존 인증·양쪽 포트·액션 설정·프로필 유지와 재생 제어를 확인합니다.

설치에 실패하면 Stream Deck을 완전히 종료하고, 불완전한 새 플러그인 폴더가 있으면 `Plugins` 밖으로 옮긴 뒤 백업 폴더를 원래 경로에 복원하고 재실행합니다. 필요하면 Chrome도 같은 확장 폴더에 이전 파일을 복원하고 새로고침합니다. 인증·포트·프로필은 유지하세요. 실제 설치 버전과 설치 로그를 확인하며, `Failed to fetch` 해결을 위해 반복 설치나 PIN 초기화부터 진행하지 마세요.

`Failed to fetch`는 확장 프로그램이 설정된 로컬 브리지에서 HTTP 응답을 받지 못했다는 뜻입니다. 설치가 거부된 직후라면 Stream Deck 재실행으로 이전 버전이 복구되는지, 양쪽 포트가 같은지 먼저 확인하세요. 이 메시지만으로 PIN 오류나 새 플러그인의 결함을 확정할 수는 없습니다. 새 버전이 설치되지 않았을 수 있습니다. 10월 17일 실제 로그에서는 기존 플러그인 제거 중 폴더 이름 변경이 `Access is denied`로 실패했습니다. 이를 막은 프로세스나 권한은 미확인이며 [조사 기록과 남은 보존 검증](verification/update-installation.md)을 참고하세요.

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
| Actions → Releases | 위 플러그인 파일 교체 절차로 안정 패키지를 설치하고, 기존 Chrome 폴더를 같은 위치에서 갱신한 뒤 새로고침합니다. |
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
