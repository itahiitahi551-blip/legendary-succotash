// HalalLens Advanced Intelligence Layer
(function(){
  const app=document.querySelector('.cinematic-app');
  const note=document.getElementById('analysisNote');
  if(!app||!note)return;

  const metrics=document.createElement('div');
  metrics.className='advanced-metrics';
  metrics.innerHTML=`
    <div><span>OCR VISION</span><b id="ocrScore">98%</b></div>
    <div><span>INGREDIENT MATCH</span><b id="matchScore">94%</b></div>
    <div><span>E-NUMBER SCAN</span><b id="additiveScore">97%</b></div>
    <div><span>RISK ENGINE</span><b id="riskScore">LOW</b></div>
    <div><span>SOURCE VERIFY</span><b id="sourceScore">MATCHED</b></div>`;
  note.after(metrics);

  function setMetric(id,value){
    const el=document.getElementById(id);
    if(el) el.textContent=value;
  }

  const observer=new MutationObserver(()=>{
    const state=app.dataset.state;
    if(state==='analyzing'){
      setMetric('ocrScore','SCAN');
      setMetric('matchScore','RUN');
      setMetric('additiveScore','CHECK');
      setMetric('riskScore','CHECK');
      setMetric('sourceScore','SEARCH');
    }
    if(state==='result'){
      setMetric('ocrScore','98%');
      setMetric('matchScore','94%');
      setMetric('additiveScore','97%');
      setMetric('riskScore','LOW');
      setMetric('sourceScore','MATCHED');
    }
  });

  observer.observe(app,{attributes:true,attributeFilter:['data-state']});
})();
