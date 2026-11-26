'use strict';
const byId=id=>document.getElementById(id);
let installPrompt=null;
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
window.addEventListener('appinstalled',()=>{installPrompt=null;byId('installApp').textContent='Pintasan dipasang ✓';announce('Ikon KokoAktif telah ditambahkan pada peranti ini.');});
byId('openApp').addEventListener('click',event=>{
  if(navigator.onLine===false){event.preventDefault();announce('Sambungkan Internet untuk membuka aplikasi DELIMa.');}
});
try{
  const url=new URL(window.OSC_CONFIG.webAppUrl);
  if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!url.pathname.endsWith('/exec'))throw Error('Pautan aplikasi tidak sah.');
  const chooser=new URL('https://accounts.google.com/AccountChooser');
  chooser.searchParams.set('continue',url.href);
  byId('openApp').href=chooser.href;
}catch(e){byId('openApp').removeAttribute('href');announce('Pautan aplikasi belum dikonfigurasi. Hubungi pentadbir.');}
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone){byId('installApp').textContent='Panduan pintasan';}
const updateButton=byId('updateApp');
const serviceWorker=navigator.serviceWorker;
const hadController=Boolean(serviceWorker?.controller);
let refreshing=false;
let reloadTimer;
function reloadLauncher(){
  if(refreshing)return;
  refreshing=true;
  clearTimeout(reloadTimer);
  const url=new URL(window.location.href);
  url.searchParams.set('kemasKini',Date.now().toString());
  window.location.replace(url);
}
function activateUpdate(registration){
  if(!registration.waiting)return false;
  registration.waiting.postMessage({type:'SKIP_WAITING'});
  return true;
}
function watchUpdate(registration){
  const worker=registration.installing;
  if(!worker)return;
  worker.addEventListener('statechange',()=>{
    if(worker.state==='installed'&&serviceWorker.controller)activateUpdate(registration);
  });
}
const launcherWorker=serviceWorker?.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(registration=>{
  if(hadController)activateUpdate(registration);
  registration.addEventListener('updatefound',()=>watchUpdate(registration));
  watchUpdate(registration);
  return registration;
}).catch(()=>null);
serviceWorker?.addEventListener('controllerchange',()=>{
  if(hadController||updateButton.disabled)reloadLauncher();
});
updateButton.addEventListener('click',async()=>{
  if(navigator.onLine===false){announce('Sambungkan Internet untuk mengemas kini aplikasi.');return;}
  updateButton.disabled=true;
  announce('Menyemak versi terkini…');
  reloadTimer=setTimeout(reloadLauncher,10000);
  try{
    const registration=await launcherWorker;
    if(registration){
      if(activateUpdate(registration))return;
      await registration.update();
      if(activateUpdate(registration)||registration.installing)return;
    }
  }catch(e){/* The page can still refresh if the offline cache is unavailable. */}
  reloadLauncher();
});
