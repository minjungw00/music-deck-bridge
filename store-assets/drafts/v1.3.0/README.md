# 1.3.0 스토어 제출 초안

Chrome 상세 설명은 제품 UI와 동일한 8개 로케일로 준비했습니다. Elgato에는 영어 제품 설명과 별도 What's new 문안을 사용합니다. [Chrome 상세 설명 현지화 안내](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#localize-your-listing) · [Elgato 제품 설명 기준](https://docs.elgato.com/guidelines/products/#description)

| 로케일 | Chrome 상세 설명 | 이미지 초안 |
| --- | --- | --- |
| `en` | [English](chrome-en.txt) | [1280 × 800 PNG](chrome-screenshot-en-1280x800.png) |
| `ko` | [한국어](chrome-ko.txt) | [1280 × 800 PNG](chrome-screenshot-ko-1280x800.png) |
| `zh_CN` | [简体中文](chrome-zh_CN.txt) |  |
| `zh_TW` | [繁體中文](chrome-zh_TW.txt) |  |
| `ja` | [日本語](chrome-ja.txt) |  |
| `es` | [Español](chrome-es.txt) |  |
| `fr` | [Français](chrome-fr.txt) |  |
| `de` | [Deutsch](chrome-de.txt) |  |

Elgato Maker Console에는 [제품 설명](elgato-en.txt)과 [What's new](elgato-whats-new.en.txt)를 각각 입력합니다. 설명 길이는 LF 기준 1,130자입니다. 동반 제품, 설치·지원 안내, 개인정보 처리방침에는 [기존 필드의 URL](../v1.2.0/README.md#utm-링크와-추가-링크-필드)을 사용합니다.

Chrome 이미지 두 장은 `394b941`과 동일한 제품 소스의 임시 1.3.0 출시 빌드에 샘플 곡을 표시한 결과입니다. 320 × 551 픽셀의 팝업을 배율 1에서 캡처해 내보냈고, 앨범 이미지 영역에는 프로젝트 아이콘을 넣었습니다. [Chrome 스크린샷 기준](https://developer.chrome.com/docs/webstore/images#screenshots)

Elgato 갤러리 초안은 모두 영어 1920 × 960 PNG입니다. 공개 갤러리의 배경과 제목 스타일을 따르고, Elgato 제품 이미지에 실제 플러그인 아이콘과 예시 앨범 이미지를 합성했습니다. 제품 아이콘은 [기존 288 × 288 PNG](../../elgato/listing/app-icon-288.png)를 사용합니다. [Elgato 갤러리 기준](https://docs.elgato.com/guidelines/products/#gallery) · [이미지 출처 및 검증](../../../docs/verification/media.md#november-28-revised-130-elgato-gallery)

1. [제품 소개](elgato-gallery-01-overview-1920x960.png) — Stream Deck 플러그인, Chrome 확장 프로그램, YouTube Music 브라우저 예시. Stream Deck 제어에는 두 구성요소가 모두 필요합니다.
2. [Stream Deck 키 기능](elgato-gallery-02-controls-1920x960.png) — MK.2의 재생, 반복·셔플, 볼륨·평가 매핑 예시.
3. [Chrome 단독 제어](elgato-gallery-03-chrome-1920x960.png) — 확장 프로그램만으로 음악을 조작하는 팝업 예시.
4. [연결 앨범 이미지](elgato-gallery-04-linked-artwork-1920x960.png) — Stream Deck +의 여덟 키 전체에 한 앨범 이미지를 연결한 예시.

Chrome의 권한 및 호스트 범위는 1.2.0과 동일합니다. 개인정보 양식은 이번 버전이 마지막 곡 한 개와 플레이어 상태를 로컬에 보존하고 Google·YouTube 이미지 서버에서 앨범 이미지를 가져오는 동작을 반영해야 합니다. [개인정보 처리방침](../../../PRIVACY.md)

제출할 정식 파일의 체크섬과 Console 처리 결과는 [스토어 검증 기록](../../../docs/verification/stores.md)과 [Maker Console 처리본 기록](../../../docs/verification/marketplace-drm.md)에 남깁니다.
