const canvas=document.getElementById('teardownCanvas');
const ctx=canvas.getContext('2d');
const slider=document.getElementById('explodeSlider');
const loadSlider=document.getElementById('loadSlider');
const thermalBtn=document.getElementById('thermalBtn');
const labels=document.getElementById('componentLabels');
let explode=64,load=58,thermal=true,yaw=18,pitch=-8,drag=false,lastX=0,lastY=0,hovered=null;

const parts=[
{name:'Outer Frame',short:'FRAME',cost:42,material:'Aluminium alloy',score:'8.9 / 10',thermal:'Low',color:'#91a2ab',x:0,y:-190,w:250,h:22,z:0,depth:18,desc:'Machined alloy chassis provides structural rigidity and acts as a secondary heat spreader.'},
{name:'Display Assembly',short:'DISPLAY',cost:78,material:'OLED / glass',score:'9.2 / 10',thermal:'Low',color:'#4d7180',x:0,y:-120,w:215,h:95,z:1,depth:15,desc:'High-density OLED stack bonded to a rigid carrier plate with perimeter adhesive.'},
{name:'Battery Pack',short:'BATTERY',cost:31,material:'Lithium-ion polymer',score:'8.1 / 10',thermal:'Medium',color:'#a38a58',x:-78,y:20,w:105,h:150,z:2,depth:22,desc:'High-density pouch cell with pull tabs and a protective composite enclosure.'},
{name:'Vapor Chamber',short:'COOLING',cost:18,material:'Copper',score:'9.0 / 10',thermal:'High',color:'#a16a52',x:74,y:20,w:90,h:145,z:3,depth:8,desc:'Ultra-thin copper vapor chamber distributes processor heat across the mid-frame.'},
{name:'Mainboard',short:'MAINBOARD',cost:86,material:'FR-4 / copper',score:'9.1 / 10',thermal:'High',color:'#355f55',x:0,y:15,w:155,h:115,z:4,depth:9,desc:'Dense multi-layer board carrying power management, compute, memory and connectivity.'},
{name:'Application Processor',short:'SoC',cost:59,material:'Silicon / copper',score:'9.6 / 10',thermal:'High',color:'#456f77',x:0,y:5,w:52,h:42,z:5,depth:6,desc:'Dense package design prioritizes compute density. Copper heat spreader sits directly above the package.'},
{name:'Camera Cluster',short:'CAMERA',cost:44,material:'Glass / aluminium',score:'9.0 / 10',thermal:'Medium',color:'#52617a',x:72,y:-12,w:55,h:65,z:6,depth:16,desc:'Triple-camera module with stabilized optics and compact actuator assemblies.'},
{name:'Speaker / Haptics',short:'I/O',cost:14,material:'Polymer / steel',score:'8.5 / 10',thermal:'Low',color:'#6e6b58',x:-72,y:112,w:48,h:35,z:7,depth:12,desc:'Compact acoustic and haptic module connected through flex interfaces.'}
];
let selected=parts[5];

function resize(){const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);draw()}
window.addEventListener('resize',resize);

function project(p){
  const spread=explode/100;
  const rx=(p.x)*(1+spread*.82);
  const rz=p.y+(p.y<0?-1:1)*spread*112*(p.z/7+.15);
  const yawRad=yaw*Math.PI/180;
  const pitchRad=pitch*Math.PI/180;
  const x=rx*Math.cos(yawRad)-rz*Math.sin(yawRad)*.22;
  const y=rz*Math.cos(pitchRad)-rx*Math.sin(yawRad)*.12;
  const depth=(rx*Math.sin(yawRad)+rz*.22*Math.cos(yawRad));
  return {x,y,depth,scale:1+depth/1400};
}

function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  drawGrid(w,h);
  const centerX=w/2,centerY=h/2+10,scale=Math.min(w/480,h/480);
  ctx.save();ctx.translate(centerX,centerY);ctx.scale(scale,scale);
  const ordered=[...parts].sort((a,b)=>project(a).depth-project(b).depth);
  ordered.forEach(p=>drawPart(p));
  drawAxis();
  ctx.restore();
  updateLabels();
}

function drawGrid(w,h){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0e1820');g.addColorStop(.55,'#0a1117');g.addColorStop(1,'#071015');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.globalAlpha=.26;ctx.strokeStyle='#28434c';ctx.lineWidth=1;const step=Math.max(28,Math.floor(w/28));
  for(let x=0;x<w;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<h;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  ctx.restore();
  const vignette=ctx.createRadialGradient(w/2,h/2,20,w/2,h/2,Math.max(w,h)*.65);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#020609aa');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
}

function drawPart(p){
  const q=project(p),rx=q.x,ry=q.y,s=q.scale,spread=explode/100;
  const hot=Math.min(1,Math.max(0,(load-25)/75)*(p.thermal==='High'?1:p.thermal==='Medium'?.55:.18));
  ctx.save();ctx.translate(rx,ry);ctx.scale(s,s);ctx.rotate((p.z-3)*.015);
  const depth=p.depth*(.45+spread*.35);
  if(thermal&&hot>.08){ctx.shadowBlur=24*hot;ctx.shadowColor=hot>.45?'#ff5a42':'#19d9ef'}
  const base=thermal&&hot>.08?mix(p.color,'#ff543e',hot*.68):p.color;
  drawExtruded(-p.w/2,-p.h/2,p.w,p.h,depth,base,p===selected,p===hovered);
  if(p.name==='Mainboard')drawBoardTrace(p);
  if(p.name==='Application Processor')drawChip(p);
  if(p.name==='Camera Cluster')drawCameras(p);
  if(p.name==='Battery Pack')drawBattery(p);
  ctx.restore();
}

function drawExtruded(x,y,w,h,d,color,isSelected,isHover){
  const side=shade(color,-.34),top=shade(color,.14);
  ctx.fillStyle=side;ctx.strokeStyle='#3a5660';ctx.lineWidth=isSelected?2.4:1.1;
  ctx.beginPath();ctx.roundRect(x+d*.3,y+d*.3,w,h,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=top;ctx.beginPath();ctx.roundRect(x+d*.3,y+d*.3,w,h,8);ctx.fill();
  ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();
  ctx.strokeStyle=isSelected?'#59edff':isHover?'#b4f8ff':'#45616a';ctx.lineWidth=isSelected?2.4:isHover?1.8:1;ctx.stroke();
  if(isSelected){ctx.globalAlpha=.16;ctx.fillStyle='#4de7ff';ctx.beginPath();ctx.roundRect(x-6,y-6,w+12,h+12,12);ctx.fill()}
}
function drawBoardTrace(){ctx.strokeStyle='#86d2ad';ctx.lineWidth=1;ctx.globalAlpha=.72;for(let x=-55;x<56;x+=14){ctx.beginPath();ctx.moveTo(x,-40);ctx.lineTo(x+18,40);ctx.stroke()}for(let y=-30;y<31;y+=12){ctx.beginPath();ctx.moveTo(-65,y);ctx.lineTo(65,y+5);ctx.stroke()}ctx.globalAlpha=1}
function drawChip(){ctx.fillStyle='#0c171b';ctx.fillRect(-17,-13,34,26);ctx.strokeStyle='#a6f1f8';ctx.strokeRect(-17,-13,34,26);ctx.fillStyle='#68e7f4';ctx.fillRect(-8,-5,16,10)}
function drawCameras(){for(let i=-1;i<=1;i++){ctx.fillStyle='#111b22';ctx.strokeStyle='#8fdce6';ctx.beginPath();ctx.arc(0+i*15,-7,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#02070b';ctx.beginPath();ctx.arc(i*15,-7,3,0,Math.PI*2);ctx.fill()}}
function drawBattery(){ctx.strokeStyle='#d9bc77';ctx.lineWidth=2;ctx.strokeRect(-37,-52,74,104);ctx.fillStyle='#bfa15f';ctx.fillRect(-17,-58,34,6);ctx.globalAlpha=.35;ctx.fillStyle='#fff4bf';ctx.fillRect(-30,-44,60,4);ctx.globalAlpha=1}
function drawAxis(){ctx.globalAlpha=.8;ctx.lineWidth=1.4;[['X','#f07e6c',56,0],['Y','#76d58c',0,-56],['Z','#6eacef',-40,30]].forEach(([t,c,x,y])=>{ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=c;ctx.font='9px ui-monospace,monospace';ctx.fillText(t,x+(x>0?5:-10),y+(y>0?10:-5))});ctx.globalAlpha=1}
function updateLabels(){
  labels.innerHTML='';
  parts.filter(p=>p.z>=3).forEach(p=>{
    const q=project(p),e=document.createElement('button');e.className='component-label';e.textContent=p.short;e.type='button';e.style.left=`calc(50% + ${q.x*Math.min(canvas.clientWidth/480,canvas.clientHeight/480)}px)`;e.style.top=`calc(50% + ${(q.y+10)*Math.min(canvas.clientWidth/480,canvas.clientHeight/480)}px)`;e.classList.toggle('selected',p===selected);e.onclick=()=>select(p);labels.appendChild(e)
  })
}
function select(p){selected=p;document.getElementById('componentTitle').textContent=p.name;document.getElementById('componentSubtitle').textContent=p.name==='Application Processor'?'8-core mobile SoC':'Precision engineered module';document.getElementById('componentVendor').textContent=p.name==='Application Processor'?'Astra Semiconductor':'Astra Components Group';document.getElementById('componentCost').textContent='$'+p.cost;document.getElementById('componentMaterial').textContent=p.material;document.getElementById('componentPerformance').textContent=p.score;const t=document.getElementById('componentThermal');t.textContent=p.thermal;t.className=p.thermal==='High'?'thermal-hot':p.thermal==='Low'?'thermal-good':'';document.getElementById('componentNotes').textContent=p.desc;renderBars();draw()}
function renderBars(){const b=document.getElementById('loadBars');b.innerHTML='';for(let i=0;i<18;i++){const e=document.createElement('i');e.className='bar';e.style.height=(18+Math.max(0,Math.sin(i*.7)*25)+load*.45+(selected.thermal==='High'?12:0))+'%';b.appendChild(e)}document.getElementById('loadValue').textContent=Math.round(load*(selected.thermal==='High'?1.15:1.02))+'%'}
function shade(hex,amt){const m=hex.match(/\w\w/g);if(!m)return hex;return '#'+m.map(v=>Math.max(0,Math.min(255,parseInt(v,16)+(amt*255))).toString(16).padStart(2,'0')).join('')}
function mix(a,b,t){const A=a.match(/\w\w/g),B=b.match(/\w\w/g);if(!A||!B)return a;return '#'+A.map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(B[i],16)*t).toString(16).padStart(2,'0')).join('')}

slider.addEventListener('input',e=>{explode=+e.target.value;document.getElementById('explodeValue').textContent=String(explode).padStart(2,'0')+'%';document.getElementById('explodeLabel').textContent=explode+'%';draw()});
loadSlider.addEventListener('input',e=>{load=+e.target.value;document.getElementById('dialCore').textContent=load;const temp=Math.round(30+load*.29+(selected.thermal==='High'?4:0));document.getElementById('simTemp').textContent=temp+'°C';document.getElementById('headroomValue').textContent=Math.max(4,100-load)+'%';document.getElementById('headroomBar').style.width=Math.max(4,100-load)+'%';const state=document.getElementById('simulationState');state.textContent=load>82?'CRITICAL':load>65?'HIGH LOAD':'BALANCED';state.className='tiny-tag '+(load>82?'thermal-hot':'');renderBars();draw()});
thermalBtn.addEventListener('click',()=>{thermal=!thermal;thermalBtn.classList.toggle('active',thermal);draw()});
document.getElementById('resetBtn').addEventListener('click',()=>{explode=64;load=58;yaw=18;pitch=-8;slider.value=64;loadSlider.value=58;document.getElementById('explodeValue').textContent='64%';document.getElementById('explodeLabel').textContent='64%';document.getElementById('angleValue').textContent='018°';document.getElementById('dialCore').textContent='58';document.getElementById('simTemp').textContent='47°C';renderBars();draw()});

canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;yaw+=dx*.65;pitch=Math.max(-28,Math.min(28,pitch+dy*.38));lastX=e.clientX;lastY=e.clientY;document.getElementById('angleValue').textContent=(Math.round((yaw%360+360)%360)).toString().padStart(3,'0')+'°';draw()});
canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);

canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect(),sx=Math.min(r.width/480,r.height/480);let hit=null;for(const p of parts.slice().sort((a,b)=>b.z-a.z)){const q=project(p),x=r.width/2+q.x*sx,y=r.height/2+q.y*sx;const hw=p.w*sx*.55,hh=p.h*sx*.55;if(Math.abs(e.clientX-r.left-x)<hw&&Math.abs(e.clientY-r.top-y)<hh){hit=p;break}}if(hovered!==hit){hovered=hit;draw()}});
canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),sx=Math.min(r.width/480,r.height/480);for(const p of parts.slice().sort((a,b)=>b.z-a.z)){const q=project(p),x=r.width/2+q.x*sx,y=r.height/2+q.y*sx;if(Math.abs(e.clientX-r.left-x)<p.w*sx*.55&&Math.abs(e.clientY-r.top-y)<p.h*sx*.55){select(p);break}}});

renderBars();resize();select(selected);
