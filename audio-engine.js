'use strict';
// Real recordings only. Full provenance and editing details: audio/credits.json.
const AUDIO_SCENES = [
  [null, ['breath', 0], ['paper', -.2], ['stamp', .3], ['post-office', 0], ['post-detail', -.55]],
  [null, ['breath', 0], ['cloth', -.15], ['taipei', 0], ['forest-birds', .2], ['cicadas', -.3]],
  [null, ['breath', 0], ['cloth', -.15], ['crowd', 0], ['audience', -.25], ['crowd-detail', .5]],
  [null, ['breath', 0], ['paper', -.15], ['orchestra', 0], ['audience', .25], ['hall-detail', -.55]],
  [null, ['breath', 0], ['forest-steps', 0], ['forest-birds', 0], ['forest-stream', -.15], ['forest-unknown', .3]]
];
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
  async buffer(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const response = await fetch(`audio/${name}.mp3?v=2`, {signal: AbortSignal.timeout(30000)});
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
      const source = this.ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
      const gain = this.ctx.createGain(); gain.gain.value = 0;
      const pan = this.ctx.createStereoPanner(); pan.pan.value = config[i+1][1];
      source.connect(gain); gain.connect(pan); pan.connect(this.master);
      source.start(now + .05);
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
      const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      const gain=this.ctx.createGain();gain.gain.value=0;
      const pan=this.ctx.createStereoPanner();pan.pan.value=[-.62,.32,0,-.3,.65][i];
      source.connect(gain);gain.connect(pan);pan.connect(this.master);
      source.start(now+.05+i*.55);
      return {source,gain,pan};
    });
    muted.forEach((isMuted,i)=>{if(isMuted)this.closeThought(i)});
    return true;
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
  mix({playing, real, layer, panorama, solo, volume, gateOpen=true, muted=[]}) {
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(playing && !real ? volume / 100 : 0, t, .14);
    this.mindNodes.forEach((n,i)=>n.gain.gain.setTargetAtTime(!gateOpen&&!muted[i] ? .62 : 0,t,.12));
    this.nodes.forEach((n, i) => {
      const sphere = i + 1;
      const fullMix = this.scene === 0 ? [0, .08, .45, .8, 1, .12] : this.scene === 1 ? [0, .10, .24, .76, .30, .12] : [0, .10, .24, .95, .42, .16];
      const weight = !gateOpen ? 0 : panorama ? fullMix[sphere]
        : layer === 0 ? 0
        : solo ? (sphere === layer ? 1 : 0)
        : sphere === layer ? 1 : sphere < layer ? (sphere === 1 ? .12 : .25) : 0;
      n.gain.gain.setTargetAtTime(weight, t, .25);
    });
  }
  level() {
    this.analyser.getFloatTimeDomainData(this.samples);
    return Math.sqrt(this.samples.reduce((sum, v) => sum + v*v, 0) / this.samples.length);
  }
}
