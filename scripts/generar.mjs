// Genera las tarjetas SVG del perfil de GitHub con la identidad de isaacyepez.com.
// Uso:  node scripts/generar.mjs          (datos reales; requiere PERFIL_TOKEN o GITHUB_TOKEN)
//       node scripts/generar.mjs --demo   (datos de ejemplo, sin red)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const opentype = require("opentype.js");

const USUARIO = process.env.USUARIO || "legalmenteisaax";
const SALIDA = process.env.SALIDA || "dist";
const DEMO = process.argv.includes("--demo");

// ---------- Identidad visual (isaacyepez.com) ----------
const C = {
  fondo: "#0b0c0e",
  tarjeta: "#121417",
  tarjeta2: "#1a1d21",
  texto: "#f2f3f5",
  muted: "#8a8f98",
  mutedOscuro: "#5b6068",
  naranja: "#ff5a1f",
  naranja2: "#e84d14",
  niebla: "#d9dce1",
  linea: "rgba(255,255,255,.07)",
  lineaAlta: "rgba(255,255,255,.16)",
};
const SUAVE = "cubic-bezier(.16,1,.3,1)";
const W = 900;

// ---------- Tipografía: Montserrat convertida a trazos ----------
const dirFuentes = path.dirname(require.resolve("@fontsource/montserrat/package.json"));
const fuente = (peso) =>
  opentype.loadSync(path.join(dirFuentes, "files", `montserrat-latin-${peso}-normal.woff`));
const F = { 600: fuente(600), 700: fuente(700), 800: fuente(800) };

function medir(str, tam, peso = 700, tracking = 0) {
  const f = F[peso];
  const esc = tam / f.unitsPerEm;
  const glifos = f.stringToGlyphs(str);
  const items = [];
  let x = 0;
  glifos.forEach((g, i) => {
    items.push({ g, x });
    x += g.advanceWidth * esc;
    if (i < glifos.length - 1) x += f.getKerningValue(g, glifos[i + 1]) * esc + tracking;
  });
  return { items, ancho: x, tam };
}

// Devuelve un <path> con el texto. ancla: start | middle | end
function texto(str, { x = 0, y = 0, tam = 16, peso = 700, color = C.texto, tracking = 0, ancla = "start", extra = "" } = {}) {
  const m = medir(str, tam, peso, tracking);
  const x0 = ancla === "middle" ? x - m.ancho / 2 : ancla === "end" ? x - m.ancho : x;
  const d = m.items.map(({ g, x: gx }) => g.getPath(x0 + gx, y, tam).toPathData(2)).join("");
  return `<path d="${d}" fill="${color}" ${extra}/>`;
}

// Un trazo por glifo (para la animación de escritura)
function glifos(str, { x = 0, y = 0, tam = 16, peso = 700, tracking = 0 } = {}) {
  const m = medir(str, tam, peso, tracking);
  return {
    ancho: m.ancho,
    lista: m.items.map(({ g, x: gx }) => ({
      d: g.getPath(x + gx, y, tam).toPathData(2),
      fin: x + gx + g.advanceWidth * (tam / F[peso].unitsPerEm),
      espacio: g.name === "space" || g.unicode === 32,
    })),
  };
}

const etiqueta = (str, x, y, ancla = "start", color = C.muted) =>
  texto(str.toUpperCase(), { x, y, tam: 12, peso: 700, tracking: 2.6, color, ancla });

// Tarjeta base: fondo, borde, etiquetas superiores y la mancha naranja de la esquina
function tarjeta({ alto, izq, der, contenido, estilo = "", mancha = true }) {
  const id = "c" + Math.random().toString(36).slice(2, 7);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${alto}" viewBox="0 0 ${W} ${alto}" role="img" aria-label="${izq}">
<style>
@keyframes aparecer{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ap{animation:aparecer .9s ${SUAVE} both}
${estilo}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<defs><clipPath id="${id}"><rect x="1" y="1" width="${W - 2}" height="${alto - 2}" rx="22"/></clipPath></defs>
<rect x="1" y="1" width="${W - 2}" height="${alto - 2}" rx="22" fill="${C.tarjeta}" stroke="${C.linea}" stroke-width="1.5"/>
<g clip-path="url(#${id})">
${mancha ? `<circle cx="${W + 10}" cy="${alto + 10}" r="${Math.min(170, alto * 0.55)}" fill="${C.naranja}"/>` : ""}
${etiqueta(izq, 40, 46, "start", C.texto)}
${etiqueta(der, W - 40, 46, "end")}
${contenido}
</g>
</svg>`;
}

const fmt = (n) => n.toLocaleString("es-CO");

// ---------- 1. Encabezado con texto animado ----------
function encabezado() {
  const frases = [
    "daño más computadoras de lo que programo...",
    "automatizo todo lo que se repite dos veces.",
    "webs, bots, paneles y servidores.",
  ];
  const TAM = 30, X = 40, Y = 112;
  const tEscribe = 0.055, tBorra = 0.022, tPausa = 1.8, tEspera = 0.35;
  const datos = frases.map((f) => glifos(f, { x: X, y: Y, tam: TAM, peso: 800 }));
  const dur = datos.reduce((s, d) => s + d.lista.length * (tEscribe + tBorra) + tPausa + tEspera, 0);
  const pct = (t) => ((t / dur) * 100).toFixed(3);

  let css = "", paths = "", caret = [];
  let t = 0, k = 0;
  datos.forEach((d, fi) => {
    const n = d.lista.length;
    const inicioBorrado = t + n * tEscribe + tPausa;
    d.lista.forEach((g, i) => {
      const on = t + (i + 1) * tEscribe;
      const off = inicioBorrado + (n - i) * tBorra;
      const nombre = `g${k++}`;
      css += `@keyframes ${nombre}{0%,${pct(on - 0.001)}%{opacity:0}${pct(on)}%,${pct(off - 0.001)}%{opacity:1}${pct(off)}%,100%{opacity:0}}.${nombre}{animation:${nombre} ${dur.toFixed(2)}s infinite}`;
      // La segunda y tercera frase se tiñen de naranja como en el portafolio
      paths += `<path class="${nombre}" d="${g.d}" fill="${fi === 1 ? C.naranja : C.texto}"/>`;
    });
    caret.push([t, X]);
    d.lista.forEach((g, i) => caret.push([t + (i + 1) * tEscribe, g.fin + 3]));
    d.lista.forEach((g, i) => caret.push([inicioBorrado + (n - i) * tBorra, i === 0 ? X : d.lista[i - 1].fin + 3]));
    t = inicioBorrado + n * tBorra + tEspera;
  });
  const kfCaret = caret.map(([tt, x]) => `${pct(tt)}%{transform:translateX(${(x - X).toFixed(1)}px)}`).join("");
  css += `@keyframes caret{${kfCaret}100%{transform:translateX(0)}}.caret{animation:caret ${dur.toFixed(2)}s infinite steps(1,end)}
@keyframes parpadeo{0%,49%{opacity:1}50%,100%{opacity:0}}.parp{animation:parpadeo .9s infinite}`;

  // Nombre: ¡ blanco, saa naranja, x blanca
  const TN = 118, YN = 262;
  const m1 = medir("¡", TN, 800), m2 = medir("saa", TN, 800);
  const nombre =
    texto("¡", { x: X, y: YN, tam: TN, peso: 800 }) +
    texto("saa", { x: X + m1.ancho, y: YN, tam: TN, peso: 800, color: C.naranja }) +
    texto("x", { x: X + m1.ancho + m2.ancho, y: YN, tam: TN, peso: 800 });

  const contenido = `
<g>${paths}</g>
<g class="caret"><rect class="parp" x="${X}" y="${Y - 25}" width="4" height="31" rx="2" fill="${C.naranja}"/></g>
<g class="ap" style="animation-delay:.15s">${nombre}</g>
<g class="ap" style="animation-delay:.35s">${texto("@" + USUARIO, { x: X + 4, y: YN + 34, tam: 17, peso: 600, color: C.muted })}</g>`;
  return tarjeta({ alto: 330, izq: "¡saax", der: "GitHub", contenido, estilo: css });
}

// ---------- 2. Sobre mí ----------
function sobreMi() {
  const filas = [
    ["Nombre", "Isaac Yepez"],
    ["Base", "Colombia"],
    ["De día", "Calidad en planta de producción 24/7"],
    ["De noche", "Código, servidores y proyectos propios"],
    ["Modo", "Si se repite dos veces, lo automatizo"],
    ["En qué ando", "SyntaaxMC: panel web y plugin en Java para mi servidor"],
  ];
  const Y0 = 98, PASO = 42;
  const contenido = filas
    .map(([k, v], i) => {
      const y = Y0 + i * PASO;
      return `<g class="ap" style="animation-delay:${(0.1 + i * 0.08).toFixed(2)}s">
<circle cx="46" cy="${y - 5}" r="3.5" fill="${C.naranja}"/>
${etiqueta(k, 62, y, "start")}
${texto(v, { x: 236, y: y + 1, tam: 18, peso: 600 })}
${i < filas.length - 1 ? `<line x1="40" x2="${W - 40}" y1="${y + 17}" y2="${y + 17}" stroke="${C.linea}"/>` : ""}
</g>`;
    })
    .join("");
  return tarjeta({ alto: Y0 + filas.length * PASO + 10, izq: "Sobre mí", der: "whoami", contenido, mancha: false });
}

// ---------- 3. Ciudad 3D de contribuciones ----------
function ciudad(datos) {
  const { total, ultimoAnio, rachaActual, rachaMax } = datos;
  // Recorta las semanas vacías del inicio (mínimo 20 semanas visibles) para que la ciudad llene la tarjeta
  const primera = datos.semanas.findIndex((s) => s.some((d) => d.n > 0));
  const desde = primera < 0 ? 0 : Math.max(0, Math.min(primera - 1, datos.semanas.length - 20));
  const semanas = datos.semanas.slice(desde);
  const ALTO = 560;
  const nS = semanas.length;
  const base = { u: { x: 13.6, y: 3.6 }, v: { x: -10.5, y: 8.2 } };
  const anchoBase = nS * base.u.x - 7 * base.v.x;
  const altoBase = nS * base.u.y + 7 * base.v.y;
  let k = Math.min(2.0, (W - 120) / anchoBase);
  const hMax = 58 * Math.min(k, 1.4);
  k = Math.min(k, (300 - hMax) / altoBase);
  const u = { x: base.u.x * k, y: base.u.y * k };   // eje semanas
  const v = { x: base.v.x * k, y: base.v.y * k };   // eje días
  const LLENO = 0.86;
  const maximo = Math.max(1, ...semanas.flat().map((d) => d.n));
  const altura = (n) => (n === 0 ? 2.5 : 5 + hMax * Math.sqrt(n / maximo));

  // centrar la rejilla
  const xs = [], ys = [];
  for (const [a, b] of [[0, 0], [nS, 0], [0, 7], [nS, 7]]) { xs.push(a * u.x + b * v.x); ys.push(a * u.y + b * v.y); }
  const ox = (W - (Math.max(...xs) - Math.min(...xs))) / 2 - Math.min(...xs);
  const oy = ALTO - 72 - Math.max(...ys);
  const P = (a, b) => ({ x: ox + a * u.x + b * v.x, y: oy + a * u.y + b * v.y });

  const rampa = ["#3a1c10", "#7a2f12", "#c44314", "#ff5a1f"];
  const tono = (n) => (n === 0 ? null : rampa[Math.min(3, Math.floor((Math.sqrt(n / maximo)) * 4 - 1e-9))]);
  const oscurecer = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return `rgb(${r},${g},${b})`;
  };
  const pts = (arr) => arr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const celdas = [];
  semanas.forEach((sem, a) => sem.forEach((dia, b) => celdas.push({ a, b, n: dia.n })));
  celdas.sort((p, q) => p.a + p.b - (q.a + q.b) || p.a - q.a);

  let edificios = "";
  const cimas = [];
  for (const { a, b, n } of celdas) {
    const h = altura(n);
    const base = P(a, b);
    const q0 = base, q1 = { x: base.x + u.x * LLENO, y: base.y + u.y * LLENO };
    const q3 = { x: base.x + v.x * LLENO, y: base.y + v.y * LLENO };
    const q2 = { x: q1.x + v.x * LLENO, y: q1.y + v.y * LLENO };
    const arr = (p) => ({ x: p.x, y: p.y - h });
    const col = tono(n);
    const cTop = col || C.tarjeta2;
    const cIzq = col ? oscurecer(col, 0.62) : "#15171a";
    const cDer = col ? oscurecer(col, 0.42) : "#101214";
    const retardo = (0.25 + a * (1.5 / nS) + b * 0.05).toFixed(3);
    edificios += `<g class="ed" style="animation-delay:${retardo}s">` +
      `<polygon points="${pts([q3, q2, arr(q2), arr(q3)])}" fill="${cIzq}"/>` +
      `<polygon points="${pts([q1, q2, arr(q2), arr(q1)])}" fill="${cDer}"/>` +
      `<polygon points="${pts([arr(q0), arr(q1), arr(q2), arr(q3)])}" fill="${cTop}"${n ? "" : ` stroke="${C.linea}" stroke-width=".6"`}/>` +
      `</g>`;
    cimas.push({ a, b, n, x: (q0.x + q2.x) / 2, y: (q0.y + q2.y) / 2 - h });
  }

  // Recorrido del saltador: la cima más alta de cada semana
  const ruta = [];
  for (let a = 0; a < nS; a++) {
    const col = cimas.filter((c) => c.a === a);
    const mejor = col.reduce((m, c) => (c.n > m.n ? c : m), col.find((c) => c.b === 3) || col[0]);
    ruta.push(mejor);
  }
  let d = `M${ruta[0].x.toFixed(1)},${ruta[0].y.toFixed(1)}`;
  for (let i = 1; i < ruta.length; i++) {
    const p = ruta[i - 1], q = ruta[i];
    const cx = (p.x + q.x) / 2, cy = Math.min(p.y, q.y) - 26 - Math.abs(p.y - q.y) * 0.35;
    d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  }
  const INICIO = 2.6, DUR = Math.max(12, ruta.length * 0.6 * 2).toFixed(1);
  // Personaje: cubito naranja con ojos (como el ¡x del logo, en versión bloque)
  const s = 9;
  const cubo = `
<ellipse cx="0" cy="${s * 0.15}" rx="${s * 0.9}" ry="${s * 0.35}" fill="rgba(0,0,0,.35)"/>
<polygon points="0,${-s * 2} ${s},${-s * 1.5} 0,${-s} ${-s},${-s * 1.5}" fill="#ffffff"/>
<polygon points="${-s},${-s * 1.5} 0,${-s} 0,0 ${-s},${-s * 0.5}" fill="${C.niebla}"/>
<polygon points="${s},${-s * 1.5} 0,${-s} 0,0 ${s},${-s * 0.5}" fill="#b9bec6"/>
<circle cx="${-s * 0.62}" cy="${-s * 0.98}" r="1.7" fill="${C.naranja}"/>
<circle cx="${-s * 0.25}" cy="${-s * 0.8}" r="1.7" fill="${C.naranja}"/>`;
  const saltador = `<g opacity="0">
<set attributeName="opacity" to="1" begin="${INICIO}s" fill="freeze"/>
<g>${cubo}</g>
<animateMotion dur="${DUR}s" begin="${INICIO}s" repeatCount="indefinite" calcMode="linear" keyPoints="0;1;0" keyTimes="0;0.5;1" path="${d}"/>
</g>`;

  // Meses en el borde frontal
  const mesesNom = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  let meses = "", ultimoMes = -1;
  semanas.forEach((sem, a) => {
    const f = sem[0].fecha;
    if (!f) return;
    const mes = new Date(f + "T12:00:00Z").getUTCMonth();
    if (mes !== ultimoMes && a > 0 && a < nS - 1) {
      const p = P(a + 0.5, 7.25);
      meses += texto(mesesNom[mes], { x: p.x, y: p.y + 12, tam: 11, peso: 700, color: C.mutedOscuro, ancla: "middle" });
    }
    ultimoMes = mes;
  });

  // Contadores
  const stats = [
    [fmt(total), "Total histórico"],
    [fmt(ultimoAnio), "Último año"],
    [`${rachaActual} ${rachaActual === 1 ? "día" : "días"}`, "Racha actual"],
    [`${rachaMax} ${rachaMax === 1 ? "día" : "días"}`, "Mejor racha"],
  ];
  const colW = (W - 80) / 4;
  const contadores = stats
    .map(([num, lab], i) => {
      const x = 40 + i * colW;
      return `<g class="ap" style="animation-delay:${(0.1 + i * 0.08).toFixed(2)}s">
${texto(num, { x, y: 112, tam: 34, peso: 800, color: i === 0 ? C.naranja : C.texto })}
${etiqueta(lab, x + 1, 138, "start")}
</g>`;
    })
    .join("");

  const estilo = `@keyframes crecer{from{transform:scaleY(0);opacity:.2}to{transform:scaleY(1);opacity:1}}
.ed{transform-box:fill-box;transform-origin:50% 100%;animation:crecer 1.1s ${SUAVE} both}`;
  const contenido = `${contadores}
<line x1="40" x2="${W - 40}" y1="166" y2="166" stroke="${C.linea}"/>
<g>${edificios}</g>
${meses}
${saltador}`;
  return tarjeta({ alto: ALTO, izq: "Actividad", der: "Hasta hoy", contenido, estilo, mancha: false });
}

// ---------- 4. Lenguajes: una dona por lenguaje ----------
function lenguajes(lista) {
  if (!lista.length) {
    const contenido = texto("Analizando repositorios…", { x: W / 2, y: 140, tam: 18, peso: 600, color: C.muted, ancla: "middle" });
    return tarjeta({ alto: 200, izq: "Lenguajes", der: "Más usados", contenido, mancha: false });
  }
  const top = lista.slice(0, 8);
  const porFila = 4, R = 46, TRAZO = 11;
  const filas = Math.max(1, Math.ceil(top.length / porFila));
  const ALTO = 96 + filas * 196;
  const colW = (W - 80) / porFila;
  const L = 2 * Math.PI * R;
  let css = "@keyframes llenar{from{stroke-dashoffset:var(--l)}}";
  const contenido = top
    .map((lang, i) => {
      const fila = Math.floor(i / porFila), col = i % porFila;
      const enFila = Math.min(porFila, top.length - fila * porFila);
      const desplaz = ((porFila - enFila) * colW) / 2;
      const cx = 40 + desplaz + col * colW + colW / 2;
      const cy = 96 + fila * 196 + 62;
      const p = lang.pct;
      const off = (L * (1 - p / 100)).toFixed(2);
      const pctTxt = p >= 10 ? p.toFixed(0) + "%" : p.toFixed(1) + "%";
      return `<g class="ap" style="animation-delay:${(0.1 + i * 0.07).toFixed(2)}s">
<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.tarjeta2}" stroke-width="${TRAZO}"/>
<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${i === 0 ? C.naranja : i < 3 ? "#ff7a45" : "#c44314"}" stroke-width="${TRAZO}" stroke-linecap="round"
 stroke-dasharray="${L.toFixed(2)}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})"
 style="--l:${L.toFixed(2)};animation:llenar 1.4s ${SUAVE} ${(0.3 + i * 0.1).toFixed(2)}s both"/>
${texto(pctTxt, { x: cx, y: cy + 8, tam: 22, peso: 800, ancla: "middle" })}
${texto(lang.nombre, { x: cx, y: cy + R + 38, tam: 15, peso: 700, ancla: "middle" })}
</g>`;
    })
    .join("");
  return tarjeta({ alto: ALTO, izq: "Lenguajes", der: "Más usados", contenido, estilo: css, mancha: false });
}

// ---------- Datos ----------
// Prueba primero con PERFIL_TOKEN (incluye privados) y, si falla, con el GITHUB_TOKEN de Actions
const TOKENS = [process.env.PERFIL_TOKEN, process.env.GITHUB_TOKEN].filter(Boolean);
async function gh(url, opciones = {}) {
  let ultimoError;
  for (const token of TOKENS) {
    const r = await fetch(url.startsWith("http") ? url : `https://api.github.com${url}`, {
      ...opciones,
      headers: { Authorization: `bearer ${token}`, "User-Agent": "perfil", Accept: "application/vnd.github+json", ...(opciones.headers || {}) },
    });
    if (r.ok) return r.json();
    ultimoError = new Error(`GitHub ${r.status} en ${url.split("?")[0]}`);
  }
  throw ultimoError || new Error("Falta PERFIL_TOKEN o GITHUB_TOKEN");
}
const gql = async (query, variables) => {
  const r = await gh("/graphql", { method: "POST", body: JSON.stringify({ query, variables }) });
  if (r.errors) throw new Error(r.errors.map((e) => e.message).join("; "));
  return r.data;
};

function rachas(dias, hoyISO) {
  const orden = dias.filter((d) => d.fecha <= hoyISO).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  let max = 0, run = 0;
  for (const d of orden) { run = d.n > 0 ? run + 1 : 0; max = Math.max(max, run); }
  let i = orden.length - 1;
  if (i >= 0 && orden[i].n === 0) i--; // hoy aún sin contribuciones no rompe la racha
  let actual = 0;
  for (; i >= 0 && orden[i].n > 0; i--) actual++;
  return { rachaActual: actual, rachaMax: max };
}

async function datosReales() {
  const Q = `query($u:String!,$desde:DateTime,$hasta:DateTime){user(login:$u){contributionsCollection(from:$desde,to:$hasta){contributionYears contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  const ultimo = (await gql(Q, { u: USUARIO })).user.contributionsCollection;
  const semanas = ultimo.contributionCalendar.weeks.map((w) => {
    const dias = w.contributionDays.map((d) => ({ fecha: d.date, n: d.contributionCount }));
    while (dias.length < 7) dias.push({ fecha: null, n: 0 });
    return dias;
  });
  let total = 0, todos = [];
  for (const anio of ultimo.contributionYears) {
    const c = (await gql(Q, { u: USUARIO, desde: `${anio}-01-01T00:00:00Z`, hasta: `${anio}-12-31T23:59:59Z` })).user.contributionsCollection.contributionCalendar;
    total += c.totalContributions;
    c.weeks.forEach((w) => w.contributionDays.forEach((d) => todos.push({ fecha: d.date, n: d.contributionCount })));
  }
  const hoy = new Date().toISOString().slice(0, 10);

  // Lenguajes: con PERFIL_TOKEN incluye repos privados (solo se publican totales, nunca nombres)
  const privado = Boolean(process.env.PERFIL_TOKEN);
  let repos = [], pagina = 1;
  while (true) {
    const url = privado
      ? `/user/repos?per_page=100&visibility=all&affiliation=owner,collaborator&page=${pagina}`
      : `/users/${USUARIO}/repos?per_page=100&type=owner&page=${pagina}`;
    const lote = await gh(url);
    repos.push(...lote);
    if (lote.length < 100) break;
    pagina++;
  }
  console.log(`Repos visibles: ${repos.length} (privados: ${repos.filter((r) => r.private).length}, forks: ${repos.filter((r) => r.fork).length}).`);
  repos = repos.filter((r) => !r.fork && r.name !== USUARIO && r.owner?.login === USUARIO);
  const bytes = {};
  for (const r of repos) {
    const l = await gh(`/repos/${r.full_name}/languages`);
    for (const [k, b] of Object.entries(l)) bytes[k] = (bytes[k] || 0) + b;
  }
  const suma = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(bytes).map(([nombre, b]) => ({ nombre, pct: (b / suma) * 100 })).sort((a, b) => b.pct - a.pct);

  console.log(`Contribuciones: ${total} totales, ${ultimo.contributionCalendar.totalContributions} último año. Repos analizados: ${repos.length}. Privados incluidos: ${privado ? "sí" : "no"}.`);
  return { semanas, total, ultimoAnio: ultimo.contributionCalendar.totalContributions, ...rachas(todos, hoy), langs };
}

function datosDemo() {
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const hoy = new Date();
  const semanas = [];
  for (let a = 0; a < 53; a++) {
    const sem = [];
    for (let b = 0; b < 7; b++) {
      const f = new Date(hoy.getTime() - ((52 - a) * 7 + (6 - b)) * 864e5).toISOString().slice(0, 10);
      const activo = azar() < 0.25 + (a / 53) * 0.55;
      sem.push({ fecha: f, n: activo ? Math.floor(azar() ** 2 * 18 * (0.3 + a / 53)) + 1 : 0 });
    }
    semanas.push(sem);
  }
  const ultimoAnio = semanas.flat().reduce((s, d) => s + d.n, 0);
  return {
    semanas, total: ultimoAnio + 214, ultimoAnio, rachaActual: 9, rachaMax: 23,
    langs: [
      { nombre: "JavaScript", pct: 38.4 }, { nombre: "PHP", pct: 21.7 }, { nombre: "HTML", pct: 14.2 }, { nombre: "Java", pct: 9.6 },
      { nombre: "CSS", pct: 8.1 }, { nombre: "Python", pct: 4.3 }, { nombre: "PowerShell", pct: 2.4 }, { nombre: "Shell", pct: 1.3 },
    ],
  };
}

// ---------- Salida ----------
const datos = DEMO ? datosDemo() : await datosReales();
fs.mkdirSync(SALIDA, { recursive: true });
const archivos = {
  "encabezado.svg": encabezado(),
  "sobre-mi.svg": sobreMi(),
  "actividad.svg": ciudad(datos),
  "lenguajes.svg": lenguajes(datos.langs),
};
for (const [n, svg] of Object.entries(archivos)) fs.writeFileSync(path.join(SALIDA, n), svg);
console.log("Listo:", Object.keys(archivos).join(", "));
