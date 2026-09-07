'use strict';
// Real recordings only. Full provenance and editing details: audio/credits.json.
const AUDIO_SCENES = [
  [null, ['breath', 0], ['paper', -.2], ['stamp', .3], ['post-office', 0], ['post-detail', -.55]],
  [null, ['breath', 0], ['cloth', -.15], ['taipei', 0], ['forest-birds', .2], ['cicadas', -.3]],
  [null, ['breath', 0], ['cloth', -.15], ['crowd', 0], ['audience', -.25], ['crowd-detail', .5]],
  [null, ['breath', 0], ['paper', -.15], ['orchestra', 0], ['audience', .25], ['hall-detail', -.55]],
  [null, ['breath', 0], ['forest-steps', 0], ['forest-birds', 0], ['forest-stream', -.15], ['forest-unknown', .3]]
];
// Skip unusable heads (mic handling, footsteps to position). Loops restart at the offset, never at 0.
// Bump whenever any file under audio/ is re-exported, or browsers keep the old take.
const AUDIO_VERSION = 3;
const AUDIO_OFFSETS = {
  'forest-birds': 15, 'forest-steps': 5, 'forest-stream': 6, 'forest-unknown': 2
};
// Blend mode: every sphere sounds at once, loudest at the focused layer (fractional,
// so sweeping across the rings crossfades instead of stepping). Sphere 0 (I THINK) stays shut.
const BLEND_FLOOR = .14;
const blendWeight = (sphere, focus) =>
  sphere === 0 ? 0 : Math.max(BLEND_FLOOR, 1 - Math.abs(sphere - focus) * .26);
class SoundField {
  constructor(context = null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('此瀏覽器不支援 Web Audio');
    this.ctx = context || new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0;
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -10; this.compressor.knee.value = 6;
    this.compressor.ratio.value = 8; this.compressor.attack.value = .003;
    this.compressor.release.value = .18;
    this.limiter = this.ctx.createWaveShaper();
    const curve = new Float32Array(65536);
    for (let i=0;i<curve.length;i++) {
      const x=i*2/(curve.length-1)-1, a=Math.abs(x);
      curve[i]=Math.sign(x)*(a<=.75 ? a : .75+.2*(1-Math.exp(-(a-.75)/.2)));
    }
    this.limiter.curve=curve; this.limiter.oversample='4x';
    this.mindNodes=[]; this.mindSerial=0;
    this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 512;
    this.master.connect(this.compressor); this.compressor.connect(this.limiter); this.limiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.cache = new Map(); this.nodes = []; this.scene = -1; this.serial = 0;
    this.samples = new Float32Array(this.analyser.fftSize);
  }
  startLooped(source, name, when) {
    const offset = Math.min(AUDIO_OFFSETS[name] || 0, Math.max(source.buffer.duration - .5, 0));
    source.loop = true; source.loopStart = offset; source.loopEnd = source.buffer.duration;
    source.start(when, offset);
  }
  async buffer(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const response = await fetch(`audio/${name}.mp3?v=${AUDIO_VERSION}`, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`音訊未載入：${name}`);
    const buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
    this.cache.set(name, buffer);
    // Active nodes keep their own buffers; retain a small cache for adjacent scenes.
    if (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value);
    return buffer;
  }
  async prepare(index) {
    if (this.scene === index && this.nodes.length) return true;
    const ticket = ++this.serial;
    const config = AUDIO_SCENES[index];
    const buffers = await Promise.all(config.slice(1).map(row => this.buffer(row[0])));
    if (ticket !== this.serial) return false;
    const now = this.ctx.currentTime;
    for (const n of this.nodes) {
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.setTargetAtTime(0, now, .08);
      n.source.stop(now + .4);
      n.source.onended = () => { n.source.disconnect(); n.gain.disconnect(); n.pan.disconnect(); };
    }
    this.nodes = buffers.map((buffer, i) => {
      const source = this.ctx.createBufferSource(); source.buffer = buffer;
      const gain = this.ctx.createGain(); gain.gain.value = 0;
      const pan = this.ctx.createStereoPanner(); pan.pan.value = config[i+1][1];
      source.connect(gain); gain.connect(pan); pan.connect(this.master);
      this.startLooped(source, config[i+1][0], now + .05);
      return {source, gain, pan};
    });
    this.scene = index;
    return true;
  }
  async prepareMind(muted = []) {
    if(this.mindNodes.length) return true;
    const ticket=++this.mindSerial;
    const buffers=await Promise.all(THOUGHTS.map(v=>this.buffer('think-'+v.id)));
    if(ticket!==this.mindSerial)return false;
    const now=this.ctx.currentTime;
    this.mindNodes=buffers.map((buffer,i)=>{
      const source=this.ctx.createBufferSource();source.buffer=buffer;
      const gain=this.ctx.createGain();gain.gain.value=0;
      const pan=this.ctx.createStereoPanner();pan.pan.value=[-.62,.32,0,-.3,.65][i];
      source.connect(gain);gain.connect(pan);pan.connect(this.master);
      this.startLooped(source,'think-'+THOUGHTS[i].id,now+.05+i*.55);
      return {source,gain,pan};
    });
    muted.forEach((isMuted,i)=>{if(isMuted)this.closeThought(i)});
    return true;
  }
  async prepareAllMind() {
    if(this.mindNodes.some(node=>node.closed))this.resetMind();
    return this.prepareMind();
  }
  closeThought(index) {
    const t=this.ctx.currentTime;
    this.mindNodes.forEach((n,i)=>{if((index===null||index===i)&&!n.closed){n.closed=true;n.gain.gain.setTargetAtTime(0,t,.08);n.source.stop(t+.3);n.source.onended=()=>{n.source.disconnect();n.gain.disconnect();n.pan.disconnect()}}});
  }
  resetMind() {
    this.mindSerial++;
    for(const n of this.mindNodes){n.source.stop();n.source.disconnect();n.gain.disconnect();n.pan.disconnect()}
    this.mindNodes=[];
  }
  mix({playing, real, layer, panorama, solo, volume, gateOpen=true, muted=[], includeMind=false, blend=null}) {
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(playing && !real ? volume / 100 : 0, t, .14);
    this.mindNodes.forEach((n,i)=>n.gain.gain.setTargetAtTime(!gateOpen&&!muted[i] ? .62 : panorama&&includeMind ? .18 : 0,t,.12));
    this.nodes.forEach((n, i) => {
      const sphere = i + 1;
      const fullMix = this.scene === 0 ? [0, .30, .50, .75, .95, .30] : this.scene === 1 ? [0, .35, .45, .72, .40, .35] : [0, .35, .45, .85, .55, .40];
      const weight = !gateOpen ? 0
        : blend !== null ? blendWeight(sphere, blend)
        : panorama ? fullMix[sphere]
        : layer === 0 ? 0
        : solo ? (sphere === layer ? 1 : 0)
        : sphere === layer ? 1 : sphere < layer ? (sphere === 1 ? .12 : .25) : 0;
      // Sweeping needs to feel immediate; layer-to-layer moves stay unhurried.
      n.gain.gain.setTargetAtTime(weight, t, blend !== null ? .12 : .25);
    });
  }
  level() {
    this.analyser.getFloatTimeDomainData(this.samples);
    return Math.sqrt(this.samples.reduce((sum, v) => sum + v*v, 0) / this.samples.length);
  }
}
