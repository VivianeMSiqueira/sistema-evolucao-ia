import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
let recommendedSource = "current"; // ou "edx"
let recommendedTask = { group: null, index: null };
const supabaseUrl = 'https://hjzjogkuffbrutcyvnfs.supabase.co'
const supabaseKey = 'sb_publishable_kwtsN8W5EoBTJCskzPfwvQ_QN6-Y2wV'

const supabase = createClient(supabaseUrl, supabaseKey)
const STORAGE_KEY = "ia_rpg_pwa_v1";
const USER_ID_KEY = "ia_rpg_user_id";

function getOrCreateUserId() {
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}
const mem = window.__IA_RPG_PWA_MEM__ || (window.__IA_RPG_PWA_MEM__ = {});
const DATA = {
  quickLinks: [
    ["CS50x", "https://cs50.harvard.edu/x/"],
    ["CS50 AI", "https://cs50.harvard.edu/ai/"],
    ["CS221", "https://www.youtube.com/results?search_query=CS221+Stanford"],
    ["CS229", "https://www.youtube.com/results?search_query=CS229+Andrew+Ng"],
    ["CS230", "https://www.youtube.com/results?search_query=CS230+Deep+Learning+Andrew+Ng"],
    ["Udemy GenAI", "https://www.udemy.com/course/formacao-engenheiro-de-ia-generativa-ia-na-pratica/"]
  ],
  base: [
    [
      "IA vs ML vs Deep Learning",
      {
        current: "https://cs50.harvard.edu/ai/",
        edx: "https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python",
        focus: "Entender a diferença entre IA, ML e DL. NÃO aprofundar em código."
      }
    ],
    [
      "Vetores, matrizes e gradiente",
      {
        current: "https://www.khanacademy.org/math/linear-algebra",
        edx: null,
        focus: "Entender vetores e operações básicas. NÃO entrar em matemática pesada."
      }
    ],
    [
      "Loss, overfitting e generalização",
      {
        current: "https://www.youtube.com/results?search_query=overfitting+machine+learning+explained",
        edx: null,
        focus: "Entender o conceito de erro e overfitting. NÃO tentar dominar ML inteiro."
      }
    ],
    [
      "Treinar 1 modelo simples",
      {
        current: "https://www.youtube.com/results?search_query=scikit+learn+classification+tutorial+beginner",
        edx: null,
        focus: "Treinar algo simples funcionando. NÃO otimizar ou complicar."
      }
    ]
  ],
  gen: [
    ["Transformers em alto nível", "https://www.youtube.com/results?search_query=transformers+explained"],
    ["Embeddings", "https://www.youtube.com/results?search_query=embeddings+AI"],
    ["Mini app com IA", "https://platform.openai.com/docs"],
    ["Testar e documentar", "https://www.youtube.com/results?search_query=software+testing+basics"]
  ],
  projects: [
    ["Mini classificador", "https://www.youtube.com/results?search_query=iris+dataset+classification+python"],
    ["Buscador semântico", "https://www.youtube.com/results?search_query=semantic+search+embeddings+tutorial"],
    ["Chat utilitário", "https://www.youtube.com/results?search_query=chatbot+app+llm+tutorial"]
  ]
};
async function testConnection() {
  const { data, error } = await supabase.from('progress').select('*')

  if (error) {
    console.log("Erro:", error)
  } else {
    console.log("Conectado 🎉", data)
  }
}

testConnection()

async function saveToCloud(state) {
  const user = await getUser();

  if (!user) {
    console.log("Usuário não logado ainda");
    return;
  }

  const userId = user.id;

  const payload = {
    user_id: userId,
    base_state: state.base,
    gen_state: state.gen,
    projects_state: state.projects,
    xp: state.xp,
    notes: state.notes,
    timeline: state.timeline,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('progress')
    .upsert(payload);

  if (error) {
    console.log("Erro ao salvar:", error);
  } else {
    console.log("Salvo na nuvem ☁️", data);
  }
}

async function loadFromCloud() {
  const user = await getUser();

  if (!user) {
    console.log("Usuário não logado ainda");
    return null;
  }

  const userId = user.id;

  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.log("Nada na nuvem ainda ou erro ao carregar:", error);
    return null;
  }

  console.log("Carregado da nuvem ☁️", data);
  return data;
}
async function login(email) {
  setAuthLoading(true);
  setAuthMessage("Enviando link mágico... ✨");

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: "https://vivianemsiqueira.github.io/sistema-evolucao-ia/"
    }
  });

  setAuthLoading(false);

  if (error) {
    console.error("Erro completo:", error);

    setAuthMessage(
      "Erro: " +
      (error.message || JSON.stringify(error))
    );

    return { ok: false, error };
  } else {
    console.log("Link mágico enviado ✨");
    setAuthMessage("Link enviado! Verifique seu email ✨");
    return { ok: true };
  }
}
async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

window.login = login;
window.getUser = getUser;

async function logout() {
  setAuthLoading(true);

  const { error } = await supabase.auth.signOut();

  setAuthLoading(false);

  if (error) {
    console.log("Erro ao sair:", error);
    setAuthMessage("Erro ao sair. Tente novamente.");
  } else {
    console.log("Saiu 👋");
    setAuthMessage("Você saiu da conta.");
    refreshAuthUI();
  }
}

async function refreshAuthUI() {
  const user = await getUser();

  const authStatus = document.getElementById("authStatus");
  const authMessage = document.getElementById("authMessage");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const emailInput = document.getElementById("emailInput");
  const accountHeader = document.getElementById("accountHeader");
  const avatarCircle = document.getElementById("avatarCircle");
  const accountName = document.getElementById("accountName");

  if (user) {
    if (authStatus) authStatus.textContent = user.email;
    if (authMessage) authMessage.textContent = "Sessão ativa 😏";
    if (accountHeader) accountHeader.style.display = "flex";
    if (avatarCircle) avatarCircle.textContent = getInitialFromEmail(user.email);
    if (accountName) accountName.textContent = "Conta conectada";

    if (loginBtn) loginBtn.style.display = "none";
    if (emailInput) emailInput.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    if (authStatus) authStatus.textContent = "Não logada";
    if (authMessage) authMessage.textContent = "Não logada";
    if (accountHeader) accountHeader.style.display = "none";
    if (avatarCircle) avatarCircle.textContent = "?";
    if (accountName) accountName.textContent = "Conta";

    if (loginBtn) loginBtn.style.display = "inline-block";
    if (emailInput) emailInput.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

function initAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const emailInput = document.getElementById("emailInput");

  if (loginBtn && emailInput) {
    loginBtn.onclick = async () => {
      const currentUser = await getUser();

      if (currentUser) {
        setAuthMessage("Você já está logada como " + currentUser.email + " 😏");
        refreshAuthUI();
        return;
      }

      const email = emailInput.value.trim();

      if (!email) {
        setAuthMessage("Digite seu e-mail primeiro 😏");
        return;
      }

      await login(email);
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await logout();
    };
  }

  refreshAuthUI();
}

function storageAvailable() {
  try { const k = "__t"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; }
  catch (e) { return false; }
}
function loadState() {
  try {
    if (storageAvailable()) return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return mem[STORAGE_KEY] || {};
  } catch (e) { return mem[STORAGE_KEY] || {}; }
}
function saveState(s) {
  try {
    if (storageAvailable()) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else mem[STORAGE_KEY] = s;
  } catch (e) { mem[STORAGE_KEY] = s; }
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00"); const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}
function ensureState() {
  const s = loadState();
  if (!s.base) s.base = Array(DATA.base.length).fill(false);
  if (!s.gen) s.gen = Array(DATA.gen.length).fill(false);
  if (!s.projects) s.projects = Array(DATA.projects.length).fill(false);
  if (typeof s.xp !== "number") s.xp = 0;
  if (!s.notes) s.notes = "";
  if (!s.timeline) s.timeline = [];
  if (!s.lastActivity) s.lastActivity = null;
  if (typeof s.returnCount !== "number") s.returnCount = 0;
  if (typeof s.softDayCount !== "number") s.softDayCount = 0;
  return s;
}
function saveAndRefresh(s) {
  saveState(s);
  saveToCloud(s);
  refreshAll();
}
function addTimeline(text) {
  const s = ensureState();
  s.timeline.unshift({ date: new Date().toLocaleString("pt-BR"), text });
  s.timeline = s.timeline.slice(0, 12);
  s.lastActivity = todayStr();
  saveState(s);
}
function toggleItem(group, i, checked, label) {
  const s = ensureState();
  s[group][i] = checked;
  if (checked) {
    s.xp += (group === "projects" ? 20 : 10);
    addTimeline("Concluiu: " + label);
  } else {
    addTimeline("Desmarcou: " + label + " (sem perda de XP)");
  }
  saveAndRefresh(s);
}
function comebackBonus(kind) {
  const s = ensureState();
  const bonus = kind === "soft" ? 5 : 15;
  s.xp += bonus;
  if (kind === "soft") s.softDayCount += 1; else s.returnCount += 1;
  addTimeline(kind === "soft" ? "Dia difícil: mesmo assim voltou" : "Retorno heróico ao sistema");
  saveAndRefresh(s);
}
function pct(arr) { return arr.length ? Math.round(arr.filter(Boolean).length * 100 / arr.length) : 0; }
function compute() {
  const s = ensureState();
  const base = pct(s.base), gen = pct(s.gen), proj = pct(s.projects);
  const totalItems = s.base.length + s.gen.length + s.projects.length;
  const totalDone = s.base.filter(Boolean).length + s.gen.filter(Boolean).length + s.projects.filter(Boolean).length;
  const global = totalItems ? Math.round(100 * totalDone / totalItems) : 0;
  const level = Math.floor(s.xp / 50) + 1;
  const nextPct = (s.xp % 50) * 2;
  return { base, gen, proj, global, level, nextPct, xp: s.xp };
}
function renderQuickLinks() {
  const box = document.getElementById("quickLinks");
  box.innerHTML = "";
  DATA.quickLinks.forEach(([label, url]) => {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = label;
    box.appendChild(a);
  });
}
function renderChecklist(dataKey, elId) {
  const s = ensureState();
  const box = document.getElementById(elId);
  box.innerHTML = "";

  DATA[dataKey].forEach((item, i) => {
    const [label, rawLinks] = item;
    const links = typeof rawLinks === "string"
      ? { current: rawLinks, edx: null }
      : rawLinks;

    const row = document.createElement("div");
    const isRecommended =
      recommendedTask.group === dataKey &&
      recommendedTask.index === i;

    row.className = "quest" + (isRecommended ? " recommended" : "");

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = !!s[dataKey][i];
    chk.onchange = () => toggleItem(dataKey, i, chk.checked, label);

    const text = document.createElement("div");
    text.innerHTML = `
      <div>${label}</div>
      <div class="small">
        <a class="btn ${recommendedSource === 'current' ? 'recommended' : 'secondary'}"
           href="${links.current}" target="_blank" rel="noopener">
           ${getLabelForLink(links.current)}
        </a>
        ${links.edx ? `
          <a class="btn ${recommendedSource === 'edx' ? 'recommended' : 'secondary'}"
             href="${links.edx}" target="_blank" rel="noopener">
             🎓 Ver no edX
          </a>
        ` : ""}
      </div>
      ${links.focus ? `
        <div class="focus-box">
          🎯 ${links.focus}
        </div>
      `: ""}
    `;

    row.appendChild(chk);
    row.appendChild(text);
    box.appendChild(row);
  });
}
function renderDashboard() {
  const c = compute();
  document.getElementById("levelText").textContent = c.level;
  document.getElementById("xpText").textContent = c.xp;
  document.getElementById("xpBar").style.width = c.nextPct + "%";
  document.getElementById("globalBar").style.width = c.global + "%";
  document.getElementById("buildText").textContent = c.global < 30 ? "🌱" : c.global < 60 ? "⚙️" : c.global < 85 ? "🚀" : "👑";
  const line = document.getElementById("dashboardLine");
  if (c.global < 30) line.textContent = "Ainda no início, mas já com uma build promissora.";
  else if (c.global < 60) line.textContent = "Agora você já consegue causar dano real em problemas pequenos.";
  else if (c.global < 85) line.textContent = "Sua build está perigosa. Continue antes que Stanford te note.";
  else line.textContent = "Você já está em território de gente que constrói coisa séria.";
}

function getLabelForLink(url) {
  if (!url) return "📚 Abrir conteúdo";

  if (url.includes("khanacademy")) return "📐 Estudar no Khan";
  if (url.includes("youtube")) return "▶️ Ver explicação";
  if (url.includes("cs50")) return "🧠 Abrir CS50";
  if (url.includes("edx")) return "🎓 Abrir no edX";

  return "📚 Abrir conteúdo";
}
function renderMentor() {
  const s = ensureState();
  const c = compute();

  const mentorTitle = document.getElementById("mentorTitle");
  const mentorText = document.getElementById("mentorText");
  const box = document.getElementById("mentorBox");

  let gap = s.lastActivity ? daysBetween(s.lastActivity, todayStr()) : 0;

  let title = "";
  let text = "";
  let source = "";
  let good = false;

  recommendedSource = "current"; // padrão seguro a cada render
  recommendedTask = { group: null, index: null };

  if (gap >= 5) {
    title = "💜 Reentrada estratégica";
    text = "Volta suave. Nada de heroísmo hoje.";
    source = "📚 Use conteúdo leve (YouTube / atual)";
    recommendedSource = "current";
  } else if (c.base < 50) {
    title = "🧱 Fundamentos pedindo socorro";
    text = "Sua base ainda precisa de estrutura sólida.";
    source = "🎓 Vá de edX (aprendizado mais guiado)";
    recommendedSource = "edx";

    recommendedTask = {
      group: "base",
      index: findNextTask("base")
    };
  } else if (c.gen < 50) {
    title = "🤖 Hora de ganhar velocidade";
    text = "Agora você precisa praticar mais do que teorizar.";
    source = "📚 Use conteúdo direto e prático";
    recommendedSource = "current";

    recommendedTask = {
      group: "gen",
      index: findNextTask("gen")
    };
  } else if (c.proj < 34) {
    title = "🛠 Chega de teoria, constrói";
    text = "Sem projeto você não evolui de verdade.";
    source = "📚 Prática direta (sem edX agora)";
    good = true;
    recommendedSource = "current";

    recommendedTask = {
      group: "projects",
      index: findNextTask("projects")
    };
  } else if (c.global >= 85) {
    title = "👑 Modo especialista desbloqueado";
    text = "Agora você aguenta conteúdo pesado.";
    source = "🧠 Stanford / conteúdo avançado";
    good = true;
    recommendedSource = "current";

    recommendedTask = {
      group: "global",
      index: findNextTask("global")
    };
  } else {
    title = "⚙️ Consolidação inteligente";
    text = "Misture teoria e prática com estratégia.";
    source = "🎓 edX + 📚 prática";
    recommendedSource = "edx";
  }

  function findNextTask(groupKey) {
    const s = ensureState();
    const arr = s[groupKey];
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]) return i;
    }
    return null;
  }
  mentorTitle.textContent = title;
  mentorText.innerHTML = text + "<br><br><strong>" + source + "</strong>";
  box.className = "alert" + (good ? " good" : "");
}

function setAuthMessage(message) {
  const status = document.getElementById("authMessage");
  if (status) status.textContent = message;
}

function setAuthLoading(isLoading) {
  const emailInput = document.getElementById("emailInput");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (emailInput) emailInput.disabled = isLoading;
  if (loginBtn) loginBtn.disabled = isLoading;
  if (logoutBtn) logoutBtn.disabled = isLoading;
}

function getInitialFromEmail(email) {
  if (!email) return "?";
  return email.trim().charAt(0).toUpperCase();
}

function buildPlan() {
  const s = ensureState(), c = compute();
  const gap = s.lastActivity ? daysBetween(s.lastActivity, todayStr()) : 0;
  let mission = "", bullets = [];
  if (gap >= 5) {
    mission = "Missão de retorno suave";
    bullets = ["Marcar 1 tarefa leve da Base ou clicar no botão “Voltei hoje”", "Assistir 1 vídeo curto", "Anotar 1 dúvida que ficou presa"];
  } else if (c.base < 50) {
    mission = "Missão: fortalecer a Base";
    bullets = ["Fechar 1 item da Base hoje", "Abrir 1 conteúdo recomendado", "Explicar o conceito em voz alta"];
  } else if (c.gen < 50) {
    mission = "Missão: entrar em IA Generativa";
    bullets = ["Abrir o conteúdo de transformers ou embeddings", "Concluir 1 item de IA Generativa", "Anotar 1 uso prático que te empolgue"];
  } else if (c.proj < 34) {
    mission = "Missão: projeto real";
    bullets = ["Escolher 1 projeto", "Definir entrada, saída e critério de sucesso", "Fazer a versão mais simples possível"];
  } else {
    mission = "Missão: evolução profissional";
    bullets = ["Melhorar um projeto existente", "Documentar decisões e limitações", "Preparar algo apresentável"];
  }
  document.getElementById("nextMission").textContent = mission;
  document.getElementById("weekPlan").innerHTML = bullets.map((b, i) => '<div class="quest"><span class="badge">Passo ' + (i + 1) + '</span><div>' + b + '</div></div>').join("");
}
function renderPatterns() {
  const s = ensureState();
  const gap = s.lastActivity ? daysBetween(s.lastActivity, todayStr()) : null;
  document.getElementById("lastSeenBadge").textContent = "Última atividade: " + (s.lastActivity || "—");
  document.getElementById("returnRateBadge").textContent = "Taxa de retorno: " + s.returnCount;
  document.getElementById("consistencyBadge").textContent = "Dias difíceis honrados: " + s.softDayCount;
  let insight = "";
  if (gap === null) insight = "Você ainda não registrou atividade.";
  else if (gap >= 7) insight = "Seu padrão indica pausas longas. Solução: missões curtas de retorno.";
  else if (s.returnCount >= 3) insight = "Você já provou que sabe voltar. Isso vale muito.";
  else insight = "Seu padrão está relativamente estável.";
  document.getElementById("patternInsight").textContent = insight;
}
function renderTimeline() {
  const box = document.getElementById("timeline"), s = ensureState();
  box.innerHTML = "";
  if (!s.timeline.length) { box.innerHTML = '<div class="muted">Sem eventos ainda.</div>'; return; }
  s.timeline.forEach(item => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = '<div style="font-weight:700">' + item.text + '</div><div class="muted small">' + item.date + '</div>';
    box.appendChild(div);
  });
}
function initNotes() {
  const s = ensureState(), notes = document.getElementById("notes");
  notes.value = s.notes || "";
  notes.oninput = () => { const st = ensureState(); st.notes = notes.value; saveState(st); };
}
function exportState() {
  const blob = new Blob([JSON.stringify(ensureState(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "ia_rpg_pwa_v1_backup.json"; a.click();
}
function importState(evt) {
  const file = evt.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try { saveState(JSON.parse(e.target.result)); refreshAll(); alert("Importação concluída."); }
    catch (err) { alert("JSON inválido."); }
  };
  reader.readAsText(file);
}
function resetAll() {
  if (!confirm("Resetar tudo?")) return;
  if (storageAvailable()) localStorage.removeItem(STORAGE_KEY);
  mem[STORAGE_KEY] = {}; refreshAll();
}
function refreshAll() {
  renderQuickLinks();
  renderDashboard();
  renderMentor();
  renderChecklist("base", "baseBox");
  renderChecklist("gen", "genBox");
  renderChecklist("projects", "projBox");
  buildPlan();
  renderPatterns();
  renderTimeline();
  initNotes();
}
document.getElementById("returnBtn").onclick = () => comebackBonus("return");
document.getElementById("softDayBtn").onclick = () => comebackBonus("soft");
refreshAll();
initAuthUI();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => { }));

  supabase.auth.onAuthStateChange((_event, _session) => {
    refreshAuthUI();
  });
}
