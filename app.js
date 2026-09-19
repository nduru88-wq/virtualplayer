const SUPABASE_URL = 'https://yjcyfczhjjminzmotvcj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_23FFRX9kGlcBUxAjJCtphA_J0bMVYOA';
const BUCKET = 'Virtual player';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const loginView=$('loginView'), playerView=$('playerView'), loginForm=$('loginForm'), loginMsg=$('loginMsg');
const audio=$('audio'), playlist=$('playlist'), status=$('status'), trackTitle=$('trackTitle');
let tracks=[], visibleTracks=[], current=-1, currentPath=null, currentFolder='Alle numre', objectUrl=null;

function fmt(sec){ if(!Number.isFinite(sec)) return '0:00'; const m=Math.floor(sec/60),s=Math.floor(sec%60); return `${m}:${String(s).padStart(2,'0')}`; }
function cleanName(name){ return name.replace(/\.mp3$/i,''); }
function folderOf(path){ const p=path.split('/'); return p.length>1?p.slice(0,-1).join('/'):'Hovedmappe'; }
function showLogin(){ loginView.classList.remove('hidden'); playerView.classList.add('hidden'); audio.pause(); }
function showPlayer(user){ loginView.classList.add('hidden'); playerView.classList.remove('hidden'); $('userLabel').textContent=user.email||''; loadTracks(); }

loginForm.addEventListener('submit', async e=>{
  e.preventDefault(); loginMsg.textContent='Logger ind…'; $('loginBtn').disabled=true;
  const {data,error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  $('loginBtn').disabled=false;
  if(error){ loginMsg.textContent='Kunne ikke logge ind. Tjek e-mail og adgangskode.'; return; }
  loginMsg.textContent=''; showPlayer(data.user);
});
$('logoutBtn').onclick=async()=>{ await sb.auth.signOut(); showLogin(); };
$('refreshBtn').onclick=loadTracks;

async function listRecursive(path=''){
  const found=[];
  const {data,error}=await sb.storage.from(BUCKET).list(path,{limit:1000,sortBy:{column:'name',order:'asc'}});
  if(error) throw error;
  for(const item of (data||[])){
    const full=path?`${path}/${item.name}`:item.name;
    if(/\.mp3$/i.test(item.name)) found.push({name:item.name,path:full,folder:folderOf(full)});
    else if(item.id===null || !item.metadata){
      const children=await listRecursive(full);
      found.push(...children);
    }
  }
  return found;
}

async function loadTracks(){
  status.textContent='Henter musik…'; playlist.innerHTML=''; $('folders').innerHTML='';
  try{ tracks=await listRecursive(''); }
  catch(error){ status.textContent='Kunne ikke hente musik: '+error.message; return; }
  tracks.sort((a,b)=>a.path.localeCompare(b.path,'da',{numeric:true,sensitivity:'base'}));
  renderFolders();
  selectFolder(currentFolder, false);
  status.textContent=tracks.length ? `${tracks.length} nummer${tracks.length===1?'':'e'} i alt` : 'Ingen MP3-filer fundet.';
}

function renderFolders(){
  const box=$('folders'); box.innerHTML='';
  const folders=[...new Set(tracks.map(t=>t.folder))];
  const options=['Alle numre',...folders];
  if(!options.includes(currentFolder)) currentFolder='Alle numre';
  options.forEach(name=>{
    const b=document.createElement('button'); b.className='folder-btn'+(name===currentFolder?' active':'');
    const count=name==='Alle numre'?tracks.length:tracks.filter(t=>t.folder===name).length;
    b.textContent=`${name==='Alle numre'?'♫':'📁'} ${name} (${count})`;
    b.onclick=()=>selectFolder(name,true); box.append(b);
  });
}

function selectFolder(name, rerenderFolders=true){
  currentFolder=name;
  visibleTracks=name==='Alle numre'?tracks.slice():tracks.filter(t=>t.folder===name);
  if(rerenderFolders) renderFolders();
  $('libraryTitle').textContent=name;
  render();
}

function render(){
  playlist.innerHTML='';
  visibleTracks.forEach((t,i)=>{
    const row=document.createElement('div'); row.className='track'+(t.path===currentPath?' active':'');
    const main=document.createElement('button'); main.className='track-main'; main.innerHTML=`<span class="num">${i+1}</span><span class="name"></span><span class="go">▶</span>`;
    main.querySelector('.name').textContent=cleanName(t.name); main.onclick=()=>playTrack(t);
    const del=document.createElement('button'); del.className='delete'; del.textContent='Slet'; del.onclick=()=>deleteTrack(t);
    row.append(main,del); playlist.append(row);
  });
}

async function playTrack(t){
  if(!t) return; currentPath=t.path; current=visibleTracks.findIndex(x=>x.path===t.path);
  trackTitle.textContent=cleanName(t.name); $('nowFolder').textContent=t.folder; render(); status.textContent='Åbner nummer…';
  const {data,error}=await sb.storage.from(BUCKET).download(t.path);
  if(error){ status.textContent='Kunne ikke afspille: '+error.message; return; }
  if(objectUrl) URL.revokeObjectURL(objectUrl); objectUrl=URL.createObjectURL(data); audio.src=objectUrl;
  try{ await audio.play(); status.textContent=`${tracks.length} numre i alt`; }catch{ status.textContent='Tryk på afspil for at starte.'; }
}

async function deleteTrack(t){
  if(!confirm(`Slet “${cleanName(t.name)}”?\n\nFilen slettes også fra Supabase.`)) return;
  const {error}=await sb.storage.from(BUCKET).remove([t.path]);
  if(error){ alert('Kunne ikke slette filen: '+error.message); return; }
  if(t.path===currentPath){ audio.pause(); audio.removeAttribute('src'); trackTitle.textContent='Vælg et nummer'; $('nowFolder').textContent=''; currentPath=null; current=-1; }
  await loadTracks();
}

function queueIndex(){ return visibleTracks.findIndex(t=>t.path===currentPath); }
$('playBtn').onclick=()=>{ if(!currentPath && visibleTracks.length) playTrack(visibleTracks[0]); else if(audio.paused) audio.play(); else audio.pause(); };
$('prevBtn').onclick=()=>{ if(!visibleTracks.length)return; const i=queueIndex(); playTrack(visibleTracks[i<=0?visibleTracks.length-1:i-1]); };
$('nextBtn').onclick=()=>{ if(!visibleTracks.length)return; const i=queueIndex(); playTrack(visibleTracks[(i<0?0:i+1)%visibleTracks.length]); };
audio.addEventListener('play',()=>$('playBtn').textContent='❚❚'); audio.addEventListener('pause',()=>$('playBtn').textContent='▶');
audio.addEventListener('ended',()=>{ if(visibleTracks.length){ const i=queueIndex(); playTrack(visibleTracks[(i<0?0:i+1)%visibleTracks.length]); } });
audio.addEventListener('timeupdate',()=>{ $('currentTime').textContent=fmt(audio.currentTime); $('duration').textContent=fmt(audio.duration); $('seek').value=audio.duration?(audio.currentTime/audio.duration)*100:0; });
$('seek').oninput=e=>{ if(audio.duration) audio.currentTime=(e.target.value/100)*audio.duration; };
$('volume').oninput=e=>audio.volume=e.target.value; audio.volume=.8;

(async()=>{ const {data:{session}}=await sb.auth.getSession(); if(session?.user) showPlayer(session.user); else showLogin(); })();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
