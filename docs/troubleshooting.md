# Troubleshooting / 문제 해결

Never share real PINs, tokens or `auth.json`. Redact personal paths and listening data from screenshots/logs.

| Symptom / 증상 | Check / 확인 사항 |
| --- | --- |
| No Music Deck Bridge actions / 액션이 안 보임 | Confirm Stream Deck 7.1+, the plugin directory name and installation path. Fully quit and restart Stream Deck. / 버전과 설치 경로를 확인하고 완전히 종료 후 재실행하세요. |
| Connection refused / 연결 실패 | Start Stream Deck, confirm both components use the same port and check for a port conflict. / Stream Deck을 실행하고 양쪽 포트 및 충돌 여부를 확인하세요. |
| Invalid or expired PIN / PIN 오류 | Generate a new PIN in any action's settings and enter it within ten minutes. After repeated failures wait a minute. / 새 PIN을 발급하고 10분 안에 입력하세요. 연속 실패 시 1분 후 재시도하세요. |
| Not paired or extension ID changed / 인증 해제 | Reloading from a different unpacked folder/profile can change the extension ID. Pair again. / 확장 프로그램 경로·프로필 변경 시 다시 연결하세요. |
| Paired but no track / 연결됐지만 곡이 없음 | Open `music.youtube.com` in Chrome, start playback and refresh the player. / Chrome에서 YouTube Music을 재생하고 새로고침하세요. |
| Idle/stale player / 유휴 상태·응답 지연 | Check Chrome Memory Saver/site exceptions, refresh the app and retry. Idle throttling may delay updates. / 메모리 절약의 사이트 예외 설정을 확인하고 앱을 새로고침하세요. |
| Wrong window controlled / 다른 창이 조작됨 | Installed Chrome app windows take priority over normal tabs. Close competing windows. / 설치형 앱이 우선입니다. 다른 플레이어 창을 닫으세요. |
| Missing artwork / 앨범 아트가 안 보임 | Check popup status, image-server access and supported image type/host. Playback may still work. / 팝업 상태와 이미지 서버 접근을 확인하세요. 재생 제어는 별도로 동작할 수 있습니다. |
| Extension updated but controls stopped / 업데이트 후 제어 안 됨 | Reload at `chrome://extensions`, then refresh the player if necessary. Keep the source path stable. / 확장 프로그램과 필요시 플레이어를 새로고침하고 경로를 유지하세요. |
| Dials unavailable / 다이얼 사용 불가 | Encoder actions require Stream Deck +. Volume adjusts the web player, not Windows system volume. / Stream Deck +가 필요하며 웹 플레이어의 볼륨을 조절합니다. |
| Plugin update not applied / 플러그인 업데이트 미적용 | Open the new installer to replace the package. For a manual source install, quit Stream Deck from the tray, replace the plugin folder including notices, then restart. Keep one version of the plugin UUID. / 새 설치 파일로 교체하세요. 소스 수동 설치는 트레이에서 종료 후 라이선스 문서와 함께 폴더를 교체하고 재실행하세요. 같은 UUID의 플러그인은 한 버전만 사용하세요. |
| Chrome cannot find manifest.json / 매니페스트를 찾을 수 없음 | Extract both the Actions artifact ZIP and the inner Chrome ZIP. Load the folder containing manifest.json, not the outer artifact or a ZIP. / Actions 산출물 ZIP과 내부 Chrome ZIP을 각각 해제하고 manifest.json이 바로 들어 있는 폴더를 로드하세요. |
| Old extension folder deleted or moved / 확장 폴더 삭제·이동 | Unpacked extensions need their files to remain at the same absolute path. Restore/update that folder and reload; if its ID changes, pair again. / 압축 해제 폴더의 절대 경로를 유지하고 갱신 후 새로고침하세요. ID가 바뀌면 다시 연결하세요. |
| Connection alternates between installations / 설치본 간 연결 충돌 | Unpair and remove the old Chrome extension before switching sources. Keep only one active copy, including other Chrome profiles; pair the replacement with a new PIN. / 출처 전환 전 기존 확장을 해제·제거하세요. 다른 Chrome 프로필도 확인하여 하나만 활성화하고 새 PIN으로 연결하세요. |
| Build version is unchanged or download expired / 같은 버전·다운로드 만료 | Development builds can share a version. Record the run URL and commit SHA; download a recent successful main run when artifacts expire. / 개발 빌드는 버전이 같을 수 있으므로 실행 URL과 커밋 SHA를 기록하세요. 산출물이 만료되면 최근 성공한 main 실행에서 받으세요. |

See the [English installation guide](installation.en.md#switching-installation-methods) / [한국어 설치 안내](installation.ko.md#switching-installation-methods) before replacing packages or switching to stores. Back up Stream Deck profiles and keep `%APPDATA%\MusicDeckBridge` for ordinary updates.

If tests cannot bind `127.0.0.1`, run them in an environment that permits local TCP listeners. `npm test` runs test files serially because some baseline integration tests share port `17864`. Do not run a normal plugin instance on that port while testing.

For bug reports include OS, browser, extension, Stream Deck software/device versions, tab versus installed app, steps, expected/actual behavior and redacted diagnostics. Use [SECURITY.md](../SECURITY.md) for private vulnerability reports.
