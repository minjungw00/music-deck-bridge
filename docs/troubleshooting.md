# Troubleshooting / 문제 해결

Never share real PINs, tokens or `auth.json`. Redact personal paths and listening data from screenshots/logs.

| Symptom / 증상 | Check / 확인 사항 |
| --- | --- |
| No Music Deck Bridge actions / 액션이 안 보임 | Confirm Stream Deck 7.1+, the plugin directory name and installation path. Fully quit and restart Stream Deck. / 버전과 설치 경로를 확인하고 완전히 종료 후 재실행하세요. |
| Connection refused / 연결 실패 | Start Stream Deck, confirm both components use the same port and check for a port conflict. / Stream Deck을 실행하고 양쪽 포트 및 충돌 여부를 확인하세요. |
| Failed to fetch after an update attempt / 설치 시도 후 Failed to fetch | Check whether Stream Deck rejected the installation and stopped the local bridge; restart and compare both ports before resetting pairing. The message alone does not identify a PIN error or new-code defect. / 설치 거부로 브리지가 중단됐는지 확인하고 재실행·포트 일치 여부부터 점검하세요. 이 메시지만으로 PIN 오류나 새 코드 결함을 확정할 수 없습니다. |
| Invalid or expired PIN / PIN 오류 | Generate a new PIN in any action's settings and enter it within ten minutes. After repeated failures wait a minute. / 새 PIN을 발급하고 10분 안에 입력하세요. 연속 실패 시 1분 후 재시도하세요. |
| Not paired or extension ID changed / 인증 해제 | Reloading from a different unpacked folder/profile can change the extension ID. Pair again. / 확장 프로그램 경로·프로필 변경 시 다시 연결하세요. |
| Paired but no track / 연결됐지만 곡이 없음 | Open `music.youtube.com` in Chrome, start playback and refresh the player. / Chrome에서 YouTube Music을 재생하고 새로고침하세요. |
| Idle/stale player / 유휴 상태·응답 지연 | Check Chrome Memory Saver/site exceptions, refresh the app and retry. Idle throttling may delay updates. / 메모리 절약의 사이트 예외 설정을 확인하고 앱을 새로고침하세요. |
| Wrong window controlled / 다른 창이 조작됨 | Installed Chrome app windows take priority over normal tabs. Close competing windows. / 설치형 앱이 우선입니다. 다른 플레이어 창을 닫으세요. |
| Missing artwork / 앨범 아트가 안 보임 | Check popup status, image-server access and supported image type/host. Playback may still work. / 팝업 상태와 이미지 서버 접근을 확인하세요. 재생 제어는 별도로 동작할 수 있습니다. |
| Extension updated but controls stopped / 업데이트 후 제어 안 됨 | Reload at `chrome://extensions`, then refresh the player if necessary. Keep the source path stable. / 확장 프로그램과 필요시 플레이어를 새로고침하고 경로를 유지하세요. |
| Dials unavailable / 다이얼 사용 불가 | Encoder actions require Stream Deck +. Volume adjusts the web player, not Windows system volume. / Stream Deck +가 필요하며 웹 플레이어의 볼륨을 조절합니다. |
| Plugin installation rejected; old actions stop / 설치 거부 후 기존 액션 중단 | Restart Stream Deck and check the actual installed version. If the old version works again, the new install did not complete. Follow [file replacement](installation.en.md#replacing-plugin-files), preserving auth/config/profiles; save installation logs before removing files. / 재실행 후 실제 버전을 확인하세요. 이전 버전이 복구됐다면 업데이트 성공이 아닙니다. 인증·포트·프로필을 유지하는 [파일 교체 절차](installation.ko.md#replacing-plugin-files)를 따르고 교체 전 설치 로그를 보관하세요. |
| Chrome cannot find manifest.json / 매니페스트를 찾을 수 없음 | Extract both the Actions artifact ZIP and the inner Chrome ZIP. Load the folder containing manifest.json, not the outer artifact or a ZIP. / Actions 산출물 ZIP과 내부 Chrome ZIP을 각각 해제하고 manifest.json이 바로 들어 있는 폴더를 로드하세요. |
| Old extension folder deleted or moved / 확장 폴더 삭제·이동 | Unpacked extensions need their files to remain at the same absolute path. Restore/update that folder and reload; if its ID changes, pair again. / 압축 해제 폴더의 절대 경로를 유지하고 갱신 후 새로고침하세요. ID가 바뀌면 다시 연결하세요. |
| Connection alternates between installations / 설치본 간 연결 충돌 | Unpair and remove the old Chrome extension before switching sources. Keep only one active copy, including other Chrome profiles; pair the replacement with a new PIN. / 출처 전환 전 기존 확장을 해제·제거하세요. 다른 Chrome 프로필도 확인하여 하나만 활성화하고 새 PIN으로 연결하세요. |
| Build version is unchanged or download expired / 같은 버전·다운로드 만료 | Development builds can share a version. Record the run URL and commit SHA; download a recent successful main run when artifacts expire. / 개발 빌드는 버전이 같을 수 있으므로 실행 URL과 커밋 SHA를 기록하세요. 산출물이 만료되면 최근 성공한 main 실행에서 받으세요. |

See the [English installation guide](installation.en.md#switching-installation-methods) / [한국어 설치 안내](installation.ko.md#switching-installation-methods) before replacing packages or switching to stores. Back up Stream Deck profiles and keep `%APPDATA%\MusicDeckBridge` for ordinary updates.

If tests cannot bind `127.0.0.1`, run them in an environment that permits local TCP listeners. `npm test` runs test files serially because some baseline integration tests share port `17864`. Do not run a normal plugin instance on that port while testing.

For bug reports include OS, browser, extension, Stream Deck software/device versions, tab versus installed app, steps, expected/actual behavior and redacted diagnostics. Use [SECURITY.md](../SECURITY.md) for private vulnerability reports.

## Installation logs / 설치 로그

Before retrying a rejected installation, save `%APPDATA%\Elgato\StreamDeck\logs\StreamDeck*.log`, matching JSON logs and the plugin's `logs` folder if present. Include the error time, actual installed version and package source/checksum in a bug report. Back up profiles, `%APPDATA%\MusicDeckBridge` and plugin files before following the [recovery procedure](installation.en.md#replacing-plugin-files). If moving the stopped plugin folder gives access denied, close windows/terminals using it and inspect open handles and permissions. Keep the same Chrome extension path/ID.

설치가 거부되면 재시도 전에 `%APPDATA%\Elgato\StreamDeck\logs\StreamDeck*.log`, 대응하는 JSON 로그와 플러그인의 `logs` 폴더가 있으면 보관하세요. 오류 발생 시각, 실제 설치 버전과 패키지 출처·체크섬을 오류 보고에 포함합니다. 프로필·`%APPDATA%\MusicDeckBridge`·플러그인 파일을 백업한 뒤 [복구 절차](installation.ko.md#replacing-plugin-files)를 따르세요. 중지한 플러그인 폴더를 이동할 때 접근이 거부되면 해당 폴더를 사용하는 창·터미널을 닫고 열린 핸들과 권한을 확인합니다. Chrome 확장 프로그램의 경로·ID는 유지하세요.

Host logs can contain device and account identifiers. Share only reviewed, redacted entries. 호스트 로그에는 장치·계정 식별 정보가 포함될 수 있으므로 검토하고 가린 내용만 공유하세요.
