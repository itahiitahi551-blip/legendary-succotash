const $=(id)=>document.getElementById(id);
const fileInput=$('fileInput'),uploadBtn=$('uploadBtn'),demoBtn=$('demoBtn'),analyzeBtn=$('analyzeBtn');
const preview=$('previewImage'),dropZone=$('dropZone'),emptyState=$('emptyState'),overlay=$('scanOverlay'),removeBtn=$('removeBtn');
const ingredients=$('ingredients'),count=$('ingredientCount'),verdictCard=$('verdictCard'),confidenceRing=$('confidenceRing'),toast=$('toast');
const verdictKicker=$('verdictKicker'),verdictTitle=$('verdictTitle'),verdictText=$('verdictText'),verdictIcon=$('verdictIcon');
const confidenceValue=$('confidenceValue'),confidenceTitle=$('confidenceTitle'),confidenceText=$('confidenceText'),analysisNote=$('analysisNote');
const state={status:'idle',file:null,objectUrl:null,demo:false,timer:null};

const demoData=[
  {name:'مستحلب E120 (قرمزي)',status:'bad',label:'حساس — يحتاج تحقق'},
  {name:'سكر',status:'good',label:'مقبول'},
  {name:'حبوب كاملة',status:'good',label:'مقبول'},
  {name:'نكهة طبيعية',status:'warn',label:'تحتاج مصدرًا'},
  {name:'زيت نباتي',status:'good',label:'مقبول'}
];

function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>toast.classList.remove('show'),2400)}
function setStatus(status){state.status=status;dropZone.dataset.status=status;overlay.classList.toggle('active',status==='analyzing');analyzeBtn.disabled=!(status==='ready'||status==='result');removeBtn.disabled=status==='analyzing'}
function setPreview(src){preview.src=src;preview.classList.add('visible');dropZone.classList.add('has-image');emptyState.setAttribute('aria-hidden','true')}
function clearPreview(){if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null}preview.removeAttribute('src');preview.classList.remove('visible');dropZone.classList.remove('has-image');emptyState.removeAttribute('aria-hidden');fileInput.value='';state.file=null;state.demo=false;setStatus('idle')}
function validateFile(file){if(!file)return 'لم يتم اختيار صورة';if(!file.type.startsWith('image/'))return 'الملف المختار ليس صورة';if(file.size>10*1024*1024)return 'حجم الصورة يتجاوز 10MB';return ''}
function loadImage(file){const error=validateFile(file);if(error){showToast(error);return}if(state.objectUrl)URL.revokeObjectURL(state.objectUrl);state.file=file;state.demo=false;state.objectUrl=URL.createObjectURL(file);setPreview(state.objectUrl);setStatus('ready');showToast('تم تجهيز الصورة للتحليل')}
function setVerdict(type,kicker,title,text,confidence){
  verdictCard.className=`verdict-card ${type}`;
  verdictKicker.textContent=kicker;verdictTitle.textContent=title;verdictText.textContent=text;
  verdictIcon.textContent=type==='safe'?'✓':type==='bad'?'×':type==='warn'?'!':'◌';
  const deg=Math.round(confidence*360),accent=type==='safe'?'var(--green)':type==='bad'?'var(--red)':'var(--cyan)';
  confidenceRing.style.background=`conic-gradient(${accent} ${deg}deg,rgba(100,231,238,.12) ${deg}deg)`;
  confidenceValue.textContent=confidence.toFixed(2);
  confidenceTitle.textContent=confidence>.9?'ثقة مرتفعة':confidence>.75?'ثقة جيدة':'ثقة منخفضة';
  confidenceText.textContent='درجة الثقة تقديرية في هذا النموذج التجريبي وليست حكمًا شرعيًا.';
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function renderIngredients(data){ingredients.innerHTML=data.map(x=>`<div class="ingredient ${x.status}"><i></i><b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.label)}</span></div>`).join('');count.textContent=data.length}
function saveHistory(result){try{const items=JSON.parse(localStorage.getItem('halallens-history')||'[]');items.unshift({...result,at:new Date().toISOString()});localStorage.setItem('halallens-history',JSON.stringify(items.slice(0,8)))}catch(_){}}
function getHistory(){try{return JSON.parse(localStorage.getItem('halallens-history')||'[]')}catch(_){return []}}
function showHistory(){const items=getHistory();if(!items.length){showToast('لا توجد تحليلات محفوظة بعد');return}const latest=items[0];showToast(`${items.length} تحليلات محفوظة · آخر نتيجة: ${latest.title}`)}
function finishAnalysis(){
  renderIngredients(demoData);
  setVerdict('warn','نتيجة أولية','يحتاج تحقق','تم العثور على مكوّن عالي الحساسية (E120). لا تعتمد النتيجة النهائية قبل التحقق من مصدره.',.95);
  analysisNote.innerHTML='<b>تنبيه:</b> هذه واجهة محاكاة. لا يتم استنتاج الحلال/الحرام بشكل موثوق من دون OCR وقاعدة مكونات ومصادر معتمدة ومراجعة منهجية.';
  saveHistory({title:'يحتاج تحقق',confidence:.95,count:demoData.length});
  setStatus('result');showToast('اكتمل التحليل التجريبي');
}
function runAnalysis(){
  if(state.status==='analyzing')return;
  if(!(state.status==='ready'||state.status==='result')){showToast('ارفع صورة أولًا');return}
  setStatus('analyzing');
  clearTimeout(state.timer);
  state.timer=setTimeout(finishAnalysis,1200);
}
function makeDemoSvg(){return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#eff7b5"/><stop offset="1" stop-color="#cde772"/></linearGradient></defs><rect width="100%" height="100%" fill="#10282b"/><rect x="250" y="55" width="400" height="590" rx="28" fill="url(#g)"/><text x="450" y="175" text-anchor="middle" font-family="Arial" font-size="64" font-weight="700" fill="#173a32">Choco</text><text x="450" y="245" text-anchor="middle" font-family="Arial" font-size="42" fill="#173a32">Crunch</text><circle cx="450" cy="390" r="92" fill="#895630"/><circle cx="414" cy="365" r="11" fill="#ead08e"/><circle cx="470" cy="410" r="13" fill="#ead08e"/><text x="450" y="558" text-anchor="middle" font-family="Arial" font-size="19" fill="#173a32">E120 • SUGAR • OIL</text></svg>`}
function demo(){
  clearTimeout(state.timer);state.demo=true;state.file=null;
  if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null}
  const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(makeDemoSvg());
  setPreview(src);setStatus('ready');showToast('تم تحميل منتج تجريبي');runAnalysis();
}

uploadBtn.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',e=>loadImage(e.target.files?.[0]));
analyzeBtn.addEventListener('click',runAnalysis);
demoBtn.addEventListener('click',demo);
removeBtn.addEventListener('click',()=>{clearTimeout(state.timer);clearPreview();renderIngredients([]);setVerdict('pending','بانتظار الصورة','جاهز للتحليل','ارفع منتجًا للحصول على تقرير المكونات.',0);analysisNote.innerHTML='<b>ملاحظة:</b> ستظهر تفاصيل التحليل بعد رفع صورة وتشغيل الفحص.';showToast('تمت إزالة الصورة')});
$('helpBtn').addEventListener('click',()=>showToast('ارفع صورة واضحة للمكونات ثم اضغط ابدأ التحليل'));
$('historyBtn').addEventListener('click',showHistory);

dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('dragging')});
dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('dragging');loadImage(e.dataTransfer.files?.[0])});
window.addEventListener('beforeunload',()=>{if(state.objectUrl)URL.revokeObjectURL(state.objectUrl)});
setStatus('idle');
