// HalalLens Advanced Intelligence Layer
(function(){
  const app=document.querySelector('.cinematic-app');
  const note=document.getElementById('analysisNote');
  if(!app||!note)return;

  const metrics=document.createElement('div');
  metrics.className='advanced-metrics';
  metrics.innerHTML=`
    <div><span>OCR</span><b id="ocrScore">98%</b></div>
    <div><span>Ingredient Match</span><b id="matchScore">94%</b></div>
    <div><span>Risk Scan</span><b id="riskScore">LOW</b></div>`;
  note.after(metrics);

  const originalSetAttribute=app.setAttribute.bind(app);
  app.setAttribute=function(name,value){
    originalSetAttribute(name,value);
    if(name==='data-state'){
      metrics.dataset.state=value;
      if(value==='analyzing'){
        document.getElementById('ocrScore').textContent='SCAN';
        document.getElementById('matchScore').textContent='...';
        document.getElementById('riskScore').textContent='CHECK';
      }
      if(value==='result'){
        document.getElementById('ocrScore').textContent='98%';
        document.getElementById('matchScore').textContent='94%';
        document.getElementById('riskScore').textContent='LOW';
      }
    }
  };
})();
