const $ = (s) => document.querySelector(s);
let token = localStorage.getItem('moro228_token') || '';
let mode = 'register';
$('#year').textContent = new Date().getFullYear();
function openModal(nextMode='register') { $('#auth-modal').classList.remove('hidden'); setMode(nextMode); $('#auth-message').textContent=''; $('#pay-message').textContent=''; }
function closeModal() { $('#auth-modal').classList.add('hidden'); }
function setMode(next) {
 mode=next;
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
 $('#name-wrap').classList.toggle('hidden',mode==='login');
 $('#auth-form').classList.toggle('hidden',Boolean(window.memberData));
 $('#member-panel').classList.toggle('hidden',!window.memberData);
 $('#modal-title').textContent=window.memberData?'Mon espace':(mode==='register'?'Créer un compte':'Connexion');
 $('#auth-submit').textContent=mode==='register'?'Créer mon compte':'Me connecter';
 const name=$('#auth-form [name="name"]'); name.required=mode==='register';
 $('#auth-form [name="password"]').autocomplete=mode==='register'?'new-password':'current-password';
}
$('#open-login').addEventListener('click',()=>openModal('login'));
$('#join-vip').addEventListener('click',()=>openModal(token?'login':'register'));
$('#close-modal').addEventListener('click',closeModal);
$('#auth-modal').addEventListener('click',e=>{if(e.target===$('#auth-modal'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{window.memberData=null;setMode(b.dataset.mode)}));
$('#auth-form').addEventListener('submit',async e=>{
 e.preventDefault(); const fd=new FormData(e.currentTarget); const body=Object.fromEntries(fd.entries());
 $('#auth-submit').disabled=true; $('#auth-message').textContent='Connexion au serveur…';
 try { const r=await fetch('/api/'+(mode==='register'?'register':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json(); if(!r.ok)throw new Error(data.error||'Erreur serveur'); token=data.token; localStorage.setItem('moro228_token',token); await loadMember(); $('#auth-message').textContent=''; }
 catch(err){$('#auth-message').textContent=err.message;}
 finally{$('#auth-submit').disabled=false;}
});
async function loadMember(){
 const r=await fetch('/api/me',{headers:{Authorization:'Bearer '+token}}); if(!r.ok){token='';localStorage.removeItem('moro228_token');window.memberData=null;return false;}
 const d=await r.json(); window.memberData=d; $('#auth-form').classList.add('hidden');$('#member-panel').classList.remove('hidden');$('#modal-title').textContent='Mon espace';
 $('#member-status').innerHTML=`Bonjour <b>${escapeHtml(d.user.name)}</b>.<br>`+(d.vip?`<span class="member-badge">Accès VIP actif jusqu'au ${escapeHtml(d.vip.expiresAt)}.</span>`:'Ton accès VIP n’est pas actif. Choisis TMoney ou Flooz pour commencer le paiement.');
 $('#open-login').textContent='Mon compte'; return true;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
document.querySelectorAll('[data-provider]').forEach(b=>b.addEventListener('click',async()=>{
 $('#pay-message').textContent='Demande de paiement…';
 try{const r=await fetch('/api/membership/checkout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({provider:b.dataset.provider})});const d=await r.json();if(!r.ok)throw new Error((d.error||'Paiement indisponible')+(d.reference?' Référence : '+d.reference:''));$('#pay-message').textContent='Paiement lancé.';}
 catch(e){$('#pay-message').textContent=e.message;}
}));
$('#logout').addEventListener('click',()=>{token='';window.memberData=null;localStorage.removeItem('moro228_token');$('#open-login').textContent='Connexion';setMode('login');$('#auth-message').textContent='Tu es déconnecté.';});
async function loadPredictions(){
 const el=$('#predictions');
 try {
  const r=await fetch('/api/predictions',{headers:token?{Authorization:'Bearer '+token}:{}});
  const d=await r.json();
  if(!r.ok || !d.vip){el.innerHTML='<div class="empty" style="grid-column:1/-1"><span>🔒</span><h3>Pronostics réservés aux membres VIP</h3><p>Pour protéger les analyses, aucun pronostic n’est affiché avant la confirmation de ton abonnement.</p><button class="btn btn-gold" id="unlock-predictions">Activer mon accès VIP</button></div>'; const b=$('#unlock-predictions'); if(b)b.addEventListener('click',()=>openModal(token?'login':'register')); return;}
  if(!d.predictions.length){el.innerHTML='<div class="empty" style="grid-column:1/-1"><span>⚽</span><h3>Aucun pronostic publié pour le moment</h3><p>Les analyses seront ajoutées par l’administrateur. Aucun résultat n’est inventé.</p></div>';return;}
  el.innerHTML=d.predictions.map(p=>`<article class="prediction"><div class="meta">VIP · ${escapeHtml(p.kickoff)}</div><h3>${escapeHtml(p.match_label)}</h3><p>${escapeHtml(p.market)}</p><div class="pick">${escapeHtml(p.pick)}</div><p>${escapeHtml(p.analysis)}</p><div class="stat-row"><span>Confiance estimée</span><b>${p.confidence}%</b></div><p>Résultat : ${escapeHtml(({won:'Gagné',lost:'Perdu',void:'Annulé',pending:'En attente'})[p.result]||'En attente')}</p></article>`).join('');
 } catch {el.innerHTML='<div class="empty" style="grid-column:1/-1"><h3>Connexion au serveur impossible</h3><p>Réessaie dans quelques instants.</p></div>';}
}

(async()=>{if(token){const ok=await loadMember();if(!ok)$('#open-login').textContent='Connexion';}await loadPredictions();})();
