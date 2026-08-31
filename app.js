const DB_NAME="prospectaDB"; const DB_VERSION=1;
let db; let currentSearchResults=[]; let activeWhatsappLead=null;

const defaultServices=[
  {id:"svc_paid",name:"Tráfego pago",description:"Gestão de campanhas em Google Ads e Meta Ads, com acompanhamento e otimização.",price:"R$ 550 a R$ 1.100/mês + investimento em anúncios"},
  {id:"svc_organic",name:"Tráfego orgânico / Google",description:"Otimização da presença no Google, informações, palavras-chave, fotos e posicionamento local.",price:"R$ 550 a R$ 1.100"},
  {id:"svc_site",name:"Criação de site",description:"Site institucional, catálogo, landing page ou página de contato para empresas.",price:"Incluído em pacotes ou sob orçamento"},
  {id:"svc_social",name:"Social Media",description:"Criação de posts, vídeos, Reels, TikTok, Kwai e peças para redes sociais.",price:"Semanal: R$ 600 | Mensal: R$ 1.800"},
  {id:"svc_design",name:"Design gráfico",description:"Cardápios, PDFs, apresentações, artes promocionais e materiais digitais.",price:"Sob orçamento"},
  {id:"svc_video",name:"Edição de vídeos",description:"Edição de vídeos comerciais, anúncios, Reels e vídeos curtos.",price:"Sob orçamento"}
];

const defaultMessages=[
 {id:"msg_site",name:"Empresa sem site",text:"Olá! Tudo bem? Encontrei a {empresa} pelo Google e percebi uma oportunidade de melhorar a presença digital de vocês. Trabalho com criação de site, otimização do Google e estratégias para atrair novos clientes. Posso te mostrar rapidamente algumas ideias para a empresa?"},
 {id:"msg_google",name:"Google / presença local",text:"Olá! Tudo bem? Analisei rapidamente a presença da {empresa} no Google e encontrei alguns pontos que podem ajudar vocês a aparecer melhor nas pesquisas locais e gerar mais contatos. Trabalho justamente com esse tipo de otimização. Posso te explicar em poucos minutos?"},
 {id:"msg_social",name:"Conteúdo e redes sociais",text:"Olá! Tudo bem? Conheci a {empresa} e vi potencial para fortalecer a comunicação nas redes sociais. Trabalho com design, posts, vídeos e edição de conteúdo para empresas. Posso te mostrar algumas ideias que combinariam com o negócio de vocês?"},
 {id:"msg_full",name:"Pacote completo",text:"Olá! Tudo bem? Encontrei a {empresa} e fiz uma análise rápida da presença digital. Trabalho com um pacote que reúne site, Google, tráfego pago, conteúdo e design para ajudar empresas locais a gerar mais oportunidades. Posso te mostrar como eu aplicaria isso na empresa de vocês?"}
];

function openDB(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{const d=req.result;
    if(!d.objectStoreNames.contains("leads")) d.createObjectStore("leads",{keyPath:"id"});
    if(!d.objectStoreNames.contains("services")) d.createObjectStore("services",{keyPath:"id"});
    if(!d.objectStoreNames.contains("messages")) d.createObjectStore("messages",{keyPath:"id"});
    if(!d.objectStoreNames.contains("settings")) d.createObjectStore("settings",{keyPath:"key"});
  };
  req.onsuccess=()=>{db=req.result;resolve(db)}; req.onerror=()=>reject(req.error);
 });
}
function store(name,mode="readonly"){return db.transaction(name,mode).objectStore(name)}
function getAll(name){return new Promise((res,rej)=>{const r=store(name).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function getOne(name,key){return new Promise((res,rej)=>{const r=store(name).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function put(name,val){return new Promise((res,rej)=>{const r=store(name,"readwrite").put(val);r.onsuccess=()=>res(val);r.onerror=()=>rej(r.error)})}
function del(name,key){return new Promise((res,rej)=>{const r=store(name,"readwrite").delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function clearStore(name){return new Promise((res,rej)=>{const r=store(name,"readwrite").clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function uid(prefix="id"){return prefix+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function digits(s=""){return s.replace(/\D/g,"")}
function fmtDate(v){if(!v)return "-";return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(v))}
function mapsUrl(place){return place.googleMapsUri || (place.id?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text||"")}&query_place_id=${encodeURIComponent(place.id)}`:"")}

function opportunityFrom(lead){
 let score=0;
 if(!lead.website) score+=35;
 if(!lead.instagram) score+=10;
 if(!lead.phone) score-=20; else score+=10;
 const rating=parseFloat(lead.rating||0);
 if(rating>=4 && rating>0) score+=10;
 if((lead.userRatingCount||0)>=20) score+=10;
 if(!lead.recommendedService) score+=5;
 if(score>=55)return {level:"high",score:Math.min(score,100),label:"🔥 Alta"};
 if(score>=30)return {level:"medium",score:Math.min(score,100),label:"🟡 Média"};
 return {level:"low",score:Math.max(score,0),label:"⚪ Baixa"};
}
function recommend(lead){
 const rec=[];
 if(!lead.website)rec.push("Criação de site");
 if(!lead.instagram)rec.push("Social Media / Design");
 if((parseFloat(lead.rating)||0)<4 || !lead.rating)rec.push("Tráfego orgânico / Google");
 if(rec.length===0)rec.push("Tráfego pago");
 return rec.slice(0,3).join(" + ");
}

async function seed(){
 const sv=await getAll("services"); if(!sv.length) for(const s of defaultServices) await put("services",s);
 const ms=await getAll("messages"); if(!ms.length) for(const m of defaultMessages) await put("messages",m);
}

const views={
 dashboard:["Dashboard","Visão geral da sua prospecção comercial."],
 prospect:["Prospectar","Encontre e qualifique empresas com potencial."],
 leads:["Leads","Acompanhe histórico, status e oportunidades."],
 services:["Serviços","Organize o que você vende."],
 messages:["Abordagens","Edite seus modelos de mensagem."],
 settings:["Configurações","API, memória, backup e restauração."]
};
async function navigate(view){
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
 document.getElementById(view+"View").classList.add("active");
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 document.getElementById("pageTitle").textContent=views[view][0];
 document.getElementById("pageSubtitle").textContent=views[view][1];
 if(view==="dashboard")await renderDashboard();
 if(view==="leads")await renderLeads();
 if(view==="services")await renderServices();
 if(view==="messages")await renderMessages();
 if(view==="settings")await loadSettings();
}

async function renderDashboard(){
 const leads=await getAll("leads");
 const count=s=>leads.filter(l=>l.status===s).length;
 const metrics=[
  ["Empresas",leads.length],["Contatadas",count("Contatado")+count("Respondeu")+count("Interessado")+count("Proposta enviada")+count("Fechado")],
  ["Interessadas",count("Interessado")+count("Proposta enviada")+count("Fechado")],["Clientes",count("Fechado")]
 ];
 document.getElementById("metrics").innerHTML=metrics.map(x=>`<div class="metric"><div class="value">${x[1]}</div><div class="label">${x[0]}</div></div>`).join("");
 const stages=["Novo","Contatado","Respondeu","Interessado","Proposta enviada","Fechado"];
 const max=Math.max(1,...stages.map(count));
 document.getElementById("funnel").innerHTML=stages.map(s=>`<div class="funnel-row"><span>${s}</span><div class="funnel-bar"><div class="funnel-fill" style="width:${count(s)/max*100}%"></div></div><strong>${count(s)}</strong></div>`).join("");
 const sorted=[...leads].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
 document.getElementById("recentLeads").innerHTML=sorted.length?tableHtml(sorted.slice(0,5),false):'<div class="empty">Nenhum lead cadastrado ainda.</div>';
 const actions=sorted.filter(l=>["Interessado","Respondeu","Proposta enviada"].includes(l.status)).slice(0,5);
 document.getElementById("nextActions").innerHTML=actions.length?actions.map(l=>`<div class="message-item"><strong>${esc(l.name)}</strong><div class="muted">${esc(l.status)} • ${esc(l.recommendedService||recommend(l))}</div></div>`).join(""):'Nenhuma ação pendente. Quando houver respostas ou propostas, elas aparecem aqui.';
}

function resultCard(p){
 const lead={name:p.displayName?.text||"",website:p.websiteUri||"",phone:p.nationalPhoneNumber||p.internationalPhoneNumber||"",rating:p.rating||"",userRatingCount:p.userRatingCount||0,instagram:"",mapsUrl:mapsUrl(p),niche:document.getElementById("searchNiche").value,city:document.getElementById("searchCity").value};
 const op=opportunityFrom(lead); const rec=recommend(lead);
 return `<div class="lead-card">
  <h3>${esc(lead.name)}</h3>
  <div class="lead-meta">${esc(p.formattedAddress||"")}<br>⭐ ${p.rating||"-"} ${p.userRatingCount?`(${p.userRatingCount})`:""} • 📞 ${esc(lead.phone||"Não informado")}<br>🌐 ${lead.website?"Possui site":"Sem site encontrado"}</div>
  <div class="tags"><span class="tag ${op.level}">${op.label} • ${op.score}/100</span><span class="tag">${esc(rec)}</span></div>
  <div class="lead-actions">
   <button class="btn primary" data-add-place="${esc(p.id||lead.name)}">Adicionar aos leads</button>
   ${lead.mapsUrl?`<button class="btn secondary" data-open-url="${esc(lead.mapsUrl)}">Google Maps</button>`:""}
  </div></div>`;
}

async function searchPlaces(){
 const key=(await getOne("settings","googleApiKey"))?.value;
 const niche=document.getElementById("searchNiche").value.trim(), city=document.getElementById("searchCity").value.trim();
 const limit=parseInt(document.getElementById("searchLimit").value);
 const status=document.getElementById("searchStatus");
 if(!niche||!city){showNotice("Informe o nicho e a cidade.",true);return}
 if(!key){showNotice("Cadastre sua chave do Google Places em Configurações. Você também pode usar “Abrir no Google Maps” e cadastrar manualmente.",true);return}
 status.classList.remove("hidden","error"); status.textContent="Buscando empresas...";
 try{
  const res=await fetch("https://places.googleapis.com/v1/places:searchText",{
   method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":key,
   "X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri"},
   body:JSON.stringify({textQuery:`${niche} em ${city}`,pageSize:Math.min(limit,20),languageCode:"pt-BR",regionCode:"BR"})
  });
  const data=await res.json(); if(!res.ok)throw new Error(data.error?.message||"Falha na API");
  currentSearchResults=data.places||[];
  document.getElementById("resultsCount").textContent=`${currentSearchResults.length} empresas`;
  document.getElementById("searchResults").innerHTML=currentSearchResults.length?currentSearchResults.map(resultCard).join(""):'<div class="empty">Nenhuma empresa encontrada.</div>';
  status.classList.add("hidden");
 }catch(e){showNotice("Não foi possível consultar a API: "+e.message+" Se estiver abrindo o arquivo diretamente, tente executar a plataforma por um servidor local.",true)}
}
function showNotice(msg,error=false){const el=document.getElementById("searchStatus");el.textContent=msg;el.classList.remove("hidden");el.classList.toggle("error",error)}
async function addPlace(ref){
 const p=currentSearchResults.find(x=>(x.id||x.displayName?.text)===ref); if(!p)return;
 const name=p.displayName?.text||"Empresa";
 const duplicate=(await getAll("leads")).find(l=>(l.placeId&&l.placeId===p.id)||l.name.toLowerCase()===name.toLowerCase());
 if(duplicate){alert("Essa empresa já está salva nos seus leads.");return}
 const lead={id:uid("lead"),placeId:p.id||"",name,niche:document.getElementById("searchNiche").value.trim(),city:document.getElementById("searchCity").value.trim(),phone:p.nationalPhoneNumber||p.internationalPhoneNumber||"",website:p.websiteUri||"",mapsUrl:mapsUrl(p),instagram:"",rating:p.rating||"",userRatingCount:p.userRatingCount||0,status:"Novo",notes:"",createdAt:Date.now(),updatedAt:Date.now()};
 lead.recommendedService=recommend(lead); const op=opportunityFrom(lead);lead.opportunity=op.level;lead.score=op.score;
 await put("leads",lead); alert("Empresa adicionada aos leads.");
}

function tableHtml(leads,withActions=true){
 if(!leads.length)return '<div class="empty">Nenhum lead encontrado.</div>';
 return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Empresa</th><th>Nicho</th><th>Status</th><th>Oportunidade</th><th>Serviço</th><th>Última atualização</th>${withActions?"<th>Ações</th>":""}</tr></thead><tbody>
 ${leads.map(l=>{const op=l.opportunity?{level:l.opportunity,label:l.opportunity==="high"?"🔥 Alta":l.opportunity==="medium"?"🟡 Média":"⚪ Baixa"}:opportunityFrom(l);
 return `<tr><td><strong>${esc(l.name)}</strong><br><span class="muted">${esc(l.city||"")}</span></td><td>${esc(l.niche||"-")}</td><td><span class="status-pill">${esc(l.status||"Novo")}</span></td><td><span class="tag ${op.level}">${op.label} ${l.score!=null?`• ${l.score}/100`:""}</span></td><td>${esc(l.recommendedService||recommend(l))}</td><td>${fmtDate(l.updatedAt||l.createdAt)}</td>${withActions?`<td><button class="link-btn" data-edit="${l.id}">Editar</button> <button class="link-btn" data-msg="${l.id}">WhatsApp</button> <button class="link-btn" data-delete="${l.id}">Excluir</button></td>`:""}</tr>`}).join("")}
 </tbody></table></div>`;
}

async function renderLeads(){
 let leads=await getAll("leads"); const q=document.getElementById("leadSearch").value.toLowerCase().trim(), st=document.getElementById("leadStatusFilter").value, sc=document.getElementById("leadScoreFilter").value;
 if(q)leads=leads.filter(l=>[l.name,l.city,l.niche].join(" ").toLowerCase().includes(q));
 if(st)leads=leads.filter(l=>l.status===st); if(sc)leads=leads.filter(l=>l.opportunity===sc);
 leads.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
 document.getElementById("leadsTable").innerHTML=tableHtml(leads,true);
}

async function openLeadDialog(id=null){
 document.getElementById("leadForm").reset(); document.getElementById("leadId").value="";
 document.getElementById("leadDialogTitle").textContent=id?"Editar empresa":"Adicionar empresa";
 if(id){const l=await getOne("leads",id); if(!l)return;
  for(const [field,val] of Object.entries({leadId:l.id,leadName:l.name,leadNiche:l.niche,leadCity:l.city,leadPhone:l.phone,leadWebsite:l.website,leadMapsUrl:l.mapsUrl,leadInstagram:l.instagram,leadRating:l.rating,leadStatus:l.status,leadRecommended:l.recommendedService,leadNotes:l.notes})){const el=document.getElementById(field);if(el)el.value=val||""}
  document.getElementById("leadOpportunity").value=l.opportunity||"auto";
 }
 document.getElementById("leadDialog").showModal();
}
async function saveLead(){
 const existingId=document.getElementById("leadId").value, old=existingId?await getOne("leads",existingId):null;
 const l={...(old||{}),id:existingId||uid("lead"),name:document.getElementById("leadName").value.trim(),niche:document.getElementById("leadNiche").value.trim(),city:document.getElementById("leadCity").value.trim(),phone:document.getElementById("leadPhone").value.trim(),website:document.getElementById("leadWebsite").value.trim(),mapsUrl:document.getElementById("leadMapsUrl").value.trim(),instagram:document.getElementById("leadInstagram").value.trim(),rating:document.getElementById("leadRating").value,status:document.getElementById("leadStatus").value,recommendedService:document.getElementById("leadRecommended").value.trim(),notes:document.getElementById("leadNotes").value.trim(),createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()};
 if(!l.name){alert("Informe o nome da empresa.");return}
 if(!l.recommendedService)l.recommendedService=recommend(l);
 const choice=document.getElementById("leadOpportunity").value;
 if(choice==="auto"){const op=opportunityFrom(l);l.opportunity=op.level;l.score=op.score}else{l.opportunity=choice;l.score=choice==="high"?80:choice==="medium"?50:20}
 await put("leads",l); document.getElementById("leadDialog").close(); await renderLeads(); await renderDashboard();
}
async function deleteLead(id){if(confirm("Excluir este lead?")){await del("leads",id);await renderLeads();await renderDashboard()}}

async function generateMessage(id){
 const lead=await getOne("leads",id); if(!lead)return; activeWhatsappLead=lead;
 const msgs=await getAll("messages");
 let m;
 if(!lead.website)m=msgs.find(x=>x.id==="msg_site"); else if(!lead.instagram)m=msgs.find(x=>x.id==="msg_social"); else m=msgs.find(x=>x.id==="msg_full")||msgs[0];
 document.getElementById("generatedMessage").value=(m?.text||"Olá! Tudo bem?").replaceAll("{empresa}",lead.name);
 document.getElementById("messageDialog").showModal();
}
async function openWhatsapp(){
 if(!activeWhatsappLead)return; const msg=document.getElementById("generatedMessage").value, phone=digits(activeWhatsappLead.phone);
 if(!phone){alert("Este lead não possui telefone cadastrado.");return}
 activeWhatsappLead.status=activeWhatsappLead.status==="Novo"?"Contatado":activeWhatsappLead.status; activeWhatsappLead.updatedAt=Date.now(); await put("leads",activeWhatsappLead);
 window.open(`https://wa.me/${phone.startsWith("55")?phone:"55"+phone}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
 document.getElementById("messageDialog").close(); await renderLeads(); await renderDashboard();
}

async function renderServices(){
 const sv=await getAll("services");
 document.getElementById("servicesList").innerHTML=sv.map(s=>`<div class="service-card"><h3>${esc(s.name)}</h3><p>${esc(s.description||"")}</p><strong>${esc(s.price||"")}</strong></div>`).join("");
}
async function saveService(){
 const s={id:uid("svc"),name:document.getElementById("serviceName").value.trim(),description:document.getElementById("serviceDescription").value.trim(),price:document.getElementById("servicePrice").value.trim()};
 if(!s.name){alert("Informe o nome.");return} await put("services",s);document.getElementById("serviceDialog").close();await renderServices();
}
async function renderMessages(){
 const ms=await getAll("messages");
 document.getElementById("messagesList").innerHTML=ms.map(m=>`<div class="message-item"><strong>${esc(m.name)}</strong><textarea rows="4" data-message-id="${m.id}">${esc(m.text)}</textarea><button class="btn secondary" data-save-message="${m.id}">Salvar modelo</button></div>`).join("");
}
async function saveMessage(id,btn){const m=await getOne("messages",id); const ta=document.querySelector(`textarea[data-message-id="${id}"]`);m.text=ta.value;await put("messages",m);btn.textContent="Salvo ✓";setTimeout(()=>btn.textContent="Salvar modelo",1200)}

async function loadSettings(){const k=await getOne("settings","googleApiKey");document.getElementById("googleApiKey").value=k?.value||""}
async function exportBackup(){
 const data={version:1,exportedAt:new Date().toISOString(),leads:await getAll("leads"),services:await getAll("services"),messages:await getAll("messages")};
 download("prospecta-backup-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(data,null,2),"application/json");
}
function download(name,content,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function restoreBackup(file){
 const data=JSON.parse(await file.text()); if(!Array.isArray(data.leads))throw new Error("Backup inválido");
 for(const s of ["leads","services","messages"])await clearStore(s);
 for(const l of data.leads||[])await put("leads",l); for(const x of data.services||[])await put("services",x); for(const x of data.messages||[])await put("messages",x);
 await renderDashboard(); alert("Backup restaurado.");
}
async function exportCSV(){
 const leads=await getAll("leads"); const cols=["Empresa","Nicho","Cidade","Telefone","Site","Google Maps","Instagram","Avaliação","Status","Oportunidade","Score","Serviço recomendado","Observações"];
 const rows=leads.map(l=>[l.name,l.niche,l.city,l.phone,l.website,l.mapsUrl,l.instagram,l.rating,l.status,l.opportunity,l.score,l.recommendedService,l.notes]);
 const csv=[cols,...rows].map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");
 download("prospecta-leads.csv","\ufeff"+csv,"text/csv;charset=utf-8");
}

document.addEventListener("click",async e=>{
 const nav=e.target.closest("[data-view]"); if(nav)return navigate(nav.dataset.view);
 const go=e.target.closest("[data-go]"); if(go)return navigate(go.dataset.go);
 const add=e.target.closest("[data-add-place]"); if(add)return addPlace(add.dataset.addPlace);
 const url=e.target.closest("[data-open-url]"); if(url)return window.open(url.dataset.openUrl,"_blank","noopener");
 const edit=e.target.closest("[data-edit]"); if(edit)return openLeadDialog(edit.dataset.edit);
 const msg=e.target.closest("[data-msg]"); if(msg)return generateMessage(msg.dataset.msg);
 const dl=e.target.closest("[data-delete]"); if(dl)return deleteLead(dl.dataset.delete);
 const sm=e.target.closest("[data-save-message]"); if(sm)return saveMessage(sm.dataset.saveMessage,sm);
});
document.getElementById("quickAddBtn").onclick=()=>openLeadDialog();
document.getElementById("saveLeadBtn").onclick=saveLead;
document.getElementById("searchPlacesBtn").onclick=searchPlaces;
document.getElementById("openMapsBtn").onclick=()=>{const n=document.getElementById("searchNiche").value.trim(),c=document.getElementById("searchCity").value.trim(); if(!n||!c)return alert("Informe nicho e cidade.");window.open(`https://www.google.com/maps/search/${encodeURIComponent(n+" em "+c)}`,"_blank","noopener")};
document.getElementById("leadSearch").oninput=renderLeads;document.getElementById("leadStatusFilter").onchange=renderLeads;document.getElementById("leadScoreFilter").onchange=renderLeads;
document.getElementById("addServiceBtn").onclick=()=>{document.getElementById("serviceName").value="";document.getElementById("serviceDescription").value="";document.getElementById("servicePrice").value="";document.getElementById("serviceDialog").showModal()};
document.getElementById("saveServiceBtn").onclick=saveService;
document.getElementById("saveApiKeyBtn").onclick=async()=>{await put("settings",{key:"googleApiKey",value:document.getElementById("googleApiKey").value.trim()});alert("Chave salva neste navegador.")};
document.getElementById("toggleApiKeyBtn").onclick=()=>{const i=document.getElementById("googleApiKey");i.type=i.type==="password"?"text":"password"};
document.getElementById("backupBtn").onclick=exportBackup;
document.getElementById("restoreInput").onchange=async e=>{try{await restoreBackup(e.target.files[0])}catch(err){alert("Erro ao restaurar: "+err.message)}};
document.getElementById("clearDataBtn").onclick=async()=>{if(confirm("Isso apagará leads, serviços e mensagens salvos neste navegador. Continuar?")){for(const s of ["leads","services","messages"])await clearStore(s);await seed();await renderDashboard();alert("Dados apagados.")}};
document.getElementById("exportCsvBtn").onclick=exportCSV;
document.getElementById("copyMessageBtn").onclick=async()=>{await navigator.clipboard.writeText(document.getElementById("generatedMessage").value);document.getElementById("copyMessageBtn").textContent="Copiado ✓";setTimeout(()=>document.getElementById("copyMessageBtn").textContent="Copiar mensagem",1000)};
document.getElementById("openWhatsappBtn").onclick=openWhatsapp;

(async()=>{await openDB();await seed();await renderDashboard()})().catch(err=>{console.error(err);alert("Erro ao iniciar a plataforma: "+err.message)});
