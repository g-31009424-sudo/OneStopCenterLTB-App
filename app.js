'use strict';
const byId=id=>document.getElementById(id);
let installPrompt=null,waitingWorker=null;
function announce(message){byId('notice').textContent=message;}
function updateConnection(){
  const online=navigator.onLine!==false;
  byId('connection').textContent=online?'Peranti dalam talian':'Tiada sambungan Internet';
  byId('openApp').setAttribute('aria-disabled',String(!online));
  if(!online)announce('Pintasan boleh dibuka di luar talian. Sambungan Internet diperlukan untuk rekod dan laporan sekolah.');
  else if(byId('notice').textContent.startsWith('Pintasan boleh'))announce('');
}
function showHelp(){byId('installHelp').showModal();}
byId('helpInstall').addEventListener('click',showHelp);
byId('closeHelp').addEventListener('click',()=>byId('installHelp').close());
byId('installApp').addEventListener('click',async()=>{
  if(!installPrompt){showHelp();return;}
  const prompt=installPrompt;installPrompt=null;
  try{
    await prompt.prompt();
    const choice=await prompt.userChoice;
    if(choice.outcome!=='accepted')announce('Pemasangan dibatalkan. Cikgu boleh pasang semula melalui menu pelayar.');
  }catch(e){showHelp();}
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
window.addEventListener('appinstalled',()=>{installPrompt=null;byId('installApp').textContent='Pintasan dipasang ✓';announce('Ikon One Stop Center telah ditambahkan pada peranti ini.');});
byId('openApp').addEventListener('click',event=>{
  if(navigator.onLine===false){event.preventDefault();announce('Sambungkan Internet untuk membuka aplikasi DELIMa.');}
});
try{
  const url=new URL(window.OSC_CONFIG.webAppUrl);
  if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!url.pathname.endsWith('/exec'))throw Error('Pautan aplikasi tidak sah.');
  byId('openApp').href=url.href;
}catch(e){byId('openApp').removeAttribute('href');announce('Pautan aplikasi belum dikonfigurasi. Hubungi pentadbir.');}
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone){byId('installApp').textContent='Panduan pintasan';}
byId('updateApp').addEventListener('click',()=>waitingWorker?.postMessage({type:'SKIP_WAITING'}));
if('serviceWorker' in navigator){
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading){reloading=true;window.location.reload();}});
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(registration=>{
    const offer=()=>{waitingWorker=registration.waiting;if(waitingWorker&&navigator.serviceWorker.controller)byId('updateBox').hidden=false;};
    offer();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')offer();});});
  }).catch(()=>announce('Pintasan boleh digunakan. Simpanan luar talian belum tersedia dalam pelayar ini.'));
}
