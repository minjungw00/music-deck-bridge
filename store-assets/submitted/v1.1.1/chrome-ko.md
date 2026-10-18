Music Deck Bridge를 사용하려면 같은 Windows PC에 Chrome 확장 프로그램과 Stream Deck 플러그인을 모두 설치해야 합니다. 확장 프로그램만으로는 Stream Deck을 제어할 수 없습니다.

동반 Stream Deck 플러그인:
https://github.com/minjungw00/music-deck-bridge/releases/latest

**주요 기능**

Stream Deck 버튼으로 재생·일시정지, 이전·다음 곡, 음소거, YouTube Music 실행, 좋아요·싫어요를 제어합니다. 현재 곡 제목·아티스트·앨범 아트를 표시합니다. Stream Deck +에서는 볼륨·현재 곡 다이얼과 앨범 아트 크기, 텍스트 표시·스크롤 옵션을 사용할 수 있습니다. 좋아요·싫어요는 로그인된 플레이어에서 해당 버튼을 사용할 수 있어야 동작합니다. 한국어·영어 UI를 지원합니다.

**설치 및 연결**

1. Chrome 웹 스토어에서 이 확장 프로그램을 추가합니다.
2. Elgato Marketplace에 플러그인이 공개되기 전까지 아래 GitHub Releases에서 Stream Deck 설치 파일(.streamDeckPlugin)을 다운로드합니다.
https://github.com/minjungw00/music-deck-bridge/releases/latest
3. .streamDeckPlugin 파일을 더블클릭해 Stream Deck 앱에 설치합니다.
4. Stream Deck에 Music Deck Bridge 액션을 배치하고 액션 설정에서 'PIN 생성'을 누릅니다.
5. Chrome 도구 모음에서 이 확장 프로그램의 팝업을 열고 10분 이내에 6자리 PIN을 입력해 연결합니다. 기본 로컬 포트는 17864입니다.
6. Chrome에서 music.youtube.com을 열거나 Chrome으로 설치한 YouTube Music 앱(PWA)을 실행한 후 곡을 재생합니다.

**사용 환경**

Windows 10/11, Chrome 116 이상, Stream Deck 소프트웨어 7.1 이상 및 Stream Deck 기기가 필요합니다. 다이얼 기능은 Stream Deck + 전용입니다. 완성된 플러그인 설치 파일에는 Node.js/npm의 별도 설치가 필요하지 않습니다.

**개인정보**

확장 프로그램과 플러그인은 PIN으로 인증된 로컬 연결을 사용합니다. 곡 정보는 Stream Deck 화면에 표시하는 데 사용하며, 앨범 아트는 플러그인이 허용된 Google·YouTube 이미지 서버에서 받아옵니다. 프로젝트 운영 분석 서버는 없습니다.

Google·YouTube·Elgato·Corsair의 공식 제품이나 제휴 제품이 아닌 독립적인 비공식 연동 도구입니다.

설치 안내: https://github.com/minjungw00/music-deck-bridge/blob/main/docs/installation.ko.md

개인정보 처리방침: https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md
