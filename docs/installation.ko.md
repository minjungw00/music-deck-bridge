# 설치 안내

[English](installation.en.md) · [문제 해결](troubleshooting.md)

Music Deck Bridge는 **Stream Deck 플러그인과 Chrome 확장 프로그램을 모두 설치**해야 동작합니다. 지원 대상은 Windows 10/11, Chrome 116 이상, Stream Deck 소프트웨어 7.1 이상입니다. 볼륨·곡 이동 다이얼은 Stream Deck +가 필요합니다.

## Stream Deck 플러그인 설치

1. 저장소를 다운로드하거나 복제합니다. Node.js 24를 설치한 뒤 저장소 루트에서 `npm ci --ignore-scripts`, `npm run build:plugin`을 실행합니다. 공식 SDK가 포함된 독립 실행 파일 `bin/plugin.js`가 생성됩니다.
2. 시스템 트레이 메뉴에서 Stream Deck을 완전히 종료합니다. 창만 닫으면 계속 실행 중일 수 있습니다.
3. `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin` 폴더 전체를 다음 경로에 붙여넣습니다.

   ```text
   %APPDATA%\Elgato\StreamDeck\Plugins
   ```

   `%APPDATA%`는 Windows 사용자 계정의 로밍 앱 데이터 폴더를 가리킵니다. 파일 탐색기 주소 표시줄에 위 경로를 그대로 붙여넣을 수 있습니다. 설치 후 매니페스트의 위치는 다음과 같아야 합니다.

   ```text
   %APPDATA%\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin\manifest.json
   ```

4. 저장소 루트의 `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, `PRIVACY.md`도 설치된 플러그인 폴더 안에 복사합니다.
5. Stream Deck을 다시 실행하고 액션 목록의 **Music Deck Bridge**를 확인합니다.

기존 설치를 교체할 때는 먼저 폴더를 백업하세요.

## Chrome 확장 프로그램 설치

1. Google Chrome에서 `chrome://extensions`를 엽니다.
2. **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 눌러 `manifest.json`이 있는 저장소의 `chrome-extension` 폴더를 선택합니다.
4. 필요하면 **Music Deck Bridge**를 도구 모음에 고정합니다.

## PIN 연결 및 사용

1. Stream Deck에 Music Deck Bridge 버튼 또는 다이얼 액션을 배치합니다.
2. 액션을 선택한 뒤 설정에서 **PIN 생성**을 누릅니다.
3. Chrome 확장 프로그램 팝업에 6자리 PIN을 입력하고 **연결**을 누릅니다. PIN 유효 시간은 10분이며 한 번 사용하면 폐기됩니다.
4. [YouTube Music](https://music.youtube.com/)에서 곡을 재생하고 팝업의 **상태 확인**을 누릅니다.
5. 현재 곡·앨범 아트, 재생/일시정지, 이전/다음 곡, 음소거를 확인합니다. Stream Deck +에서는 볼륨·곡 이동 다이얼도 확인합니다. 볼륨은 한 칸당 1~5%p로 설정할 수 있습니다. 곡 이동 다이얼은 한 칸당 한 곡씩 이동하며 한 이벤트당 최대 5곡까지 처리합니다.

일반 Chrome 탭과 Chrome으로 설치한 YouTube Music 앱(PWA)을 모두 사용할 수 있습니다. 두 창이 동시에 열리면 설치형 앱을 우선합니다.

## 포트 변경

기본 포트는 `17864`입니다. 액션 설정 또는 Chrome 팝업에서 사용하지 않는 `1024~65535` 정수로 변경할 수 있습니다. 플러그인의 모든 액션이 같은 포트를 사용하며, 연결된 Chrome은 변경을 따라갑니다. 연결이 끊겼거나 절전 상태였다면 양쪽 포트를 수동으로 맞추세요.

## 업데이트

Stream Deck을 종료하고 설치된 플러그인 폴더를 백업한 뒤, `npm ci --ignore-scripts`, `npm run build:plugin`으로 다시 빌드하고 위 Plugins 경로의 `io.github.minjungw00.musicdeckbridge.sdPlugin` 폴더를 새 폴더로 교체합니다. 설치 절차에 안내된 라이선스·개인정보 문서도 복사하고 Stream Deck을 다시 실행하세요. 인증 정보와 포트 설정은 별도로 저장되어 유지됩니다.

Chrome 확장 프로그램 폴더의 절대 경로를 유지하세요. 소스를 업데이트한 뒤 `chrome://extensions`에서 이 확장 프로그램의 **새로고침**을 누릅니다. 자동 재연결이 되지 않으면 YouTube Music 창도 새로고침하세요. 확장 프로그램 ID가 달라지면 새 PIN으로 연결해야 합니다.

## 삭제 및 초기화

Stream Deck을 종료한 다음 `%APPDATA%\Elgato\StreamDeck\Plugins`에서 `io.github.minjungw00.musicdeckbridge.sdPlugin` 폴더를 삭제합니다. Chrome 확장 프로그램은 `chrome://extensions`에서 별도로 삭제합니다.

팝업의 **해제**는 서버와 Chrome의 인증 토큰을 모두 폐기하고 대기 중인 명령 요청을 종료합니다. Stream Deck을 실행하고 포트를 맞춘 상태에서 해제하세요. 서버 인증 폐기에 실패하면 토큰을 유지하여 다시 시도할 수 있습니다. 포트 설정은 유지됩니다. 완전 초기화 시에는 Stream Deck을 종료한 상태에서 `%APPDATA%\MusicDeckBridge\auth.json`, `config.json`도 삭제하세요. 데이터 보존과 액션 설정 삭제는 [개인정보 문서](../PRIVACY.md)를 참고하세요.
