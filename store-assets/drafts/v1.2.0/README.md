# 1.2.0 스토어 제출용 문안

검토용 초안입니다. 실제 제출본·게시 문구와 구분합니다. 공개 페이지 확인 결과는 [스토어 검증 기록](../../../docs/verification/stores.md#november-14-public-listing-review-and-120-drafts)에 있습니다. 기존 제출본과 공개 릴리즈 파일을 보존합니다.

## 복사할 문안

| 스토어 필드 | 파일 | 적용 방법 |
| --- | --- | --- |
| Chrome 상세 설명 — 영어/기본 | [chrome-en.txt](chrome-en.txt) | 전체 교체 |
| Chrome 상세 설명 — 한국어 | [chrome-ko.txt](chrome-ko.txt) | 해당 언어의 상세 설명 전체 교체 |
| Elgato Overview / Description — 영어 | [elgato-en.txt](elgato-en.txt) | 기존 Overview와 How to Use 전체를 합쳐 교체; 기존 앞부분을 덧붙이지 않음 |
| Elgato What's new — 영어 | [elgato-whats-new.en.txt](elgato-whats-new.en.txt) | 1.2.0 버전의 변경 사항 필드 |

본문은 순수 텍스트이며 Markdown 별표를 사용하지 않습니다. Elgato 설명은 줄바꿈을 포함해 250–1,500자 범위에 맞췄습니다. 변경 사항은 별도 필드이므로 설명 뒤에 합치지 않습니다. [공식 설명 가이드](https://docs.elgato.com/guidelines/products/#description)를 기준으로 실제 Console의 최종 문자 수도 확인하세요.

확장 팝업 단독 제어와 Stream Deck 연결을 구분했습니다. Windows 10/11·Chrome 116+를 지원 대상으로 유지하고, Stream Deck 제어에만 플러그인·기기·Stream Deck 7.1+를 요구합니다. UI 언어는 8개이며 스토어 설명문은 기존 범위인 Chrome 영어·한국어와 Elgato 영어를 제공합니다. UI 번역 목록이 고객 지원·법적 고지 언어를 확정하지는 않습니다.

각 문안은 해당 구성요소의 1.2.0 게시에 맞춰 사용하세요. 동반 스토어 업데이트가 아직 공개되지 않은 경우의 수동 설치 경로는 [1.2.0 릴리즈](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.2.0)와 설치 안내에 있습니다. 이전 버전의 두 구성요소를 설치한 상태를 1.2.0 전체 기능의 근거로 삼지 않습니다.

## UTM 링크와 추가 링크 필드

| 배치 위치 | 연결 대상 URL |
| --- | --- |
| Elgato 설명의 Chrome 설치 링크 및 Related Download | https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca?utm_source=elgato_marketplace&utm_medium=referral&utm_campaign=companion_setup |
| Chrome 영어·한국어 설명의 동반 플러그인 설치 링크 | https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd?utm_source=chrome_web_store&utm_medium=referral&utm_campaign=companion_setup |
| Elgato Setup Guide / Chrome 설치 안내 — 영어 | https://github.com/minjungw00/music-deck-bridge/blob/main/docs/installation.en.md |
| Chrome 설치 안내 — 한국어 | https://github.com/minjungw00/music-deck-bridge/blob/main/docs/installation.ko.md |
| 양쪽 Privacy Policy | https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md |
| 양쪽 Support / Get help | https://github.com/minjungw00/music-deck-bridge/issues |

공통 `utm_medium=referral`, `utm_campaign=companion_setup`을 유지하고 출발 스토어를 `utm_source`로 구분합니다. 제품 내부의 기존 `streamdeck_plugin` / `chrome_extension` 출처와도 구분됩니다. 제품 내부 링크나 이미 배포된 패키지는 이번 문안 작업으로 바꾸지 않습니다. 설치·지원·개인정보 안내에는 원래 URL을 사용합니다.

Chrome Web Store는 [공식 GA 안내](https://developer.chrome.com/docs/webstore/google-analytics#using-utm-parameters)에 세 UTM 매개변수의 페이지 조회·설치 이벤트 전달을 설명합니다. 실제 확인에는 게시자 계정의 GA 사용 설정과 보고서 접근이 필요하며, 이 작업에서 계정 설정이나 전환 수집은 확인하지 않았습니다. Elgato는 URL에 UTM을 붙여 제품 페이지를 여는 것과 Console에서 유입·설치를 집계하는 것을 구분합니다. 집계 지원을 확인한 것으로 안내하지 않습니다.

## 나머지 필드

이름은 Music Deck Bridge입니다. 공개된 1.2.0 ZIP의 Chrome 짧은 설명은 다음과 같습니다.

| 언어 | 현재 패키지의 짧은 설명 |
| --- | --- |
| 영어 | Control YouTube Music from Elgato Stream Deck using a Chrome extension. |
| 한국어 | Chrome 확장 프로그램을 통해 Elgato Stream Deck에서 YouTube Music을 조작합니다. |

Chrome 짧은 설명은 [manifest의 description](https://developer.chrome.com/docs/extensions/reference/manifest/description)에서 제공되며 상세 설명과 다릅니다. 위 문구는 기존 1.2.0 ZIP을 사용하는 경우의 값입니다. 이를 바꾸려면 공개 파일을 교체하지 않고 별도 패키지 개정으로 다뤄야 합니다.

Elgato의 제품 UI 언어 선택 항목은 English, Korean, Chinese (Simplified), Chinese (Traditional), Japanese, Spanish, French, German에 맞춥니다. Chrome의 8개 UI 카탈로그와 상세 설명 번역 언어는 별개입니다. 기존 공개 개인정보 분류는 인증 정보·사용자 활동·웹사이트 콘텐츠이며, 제출 폼은 1.2.0의 [개인정보 처리방침](../../../PRIVACY.md)에 맞춰 검토합니다. 새 문안은 확장 단독 제어와 외부 앨범 이미지 요청을 포함하며 모든 통신이 로컬이라고 안내하지 않습니다.

## 사용할 패키지와 이미지

| 구성요소 | 공개된 1.2.0 파일 | SHA-256 |
| --- | --- | --- |
| Chrome | [music-deck-bridge-chrome-1.2.0.zip](https://github.com/minjungw00/music-deck-bridge/releases/download/v1.2.0/music-deck-bridge-chrome-1.2.0.zip) | `a7ffb9eefe5d813da5232dca6a7f00144bfc6a2d977cbdb1917921d8b4ee6b79` |
| Elgato | [io.github.minjungw00.musicdeckbridge.streamDeckPlugin](https://github.com/minjungw00/music-deck-bridge/releases/download/v1.2.0/io.github.minjungw00.musicdeckbridge.streamDeckPlugin) | `e60149ca97452c8cb5a5690f468b2b51d75e4fa2dc8a93ad4883e676ddc5acb9` |

[릴리즈 검증](../../../docs/verification/releases.md#v120)은 GitHub 패키지의 근거입니다. 업로드·심사·스토어 게시·처리된 설치 파일의 실행 결과는 제출 후 별도로 기록합니다.

기존 스토어용 팝업 이미지는 1.1.1 샘플 UI이며 플러그인 필수 안내를 포함합니다. 1.2.0 팝업과 단독 제어를 설명하는 이미지로 그대로 사용하기에는 맞지 않습니다. 새 버전의 실제 UI를 캡처하거나 샘플임을 명시한 새 미리보기를 마련하고, 기존 제출 이미지와 원본 UI 픽셀은 보존하세요. 이 작업의 변경 범위는 설명문·링크입니다. 제출 양식의 AI 사용 항목에는 실제 제작 방식을 기재하세요. 이 설명문 초안은 AI 지원으로 작성했습니다.
