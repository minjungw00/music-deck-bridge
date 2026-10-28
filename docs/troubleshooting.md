# Troubleshooting / 문제 해결

Never share real PINs, tokens or `auth.json`. Redact personal paths and listening data from screenshots/logs.

실제 PIN·토큰·인증 파일은 공유하지 말고, 스크린샷과 로그의 개인 경로·청취 정보를 가리세요.

- [Connection and pairing / 연결과 PIN](#connection-and-pairing--연결과-pin)
- [Player controls and display / 재생과 화면](#player-controls-and-display--재생과-화면)
- [Installation and updates / 설치와 업데이트](#installation-and-updates--설치와-업데이트)
- [Protocol compatibility / 통신 규약 호환성](#protocol-compatibility--통신-규약-호환성)
- [Command warnings / 버튼 경고](#command-warnings--버튼-경고)
- [Installation logs / 설치 로그](#installation-logs--설치-로그)
- [Bug reports / 오류 보고](#bug-reports--오류-보고)

## Connection and pairing / 연결과 PIN

| Symptom / 증상 | English | 한국어 |
| --- | --- | --- |
| Connection refused / 연결 실패 | Start Stream Deck, confirm both components use the same port and check for a port conflict. | Stream Deck을 실행하고 양쪽 포트 및 충돌 여부를 확인하세요. |
| Failed to fetch after an update attempt / 설치 시도 후 Failed to fetch | Check whether Stream Deck rejected the installation and stopped the local bridge; restart and compare both ports before resetting pairing. The message alone does not identify a PIN error or new-code defect. | 설치 거부로 브리지가 중단됐는지 확인하고 재실행·포트 일치 여부부터 점검하세요. 이 메시지만으로 PIN 오류나 새 코드 결함을 확정할 수 없습니다. |
| Invalid or expired PIN / PIN 오류 | Generate a new PIN in any action's settings and enter it within ten minutes. After repeated failures wait a minute. | 새 PIN을 발급하고 10분 안에 입력하세요. 연속 실패 시 1분 후 재시도하세요. |
| Not paired or extension ID changed / 인증 해제 | Reloading from a different unpacked folder/profile can change the extension ID. Pair again. | 확장 프로그램 경로·프로필 변경 시 다시 연결하세요. |
| Connection alternates between installations / 설치본 간 연결 충돌 | Unpair and remove the old Chrome extension before switching sources. Keep only one active copy, including other Chrome profiles; pair the replacement with a new PIN. | 출처 전환 전 기존 확장을 해제·제거하세요. 다른 Chrome 프로필도 확인하여 하나만 활성화하고 새 PIN으로 연결하세요. |

## Player controls and display / 재생과 화면

| Symptom / 증상 | English | 한국어 |
| --- | --- | --- |
| Launch key shows an alert / 실행 버튼 경고 | Install matching plugin/extension builds and check pairing. For fully closed Chrome, use a standard Windows Chrome installation; custom paths are unsupported. | 플러그인·확장 프로그램 빌드와 PIN 연결을 확인하세요. Chrome이 완전히 종료됐다면 표준 Windows 설치 경로의 Chrome이 필요합니다. |
| Ratings do not change / 좋아요·싫어요가 바뀌지 않음 | Use the matching extension, sign in to YouTube Music and check its current-song rating controls. Commands for a changed track are discarded; retry for the intended song. | 맞는 확장 프로그램을 사용하고 로그인 및 현재 곡 평가 버튼을 확인하세요. 곡이 바뀌면 이전 평가 명령은 취소되므로 원하는 곡에서 다시 누르세요. |
| Paired but no track / 연결됐지만 곡이 없음 | Open `music.youtube.com` in Chrome, start playback and refresh the player. | Chrome에서 YouTube Music을 재생하고 새로고침하세요. |
| Idle/stale player / 유휴 상태·응답 지연 | Check Chrome Memory Saver/site exceptions, refresh the app and retry. Idle throttling may delay updates. | 메모리 절약의 사이트 예외 설정을 확인하고 앱을 새로고침하세요. |
| Wrong window controlled / 다른 창이 조작됨 | Installed Chrome app windows take priority over normal tabs. Close competing windows. | 설치형 앱이 우선입니다. 다른 플레이어 창을 닫으세요. |
| Missing artwork / 앨범 아트가 안 보임 | Check popup status, image-server access and supported image type/host. Playback may still work. | 팝업 상태와 이미지 서버 접근을 확인하세요. 재생 제어는 별도로 동작할 수 있습니다. |
| Extension updated but controls stopped / 업데이트 후 제어 안 됨 | Reload at `chrome://extensions`, then refresh the player if necessary. Keep the source path stable. | 확장 프로그램과 필요시 플레이어를 새로고침하고 경로를 유지하세요. |
| Dials unavailable / 다이얼 사용 불가 | Encoder actions require Stream Deck +. Volume adjusts the web player, not Windows system volume. | Stream Deck +가 필요하며 웹 플레이어의 볼륨을 조절합니다. |

## Installation and updates / 설치와 업데이트

| Symptom / 증상 | English | 한국어 |
| --- | --- | --- |
| No Music Deck Bridge actions / 액션이 안 보임 | Confirm Stream Deck 7.1+, the plugin directory name and installation path. Fully quit and restart Stream Deck. | 버전과 설치 경로를 확인하고 완전히 종료 후 재실행하세요. |
| Plugin installation rejected; old actions stop / 설치 거부 후 기존 액션 중단 | Restart Stream Deck and check the actual installed version. If the old version works again, the new install did not complete. Follow [file replacement](installation.en.md#replacing-plugin-files), preserving auth/config/profiles; save installation logs before removing files. | 재실행 후 실제 버전을 확인하세요. 이전 버전이 복구됐다면 업데이트 성공이 아닙니다. 인증·포트·프로필을 유지하는 [파일 교체 절차](installation.ko.md#replacing-plugin-files)를 따르고 교체 전 설치 로그를 보관하세요. |
| Chrome cannot find manifest.json / 매니페스트를 찾을 수 없음 | Extract both the Actions artifact ZIP and the inner Chrome ZIP. Load the folder containing manifest.json, not the outer artifact or a ZIP. | Actions 산출물 ZIP과 내부 Chrome ZIP을 각각 해제하고 manifest.json이 바로 들어 있는 폴더를 로드하세요. |
| Old extension folder deleted or moved / 확장 폴더 삭제·이동 | Unpacked extensions need their files to remain at the same absolute path. Restore/update that folder and reload; if its ID changes, pair again. | 압축 해제 폴더의 절대 경로를 유지하고 갱신 후 새로고침하세요. ID가 바뀌면 다시 연결하세요. |
| Build version is unchanged or download expired / 같은 버전·다운로드 만료 | Development builds can share a version. Record the run URL and commit SHA; download a recent successful main run when artifacts expire. | 개발 빌드는 버전이 같을 수 있으므로 실행 URL과 커밋 SHA를 기록하세요. 산출물이 만료되면 최근 성공한 main 실행에서 받으세요. |

See the [English installation guide](installation.en.md#switching-installation-methods) / [한국어 설치 안내](installation.ko.md#switching-installation-methods) before replacing packages or switching to stores. Back up Stream Deck profiles and keep `%APPDATA%\MusicDeckBridge` for ordinary updates.

## Protocol compatibility / 통신 규약 호환성

Update the plugin or extension named in an incompatibility message. Existing credentials and port are retained; protocol mismatch does not require a new PIN. If compatibility information is invalid, update both components and check again. See the [protocol policy](protocol.md).

비호환 안내에 지정된 플러그인 또는 확장 프로그램을 업데이트하세요. 기존 인증정보와 포트는 유지되므로 규약 불일치 때문에 새 PIN을 발급할 필요는 없습니다. 호환성 정보 자체가 올바르지 않다는 안내라면 양쪽을 업데이트한 뒤 다시 확인하세요.

## Command warnings / 버튼 경고

When a control shows the warning triangle, select that action in the Stream Deck app. In its lower settings panel, look in **Chrome connection**, below the PIN button and connection/version lines, for the failure explanation ending in `(error-code)`. There is no separate “last command error” setting. Successful browser input clears the explanation.

버튼에 노란 삼각형이 표시되면 Stream Deck 앱에서 해당 버튼을 선택하세요. 하단 설정 패널의 **Chrome 연결** 영역에서 PIN 발급 버튼 및 연결 상태·버전 표시 아래에 있는 `(오류 코드)`로 끝나는 실패 안내를 확인하세요. ‘마지막 명령 오류’라는 별도 설정 항목은 없습니다. 이후 명령이 성공하면 안내가 지워집니다.

| Code | English | 한국어 |
| --- | --- | --- |
| `pairing-required`, `authorization-lost` | Pair with a new PIN. | 새 PIN으로 다시 연결하세요. |
| `extension-unavailable`, `bridge-unavailable`, `browser-api-failed` | Check the paired Chrome profile, ports and extension permissions. | 연결한 Chrome 프로필·양쪽 포트·확장 권한을 확인하세요. |
| `player-not-ready` | Wait for usable player controls; sign in or select a song if needed. | 플레이어 조작부가 준비될 때까지 기다리고 필요하면 로그인하거나 곡을 선택하세요. |
| `receiver-unavailable` | The receiver stayed unavailable during navigation; refresh the player and retry. | 페이지 이동 중 수신기가 연결되지 않았습니다. 플레이어를 새로고침한 뒤 재시도하세요. |
| `delivery-uncertain` | Check the player before repeating: the original input may have executed. | 이미 실행됐을 수 있으므로 플레이어 상태를 확인한 뒤 다시 누르세요. |
| `playback-unconfirmed` | Input was dispatched, but playback/track change was not observed. Check the player before retrying. | 입력 후 재생·곡 변경을 확인하지 못했습니다. 플레이어 상태를 먼저 확인하세요. |
| `player-error` | Resolve the reported player/media error in YouTube Music. | YouTube Music에서 플레이어·미디어 오류를 확인하세요. |
| `autoplay-blocked` | Start playback in the YouTube Music window, then retry. | YouTube Music 창에서 직접 재생한 뒤 재시도하세요. |

The plugin leaves Chrome's autoplay and security settings unchanged. See Chrome's [autoplay policy](https://developer.chrome.com/blog/autoplay/).

플러그인은 Chrome의 자동 재생·보안 설정을 변경하지 않습니다.

## Installation logs / 설치 로그

Before retrying a rejected installation / 설치 재시도 전:

| Step | English | 한국어 |
| --- | --- | --- |
| 1 | Save `%APPDATA%\Elgato\StreamDeck\logs\StreamDeck*.log`, matching JSON logs and the plugin's `logs` folder if present. | 같은 경로의 호스트 로그·대응 JSON 로그와 플러그인 `logs` 폴더가 있으면 보관하세요. |
| 2 | Record the error time, actual installed version and package source/checksum. | 오류 시각·실제 설치 버전·패키지 출처·체크섬을 기록하세요. |
| 3 | Back up profiles, `%APPDATA%\MusicDeckBridge` and plugin files, then follow [recovery](installation.en.md#replacing-plugin-files). | 프로필·인증/포트·플러그인 파일을 백업한 뒤 [복구 절차](installation.ko.md#replacing-plugin-files)를 따르세요. |
| 4 | If moving the stopped plugin folder is denied, close windows/terminals using it and inspect open handles/permissions. Keep the Chrome path/ID. | 폴더 이동이 거부되면 해당 폴더를 쓰는 창·터미널을 닫고 핸들·권한을 확인하세요. Chrome 경로·ID는 유지합니다. |

SDK logs in the installed plugin's `logs` directory include command failure codes. Host logs can contain device and account identifiers; review and redact them before sharing.

설치된 플러그인의 `logs` 폴더에는 명령 실패 코드가 기록됩니다. 호스트 로그에는 장치·계정 식별 정보가 포함될 수 있으므로 검토하고 가린 뒤 공유하세요.

## Bug reports / 오류 보고

Include OS, Chrome/extension, Stream Deck software/device versions, tab versus installed app, steps, expected/actual behavior and redacted diagnostics. Use [SECURITY.md](../SECURITY.md) for private vulnerability reports.

운영체제·Chrome·확장 프로그램·Stream Deck 소프트웨어·장치 버전, 탭 또는 설치형 앱 여부, 재현 절차, 예상·실제 결과와 가린 로그를 포함하세요. 보안 취약점은 [비공개 신고 경로](../SECURITY.md)를 사용합니다.
