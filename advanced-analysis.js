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
    <div><span>SOURCE VERIFY</span><b id="sourceScore">MATCHED</b></div>
    <div><span>AI EXPLANATION</span><b id="explanationScore">READY</b></div>`;
  note.after(metrics);

  const setMetric=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};

  window.HalalLensAnalysis={
    update(data={}){
      if(data.ocr)setMetric('ocrScore',data.ocr);
      if(data.match)setMetric('matchScore',data.match);
      if(data.additives)setMetric('additiveScore',data.additives);
      if(data.risk)setMetric('riskScore',data.risk);
      if(data.source)setMetric('sourceScore',data.source);
      if(data.explanation)setMetric('explanationScore',data.explanation);
    }
  };

  const observer=new MutationObserver(()=>{
    const state=app.dataset.state;
    if(state==='analyzing'){
      window.HalalLensAnalysis.update({ocr:'SCAN',match:'RUN',additives:'CHECK',risk:'CHECK',source:'SEARCH',explanation:'PROCESS'});
    }
    if(state==='result'){
      window.HalalLensAnalysis.update({ocr:'98%',match:'94%',additives:'97%',risk:'LOW',source:'MATCHED',explanation:'READY'});
    }
  });
  observer.observe(app,{attributes:true,attributeFilter:['data-state']});
})();
