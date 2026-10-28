# 스토어 등록 문안 — 한국어

## 실제 제출 설명문

사용자가 제공한 **v1.1.1 실제 제출본**입니다. 원문을 보존하고 이후 수정본은 별도로 기록합니다. 패키지·이미지 출처와 심사 상태는 [제출 기록](../docs/verification/stores.md)에서 확인하세요.

| 스토어 | 제출 설명문 |
| --- | --- |
| Chrome 웹 스토어 | [한국어](submitted/v1.1.1/chrome-ko.md) · [영어](submitted/v1.1.1/chrome-en.md) |
| Elgato Marketplace | [영어](submitted/v1.1.1/elgato-en.md) |

## 메타데이터 제안

| 필드 | 제안 문안 |
| --- | --- |
| 이름 | **Music Deck Bridge** |
| Chrome 짧은 설명 | Chrome 확장 프로그램으로 Elgato Stream Deck에서 YouTube Music을 제어하세요. |

짧은 설명과 아래 권한 설명은 작성 참고용이며, 해당 필드의 실제 제출값은 제공되지 않았습니다. Marketplace의 한국어 제출본은 제공되지 않았습니다.

## 권한 설명

| 권한 / 호스트 | 사용 목적 |
| --- | --- |
| storage | 로컬 연결 토큰과 브리지 포트를 저장합니다. 콘텐츠 스크립트의 저장소 접근은 차단합니다. |
| scripting | 확장 프로그램 업데이트·브라우저 시작 후 스크립트를 복원하고, 페이지의 재생 상태를 읽으며 재생·곡 이동·볼륨·음소거 제어와 실행 결과를 확인합니다. |
| alarms | 플레이어 스크립트와 브라우저 명령 연결을 주기적으로 복원합니다. |
| https://music.youtube.com/* | YouTube Music의 곡 정보·평가 상태를 읽고 해당 탭을 찾아 재생·평가를 제어합니다. |
| http://127.0.0.1/* | 같은 컴퓨터의 동반 플러그인에 설정한 포트로 접속합니다. |

## 제출 링크 및 개인정보 확인

- [프로젝트·설치 안내](https://github.com/minjungw00/music-deck-bridge)
- [지원](https://github.com/minjungw00/music-deck-bridge/issues)
- [개인정보 처리방침](https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md)
- 함께 설치할 구성요소: [Elgato Marketplace](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) / [Chrome 웹 스토어](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca)
- 라이선스·고지: 저장소 및 배포 파일의 LICENSE, THIRD_PARTY_NOTICES.md

제출 전에 공개된 개인정보 처리방침이 업로드한 빌드와 일치하는지 확인하고 스토어의 데이터 이용 항목을 검토하세요. 확장 프로그램은 곡 정보·탭 ID·로컬 인증 정보를 처리하며 플러그인은 외부로 앨범 이미지를 요청합니다. 모든 통신이 로컬이라고 기재하지 마세요. 스토어의 실제 분류 항목을 확인한 후 개인정보 신고 양식을 작성하세요.
