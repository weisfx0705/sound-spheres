'use strict';
const $=s=>document.querySelector(s);
const layers=[
['I THINK','腦海中的聲音','安放','先讓腦海，空出一點位置。','待辦事項、回憶、心裡的自言自語，都可能正在發聲。察覺它們，再輕輕放下；不必責怪自己分心。','留意一個浮現的念頭。不追著它走，把注意力交回身體。'],
['I AM','身體本身的聲音','呼吸','你在這裡，就已經有聲音。','聽見自然的呼吸、吞嚥，以及衣領邊微小的起伏。聲音不是從遠方開始，而是從你存在的地方開始。','維持自己的呼吸節奏。聽一口氣進來，再聽它離開。'],
['I TOUCH','我接觸而生的聲音','觸碰','世界，在接觸的地方回應。','手指、衣料、鞋底，每一次接觸都讓你參與聲景。注意：這一層是你自己的行動所製造的聲音。','輕輕摩擦指尖或袖口。留意動作停止後，聲音如何消失。'],
['I SEE','我看見聲源的聲音','看見','讓耳朵，與眼睛相遇。','把注意力延伸到眼前。看見動作發生，也聽見它留下的聲音。聲音與動作，總是同時抵達嗎？','選一個眼前正在發聲的物件。真實環境中，觀察它的動作。'],
['I KNOW','看不見，但認得的聲音','辨認','有些熟悉，不需要看見。','背後的車流、隔壁的交談、遠處的鐘聲。即使看不到，你仍可能憑經驗辨認；也容許自己的猜測出錯。','找一個看不到聲源、卻覺得熟悉的聲音。你憑什麼認出它？'],
["I DON'T KNOW",'尚未命名的聲音','未知','暫時，不必知道答案。','停留在無法辨認的聲響。先不找來源，只聽它的高低、質地、長短，以及在空間中的移動。','用擬聲詞記錄它，例如「嗡——」「窸、窸」。保留未知。']];
const scenes=[
['POST OFFICE','郵局・寄出一封信','紙張 / 蓋章 / 櫃檯人聲','紙張在指尖展開，印章落在右前方；櫃檯交談在空間裡延伸。郵局情境重構，室內底景來自芬蘭。',['手中信紙的摩擦','想像眼前櫃檯正在蓋章','看不見的另一側櫃檯交談','門後未能辨認的叩響']],
['TAIPEI STREET','台北・街角午後','車流 / 鳥鳴 / 夏蟬','台北真實街頭雙耳錄音，疊入阿里山鳥蟲聲；以台灣實錄重構樹蔭下的城市午後。',['袖口與手臂的摩擦','想像眼前車輛駛過街口','樹蔭後方熟悉的鳥聲','遠處未命名的持續聲響']],
['LIVE CONCERT','演唱會・謝幕人海','掌聲 / 歡呼 / 人群','停在歌曲之間的謝幕時刻。大片掌聲與歡呼包圍你，身後的交談仍在延續。這裡播放真實人群，沒有歌曲。',['自己的衣料摩擦','想像眼前觀眾拍手、歡呼','身後觀眾低聲交談','人海裡難以定位的尾聲']],
['CONCERT HALL','音樂廳・開演之前','弦樂 / 調音 / 座席細響','雙簧管的音高引出樂團調音，觀眾在座位間低語。聽的是開演前真實樂團的聲音，並非完整曲目。',['手中節目單的翻動','想像眼前樂團正在調音','身後座席傳來的交談','遠處未能命名的摩擦聲']],
['ALISHAN FOREST','阿里山・林間慢行','落葉腳步 / 晨鳥 / 溪流','阿里山清晨的鳥蟲與溪流實錄，加入森林腳步，重構沿著林間小徑緩行的聆聽位置。',['鞋底壓過落葉與碎石','想像眼前枝頭發出晨間鳴聲','看不見、卻認得的溪流','林間尚未辨認的短促叫聲']]];
let layer=0,scene=4,playing=false,real=false,guided=false,panorama=false,solo=false,loading=false,elapsed=0,stageTime=0,engine=null,requestId=0,message='';
let gateOpen=false,gateStarted=false,muted=Array(5).fill(false);
let notes={};try{const data=JSON.parse(localStorage.getItem('sound-spheres-notes')||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))notes=data}catch{}
const key=()=>`${scene}-${layer}`;
$('#steps').innerHTML=layers.map((l,i)=>`<button class="step" data-layer="${i}"><small>0${i+1}</small><strong>${l[0]}</strong><span>${l[1]}</span></button>`).join('');
$('#orb').innerHTML=layers.map((l,i)=>`<div class="ring" style="--size:${24+i*15}%"></div>`).join('');
$('#sceneCards').innerHTML=scenes.map((s,i)=>`<button class="scene" data-scene="${i}" aria-label="試聽${s[1]}"><div class="landscape"><i>REAL SOUND / 0${i+1}</i><span class="scene-listen">▶ 聽見這裡</span></div><div class="scene-text"><small>${s[0]}</small><strong>${s[1]}</strong><span>${s[2]}</span></div></button>`).join('');
$('#thoughtCards').innerHTML=THOUGHTS.map((v,i)=>`<article class="thought" data-thought="${i}"><div class="thought-index">VOICE 0${i+1}<span class="thought-waves" aria-hidden="true">▂ ▅ ▃ ▆</span></div><h3>${v.title}</h3><p>「${v.text}」</p><button data-mute="${i}" aria-label="關閉${v.title}的內在聲音">先放下 ×</button></article>`).join('');
function render(){
 const l=layers[layer];
 document.querySelectorAll('.step').forEach((e,i)=>{e.classList.toggle('active',i===layer&&!panorama);e.setAttribute('aria-pressed',i===layer&&!panorama);e.disabled=!gateOpen&&i>0});
 document.querySelectorAll('.ring').forEach((e,i)=>e.classList.toggle('active',panorama||i<=layer));
 document.querySelectorAll('.scene').forEach((e,i)=>{e.classList.toggle('selected',i===scene);e.setAttribute('aria-pressed',i===scene);e.disabled=!gateOpen});
 $('#orbEnglish').textContent=panorama?'THE WHOLE SOUNDSCAPE':l[0];$('#orbWord').textContent=!gateOpen?'紛擾':panorama?'置身':l[2];
 $('#breath').textContent=!gateOpen?`${5-muted.filter(Boolean).length} 個念頭，等你慢慢安放`:panorama?scenes[scene][1]:layer===0?'念頭已安放，讓安靜停留一下':layer===1?'聽見呼吸，不必跟隨它的節奏':'讓注意力向外延伸';
 $('#stepMeta').textContent=panorama?'完整聲景 / REAL RECORDINGS':`0${layer+1} / ${l[0]}`;
 $('#stepTitle').textContent=!gateOpen?'先把腦內的五個分頁，一個個關上。':panorama?scenes[scene][1]:l[3];
 $('#stepCopy').textContent=panorama?scenes[scene][3]:l[4];
 $('#stepAction').textContent=!gateOpen?'在上方小練習按下播放，聽見五段碎念交疊。逐一關閉，或一鍵安放全部；全部關閉後，從呼吸出發。':panorama?'先感受整個地方。準備好後，點選 I THINK，讓聲景安靜下來，再從呼吸往外探索。':l[5]+(layer>=2&&!real?` 情境聲音：${scenes[scene][4][layer-2]}。`:'');
 $('#noteLabel').textContent=`${scenes[scene][1]} · ${l[0]} · ${l[1]}`;
 if(document.activeElement!==$('#notes'))$('#notes').value=notes[key()]||'';
 $('#sceneDetail').textContent=scenes[scene][3];
 $('#play').innerHTML=loading?'取消載入 <span>×</span>':playing?'暫停聆聽 <span>Ⅱ</span>':(gateOpen?'開始聆聽 <span>↗</span>':'開始體驗 <span>↗</span>');
 $('#auto').textContent=guided?'Ⅱ 停止自動引導':'▷ 六分鐘引導';
 $('#next').textContent=panorama?'從內在開始 →':layer===5?'回到內在 ↺':'下一層 →';
 $('#status').textContent=message||(!gateOpen?(loading?'正在準備五段內在聲音…':playing?`I THINK · ${5-muted.filter(Boolean).length} 個念頭交疊中`:gateStarted?'已暫停碎念 · 關閉全部念頭後才能出發':'從 I THINK 開始 · 先聽見腦內的聲音'):loading?'正在載入真實音訊，首次約需數秒…':playing?(real?'真實環境 · 不播放音訊':panorama?`${scenes[scene][1]} · 完整聲景`:layer===0?'I THINK · 刻意留白，準備好請進入 I AM':`${scenes[scene][1]} · ${guided?'六分鐘引導':solo?'只聽這一層':'逐層展開'}`):'尚未播放 · 點選場景可直接試聽');
 $('#mode').textContent=real?'切換：錄音聲景':'切換：聆聽真實環境';
 $('#solo').textContent=solo?'✓ 只聽這一層':'只聽這一層';$('#solo').setAttribute('aria-pressed',solo);
 $('#sceneStop').textContent=playing||loading?'暫停聲景 Ⅱ':'試聽此處 ▶';$('#solo').disabled=!gateOpen||panorama||real;$('#preview').setAttribute('aria-pressed',panorama);$('#preview').disabled=!gateOpen;$('#auto').disabled=!gateOpen;$('#next').disabled=!gateOpen;$('#mode').disabled=!gateOpen;
 $('#meterLabel').textContent=loading?'載入中':playing&&!real&&(!gateOpen||panorama||layer>0)?'音訊輸出':playing&&gateOpen&&layer===0&&!real?'I THINK · 安靜':'安靜';
 document.body.classList.toggle('playing',playing);$('#volumeValue').textContent=$('#volume').value+'%';
 renderMind();
 if(engine)engine.mix({playing:playing&&!loading,real,layer,panorama,solo,gateOpen,muted,volume:Number($('#volume').value)});
}
function setLayer(n){if(!gateOpen&&n>0)return;layer=n;stageTime=0;panorama=false;message='';render()}
function stop(){requestId++;playing=false;loading=false;message='';render()}
async function start(){
 const ticket=++requestId;message='';
 if(real&&gateOpen){playing=true;loading=false;render();return}
 try{
  engine??=new SoundField();
  const resumed=engine.ctx.resume(); // Called inside the user gesture for Safari/iOS.
  loading=true;playing=false;render();
  await resumed;const ready=await (gateOpen?engine.prepare(scene):engine.prepareMind(muted));
  if(ticket!==requestId||!ready)return;
  loading=false;playing=true;if(!gateOpen)gateStarted=true;render();
 }catch(error){if(ticket!==requestId)return;playing=false;loading=false;message='音訊載入失敗。請檢查連線後再按開始，或切換真實環境。';render()}
}
$('#play').onclick=()=>{if(playing||loading)stop();else{start();if(!gateOpen)$('#mindGate').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})}};
$('#steps').onclick=e=>{const b=e.target.closest('[data-layer]');if(b){guided=false;setLayer(+b.dataset.layer)}};
$('#sceneCards').onclick=e=>{const b=e.target.closest('[data-scene]');if(b&&gateOpen){scene=+b.dataset.scene;guided=false;panorama=true;real=false;stageTime=0;start()}};
$('#sceneStop').onclick=()=>{if(!gateOpen){start();return}if(playing||loading)stop();else{panorama=true;real=false;guided=false;start()}};
$('#preview').onclick=()=>{if(!gateOpen)return;guided=false;panorama=true;real=false;start()};
$('#next').onclick=()=>setLayer(panorama?0:(layer+1)%6);
$('#mode').onclick=()=>{if(!gateOpen)return;const wasActive=playing||loading;stop();real=!real;panorama=false;render();if(wasActive)start()};
$('#solo').onclick=()=>{solo=!solo;render()};
$('#volume').oninput=()=>render();
$('#auto').onclick=()=>{if(!gateOpen)return;guided=!guided;if(guided){layer=0;panorama=false;solo=false;elapsed=0;stageTime=0;start()}render()};
function renderMind(){
 const remaining=muted.filter(v=>!v).length;
 $('#mindCount').textContent=String(remaining).padStart(2,'0');
 $('#mindGate').classList.toggle('gate-complete',gateOpen);
 document.querySelectorAll('.thought').forEach((card,i)=>{
  card.classList.toggle('is-quiet',muted[i]);card.classList.toggle('is-talking',!muted[i]&&!gateOpen&&playing);
  const button=card.querySelector('button');button.disabled=muted[i];button.textContent=muted[i]?'已放下 ✓':'先放下 ×';
 });
 $('#mindStart').hidden=gateOpen;
 $('#mindStart').textContent=loading?'取消載入 ×':playing?'暫停腦內聲音 Ⅱ':gateStarted?'繼續聽見碎念 ▶':'▶ 聽見腦內的聲音';
 $('#quietAll').hidden=gateOpen;$('#mindContinue').disabled=!gateOpen;$('#mindReset').hidden=!gateOpen;
 $('#gateMessage').textContent=gateOpen?'五個念頭都已安放。聽見剛剛騰出的空間了嗎？準備好，就從一口呼吸出發。':`還有 ${remaining} 個念頭。逐一關閉，或一鍵全部安放，才能出發往外聆聽。暫停播放不會解鎖。`;
 $('#sceneStop').disabled=!gateOpen;
}
function muteThought(index){
 if(gateOpen)return;
 if(index===null)muted.fill(true);else muted[index]=true;engine?.closeThought(index);
 if(muted.every(Boolean)){requestId++;gateOpen=true;playing=false;loading=false;message='';layer=0;panorama=false;guided=false;}
 render();
}
$('#thoughtCards').onclick=e=>{const button=e.target.closest('[data-mute]');if(button)muteThought(+button.dataset.mute)};
$('#quietAll').onclick=()=>muteThought(null);
$('#mindStart').onclick=()=>{if(playing||loading)stop();else start()};
$('#mindContinue').onclick=()=>{if(!gateOpen)return;setLayer(1);start();$('#steps').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})};
$('#mindReset').onclick=()=>{stop();gateOpen=false;gateStarted=false;muted.fill(false);layer=0;panorama=false;guided=false;real=false;engine?.resetMind();start()};
$('#notes').oninput=()=>{notes[key()]=$('#notes').value;try{localStorage.setItem('sound-spheres-notes',JSON.stringify(notes));$('#saveStatus').textContent='已儲存在此瀏覽器。'}catch{$('#saveStatus').textContent='瀏覽器無法儲存，請在離開前匯出筆記。'}};
$('#download').onclick=()=>{let txt='# 我的聲音球體\n\n'+new Date().toLocaleString('zh-TW')+'\n\n';for(let s=0;s<5;s++)for(let l=0;l<6;l++)if(notes[`${s}-${l}`])txt+=`## ${scenes[s][1]} / ${layers[l][0]}\n${notes[`${s}-${l}`]}\n\n`;let url=URL.createObjectURL(new Blob([txt],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='我的聲音球體.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('#about').onclick=()=>$('#info').showModal();$('#close').onclick=()=>$('#info').close();
let previousTick=performance.now();
setInterval(()=>{const now=performance.now(),delta=(now-previousTick)/1000;previousTick=now;if(!playing||loading)return;elapsed+=delta;stageTime+=delta;$('#timer').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed)%60).padStart(2,'0')}`;if(guided&&stageTime>=60){if(layer<5)setLayer(layer+1);else{playing=false;guided=false;message='練習完成 · 留下一筆，將聆聽帶回生活。';render()}}},250);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(playing||loading))stop()});
let lastMeter=0;function meter(now){if(now-lastMeter>80){lastMeter=now;const level=engine&&playing&&!real?engine.level():0;$('#meterFill').style.width=Math.min(100,Math.max(0,(20*Math.log10(level||.00001)+60)/60*100))+'%'}requestAnimationFrame(meter)}requestAnimationFrame(meter);render();
