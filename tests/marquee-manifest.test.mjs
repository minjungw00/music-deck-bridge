import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { versionInfo } from '../scripts/version.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','streamdeck','io.github.minjungw00.musicdeckbridge.sdPlugin');
const script=readFileSync(join(root,'..','src','plugin.cjs'),'utf8');
const m=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const version=JSON.parse(readFileSync(join(root,'..','..','package.json'),'utf8')).version;

test('manifest exposes the supported actions and shares the property inspector',()=>{
  assert.equal(m.UUID,'io.github.minjungw00.musicdeckbridge');
  assert.equal(m.PropertyInspectorPath,'property-inspector/settings.html');
  assert.equal(m.Version,versionInfo(version).pluginVersion);
  assert.deepEqual(m.Actions.map(a=>a.UUID.slice(m.UUID.length+1)),
    ['nowplaying','toggle','prev','next','mute','volume','trackdial','open','like','dislike']);
  assert.ok(m.Actions.every(a=>!a.PropertyInspectorPath));
  for (const name of ['toggle', 'like', 'dislike', 'open']) {
    assert.ok(m.Actions.find(action=>action.UUID.endsWith('.'+name)).States.every(state=>state.ShowTitle===false));
  }
});

test('marquee scrolls long titles and artists leftwards and preserves Unicode graphemes',()=>{
  const start=script.indexOf('const segmenter =');
  const end=script.indexOf('const COVERS =',start);
  const snippet=script.slice(start,end);
  const ctx={Intl,Date};
  vm.runInNewContext('const MARQUEE_STEP_MS=380;const MARQUEE_WIDTH=11;'+snippet+'\nthis.marquee=marquee;',ctx);
  assert.match(script, /marquee\(state\.artist/,'artist must scroll when titleMode scrolls');
  const title='가나다라마바사아자차카타파하';
  assert.equal(ctx.marquee('짧은 노래',1000,1000),'짧은 노래');
  assert.equal(ctx.marquee(title,1000,1000),title.slice(0,11));
  assert.equal(ctx.marquee(title,1000,1000+4*380),title.slice(1,12));
  assert.equal(ctx.marquee('한글🇰🇷이모지🙂문자열길어요',1000,1000).includes('�'),false);
});
