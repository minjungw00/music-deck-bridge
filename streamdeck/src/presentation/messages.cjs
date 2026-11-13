'use strict';
const { resolve: resolveLanguage } = require('../../io.github.minjungw00.musicdeckbridge.sdPlugin/property-inspector/language.js');
const STRINGS = {
  "ko": {
    "unavailable": "연결 안 됨",
    "offline": "오프라인",
    "pause": "일시정지",
    "play": "재생",
    "muted": "음소거",
    "absent": "YTM 없음",
    "currentTrack": "현재 곡",
    "open": "YTM 실행",
    "like": "좋아요",
    "dislike": "싫어요"
  },
  "en": {
    "unavailable": "Disconnected",
    "offline": "Offline",
    "pause": "Pause",
    "play": "Play",
    "muted": "Muted",
    "absent": "No YTM",
    "currentTrack": "Current Track",
    "open": "Open YTM",
    "like": "Like",
    "dislike": "Dislike"
  },
  "zh_CN": {
    "unavailable": "未连接",
    "offline": "离线",
    "pause": "暂停",
    "play": "播放",
    "muted": "已静音",
    "absent": "没有 YTM",
    "currentTrack": "当前歌曲",
    "open": "打开 YTM",
    "like": "喜欢",
    "dislike": "不喜欢"
  },
  "zh_TW": {
    "unavailable": "未連線",
    "offline": "離線",
    "pause": "暫停",
    "play": "播放",
    "muted": "已靜音",
    "absent": "沒有 YTM",
    "currentTrack": "目前歌曲",
    "open": "開啟 YTM",
    "like": "喜歡",
    "dislike": "不喜歡"
  },
  "ja": {
    "unavailable": "未接続",
    "offline": "オフライン",
    "pause": "一時停止",
    "play": "再生",
    "muted": "ミュート中",
    "absent": "YTM なし",
    "currentTrack": "現在の曲",
    "open": "YTM を開く",
    "like": "高評価",
    "dislike": "低評価"
  },
  "es": {
    "unavailable": "Sin conexión",
    "offline": "Desconectado",
    "pause": "Pausar",
    "play": "Reproducir",
    "muted": "Silenciado",
    "absent": "Sin YTM",
    "currentTrack": "Canción actual",
    "open": "Abrir YTM",
    "like": "Me gusta",
    "dislike": "No me gusta"
  },
  "fr": {
    "unavailable": "Non connecté",
    "offline": "Hors ligne",
    "pause": "Pause",
    "play": "Lire",
    "muted": "Muet",
    "absent": "Pas de YTM",
    "currentTrack": "Titre actuel",
    "open": "Ouvrir YTM",
    "like": "J’aime",
    "dislike": "Je n’aime pas"
  },
  "de": {
    "unavailable": "Nicht verbunden",
    "offline": "Offline",
    "pause": "Pause",
    "play": "Wiedergabe",
    "muted": "Stumm",
    "absent": "Kein YTM",
    "currentTrack": "Aktueller Titel",
    "open": "YTM öffnen",
    "like": "Gefällt mir",
    "dislike": "Gefällt mir nicht"
  }
};
function translate(locale, key) { return STRINGS[resolveLanguage(locale)]?.[key] || STRINGS.en[key]; }
module.exports = { translate };
