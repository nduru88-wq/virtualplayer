const SUPABASE_URL = 'https://yjcyfczhjjminzmotvcj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_23FFRX9kGlcBUxAjJCtphA_J0bMVYOA';
const BUCKET = 'Virtual player';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const loginView=$('loginView'), playerView=$('playerView'), loginForm=$('loginForm'), loginMsg=$('loginMsg');
const audio=$('audio'), playlist=$('playlist'), status=$('status'), trackTitle=$('trackTitle');
let tracks=[], current=-1, objectUrl=null;

function fmt(sec){ if(!Number.isFinite(sec)) return '0:00'; const m=Math.floor(sec/60),s=Math.floor(sec%60); return `${m}:${String(s).padStart(2,'0')}`; }
function cleanName(name){ return name.replace(/\.mp3$/i,''); }
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

async function loadTracks(){
  status.textContent='Henter musik…'; playlist.innerHTML='';
  const {data,error}=await sb.storage.from(BUCKET).list('',{limit:1000,sortBy:{column:'name',order:'asc'}});
  if(error){ status.textContent='Kunne ikke hente musik: '+error.message; return; }
  tracks=(data||[]).filter(f=>f.name && /\.mp3$/i.test(f.name));
  status.textContent=tracks.length ? `${tracks.length} nummer${tracks.length===1?'':'e'}` : 'Ingen MP3-filer fundet.';
  render();
}
function render(){
  playlist.innerHTML='';
  tracks.forEach((t,i)=>{
    const row=document.createElement('div'); row.className='track'+(i===current?' active':'');
    const main=document.createElement('button'); main.className='track-main'; main.innerHTML=`<span class="num">${i+1}</span><span class="name"></span><span class="go">▶</span>`;
    main.querySelector('.name').textContent=cleanName(t.name); main.onclick=()=>playIndex(i);
    const del=document.createElement('button'); del.className='delete'; del.textContent='Slet'; del.onclick=()=>deleteTrack(i);
    row.append(main,del); playlist.append(row);
  });
}
async function playIndex(i){
  if(!tracks.length) return; current=(i+tracks.length)%tracks.length; const t=tracks[current];
  trackTitle.textContent=cleanName(t.name); render(); status.textContent='Åbner nummer…';
  const {data,error}=await sb.storage.from(BUCKET).download(t.name);
  if(error){ status.textContent='Kunne ikke afspille: '+error.message; return; }
  if(objectUrl) URL.revokeObjectURL(objectUrl); objectUrl=URL.createObjectURL(data); audio.src=objectUrl;
  try{ await audio.play(); status.textContent=`${tracks.length} numre`; }catch{ status.textContent='Tryk på afspil for at starte.'; }
}
async function deleteTrack(i){
  const t=tracks[i]; if(!confirm(`Slet “${cleanName(t.name)}”?\n\nFilen slettes også fra Supabase.`)) return;
  const {error}=await sb.storage.from(BUCKET).remove([t.name]);
  if(error){ alert('Kunne ikke slette filen: '+error.message); return; }
  if(i===current){ audio.pause(); audio.removeAttribute('src'); trackTitle.textContent='Vælg et nummer'; current=-1; }
  else if(i<current) current--;
  await loadTracks();
}
$('playBtn').onclick=()=>{ if(current<0 && tracks.length) playIndex(0); else if(audio.paused) audio.play(); else audio.pause(); };
$('prevBtn').onclick=()=>{ if(tracks.length) playIndex(current<=0?tracks.length-1:current-1); };
$('nextBtn').onclick=()=>{ if(tracks.length) playIndex((current+1)%tracks.length); };
audio.addEventListener('play',()=>$('playBtn').textContent='❚❚'); audio.addEventListener('pause',()=>$('playBtn').textContent='▶');
audio.addEventListener('ended',()=>{ if(tracks.length) playIndex((current+1)%tracks.length); });
audio.addEventListener('timeupdate',()=>{ $('currentTime').textContent=fmt(audio.currentTime); $('duration').textContent=fmt(audio.duration); $('seek').value=audio.duration?(audio.currentTime/audio.duration)*100:0; });
$('seek').oninput=e=>{ if(audio.duration) audio.currentTime=(e.target.value/100)*audio.duration; };
$('volume').oninput=e=>audio.volume=e.target.value; audio.volume=.8;

(async()=>{ const {data:{session}}=await sb.auth.getSession(); if(session?.user) showPlayer(session.user); else showLogin(); })();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
