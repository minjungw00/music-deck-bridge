# 스토어 등록 문안 — 한국어

미공개 1.0.2 후보 기준 초안입니다. 기존 Elgato 제출본은 개발자 보고 기준 v1.0.1 Pending review 상태를 유지합니다. 제출할 빌드에서 모든 기능을 확인하세요. 실제 스크린샷과 출시 승인은 아직 필요합니다. [출시 준비 기록](../docs/release-readiness.md)을 참고하세요.

## Chrome 웹 스토어

이름: **Music Deck Bridge**

짧은 설명: Chrome 확장 프로그램으로 Elgato Stream Deck에서 YouTube Music을 제어하세요.

상세 설명:

Music Deck Bridge는 같은 Windows 컴퓨터의 Chrome에서 실행되는 YouTube Music과 Stream Deck을 연결합니다. 별도의 Music Deck Bridge Stream Deck 플러그인을 함께 설치해야 합니다.

- Stream Deck 버튼으로 재생·일시정지, 이전·다음 곡 이동, 음소거를 제어합니다.
- 현재 곡 버튼에 앨범 아트, 곡 제목과 아티스트를 표시합니다.
- Stream Deck + 다이얼로 볼륨을 조절하거나 곡을 이동합니다.
- Stream Deck 액션 설정에서 생성한 6자리 PIN으로 연결합니다.
- 일반 Chrome 탭과 Chrome으로 설치한 YouTube Music 앱을 지원합니다.
- Chrome 및 Stream Deck의 언어 설정에 따라 한국어·영어를 제공합니다.

Windows 10/11, Chrome 116 이상, Stream Deck 소프트웨어 7.1 이상과 동반 플러그인이 필요합니다. 다이얼 기능에는 Stream Deck +가 필요합니다. YouTube Music의 재생·계정 요건은 해당 서비스 정책을 따릅니다.

확장 프로그램과 플러그인은 인증된 로컬 브리지로 통신합니다. 플러그인은 허용된 Google·YouTube 이미지 호스트에서 앨범 아트를 내려받습니다. 프로젝트 운영 서버, 분석 기능과 광고는 없습니다. 데이터 처리와 보존에 관한 자세한 내용은 개인정보 처리방침을 확인하세요.

Google, YouTube, Elgato, Corsair와 제휴하거나 이들의 승인을 받은 제품이 아닌 독립적인 비공식 연동 도구입니다.

## Elgato Marketplace

이름: **Music Deck Bridge**

요약: Stream Deck 버튼과 Stream Deck + 다이얼로 YouTube Music 웹 플레이어를 제어하세요.

상세 설명:

Chrome에서 YouTube Music을 실행하면서 Stream Deck으로 재생을 제어하고 현재 곡을 확인하세요. 현재 곡, 재생/일시정지, 이전 곡, 다음 곡, 음소거, 볼륨 다이얼, 곡 이동 다이얼의 7가지 액션을 제공합니다.

현재 곡 버튼은 앨범 아트·곡 제목·아티스트와 긴 글자 스크롤을 지원합니다. 볼륨 다이얼은 한 칸당 1~5%p로 조절하고 누르면 음소거합니다. 곡 이동 다이얼은 돌려서 곡을 이동하고 누르면 재생·일시정지합니다. 두 다이얼의 터치 영역을 눌러도 재생·일시정지할 수 있습니다.

프로젝트 설치 안내에 따라 동반 Chrome 확장 프로그램을 설치하세요. 액션 설정에서 PIN을 생성하고 확장 프로그램 팝업에 입력하면 연결됩니다. 두 구성 요소는 같은 Windows 컴퓨터에서 실행해야 합니다. 기본 브리지 포트는 17864이며 양쪽에서 변경할 수 있습니다. 브리지에 접속할 수 있는 상태에서 연결을 해제하면 양쪽 인증 정보가 폐기됩니다.

Windows 10/11, Chrome 116 이상, Stream Deck 7.1 이상이 필요합니다. 버튼 액션은 Stream Deck 버튼 기기를 지원하며 두 다이얼 액션은 Stream Deck +가 필요합니다. 한국어와 영어를 제공합니다. 일반 플레이어 탭과 설치형 Chrome 앱이 함께 열려 있으면 설치형 앱을 우선합니다.

Google, YouTube, Elgato, Corsair와 제휴하거나 이들의 승인을 받은 제품이 아닌 독립적인 비공식 연동 도구입니다.

## 권한 설명

| 권한 / 호스트 | 사용 목적 |
| --- | --- |
| storage | 로컬 연결 토큰과 브리지 포트를 저장합니다. 콘텐츠 스크립트의 저장소 접근은 차단합니다. |
| scripting | 확장 프로그램 업데이트·브라우저 시작 후 연결을 복원하고 플레이어 자체의 볼륨·음소거 컨트롤을 사용합니다. |
| alarms | 열린 YouTube Music 창의 연결을 주기적으로 복원합니다. |
| https://music.youtube.com/* | YouTube Music의 현재 곡 정보를 읽고 재생을 제어합니다. |
| http://127.0.0.1/* | 같은 컴퓨터의 동반 플러그인에 설정한 포트로 접속합니다. |

## 제출 링크 및 개인정보 확인

- 프로젝트·설치 안내: https://github.com/minjungw00/music-deck-bridge
- 지원: https://github.com/minjungw00/music-deck-bridge/issues
- 개인정보 처리방침: https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md
- 라이선스·고지: 저장소 및 배포 파일의 LICENSE, THIRD_PARTY_NOTICES.md

제출 전에 공개된 개인정보 처리방침이 업로드한 빌드와 일치하는지 확인하고 스토어의 데이터 이용 항목을 검토하세요. 확장 프로그램은 곡 정보·탭 ID·로컬 인증 정보를 처리하며 플러그인은 외부로 앨범 이미지를 요청합니다. 모든 통신이 로컬이라고 기재하지 마세요. 스토어의 실제 분류 항목을 확인한 후 개인정보 신고 양식을 작성하세요.
