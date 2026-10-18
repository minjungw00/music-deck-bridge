'use strict';
const data = globalThis.previewData;
const $ = id => document.getElementById(id);
let locale = 'en';
const { createRenderer, translate, MARQUEE_STEP_MS } = MusicDeckRendering;
const displayed = new Map();
const cachedCoverUrl = 'preview-cover', cachedCoverData = data.cover;
const state = { title: data.title, artist: data.artist, cover: cachedCoverUrl, playing: true, muted: false, volume: 35 };
const selectedEntry = () => ['preview', state];
const actionName = action => action.split('.').at(-1);
const fitDialArtwork = (_, mode) => data.fits[mode];
const keyTextBackground = (_, lines) => data.backdrops[lines];
const imageSource = value => data.icons[value] || value;

function setImage(context, value) {
  const image = context === 'trackdial' ? $('track-icon') : document.querySelector(`[data-context="${context}"] img`);
  if (image) image.src = imageSource(value || 'imgs/actions/nowplaying/key@2x.png');
}
function setTitle(context, value) {
  const title = document.querySelector(`[data-context="${context}"] .key-title`);
  if (title) title.textContent = value;
}
async function sendStream() { /* Layout selection is applied by setFeedback below. */ }
async function setFeedback(context, payload) {
  const target = context === 'volume' ? $('volume-feedback') : $('track-feedback');
  if (context === 'volume' || displayed.get('trackdial').settings.dialDisplay !== 'artwork') {
    target.replaceChildren();
    for (const [className, text] of [['a1-title', payload.title], ['a1-value', payload.value]]) {
      const element = document.createElement('div'); element.className = className; element.textContent = text; target.append(element);
    }
    const icon = document.createElement('img'); icon.className = 'a1-icon'; icon.src = imageSource(payload.icon); icon.alt = ''; target.append(icon);
    if (payload.indicator) {
      const meter = document.createElement('div'); meter.className = 'meter';
      const fill = document.createElement('div'); fill.className = 'meter-fill'; fill.style.width = `${payload.indicator.value}%`;
      meter.append(fill); target.append(meter); $('volume-icon').src = icon.src;
    }
    return;
  }
  if (target.dataset.layout !== 'artwork') { target.replaceChildren(); target.dataset.layout = 'artwork'; }
  for (const spec of data.layout.items) {
    const field = payload[spec.key]; if (!field) continue;
    let element = target.querySelector(`[data-field="${spec.key}"]`);
    if (!element) { element = document.createElement('div'); element.dataset.field = spec.key; target.append(element); }
    element.hidden = field.enabled === false;
    element.className = 'feedback-layer' + (spec.type === 'text' ? ' text' : '');
    const [x, y, width, height] = spec.rect;
    Object.assign(element.style, { left: `${x / 2}%`, top: `${y}%`, width: `${width / 2}%`, height: `${height}%`, zIndex: String(spec.zOrder), background: field.background || 'transparent' });
    if (spec.type === 'pixmap') {
      const image = document.createElement('img'); image.alt = ''; image.src = imageSource(field.value); element.replaceChildren(image);
    } else {
      element.textContent = field.value;
      Object.assign(element.style, { fontSize: `${spec.font.size}px`, fontWeight: String(spec.font.weight),
        lineHeight: `${height}px`, textAlign: field.alignment === 'left' ? 'left' : 'center',
        textOverflow: field['text-overflow'] === 'ellipsis' ? 'ellipsis' : 'clip' });
    }
  }
}

const renderer = createRenderer({ displayed, selectedEntry, actionName,
  tr: key => translate(locale, key), fitDialArtwork, keyTextBackground,
  covers: { image: src => src === cachedCoverUrl ? cachedCoverData : '', load() {} },
  output: { setImage, setTitle, setFeedback, sendStream } });

let popupObserver, popupURL;
function loadPopup() {
  const frame = $('popup'); frame.onload = () => {
    popupObserver?.disconnect();
    popupObserver = new ResizeObserver(() => { frame.style.height = `${Math.ceil(frame.contentDocument.body.getBoundingClientRect().height)}px`; });
    popupObserver.observe(frame.contentDocument.body);
  };
  frame.srcdoc = data.popups[locale];
  if (popupURL) URL.revokeObjectURL(popupURL);
  popupURL = URL.createObjectURL(new Blob([data.popups[locale]], { type: 'text/html' }));
  $('popup-link').href = popupURL;
}
function render() {
  state.playing = $('playing').checked; state.muted = $('muted').checked; state.volume = Number($('volume').value);
  $('volume-label').value = `${state.volume}%`;
  const artist = $('artist').value, title = $('show-title').checked, background = $('background').checked;
  displayed.get('nowplaying').settings = { showTitle: title, showArtist: artist !== 'hidden', artistPosition: artist,
    titleBackground: background, titleMode: $('scroll').checked ? 'scroll' : 'truncate' };
  displayed.get('trackdial').settings = { dialDisplay: $('display').value, artworkFit: $('fit').value,
    artworkShowTitle: title, artworkShowArtist: artist !== 'hidden', artworkArtistPosition: artist,
    artworkTitleBackground: background, artworkTitleMode: $('scroll').checked ? 'scroll' : 'truncate' };
  if ($('display').value !== 'artwork') $('track-feedback').dataset.layout = 'information';
  renderer.paint();
}
for (const context of ['prev', 'toggle', 'next', 'like', 'open', 'nowplaying', 'mute', 'dislike', 'volume', 'trackdial']) {
  displayed.set(context, { action: `io.github.minjungw00.musicdeckbridge.${context}`, settings: {} });
  if (!['volume', 'trackdial'].includes(context)) setImage(context, `imgs/actions/${context}/key@2x.png`);
}
$('version').textContent = data.version;
document.querySelector('.toolbar').addEventListener('input', event => {
  if (event.target.id === 'language') { locale = event.target.value; loadPopup(); }
  render();
});
const resize = () => {
  const scale = Math.min(1, document.querySelector('.deck-viewport').clientWidth / 858);
  const deck = $('deck-capture'); deck.style.transform = `scale(${scale})`;
  document.querySelector('.deck-viewport').style.height = `${deck.offsetHeight * scale}px`;
};
new ResizeObserver(resize).observe(document.querySelector('.deck-viewport'));
loadPopup(); render(); resize();
setInterval(() => { if ($('scroll').checked) render(); }, MARQUEE_STEP_MS);
