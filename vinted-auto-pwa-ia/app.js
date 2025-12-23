// vinted auto - PWA (démo + mode IA via backend)
// Objectif : montrer le flux iPhone → photos → annonce prête à copier/coller (titre en minuscules + hashtags).

const $ = (id) => document.getElementById(id);

const state = {
  photos: []
};

// --- Réglages backend (localStorage) ---
const LS_API_URL = "va_api_url";
const LS_USE_AI = "va_use_ai";
const LS_WANT_MANNEQUIN = "va_want_mannequin";

function getApiUrl() {
  return (localStorage.getItem(LS_API_URL) || "").trim().replace(/\/$/, "");
}
function setApiUrl(v) {
  localStorage.setItem(LS_API_URL, (v||"").trim());
}
function getBool(key, def=false){
  const v = localStorage.getItem(key);
  if(v === null) return def;
  return v === "1";
}
function setBool(key, val){
  localStorage.setItem(key, val ? "1" : "0");
}

function setStatus(msg, isOk=null){
  const el = $("apiStatus");
  if(!el) return;
  el.textContent = msg || "";
  if(isOk === true) el.style.color = "#0a7a2f";
  else if(isOk === false) el.style.color = "#b42318";
  else el.style.color = "";
}

async function testApi(){
  const url = getApiUrl();
  if(!url) return setStatus("Colle d’abord l’URL de l’API.", false);
  setStatus("Test en cours…");
  try{
    const r = await fetch(url + "/health", { method:"GET" });
    if(!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json().catch(()=>({}));
    setStatus("✅ API OK" + (j.model ? ` (model: ${j.model})` : ""), true);
  }catch(e){
    setStatus("❌ API inaccessible (vérifie l’URL et le HTTPS).", false);
  }
}

function setLoading(on){
  const btn = $("generate");
  if(!btn) return;
  btn.disabled = !!on;
  btn.textContent = on ? "analyse en cours…" : "générer l’annonce";
}

function showMannequin(dataUrl){
  const wrap = $("mannequinWrap");
  const img = $("mannequinImg");
  const dl = $("downloadMannequin");
  if(!wrap || !img || !dl) return;
  if(!dataUrl){
    wrap.classList.add("hidden");
    return;
  }
  img.src = dataUrl;
  dl.href = dataUrl;
  wrap.classList.remove("hidden");
}



function formatTitle({brand, category, color, size}) {
  const parts = [category, brand, color, `taille ${size}`]
    .map(s => (s||"").trim())
    .filter(Boolean);
  return parts.join(" · ").toLowerCase();
}

function suggestHashtags({brand, category, color, size, material}) {
  const raw = [
    brand, category, color, size, material,
    "vinted", "seconde main", "homme", "femme", "vintage"
  ]
  .map(s => (s||"").toString().trim().toLowerCase())
  .filter(Boolean);

  // normalize to hashtag-friendly tokens
  const tokens = [];
  for (const r of raw) {
    r.split(/\s+|\/+|,|\.|·|\(|\)|\-|_+/).forEach(t => {
      const clean = t.replace(/[^a-z0-9àâäçéèêëîïôöùûüÿœæ]/gi, "");
      if (clean.length >= 3) tokens.push(clean);
    });
  }
  // dedupe while preserving order
  const seen = new Set();
  const uniq = tokens.filter(t => !seen.has(t) && seen.add(t));

  // limit
  return uniq.slice(0, 18).map(t => `#${t}`).join(" ");
}

function suggestPrice({brand, category, condition}) {
  // ultra simple "à la louche" juste pour la démo
  const b = (brand||"").toLowerCase();
  let base = 15;
  if (/(lacoste|ralph|polo|stone|carhartt|sandro|cos)/.test(b)) base = 25;
  if (/(stone)/.test(b)) base = 45;
  if (/(veste|doudoune|manteau)/.test((category||"").toLowerCase())) base += 10;

  const cond = (condition||"").toLowerCase();
  if (cond.includes("très bon")) base += 5;
  if (cond.includes("correct")) base -= 5;
  if (cond.includes("fortement")) base -= 10;

  // keep reasonable
  base = Math.max(5, Math.min(120, base));
  return `${base} € (démo)`;
}

function buildDescription(fields) {
  const {brand, category, size, color, material, condition, defects, photoCount} = fields;

  const lines = [];
  lines.push(`📌 ${capitalize(category)} ${brand ? " " + brand.toUpperCase() : ""}`.trim());
  lines.push(`• taille : ${size || "à préciser"}`);
  lines.push(`• couleur : ${color || "à préciser"}`);
  if (material) lines.push(`• matière : ${material}`);
  lines.push(`• état : ${condition || "à préciser"}`);
  lines.push(`• photos : ${photoCount} (détails visibles)`);
  if (defects && defects.trim().length) {
    lines.push("");
    lines.push("⚠️ défauts / remarques :");
    lines.push(defects.trim());
  }
  lines.push("");
  lines.push("✅ envoi rapide & soigné · maison non-fumeur (si applicable)");
  lines.push("💬 n’hésite pas si tu veux des mesures exactes (épaules, poitrine, longueur, manches).");

  const tags = suggestHashtags(fields);
  lines.push("");
  lines.push(tags);

  return lines.join("\n");
}

function capitalize(s){
  s = (s||"").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderThumbs() {
  const thumbs = $("thumbs");
  thumbs.innerHTML = "";
  state.photos.forEach((file) => {
    const div = document.createElement("div");
    div.className = "thumb";
    const img = document.createElement("img");
    img.alt = "photo";
    img.src = URL.createObjectURL(file);
    div.appendChild(img);
    thumbs.appendChild(div);
  });
  $("count").textContent = state.photos.length ? `${state.photos.length} photo(s) sélectionnée(s).` : "";
}

function installTip() {
  alert("Sur iPhone : Safari → bouton Partager → “Sur l’écran d’accueil”.\n\nImportant : l’app doit être hébergée en HTTPS (pas un fichier local).");
}

async function copyAll() {
  const title = $("outTitle").value || "";
  const desc = $("outDesc").value || "";
  const price = $("outPrice").value || "";
  const txt = `${title}\n\n${desc}\n\nPrix suggéré : ${price}`.trim();
  try{
    await navigator.clipboard.writeText(txt);
    $("copyAll").textContent = "copié ✅";
    setTimeout(()=>{ $("copyAll").textContent = "copier"; }, 1200);
  }catch(e){
    // fallback
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    $("copyAll").textContent = "copié ✅";
    setTimeout(()=>{ $("copyAll").textContent = "copier"; }, 1200);
  }
}

async function generate() {
  const fields = {
    brand: $("brand").value,
    category: $("category").value,
    size: $("size").value,
    color: $("color").value,
    material: $("material").value,
    condition: $("condition").value,
    defects: $("defects").value,
    photoCount: state.photos.length
  };

  // Mode IA (backend)
  const useAI = $("useAI") ? $("useAI").checked : false;
  const wantMannequin = $("wantMannequin") ? $("wantMannequin").checked : false;
  const apiUrl = getApiUrl();

  if (useAI && apiUrl && state.photos.length > 0) {
    try {
      setLoading(true);
      setStatus("Analyse IA en cours…");

      const fd = new FormData();
      state.photos.slice(0, 16).forEach((file) => fd.append("images", file, file.name));
      fd.append("hints", JSON.stringify(fields));
      fd.append("wantMannequin", wantMannequin ? "1" : "0");

      const resp = await fetch(apiUrl + "/v1/process", { method: "POST", body: fd });
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const data = await resp.json();

      // Remplir les sorties
      $("outTitle").value = (data?.listing?.title || formatTitle(fields)).toLowerCase();
      $("outDesc").value = (data?.listing?.description || buildDescription(fields));
      $("outPrice").value = data?.listing?.suggested_price_eur
        ? `${data.listing.suggested_price_eur} €`
        : suggestPrice(fields);

      const notes = [];
      if (data?.analysis?.brand_guess) notes.push(`marque détectée: ${data.analysis.brand_guess}`);
      if (Array.isArray(data?.analysis?.defects_detected) && data.analysis.defects_detected.length)
        notes.push(`défauts détectés: ${data.analysis.defects_detected.join(", ")}`);
      if (data?.listing?.price_range_eur?.min && data?.listing?.price_range_eur?.max)
        notes.push(`fourchette: ${data.listing.price_range_eur.min}–${data.listing.price_range_eur.max} €`);
      $("aiNotes").textContent = notes.length ? "IA: " + notes.join(" · ") : "";

      showMannequin(data?.mannequin_data_url || null);
      setStatus("✅ Terminé", true);
      $("copyAll").disabled = false;
    } catch (e) {
      console.error(e);
      setStatus("❌ Erreur IA, je repasse en mode démo.", false);
      // fallback démo
      $("outTitle").value = formatTitle(fields);
      $("outDesc").value = buildDescription(fields);
      $("outPrice").value = suggestPrice(fields);
      $("aiNotes").textContent = "";
      showMannequin(null);
      $("copyAll").disabled = false;
    } finally {
      setLoading(false);
    }
    return;
  }

  // Mode démo (sans IA)
  $("outTitle").value = formatTitle(fields);
  $("outDesc").value = buildDescription(fields);
  $("outPrice").value = suggestPrice(fields);
  $("aiNotes").textContent = "";
  showMannequin(null);

  $("copyAll").disabled = false;
}


// Events

// --- bind settings UI ---
window.addEventListener("load", () => {
  if ($("apiUrl")) {
    $("apiUrl").value = getApiUrl();
    $("apiUrl").addEventListener("change", (e) => setApiUrl(e.target.value));
  }
  if ($("useAI")) {
    $("useAI").checked = getBool(LS_USE_AI, false);
    $("useAI").addEventListener("change", (e) => setBool(LS_USE_AI, e.target.checked));
  }
  if ($("wantMannequin")) {
    $("wantMannequin").checked = getBool(LS_WANT_MANNEQUIN, false);
    $("wantMannequin").addEventListener("change", (e) => setBool(LS_WANT_MANNEQUIN, e.target.checked));
  }
  if ($("testApi")) $("testApi").addEventListener("click", testApi);
});

$("photos").addEventListener("change", (e) => {
  state.photos = Array.from(e.target.files || []);
  renderThumbs();
});
$("clearPhotos").addEventListener("click", () => {
  state.photos = [];
  $("photos").value = "";
  renderThumbs();
  $("copyAll").disabled = true;
});
$("generate").addEventListener("click", generate);
$("copyAll").addEventListener("click", copyAll);
$("installTip").addEventListener("click", installTip);

// Service worker (offline)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  });
}
