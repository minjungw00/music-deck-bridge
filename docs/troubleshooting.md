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
| Plugin update not applied / 플러그인 업데이트 미적용 | Quit Stream Deck from the tray, replace the installed plugin folder, then restart it. / 트레이에서 Stream Deck을 종료하고 설치 폴더를 교체한 뒤 재실행하세요. |

If tests cannot bind `127.0.0.1`, run them in an environment that permits local TCP listeners. `npm test` runs test files serially because some baseline integration tests share port `17864`. Do not run a normal plugin instance on that port while testing.

For bug reports include OS, browser, extension, Stream Deck software/device versions, tab versus installed app, steps, expected/actual behavior and redacted diagnostics. Use [SECURITY.md](../SECURITY.md) for private vulnerability reports.
