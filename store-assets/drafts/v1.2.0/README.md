# 1.2.0 스토어 참고 문안

1.2.0 제출을 준비하며 작성한 참고 문안입니다. 양쪽 공식 스토어의 1.2.0 게시를 확인했습니다. 공개 페이지에서 확인한 항목과 확인 범위는 [스토어 검증 기록](../../../docs/verification/stores.md#november-27-publication-verification)에 있습니다. 실제 Console 제출 원문은 확인되지 않았습니다.

## 복사할 문안

| 언어 / 로케일 | Chrome 상세 설명 | Elgato 제품 설명 |
| --- | --- | --- |
| English / `en` | [Chrome](chrome-en.txt) | [Elgato](elgato-en.txt) — 영어 게시용 |
| 한국어 / `ko` | [Chrome](chrome-ko.txt) | [Elgato](elgato-ko.txt) — 참고 번역 |
| 简体中文 / `zh_CN` | [Chrome](chrome-zh_CN.txt) | [Elgato](elgato-zh_CN.txt) — 참고 번역 |
| 繁體中文 / `zh_TW` | [Chrome](chrome-zh_TW.txt) | [Elgato](elgato-zh_TW.txt) — 참고 번역 |
| 日本語 / `ja` | [Chrome](chrome-ja.txt) | [Elgato](elgato-ja.txt) — 참고 번역 |
| Español / `es` | [Chrome](chrome-es.txt) | [Elgato](elgato-es.txt) — 참고 번역 |
| Français / `fr` | [Chrome](chrome-fr.txt) | [Elgato](elgato-fr.txt) — 참고 번역 |
| Deutsch / `de` | [Chrome](chrome-de.txt) | [Elgato](elgato-de.txt) — 참고 번역 |

Chrome는 [공식 현지화 안내](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#localize-your-listing)에 따라 각 로케일의 상세 설명 전체를 교체합니다. Elgato는 [공식 설명 가이드](https://docs.elgato.com/guidelines/products/#description)가 영어를 요구하므로 영어 본문을 게시용으로 사용하고, 다른 7개 언어는 참고 번역으로 제공합니다. Maker Console의 지원 언어 목록과 설명문 번역 필드는 구분합니다. 비영어 설명의 별도 게시 지원은 확인하지 않았습니다.

Elgato 영어 본문은 기존 Overview와 How to Use를 합친 전체 교체용입니다. 버전별 [영어 What's new](elgato-whats-new.en.txt)는 별도 변경 사항 필드에 사용합니다.

본문은 순수 텍스트이며 Markdown 별표를 사용하지 않습니다. Elgato 설명은 줄바꿈을 포함해 250–1,500자 범위에 맞췄습니다. 변경 사항은 별도 필드이므로 설명 뒤에 합치지 않습니다. [공식 설명 가이드](https://docs.elgato.com/guidelines/products/#description)를 기준으로 실제 Console의 최종 문자 수도 확인하세요.

제품 설명은 용도·주요 기능·설치·사용 환경을 중심으로 작성합니다. 기능별 세부 설정 수치, 특정 버전으로의 업데이트 지시, 내부 명령 처리 방식은 제품 설명에 넣지 않습니다. 버전별 변경 사항은 별도 What's new 필드에서 다룹니다.

확장 팝업 단독 제어와 Stream Deck 연결을 구분했습니다. Windows 10/11·Chrome 116+를 지원 대상으로 유지하고, Stream Deck 제어에만 플러그인·기기·Stream Deck 7.1+를 요구합니다. 지원 UI 언어와 같은 8개 로케일에 대해 Chrome·Elgato 설명문 16개를 제공합니다. 기존 영어·한국어 기준 문안의 기능과 조건을 유지해 번역했습니다. UI 번역 목록이 고객 지원·법적 고지 언어를 확정하지는 않습니다.

일반 설치는 [공식 스토어 설치 안내](../../../docs/installation.ko.md#method-1-official-stores)를 따르세요. 수동 설치 파일은 [GitHub 1.2.0 릴리스](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.2.0)에 있습니다.

## UTM 링크와 추가 링크 필드

| 배치 위치 | 연결 대상 URL |
| --- | --- |
| Elgato 설명의 Chrome 설치 링크 및 Related Download | https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca?utm_source=elgato_marketplace&utm_medium=referral&utm_campaign=companion_setup |
| Chrome 전체 언어 설명의 동반 플러그인 설치 링크 | https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd?utm_source=chrome_web_store&utm_medium=referral&utm_campaign=companion_setup |
| Elgato Setup Guide / Chrome 설치 안내 — 영어 | https://github.com/minjungw00/music-deck-bridge/blob/main/docs/installation.en.md |
| Chrome 설치 안내 — 한국어 | https://github.com/minjungw00/music-deck-bridge/blob/main/docs/installation.ko.md |
| Chrome 중국어·일본어·스페인어·프랑스어·독일어 설명의 설치 안내 — 영어 문서임을 표시 | https://github.com/minjungw00/music-deck-bridge/blob/main/docs/installation.en.md |
| 양쪽 Privacy Policy | https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md |
| 양쪽 Support / Get help | https://github.com/minjungw00/music-deck-bridge/issues |

공통 `utm_medium=referral`, `utm_campaign=companion_setup`을 유지하고 출발 스토어를 `utm_source`로 구분합니다. 제품 내부의 기존 `streamdeck_plugin` / `chrome_extension` 출처와도 구분됩니다. 제품 내부 링크나 이미 배포된 패키지는 이번 문안 작업으로 바꾸지 않습니다. 설치·지원·개인정보 안내에는 원래 URL을 사용합니다.

Chrome Web Store는 [공식 GA 안내](https://developer.chrome.com/docs/webstore/google-analytics#using-utm-parameters)에 세 UTM 매개변수의 페이지 조회·설치 이벤트 전달을 설명합니다. 실제 확인에는 게시자 계정의 GA 사용 설정과 보고서 접근이 필요하며, 이 작업에서 계정 설정이나 전환 수집은 확인하지 않았습니다. Elgato는 URL에 UTM을 붙여 제품 페이지를 여는 것과 Console에서 유입·설치를 집계하는 것을 구분합니다. 집계 지원을 확인한 것으로 안내하지 않습니다.

## 나머지 필드

이름은 Music Deck Bridge입니다. 공개된 1.2.0 ZIP의 Chrome 짧은 설명은 다음과 같습니다.

| 언어 / 로케일 | 현재 패키지의 짧은 설명 |
| --- | --- |
| English / `en` | Control YouTube Music from Elgato Stream Deck using a Chrome extension. |
| 한국어 / `ko` | Chrome 확장 프로그램을 통해 Elgato Stream Deck에서 YouTube Music을 조작합니다. |
| 简体中文 / `zh_CN` | 通过 Chrome 扩展，使用 Elgato Stream Deck 控制 YouTube Music。 |
| 繁體中文 / `zh_TW` | 透過 Chrome 擴充功能，使用 Elgato Stream Deck 控制 YouTube Music。 |
| 日本語 / `ja` | Chrome 拡張機能を使い、Elgato Stream Deck から YouTube Music を操作できます。 |
| Español / `es` | Controla YouTube Music desde Elgato Stream Deck con una extensión de Chrome. |
| Français / `fr` | Contrôlez YouTube Music depuis Elgato Stream Deck à l’aide d’une extension Chrome. |
| Deutsch / `de` | YouTube Music über eine Chrome-Erweiterung mit Elgato Stream Deck steuern. |

Chrome 짧은 설명은 [manifest의 description](https://developer.chrome.com/docs/extensions/reference/manifest/description)에서 제공되며 상세 설명과 다릅니다. 위 문구는 교체된 1.2.0 ZIP을 사용하는 경우의 값입니다. 이를 바꾸려면 공개 파일을 교체하지 않고 별도 패키지 개정으로 다뤄야 합니다.

Elgato의 제품 UI 언어 선택 항목은 English, Korean, Chinese (Simplified), Chinese (Traditional), Japanese, Spanish, French, German에 맞춥니다. Chrome의 로케일 선택은 패키지의 `_locales` 이름과 맞춥니다. 이번 초안에는 그 8개 언어의 상세 설명이 모두 있습니다. 기존 공개 개인정보 분류는 인증 정보·사용자 활동·웹사이트 콘텐츠이며, 제출 폼은 1.2.0의 [개인정보 처리방침](../../../PRIVACY.md)에 맞춰 검토합니다. 새 문안은 확장 단독 제어와 외부 앨범 이미지 요청을 포함하며 모든 통신이 로컬이라고 안내하지 않습니다.

## 패키지와 이미지 준비 기록

| 구성요소 | 공개된 1.2.0 파일 | SHA-256 |
| --- | --- | --- |
| Chrome | [music-deck-bridge-chrome-1.2.0.zip](https://github.com/minjungw00/music-deck-bridge/releases/download/v1.2.0/music-deck-bridge-chrome-1.2.0.zip) | `f423aef0414da08480ceaef4145b4b1ef0866107eb8b375e285a8a3324341397` |
| Elgato | [io.github.minjungw00.musicdeckbridge.streamDeckPlugin](https://github.com/minjungw00/music-deck-bridge/releases/download/v1.2.0/io.github.minjungw00.musicdeckbridge.streamDeckPlugin) | `e60149ca97452c8cb5a5690f468b2b51d75e4fa2dc8a93ad4883e676ddc5acb9` |

Chrome 제출 준비에는 팝업의 YouTube Music 열기 수정이 포함된 **교체된 1.2.0 ZIP**을 사용했습니다. 사용자의 명시적 요청으로 스토어 게시 전에 기존 이름의 파일과 태그를 교체했으며, 임시 r1 첨부를 제거했습니다. [GitHub 파일 체크섬과 교체 기록](../../../docs/verification/releases.md#current-corrected-publication)

위 체크섬은 GitHub 배포 파일의 값입니다. 실제 스토어 업로드 파일과 처리된 설치 파일은 확인되지 않았습니다. [스토어 검증 기록](../../../docs/verification/stores.md#november-27-publication-verification)

기존 스토어용 팝업 이미지는 1.1.1 샘플 UI이며 플러그인 필수 안내를 포함합니다. 1.2.0 팝업과 단독 제어를 설명하는 이미지로 그대로 사용하기에는 맞지 않습니다. 새 버전의 실제 UI를 캡처하거나 샘플임을 명시한 새 미리보기를 마련하고, 기존 제출 이미지와 원본 UI 픽셀은 보존하세요. 이 작업의 변경 범위는 설명문·링크입니다. 제출 양식의 AI 사용 항목에는 실제 제작 방식을 기재하세요. 이 설명문 초안은 AI 지원으로 작성했습니다.
