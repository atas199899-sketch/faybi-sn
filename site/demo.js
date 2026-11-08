const KEY = 'facturesn.freelance.v1';
const TVA = 0.18;
const EUR_XOF = 655.957; // parité fixe du franc CFA avec l'euro
const METHODS = ['Wave', 'Orange Money', 'Free Money', 'Virement', 'Espèces', 'Chèque'];
const CATS = ['Logiciels et abonnements', 'Matériel', 'Internet et téléphone', 'Coworking', 'Transport', 'Formation', 'Sous-traitance', 'Publicité', 'Autre'];
const ACCOUNT = {'Wave': 'Wave', 'Orange Money': 'Orange Money', 'Free Money': 'Free Money', 'Virement': 'Banque', 'Chèque': 'Banque', 'Espèces': 'Espèces'};

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf = new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 0});
const nf2 = new Intl.NumberFormat('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const num = n => nf.format(Math.round(n || 0));
const money = n => num(n) + ' FCFA';
const isEur = d => d.cur === 'EUR';
const rnd = (d, n) => isEur(d) ? Math.round(n * 100) / 100 : Math.round(n);
const amt = (d, n) => isEur(d) ? nf2.format(n || 0) + ' €' : money(n);            // montant dans la devise du document
const amtShort = (d, n) => isEur(d) ? nf2.format(n || 0) + ' €' : num(n);          // pour les tableaux en FCFA
const toXOF = (d, n) => isEur(d) ? Math.round(n * EUR_XOF) : n;
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = iso => iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'}) : '—';
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5);
const parseNum = v => parseFloat(String(v).replace(/[\s  ]/g, '').replace(',', '.')) || 0;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Montant en lettres (« Arrêtée la présente facture à la somme de… ») ---------- */
const U = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const D = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
function under100(n, final) {
  if (n < 20) return U[n];
  const t = Math.floor(n / 10), u = n % 10;
  if (t === 7) return n === 71 ? 'soixante et onze' : 'soixante-' + U[n - 60];
  if (t === 9) return 'quatre-vingt-' + U[n - 80];
  if (t === 8) return u === 0 ? (final ? 'quatre-vingts' : 'quatre-vingt') : 'quatre-vingt-' + U[u];
  if (u === 0) return D[t];
  return D[t] + (u === 1 ? ' et un' : '-' + U[u]);
}
function under1000(n, final) {
  const h = Math.floor(n / 100), r = n % 100;
  let s = '';
  if (h) s = h === 1 ? 'cent' : U[h] + ' cent' + (r === 0 && final ? 's' : '');
  if (r) s += (s ? ' ' : '') + under100(r, final);
  return s;
}
function enLettres(n) {
  if (n === 0) return 'zéro';
  const mrd = Math.floor(n / 1e9), mio = Math.floor(n / 1e6) % 1000, k = Math.floor(n / 1000) % 1000, r = n % 1000, p = [];
  if (mrd) p.push(under1000(mrd, true) + ' milliard' + (mrd > 1 ? 's' : ''));
  if (mio) p.push(under1000(mio, true) + ' million' + (mio > 1 ? 's' : ''));
  if (k) p.push(k === 1 ? 'mille' : under1000(k, false) + ' mille');
  if (r) p.push(under1000(r, true));
  return p.join(' ');
}
function sommeEnLettres(n, cur) {
  const ent = Math.floor(n + 1e-9), cts = Math.round((n - ent) * 100);
  const round = ent >= 1e6 && ent % 1e6 === 0; // « un million de francs », « deux millions d’euros »
  let s = enLettres(ent);
  if (cur === 'EUR') {
    s += round ? ' d’euros' : ent > 1 ? ' euros' : ' euro';
    if (cts) s += ' et ' + enLettres(cts) + (cts > 1 ? ' centimes' : ' centime');
  } else s += round ? ' de francs CFA' : ent > 1 ? ' francs CFA' : ' franc CFA';
  return cap(s);
}

/* ---------- Données ---------- */
function seed() {
  const T = today(), d = n => addDays(T, n), L = (desc, qty, price) => ({desc, qty, price});
  const clients = [
    {id: 'c1', name: 'Boulangerie Le Fournil de Mermoz', contact: 'Awa Diop', phone: '+221 77 555 12 34', email: 'awa.diop@exemple.sn', address: 'Mermoz, Dakar', ninea: ''},
    {id: 'c2', name: 'Cabinet Ndiaye & Associés', contact: 'Moussa Ndiaye', phone: '+221 78 222 33 44', email: 'm.ndiaye@exemple.sn', address: 'Avenue Pompidou, Plateau, Dakar', ninea: '006789012 1A2'},
    {id: 'c3', name: 'Hôtel Saly Plage', contact: 'Fatou Sarr', phone: '+221 76 410 20 30', email: 'direction@exemple.sn', address: 'Saly Portudal, Mbour', ninea: '003456789 2B3'},
    {id: 'c4', name: 'Studio Lumière', contact: 'Claire Martin', phone: '+33 6 12 34 56 78', email: 'claire@exemple.fr', address: 'Lyon, France', ninea: ''}
  ];
  const docs = [
    {type: 'FAC', clientId: 'c3', date: d(-130), due: d(-100), lines: [L('Reportage photo de l’hôtel (chambres, restaurant, plage)', 1, 400000)], pay: [[d(-104), null, 'Virement']]},
    {type: 'FAC', clientId: 'c1', date: d(-100), due: d(-70), lines: [L('Création du logo et de la charte graphique', 1, 300000)], pay: [[d(-80), null, 'Wave']]},
    {type: 'FAC', clientId: 'c2', date: d(-78), due: d(-45), deposit: 50, lines: [L('Site web vitrine (5 pages)', 1, 850000), L('Hébergement et nom de domaine (1 an)', 1, 120000)], pay: [[d(-76), 485000, 'Wave'], [d(-48), 485000, 'Virement']]},
    {type: 'FAC', clientId: 'c4', cur: 'EUR', date: d(-50), due: d(-20), lines: [L('Maquettes d’application mobile (écrans)', 12, 120)], pay: [[d(-24), null, 'Virement']]},
    {type: 'FAC', clientId: 'c1', date: d(-40), due: d(-10), lines: [L('Gestion des réseaux sociaux (1 mois)', 1, 150000), L('Shooting photo des produits', 1, 90000)], pay: [[d(-20), 100000, 'Wave']]},
    {type: 'FAC', clientId: 'c3', date: d(-20), due: d(25), deposit: 50, lines: [L('Application de réservation en ligne', 1, 2500000)], pay: [[d(-18), 1250000, 'Wave']]},
    {type: 'FAC', clientId: 'c4', cur: 'EUR', date: d(-15), due: d(15), lines: [L('Illustrations pour campagne Instagram', 6, 90)], pay: []},
    {type: 'FAC', clientId: 'c2', date: d(-8), due: d(22), lines: [L('Maintenance mensuelle du site', 1, 75000)], pay: [[d(0), null, 'Orange Money']]},
    {type: 'DEV', clientId: 'c2', date: d(-3), due: d(27), deposit: 50, discount: 5, lines: [L('Refonte de l’intranet', 1, 950000), L('Rédaction de contenus (pages)', 10, 15000)], pay: []}
  ].sort((a, b) => a.date.localeCompare(b.date));
  const E = (n, desc, supplier, category, amount, method) => ({id: uid(), date: d(n), desc, supplier, category, amount, method, tva: false, photo: ''});
  const C = (name, unit, price) => ({id: uid(), name, unit, price});
  const state = {
    demo: true,
    company: {name: 'Khady Sy', job: 'Designer graphique et développeuse web', address: 'Liberté 6, Dakar', phone: '+221 77 123 45 67', email: 'khady.sy@exemple.sn',
      ninea: '', tvaOn: false, goal: 1500000, mentions: 'Paiement à réception par Wave ou Orange Money. Acompte non remboursable une fois le projet démarré.'},
    clients, docs: [],
    expenses: [
      E(-60, 'Abonnement logiciels de design', 'Adobe', 'Logiciels et abonnements', 35000, 'Wave'),
      E(-30, 'Abonnement logiciels de design', 'Adobe', 'Logiciels et abonnements', 35000, 'Wave'),
      E(-58, 'Abonnement coworking (1 mois)', 'Espace de coworking', 'Coworking', 60000, 'Wave'),
      E(-28, 'Abonnement coworking (1 mois)', 'Espace de coworking', 'Coworking', 60000, 'Wave'),
      E(-22, 'Abonnement fibre', 'Orange', 'Internet et téléphone', 29900, 'Orange Money'),
      E(-40, 'Développement back-end (sous-traitance)', 'Moussa Sow, freelance', 'Sous-traitance', 200000, 'Wave'),
      E(-20, 'Cours en ligne de design UX', 'Plateforme de formation', 'Formation', 25000, 'Wave'),
      E(-12, 'Taxis pour rendez-vous clients', '', 'Transport', 18000, 'Espèces'),
      E(-6, 'Disque dur externe 2 To', 'Informatique Plus', 'Matériel', 70800, 'Wave'),
      E(0, 'Forfait internet mobile', 'Orange', 'Internet et téléphone', 5000, 'Orange Money')
    ],
    catalog: [
      C('Création du logo et de la charte graphique', 'forfait', 300000), C('Site web vitrine (5 pages)', 'forfait', 850000),
      C('Maintenance mensuelle du site', 'mois', 75000), C('Gestion des réseaux sociaux (1 mois)', 'mois', 150000),
      C('Shooting photo des produits', 'séance', 90000), C('Journée de développement', 'jour', 120000)
    ]
  };
  for (const x of docs) {
    const doc = {id: uid(), type: x.type, num: '', clientId: x.clientId, cur: x.cur || 'XOF', date: x.date, due: x.due, tva: false,
      discount: x.discount || 0, deposit: x.deposit || 0, lines: x.lines, notes: '', payments: []};
    doc.num = nextNum(doc.type, doc.date, state.docs);
    const ttc = totals(doc).ttc;
    doc.payments = x.pay.map(([date, amount, method]) => ({date, amount: amount ?? ttc, method}));
    state.docs.push(doc);
  }
  return state;
}
function blank() {
  return {demo: false, company: {name: '', job: '', address: '', phone: '', email: '', ninea: '', tvaOn: false, goal: 0, mentions: ''}, clients: [], docs: [], expenses: [], catalog: []};
}
function load() { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }

let S = load() || seed();
const ui = {view: 'dash', id: null, filter: 'all', q: '', draft: null, err: '', pay: false, relance: false, confirm: null, clientDraft: null, expDraft: null, catDraft: null, back: null};

/* ---------- Calculs ---------- */
function totals(d) {
  const brut = rnd(d, d.lines.reduce((a, l) => a + (+l.qty || 0) * (+l.price || 0), 0));
  const remise = rnd(d, brut * (+d.discount || 0) / 100), ht = rnd(d, brut - remise);
  const tva = d.tva ? rnd(d, ht * TVA) : 0, ttc = rnd(d, ht + tva);
  const paid = rnd(d, (d.payments || []).reduce((a, p) => a + p.amount, 0));
  const deposit = rnd(d, ttc * (+d.deposit || 0) / 100);
  return {brut, remise, ht, tva, ttc, paid, deposit, reste: Math.max(0, rnd(d, ttc - paid))};
}
function nextNum(type, date, docs = S.docs) {
  const y = date.slice(0, 4), pre = `${type}-${y}-`;
  const n = docs.filter(d => d.num.startsWith(pre)).reduce((m, d) => Math.max(m, +d.num.slice(pre.length) || 0), 0) + 1;
  return pre + String(n).padStart(4, '0');
}
function st(d) {
  if (d.type === 'DEV') return d.convertedTo ? 'converti' : 'devis';
  const t = totals(d);
  if (t.reste <= 0) return 'payee';
  if (d.due && d.due < today()) return 'retard';
  if (t.paid > 0) return d.deposit && t.paid >= t.deposit ? 'acompte' : 'partielle';
  return 'attente';
}
const ST = {payee: ['Payée', 'good'], retard: ['En retard', 'bad'], acompte: ['Acompte reçu', 'info'], partielle: ['Partiellement payée', 'warn'],
  attente: ['En attente', 'neutral'], devis: ['Devis', 'info'], converti: ['Devis accepté', 'muted']};
const pill = s => `<span class="pill ${ST[s][1]}">${ST[s][0]}</span>`;
const client = id => S.clients.find(c => c.id === id);
const cName = id => client(id)?.name || 'Client supprimé';
const facs = () => S.docs.filter(d => d.type === 'FAC');
const expTva = e => S.company.tvaOn && e.tva ? Math.round(e.amount - e.amount / (1 + TVA)) : 0;
function monthTax(key) {
  const coll = facs().filter(d => d.date.slice(0, 7) === key).reduce((a, d) => a + toXOF(d, totals(d).tva), 0);
  const ded = S.expenses.filter(e => e.date.slice(0, 7) === key).reduce((a, e) => a + expTva(e), 0);
  return {coll, ded, net: coll - ded};
}
function accounts() {
  const acc = {};
  const get = m => acc[ACCOUNT[m] || 'Espèces'] ||= {name: ACCOUNT[m] || 'Espèces', in: 0, out: 0};
  facs().forEach(d => d.payments.forEach(p => get(p.method).in += toXOF(d, p.amount)));
  S.expenses.forEach(e => get(e.method).out += e.amount);
  return ['Wave', 'Orange Money', 'Free Money', 'Banque', 'Espèces'].filter(k => acc[k]).map(k => ({...acc[k], bal: acc[k].in - acc[k].out}));
}

/* ---------- Vues ---------- */
const views = {dash: vDash, docs: vDocs, doc: vDoc, edit: vEdit, clients: vClients, client: vClientEdit, settings: vSettings, expenses: vExpenses, catalog: vCatalog, tax: vTax};

function banner() {
  if (!S.demo) return '';
  return `<div class="banner"><span>Vous regardez des <b>données d’exemple</b>. Elles restent dans ce navigateur uniquement.</span>
    <button class="btn sm" data-act="go" data-view="settings">Créer mon profil</button></div>`;
}

function vDash() {
  const T = today(), m = T.slice(0, 7), co = S.company;
  let enc = 0, att = 0, ret = 0, nret = 0, natt = 0;
  facs().forEach(d => {
    d.payments.forEach(p => { if (p.date.slice(0, 7) === m) enc += toXOF(d, p.amount); });
    const s = st(d), r = toXOF(d, totals(d).reste);
    if (s === 'retard') { ret += r; nret++; } else if (s !== 'payee') { att += r; natt++; }
  });
  const depM = S.expenses.filter(e => e.date.slice(0, 7) === m).reduce((a, e) => a + e.amount, 0), ben = enc - depM;
  const [yy, mm] = m.split('-').map(Number);
  const monthName = new Date(Date.UTC(yy, mm - 1, 1)).toLocaleDateString('fr-FR', {month: 'long', timeZone: 'UTC'});
  const daysLeft = daysBetween(T, new Date(Date.UTC(yy, mm, 1)).toISOString().slice(0, 10));
  const acc = accounts();

  const months = [];
  for (let i = 5; i >= 0; i--) { const dt = new Date(Date.UTC(yy, mm - 1 - i, 1)); months.push({key: dt.toISOString().slice(0, 7), label: dt.toLocaleDateString('fr-FR', {month: 'short', timeZone: 'UTC'}), f: 0, e: 0}); }
  const byKey = Object.fromEntries(months.map(x => [x.key, x]));
  facs().forEach(d => {
    const k = byKey[d.date.slice(0, 7)]; if (k) k.f += toXOF(d, totals(d).ttc);
    d.payments.forEach(p => { const q = byKey[p.date.slice(0, 7)]; if (q) q.e += toXOF(d, p.amount); });
  });
  const top = nice(Math.max(1, ...months.map(x => Math.max(x.f, x.e))));
  const short = n => n === 0 ? '0' : n >= 1e6 ? (n / 1e6).toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' M' : Math.round(n / 1000) + ' k';
  const chart = `<div class="chartwrap"><div class="chart">
      ${[1, .5, 0].map(f => `<div class="gl" style="bottom:${f * 100}%"><span>${short(top * f)}</span></div>`).join('')}
      ${months.map(x => `<div class="col" title="${esc(x.label)} : facturé ${money(x.f)}, encaissé ${money(x.e)}">
        <div class="bar f" style="height:${x.f / top * 100}%"></div><div class="bar" style="height:${x.e / top * 100}%"></div></div>`).join('')}
    </div><div class="xl">${months.map(x => `<span>${esc(x.label)}</span>`).join('')}</div></div>
    <div class="legend"><span><i style="background:var(--accent-soft);box-shadow:inset 0 0 0 1px var(--accent)"></i>Facturé</span><span><i style="background:var(--accent)"></i>Encaissé</span></div>`;

  const late = facs().filter(d => st(d) === 'retard').sort((a, b) => a.due.localeCompare(b.due));
  const recent = [...S.docs].sort((a, b) => b.date.localeCompare(a.date) || b.num.localeCompare(a.num)).slice(0, 5);
  const pct = co.goal ? Math.min(100, enc / co.goal * 100) : 0;

  return `${banner()}
  <div class="head"><div><h1>Bonjour${co.name ? ' ' + esc(co.name.split(' ')[0]) : ''}</h1><p>${cap(monthName)} ${yy} · encore ${daysLeft} jour${daysLeft > 1 ? 's' : ''} dans le mois</p></div></div>
  <div class="stack">
    <div class="kpis">
      <div class="kpi"><span class="lbl">Encaissé ce mois</span><span class="val">${num(enc)} <small>FCFA</small></span><span class="sub">Wave, Orange Money, virements…</span></div>
      <div class="kpi"><span class="lbl">À encaisser</span><span class="val">${num(att)} <small>FCFA</small></span><span class="sub">${natt} facture${natt > 1 ? 's' : ''} pas encore échue${natt > 1 ? 's' : ''}</span></div>
      <div class="kpi ${nret ? 'bad' : ''}"><span class="lbl">En retard</span><span class="val">${num(ret)} <small>FCFA</small></span><span class="sub">${nret} facture${nret > 1 ? 's' : ''} à relancer</span></div>
      <div class="kpi"><span class="lbl">Gagné ce mois</span><span class="val ${ben < 0 ? 'neg' : ''}">${ben < 0 ? '− ' : ''}${num(Math.abs(ben))} <small>FCFA</small></span><span class="sub">Encaissé moins ${num(depM)} de dépenses</span></div>
    </div>
    <div class="grid2">
      <section class="card"><h2>Facturé et encaissé, 6 derniers mois</h2>${chart}</section>
      <section class="card"><h2>À relancer</h2>
        ${late.length ? `<div class="plist">${late.map(d => { const t = totals(d); return `<div class="pitem">
          <div class="who"><b>${esc(cName(d.clientId))}</b><small>${esc(d.num)} · ${daysBetween(d.due, today())} j de retard</small></div>
          <div class="row" style="flex-wrap:nowrap"><span class="num">${amtShort(d, t.reste)}</span><button class="btn sm" data-act="remind" data-id="${d.id}">Relancer</button></div></div>`; }).join('')}</div>`
          : `<p class="empty">Aucune facture en retard. Bravo !</p>`}
      </section>
    </div>
    <div class="grid2">
      <section class="card goal"><h2>Objectif du mois</h2>
        ${co.goal ? `<div class="bigline"><b>${num(enc)}</b><span class="muted">sur ${money(co.goal)}</span></div>
          <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct}%"></i></div>
          <p class="muted" style="margin:0">${enc >= co.goal ? 'Objectif atteint ce mois-ci.' : `Il vous reste ${money(co.goal - enc)} à encaisser. ${money(att)} de factures sont déjà en attente.`}</p>`
          : `<p class="muted">Fixez-vous un objectif de revenus mensuels dans votre profil.</p><button class="btn sm" data-act="go" data-view="settings">Fixer un objectif</button>`}
      </section>
      <section class="card"><h2>Mes comptes</h2>
        ${acc.length ? `<div class="plist">${acc.map(a => `<div class="pitem"><div class="who"><b>${esc(a.name)}</b><small>+ ${num(a.in)} reçu · − ${num(a.out)} dépensé</small></div>
          <span class="num" style="${a.bal < 0 ? 'color:var(--bad)' : ''}">${a.bal < 0 ? '− ' : ''}${money(Math.abs(a.bal))}</span></div>`).join('')}</div>` : `<p class="empty">Aucun mouvement enregistré.</p>`}
        <p class="note">Calculé à partir de vos paiements et dépenses saisis, sans solde de départ. Les euros sont convertis à 655,957 FCFA.</p></section>
    </div>
    <section class="card"><div class="toolbar" style="margin-bottom:10px"><h2 style="margin:0">Derniers documents</h2><button class="btn sm ghost" data-act="go" data-view="docs">Tout voir →</button></div>
      ${recent.length ? `<div class="tablewrap" style="border:0">${docTable(recent)}</div>` : emptyDocs()}
    </section>
  </div>`;
}
function nice(v) { const p = 10 ** Math.floor(Math.log10(v)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }

function emptyDocs() {
  return `<div class="empty"><p>Aucun document pour l’instant.</p><button class="btn primary" data-act="new" data-type="FAC">Créer ma première facture</button></div>`;
}
function docTable(list) {
  return `<table class="list"><thead><tr><th>N°</th><th>Client</th><th class="hide-sm">Date</th><th class="hide-sm">Échéance</th><th class="num">Montant</th><th class="num hide-sm">Reste dû</th><th>Statut</th></tr></thead>
    <tbody>${list.map(d => { const t = totals(d), dev = d.type === 'DEV'; return `<tr data-act="open" data-id="${d.id}" tabindex="0">
      <td class="mono">${esc(d.num)}</td><td class="cl">${esc(cName(d.clientId))}</td>
      <td class="hide-sm">${fmtDate(d.date)}</td><td class="hide-sm">${dev ? '—' : fmtDate(d.due)}</td>
      <td class="num">${amtShort(d, t.ttc)}</td><td class="num hide-sm">${dev ? '—' : amtShort(d, t.reste)}</td><td>${pill(st(d))}</td></tr>`; }).join('')}</tbody></table>`;
}

const FILTERS = [['all', 'Tous'], ['attente', 'À encaisser'], ['retard', 'En retard'], ['payee', 'Payées'], ['devis', 'Devis']];
function matchFilter(d, f) {
  const s = st(d);
  if (f === 'all') return true;
  if (f === 'devis') return d.type === 'DEV';
  if (f === 'attente') return d.type === 'FAC' && !['payee', 'retard'].includes(s);
  return s === f;
}
function docList() {
  const q = ui.q.trim().toLowerCase();
  const list = S.docs.filter(d => matchFilter(d, ui.filter) && (!q || d.num.toLowerCase().includes(q) || cName(d.clientId).toLowerCase().includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.num.localeCompare(a.num));
  if (!S.docs.length) return emptyDocs();
  if (!list.length) return `<p class="empty">Aucun document ne correspond à cette recherche.</p>`;
  return `<div class="tablewrap">${docTable(list)}</div>`;
}
function vDocs() {
  return `${banner()}<div class="head"><div><h1>Factures et devis</h1><p>${S.docs.length} document${S.docs.length > 1 ? 's' : ''} · montants sans symbole en FCFA</p></div>
    <div class="row"><button class="btn ghost" data-act="exportDocs">Copier pour Excel</button><button class="btn" data-act="new" data-type="DEV">+ Devis</button><button class="btn primary" data-act="new" data-type="FAC">+ Facture</button></div></div>
    <div class="toolbar"><div class="chips">${FILTERS.map(([k, l]) => `<button class="chip" data-act="filter" data-f="${k}" aria-pressed="${ui.filter === k}">${l}<b>${S.docs.filter(d => matchFilter(d, k)).length}</b></button>`).join('')}</div>
      <input type="search" id="q" class="search" placeholder="Rechercher un client ou un numéro" value="${esc(ui.q)}" aria-label="Rechercher"></div>
    <div id="doclist">${docList()}</div>`;
}

function waLink(c, text) {
  let digits = (c?.phone || '').replace(/\D/g, '');
  if (digits.length === 9) digits = '221' + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
function payLine() { return `Vous pouvez régler par Wave ou Orange Money au ${S.company.phone || '[votre numéro]'}, ou par virement.`; }
function reminderText(d) {
  const c = client(d.clientId) || {}, t = totals(d);
  return `Bonjour ${c.contact || c.name || ''},\n\nJ’espère que vous allez bien. Petit rappel : la facture ${d.num} du ${fmtDate(d.date)} est arrivée à échéance le ${fmtDate(d.due)}. Il reste ${amt(d, t.reste)} à régler.\n\n${payLine()}\n\nMerci beaucoup,\n${S.company.name || ''}`;
}
function documentText(d) {
  const c = client(d.clientId) || {}, t = totals(d), dev = d.type === 'DEV';
  const dep = t.deposit && t.paid === 0 ? `\n\nPour démarrer, un acompte de ${d.deposit} % est demandé, soit ${amt(d, t.deposit)}.` : '';
  return `Bonjour ${c.contact || c.name || ''},\n\nVoici ${dev ? 'mon devis' : 'ma facture'} ${d.num} d’un montant de ${amt(d, t.ttc)}${dev ? `, valable jusqu’au ${fmtDate(d.due)}` : `, à régler avant le ${fmtDate(d.due)}`}.${dep}\n\n${payLine()}\n\nMerci pour votre confiance,\n${S.company.name || ''}`;
}

function vDoc() {
  const d = S.docs.find(x => x.id === ui.id);
  if (!d) { ui.view = 'docs'; return vDocs(); }
  const t = totals(d), s = st(d), c = client(d.clientId) || {name: 'Client supprimé'}, co = S.company, dev = d.type === 'DEV';
  const conv = d.convertedTo && S.docs.find(x => x.id === d.convertedTo);
  const from = S.docs.find(x => x.convertedTo === d.id);
  const msg = ui.relance === 'remind' ? reminderText(d) : documentText(d);
  const payDefault = t.deposit && t.paid < t.deposit ? rnd(d, t.deposit - t.paid) : t.reste;

  return `<div class="head"><div><button class="btn ghost sm" data-act="go" data-view="docs">← Factures et devis</button>
      <h1 style="margin-top:8px"><span class="mono" style="font-size:.8em">${esc(d.num)}</span></h1>
      <p>${esc(c.name)} · ${pill(s)}${conv ? ` · converti en <a href="#" data-act="open" data-id="${conv.id}">${esc(conv.num)}</a>` : ''}${from ? ` · issue du devis <a href="#" data-act="open" data-id="${from.id}">${esc(from.num)}</a>` : ''}</p></div>
    <div class="actions">
      ${!dev && t.reste > 0 ? `<button class="btn primary" data-act="payToggle">Enregistrer un paiement</button>` : ''}
      ${dev && !d.convertedTo ? `<button class="btn primary" data-act="convert">Le client accepte : créer la facture</button>` : ''}
      <button class="btn" data-act="share" data-mode="send">Envoyer par WhatsApp</button>
      ${!dev && s === 'retard' ? `<button class="btn" data-act="share" data-mode="remind">Relancer</button>` : ''}
      <button class="btn" data-act="edit">Modifier</button>
      <button class="btn" data-act="dup">Dupliquer</button>
      <button class="btn danger" data-act="askDel">Supprimer</button>
    </div></div>

  <div class="stack">
    ${ui.confirm === 'del' ? `<div class="panel alert"><b>Supprimer ${esc(d.num)} ? Cette action est définitive.</b>
      <div class="row"><button class="btn danger solid" data-act="del">Oui, supprimer</button><button class="btn" data-act="cancelConfirm">Annuler</button></div></div>` : ''}

    ${ui.pay ? `<form class="panel" id="payform"><h2>Paiement reçu</h2>
      <div class="fgrid">
        <label class="field">Montant (${isEur(d) ? '€' : 'FCFA'})<input type="text" id="p-amount" inputmode="decimal" value="${String(payDefault).replace('.', ',')}"></label>
        <label class="field">Moyen de paiement<select id="p-method">${METHODS.map(m => `<option ${isEur(d) && m === 'Virement' ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        <label class="field">Date<input type="date" id="p-date" value="${today()}"></label>
      </div>
      ${t.deposit && t.paid < t.deposit ? `<small class="muted">Montant proposé : l’acompte de ${d.deposit} % demandé sur cette facture.</small>` : ''}
      ${ui.err ? `<div class="err">${esc(ui.err)}</div>` : ''}
      <div class="row"><button class="btn primary" type="submit">Enregistrer</button><button class="btn" type="button" data-act="payToggle">Annuler</button></div></form>` : ''}

    ${ui.relance ? `<div class="panel"><h2>${ui.relance === 'remind' ? 'Message de relance' : 'Message d’envoi'}</h2>
      <textarea id="relmsg" class="relmsg" aria-label="Message">${esc(msg)}</textarea>
      <div class="row"><a class="btn primary" href="${esc(waLink(c, msg))}" target="_blank" rel="noopener">Ouvrir WhatsApp</a>
        <button class="btn" data-act="copy">Copier le message</button><button class="btn ghost" data-act="closeShare">Fermer</button></div>
      <small class="muted">Destinataire : ${esc(c.phone || 'aucun numéro enregistré')}. Dans la version finale, le PDF et le lien de paiement Wave seront joints automatiquement.</small></div>` : ''}

    <article class="paper" aria-label="Aperçu du document">
      <div class="p-top">
        <div class="p-co"><b>${esc(co.name || 'Votre nom')}</b>${co.job ? `<div class="job">${esc(co.job)}</div>` : ''}
          <div>${esc(co.address)}<br>${esc(co.phone)}${co.email ? ' · ' + esc(co.email) : ''}${co.ninea ? '<br>NINEA : ' + esc(co.ninea) : ''}</div></div>
        <div class="p-title"><h3>${dev ? 'DEVIS' : 'FACTURE'}</h3>
          <dl><dt>N°</dt><dd>${esc(d.num)}</dd><dt>Date</dt><dd>${fmtDate(d.date)}</dd>
          <dt>${dev ? 'Valable jusqu’au' : 'Échéance'}</dt><dd>${fmtDate(d.due)}</dd></dl>
          ${s === 'payee' ? '<span class="stamp">PAYÉE</span>' : ''}</div>
      </div>
      <div class="p-mid"><div class="p-cl"><div class="lbl">${dev ? 'Destinataire' : 'Facturé à'}</div><b>${esc(c.name)}</b>
        <div>${c.contact ? 'À l’attention de ' + esc(c.contact) + '<br>' : ''}${esc(c.address || '')}${c.phone ? '<br>' + esc(c.phone) : ''}${c.ninea ? '<br>NINEA : ' + esc(c.ninea) : ''}</div></div></div>
      <div class="p-tablewrap"><table class="p-lines"><thead><tr><th>Prestation</th><th class="num">Qté</th><th class="num">Prix unitaire</th><th class="num">Montant</th></tr></thead>
        <tbody>${d.lines.map(l => `<tr><td>${esc(l.desc)}</td><td class="num">${String(l.qty).replace('.', ',')}</td><td class="num">${amt(d, l.price)}</td><td class="num">${amt(d, rnd(d, l.qty * l.price))}</td></tr>`).join('')}</tbody></table></div>
      <div class="p-sum"><dl>
        ${t.remise ? `<dt>Sous-total</dt><dd>${amt(d, t.brut)}</dd><dt>Remise ${String(d.discount).replace('.', ',')} %</dt><dd>− ${amt(d, t.remise)}</dd>` : ''}
        ${d.tva ? `<dt>Total HT</dt><dd>${amt(d, t.ht)}</dd><dt>TVA 18 %</dt><dd>${amt(d, t.tva)}</dd>` : ''}
        <dt class="ttc">${d.tva ? 'Total TTC' : 'Total'}</dt><dd class="ttc">${amt(d, t.ttc)}</dd>
        ${t.deposit ? `<dt>Acompte demandé (${d.deposit} %)</dt><dd>${amt(d, t.deposit)}</dd>` : ''}
        ${!dev && t.paid > 0 ? `<dt>Déjà réglé</dt><dd>− ${amt(d, t.paid)}</dd><dt class="due">Reste à payer</dt><dd class="due">${amt(d, t.reste)}</dd>` : ''}
      </dl></div>
      <p class="p-words">Arrêté${dev ? ' le présent devis' : 'e la présente facture'} à la somme de <b>${sommeEnLettres(t.ttc, d.cur)} (${amt(d, t.ttc)})</b>${d.tva ? ' TTC' : ''}.${d.tva ? '' : ' TVA non applicable.'}</p>
      <div class="p-foot">
        <div class="p-sec"><div class="lbl">Paiement</div><ul>${isEur(d) ? '<li>Virement bancaire (coordonnées sur demande)</li>' : `<li>Wave et Orange Money : ${esc(co.phone || '—')}</li><li>Virement ou espèces</li>`}</ul></div>
        ${!dev && d.payments.length ? `<div class="p-sec"><div class="lbl">Paiements reçus</div><ul>${d.payments.map(p => `<li>${fmtDate(p.date)} · ${esc(p.method)} · <span class="mono">${amt(d, p.amount)}</span></li>`).join('')}</ul></div>` : ''}
        ${d.notes || co.mentions ? `<div class="p-sec"><div class="lbl">Conditions</div><div class="muted">${esc(d.notes)}${d.notes && co.mentions ? '<br>' : ''}${esc(co.mentions)}</div></div>` : ''}
      </div>
    </article>
  </div>`;
}

function vEdit() {
  const d = ui.draft, dev = d.type === 'DEV', t = totals(d);
  return `<div class="head"><div><button class="btn ghost sm" data-act="cancelEdit">← Annuler</button>
      <h1 style="margin-top:8px">${d.id ? 'Modifier ' + esc(d.num) : dev ? 'Nouveau devis' : 'Nouvelle facture'}</h1>
      <p>${d.id ? '' : 'Numéro attribué à l’enregistrement : ' + esc(nextNum(d.type, d.date || today()))}</p></div></div>
  <form id="editor" class="stack">
    ${ui.err ? `<div class="err">${esc(ui.err)}</div>` : ''}
    <section class="card"><h2>Informations</h2><div class="fgrid">
      <label class="field">Type<select id="f-type" ${d.id ? 'disabled' : ''}><option value="FAC" ${!dev ? 'selected' : ''}>Facture</option><option value="DEV" ${dev ? 'selected' : ''}>Devis</option></select></label>
      <label class="field">Client<select id="f-client"><option value="">Choisir un client…</option>${S.clients.map(c => `<option value="${c.id}" ${c.id === d.clientId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <label class="field">Devise<select id="f-cur"><option value="XOF" ${!isEur(d) ? 'selected' : ''}>Franc CFA (FCFA)</option><option value="EUR" ${isEur(d) ? 'selected' : ''}>Euro (€)</option></select></label>
      <label class="field">Date<input type="date" id="f-date" value="${esc(d.date)}"></label>
      <label class="field">${dev ? 'Valable jusqu’au' : 'Échéance'}<input type="date" id="f-due" value="${esc(d.due)}"></label>
    </div><div class="row" style="margin-top:12px"><button type="button" class="btn sm" data-act="clientNew" data-back="edit">+ Ajouter un client</button></div></section>

    <section class="card"><h2>Prestations</h2>
      <div class="lines">
        <div class="line h"><span>Prestation</span><span>Qté</span><span>Prix unitaire</span><span>Montant</span><span></span></div>
        ${d.lines.map((l, i) => `<div class="line">
          <input type="text" class="desc" id="l-${i}-desc" data-line="${i}" data-field="desc" value="${esc(l.desc)}" placeholder="Ex. : Création de site web" aria-label="Prestation" list="catlist" autocomplete="off">
          <input type="text" id="l-${i}-qty" data-line="${i}" data-field="qty" value="${esc(String(l.qty).replace('.', ','))}" inputmode="decimal" aria-label="Quantité">
          <input type="text" id="l-${i}-price" data-line="${i}" data-field="price" value="${l.price ? String(l.price).replace('.', ',') : ''}" placeholder="Prix (${isEur(d) ? '€' : 'FCFA'})" inputmode="decimal" aria-label="Prix unitaire">
          <span class="amt" data-amt="${i}">${amtShort(d, rnd(d, l.qty * l.price))}</span>
          <button type="button" class="x" data-act="delLine" data-i="${i}" aria-label="Supprimer la ligne">×</button></div>`).join('')}
      </div>
      <datalist id="catlist">${S.catalog.map(c => `<option value="${esc(c.name)}"></option>`).join('')}</datalist>
      <div class="row" style="margin-top:12px"><button type="button" class="btn sm" data-act="addLine">+ Ajouter une ligne</button>
        ${S.catalog.length && !isEur(d) ? `<small class="muted">Tapez le début d’un de vos tarifs : le prix se remplit tout seul.</small>` : ''}</div>
    </section>

    <div class="editfoot">
      <section class="card stack" style="gap:14px">
        <div class="fgrid">
          <label class="field">Acompte à la commande<select id="f-dep">${[0, 30, 40, 50].map(p => `<option value="${p}" ${(+d.deposit || 0) === p ? 'selected' : ''}>${p ? p + ' %' : 'Aucun'}</option>`).join('')}</select></label>
          <label class="field">Remise (%)<input type="text" id="f-disc" inputmode="decimal" value="${d.discount ? String(d.discount).replace('.', ',') : ''}" placeholder="0"></label>
        </div>
        ${S.company.tvaOn ? `<label class="check"><input type="checkbox" id="f-tva" ${d.tva ? 'checked' : ''}> Appliquer la TVA à 18 %</label>` : `<small class="muted">TVA non applicable. Activez-la dans votre profil si vous y êtes assujetti.</small>`}
        <label class="field">Conditions particulières<textarea id="f-notes" placeholder="Ex. : deux séries de corrections incluses">${esc(d.notes)}</textarea></label>
      </section>
      <div class="stack" style="gap:12px"><div class="tot" id="totals">${totalsBox(d)}</div>
        <button type="submit" class="btn primary">Enregistrer ${dev ? 'le devis' : 'la facture'}</button></div>
    </div>
  </form>`;
}
function totalsBox(d) {
  const t = totals(d);
  return `${t.remise ? `<div><span>Sous-total</span><span>${amt(d, t.brut)}</span></div><div><span>Remise</span><span>− ${amt(d, t.remise)}</span></div>` : ''}
    ${d.tva ? `<div><span>Total HT</span><span>${amt(d, t.ht)}</span></div><div><span>TVA</span><span>${amt(d, t.tva)}</span></div>` : ''}
    <div class="big"><span>Total</span><span>${amt(d, t.ttc)}</span></div>
    ${t.deposit ? `<div class="dep"><span>Acompte (${d.deposit} %)</span><span>${amt(d, t.deposit)}</span></div>` : ''}`;
}

function vClients() {
  const rows = S.clients.map(c => {
    const ds = facs().filter(d => d.clientId === c.id);
    const tot = ds.reduce((a, d) => a + toXOF(d, totals(d).ttc), 0), du = ds.reduce((a, d) => a + toXOF(d, totals(d).reste), 0);
    return `<tr><td><b>${esc(c.name)}</b><br><small class="muted">${esc(c.contact)}</small></td><td class="hide-sm">${esc(c.phone)}</td>
      <td class="num hide-sm">${ds.length}</td><td class="num hide-sm">${num(tot)}</td><td class="num" style="${du ? 'color:var(--bad)' : ''}">${num(du)}</td>
      <td><div class="row" style="flex-wrap:nowrap;justify-content:flex-end"><button class="btn sm" data-act="new" data-type="FAC" data-client="${c.id}">Facturer</button><button class="btn sm ghost" data-act="clientEdit" data-id="${c.id}">Modifier</button></div></td></tr>`;
  }).join('');
  return `${banner()}<div class="head"><div><h1>Clients</h1><p>${S.clients.length} client${S.clients.length > 1 ? 's' : ''} · montants en FCFA</p></div>
    <button class="btn primary" data-act="clientNew">+ Nouveau client</button></div>
    ${S.clients.length ? `<div class="tablewrap"><table class="list"><thead><tr><th>Client</th><th class="hide-sm">Téléphone</th><th class="num hide-sm">Factures</th><th class="num hide-sm">Facturé</th><th class="num">Reste dû</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<div class="card empty"><p>Ajoutez votre premier client pour commencer à facturer.</p><button class="btn primary" data-act="clientNew">+ Nouveau client</button></div>`}`;
}
function vClientEdit() {
  const c = ui.clientDraft;
  const f = (k, l, type = 'text', ph = '') => `<label class="field">${l}<input type="${type}" id="k-${k}" value="${esc(c[k])}" placeholder="${ph}"></label>`;
  return `<div class="head"><div><button class="btn ghost sm" data-act="clientCancel">← Annuler</button><h1 style="margin-top:8px">${c.id ? 'Modifier le client' : 'Nouveau client'}</h1></div></div>
  <form id="clientform" class="card stack">
    ${ui.err ? `<div class="err">${esc(ui.err)}</div>` : ''}
    <div class="fgrid">${f('name', 'Nom ou entreprise', 'text', 'Ex. : Boutique Keur Yaye')}${f('contact', 'Personne de contact')}${f('phone', 'Téléphone (WhatsApp)', 'tel', '+221 77 000 00 00')}
      ${f('email', 'E-mail', 'email')}${f('address', 'Adresse', 'text', 'Quartier, ville')}${f('ninea', 'NINEA (facultatif)')}</div>
    ${ui.confirm === 'cdel' ? `<div class="panel alert"><b>Supprimer ce client ?</b><div class="row"><button type="button" class="btn danger solid" data-act="clientDel">Oui, supprimer</button><button type="button" class="btn" data-act="cancelConfirm">Annuler</button></div></div>` : ''}
    <div class="row"><button type="submit" class="btn primary">Enregistrer</button>${c.id ? `<button type="button" class="btn danger" data-act="clientAskDel">Supprimer</button>` : ''}</div>
  </form>`;
}

function vCatalog() {
  const c = ui.catDraft;
  return `${banner()}<div class="head"><div><h1>Mes tarifs</h1><p>Vos prestations habituelles. Leur prix se remplit tout seul dans vos devis et factures.</p></div>
    <button class="btn primary" data-act="catNew">+ Nouvelle prestation</button></div>
  <div class="stack">
    ${c ? `<form class="panel" id="catform"><h2>${c.id ? 'Modifier la prestation' : 'Nouvelle prestation'}</h2><div class="fgrid">
      <label class="field">Prestation<input type="text" id="g-name" value="${esc(c.name)}" placeholder="Ex. : Site web vitrine"></label>
      <label class="field">Unité<input type="text" id="g-unit" value="${esc(c.unit)}" placeholder="forfait, jour, mois, séance…"></label>
      <label class="field">Prix (FCFA)<input type="text" id="g-price" inputmode="numeric" value="${c.price || ''}"></label></div>
      ${ui.err ? `<div class="err">${esc(ui.err)}</div>` : ''}
      <div class="row"><button type="submit" class="btn primary">Enregistrer</button><button type="button" class="btn" data-act="catCancel">Annuler</button>
        ${c.id ? `<button type="button" class="btn danger" data-act="catDel">Supprimer</button>` : ''}</div></form>` : ''}
    ${S.catalog.length ? `<div class="tablewrap"><table class="list"><thead><tr><th>Prestation</th><th class="hide-sm">Unité</th><th class="num">Prix (FCFA)</th></tr></thead>
      <tbody>${[...S.catalog].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(x => `<tr data-act="catEdit" data-id="${x.id}" tabindex="0"><td><b>${esc(x.name)}</b></td>
        <td class="hide-sm">${esc(x.unit)}</td><td class="num">${num(x.price)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="card empty"><p>Ajoutez vos prestations pour facturer plus vite.</p><button class="btn primary" data-act="catNew">+ Nouvelle prestation</button></div>`}
  </div>`;
}

function vExpenses() {
  const m = today().slice(0, 7);
  const month = S.expenses.filter(e => e.date.slice(0, 7) === m);
  const tot = month.reduce((a, e) => a + e.amount, 0);
  const byCat = CATS.map(c => [c, month.filter(e => e.category === c).reduce((a, e) => a + e.amount, 0)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const maxC = Math.max(1, ...byCat.map(x => x[1]));
  const list = [...S.expenses].sort((a, b) => b.date.localeCompare(a.date));
  const e = ui.expDraft;
  return `${banner()}<div class="head"><div><h1>Dépenses</h1><p>${money(tot)} ce mois · ${month.length} dépense${month.length > 1 ? 's' : ''}</p></div>
    <div class="row"><button class="btn ghost" data-act="exportExp">Copier pour Excel</button><button class="btn primary" data-act="expNew">+ Nouvelle dépense</button></div></div>
  <div class="stack">
    ${e ? `<form class="panel" id="expform"><h2>${e.id ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
      <div class="fgrid">
        <label class="field">Libellé<input type="text" id="e-desc" value="${esc(e.desc)}" placeholder="Ex. : Abonnement logiciel"></label>
        <label class="field">Fournisseur<input type="text" id="e-supplier" value="${esc(e.supplier)}" placeholder="Facultatif"></label>
        <label class="field">Catégorie<select id="e-cat">${CATS.map(c => `<option ${c === e.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="field">Montant (FCFA)<input type="text" id="e-amount" inputmode="numeric" value="${e.amount || ''}"></label>
        <label class="field">Payé avec<select id="e-method">${METHODS.map(x => `<option ${x === e.method ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="field">Date<input type="date" id="e-date" value="${esc(e.date)}"></label>
      </div>
      ${S.company.tvaOn ? `<label class="check"><input type="checkbox" id="e-tva" ${e.tva ? 'checked' : ''}> Facture fournisseur avec TVA récupérable (18 % inclus)</label>` : ''}
      <label class="field">Photo du reçu<input type="file" id="e-photo" accept="image/*"></label>
      ${e.photo ? `<div class="row"><img class="thumb" src="${e.photo}" alt="Photo du reçu"><button type="button" class="btn sm ghost" data-act="expPhotoDel">Retirer la photo</button></div>` : ''}
      ${ui.err ? `<div class="err">${esc(ui.err)}</div>` : ''}
      <div class="row"><button type="submit" class="btn primary">Enregistrer</button><button type="button" class="btn" data-act="expCancel">Annuler</button>
        ${e.id ? `<button type="button" class="btn danger" data-act="expDel">Supprimer</button>` : ''}</div></form>` : ''}
    <div class="grid2">
      ${list.length ? `<div class="tablewrap"><table class="list"><thead><tr><th>Date</th><th>Libellé</th><th class="hide-sm">Payé avec</th><th class="num">Montant</th></tr></thead>
        <tbody>${list.map(x => `<tr data-act="expEdit" data-id="${x.id}" tabindex="0"><td style="white-space:nowrap">${fmtDate(x.date)}</td>
          <td><b>${esc(x.desc)}</b>${x.photo ? ' <span class="pill muted">Reçu</span>' : ''}<br><small class="muted">${esc(x.category)}${x.supplier ? ' · ' + esc(x.supplier) : ''}</small></td>
          <td class="hide-sm">${esc(x.method)}</td><td class="num">${num(x.amount)}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="card empty"><p>Notez vos dépenses pour connaître ce que vous gagnez vraiment.</p><button class="btn primary" data-act="expNew">+ Nouvelle dépense</button></div>`}
      <section class="card"><h2>Par catégorie, ce mois</h2>
        ${byCat.length ? `<div class="cats">${byCat.map(([c, v]) => `<div class="cat"><span>${esc(c)}</span><span class="track"><i style="width:${v / maxC * 100}%"></i></span><span class="num">${num(v)}</span></div>`).join('')}</div>`
          : `<p class="empty">Aucune dépense ce mois-ci.</p>`}
      </section>
    </div>
  </div>`;
}
function readExp() {
  const e = ui.expDraft; if (!$('#expform')) return;
  e.desc = $('#e-desc').value.trim(); e.supplier = $('#e-supplier').value.trim(); e.category = $('#e-cat').value;
  e.amount = Math.round(parseNum($('#e-amount').value)); e.method = $('#e-method').value; e.date = $('#e-date').value || today();
  e.tva = !!$('#e-tva')?.checked;
}

function vTax() {
  if (!S.company.tvaOn) return `<div class="head"><div><h1>TVA</h1><p>Vous n’êtes pas assujetti à la TVA.</p></div></div>
    <div class="card stack" style="gap:12px"><p style="margin:0">Beaucoup de freelances qui démarrent ne facturent pas la TVA. Si vous y êtes assujetti, activez-la dans votre profil : vos factures, vos dépenses et votre calendrier de déclaration s’adapteront.</p>
    <div><button class="btn" data-act="go" data-view="settings">Ouvrir mon profil</button></div></div>`;
  const T = today(), [yy, mm] = T.slice(0, 7).split('-').map(Number);
  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(Date.UTC(yy, mm - 1 - i, 1)), key = dt.toISOString().slice(0, 7);
    rows.push({key, label: dt.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric', timeZone: 'UTC'}), ...monthTax(key)});
  }
  // La TVA d'un mois se déclare avant le 15 du mois suivant
  const dl = [-1, 0].map(i => {
    const due = new Date(Date.UTC(yy, mm + i, 15)).toISOString().slice(0, 10), per = new Date(Date.UTC(yy, mm - 1 + i, 1));
    return {due, key: per.toISOString().slice(0, 7), label: per.toLocaleDateString('fr-FR', {month: 'long', timeZone: 'UTC'}), current: i === 0};
  }).filter(x => x.due >= T);
  const when = due => { const n = daysBetween(T, due); return n === 0 ? 'aujourd’hui' : `dans ${n} jour${n > 1 ? 's' : ''}`; };
  return `<div class="head"><div><h1>TVA</h1><p>Calculée à partir de vos factures et de vos dépenses.</p></div></div>
  <div class="stack">
    <section class="card"><h2>Prochaines déclarations</h2>
      ${dl.map(x => { const t = monthTax(x.key), dd = new Date(x.due + 'T00:00:00Z'); return `<div class="deadline">
        <div class="day"><b>${dd.getUTCDate()}</b><small>${esc(dd.toLocaleDateString('fr-FR', {month: 'short', timeZone: 'UTC'}))}</small></div>
        <div><b>TVA de ${esc(x.label)}</b> · ${when(x.due)}<br><span class="muted">Collectée ${money(t.coll)} · déductible ${money(t.ded)}</span><br>
        ${t.net >= 0 ? `À payer : <b class="mono">${money(t.net)}</b>` : `Crédit de TVA : <b class="mono">${money(-t.net)}</b>`}${x.current ? ' <span class="pill muted">estimation, mois en cours</span>' : ''}</div></div>`; }).join('')}
      <p class="note">Calendrier indicatif. Faites confirmer vos obligations par un comptable ou par la DGID.</p>
    </section>
    <div class="tablewrap"><table class="list"><thead><tr><th>Mois</th><th class="num">Collectée</th><th class="num">Déductible</th><th class="num">Net</th></tr></thead>
      <tbody>${rows.reverse().map(r => `<tr><td>${esc(cap(r.label))}</td><td class="num">${num(r.coll)}</td><td class="num">${num(r.ded)}</td>
        <td class="num" style="font-weight:600">${r.net < 0 ? 'Crédit ' + num(-r.net) : num(r.net)}</td></tr>`).join('')}</tbody></table></div>
  </div>`;
}

function vSettings() {
  const co = S.company;
  const f = (k, l, ph = '') => `<label class="field">${l}<input type="text" id="s-${k}" value="${esc(co[k])}" placeholder="${ph}"></label>`;
  return `<div class="head"><div><h1>Mon profil</h1><p>Ces informations apparaissent sur vos devis et factures.</p></div></div>
  <div class="stack">
    <form id="setform" class="card stack">
      <div class="fgrid">${f('name', 'Votre nom ou nom de marque', 'Ex. : Khady Sy')}${f('job', 'Votre métier', 'Ex. : Développeur web')}
        ${f('phone', 'Téléphone Wave / Orange Money', '+221 77 000 00 00')}${f('email', 'E-mail')}${f('address', 'Ville ou quartier', 'Ex. : Liberté 6, Dakar')}${f('ninea', 'NINEA (facultatif)')}
        <label class="field">Objectif de revenus par mois (FCFA)<input type="text" id="s-goal" inputmode="numeric" value="${co.goal || ''}" placeholder="Ex. : 1 000 000"></label></div>
      <label class="check"><input type="checkbox" id="s-tvaOn" ${co.tvaOn ? 'checked' : ''}> Je suis assujetti à la TVA (18 %)</label>
      <label class="field">Conditions en bas de vos documents<textarea id="s-mentions">${esc(co.mentions)}</textarea></label>
      <div class="row"><button type="submit" class="btn primary">Enregistrer</button></div>
    </form>
    <section class="card stack" style="gap:12px"><h2 style="margin:0">Données</h2>
      <p class="muted" style="margin:0">Dans ce prototype, vos données sont gardées dans ce navigateur uniquement. La version finale les enregistrera sur un serveur sécurisé.</p>
      ${ui.confirm === 'wipe' ? `<div class="panel alert"><b>Effacer toutes les factures, devis, clients et dépenses ?</b><div class="row"><button class="btn danger solid" data-act="wipe">Oui, tout effacer</button><button class="btn" data-act="cancelConfirm">Annuler</button></div></div>` : ''}
      <div class="row"><button class="btn" data-act="demo">Recharger les exemples</button><button class="btn danger" data-act="askWipe">Repartir de zéro</button></div>
    </section>
  </div>`;
}

/* ---------- Rendu et actions ---------- */
function render(scroll) {
  $('#main').innerHTML = views[ui.view]();
  const nav = {dash: 'dash', docs: 'docs', doc: 'docs', edit: 'docs', clients: 'clients', client: 'clients', settings: 'settings', expenses: 'expenses', catalog: 'catalog', tax: 'tax'}[ui.view];
  document.querySelectorAll('#nav button').forEach(b => b.dataset.view === nav ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('#nav-tax').hidden = !S.company.tvaOn;
  if (scroll) window.scrollTo(0, 0);
}
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2400); }
function go(view, extra = {}) { Object.assign(ui, {view, err: '', pay: false, relance: false, confirm: null, expDraft: null, catDraft: null}, extra); render(true); }
function persist(msg) { const ok = save(); if (msg) toast(ok ? msg : msg + ' (non sauvegardé : stockage du navigateur indisponible ou plein)'); }
const cell = v => String(v ?? '').replace(/[\t\n]/g, ' ');
function copyText(text, ok) {
  navigator.clipboard.writeText(text).then(() => toast(ok)).catch(() => toast('Cette fenêtre bloque la copie. Ouvrez le prototype dans un navigateur pour copier.'));
}

function startDraft(type, clientId) {
  const T = today(), c = client(clientId);
  ui.draft = {id: null, type, num: '', clientId: clientId || '', cur: c && /^\+(?!221)/.test(c.phone || '') ? 'EUR' : 'XOF', date: T, due: addDays(T, type === 'DEV' ? 30 : 15),
    tva: S.company.tvaOn, discount: 0, deposit: type === 'DEV' ? 50 : 0, lines: [{desc: '', qty: 1, price: 0}], notes: '', payments: []};
  go('edit');
}
function readDraft() {
  const d = ui.draft; if (!$('#editor')) return;
  if (!d.id) d.type = $('#f-type').value;
  d.clientId = $('#f-client').value; d.cur = $('#f-cur').value; d.date = $('#f-date').value || today(); d.due = $('#f-due').value;
  d.tva = S.company.tvaOn && !!$('#f-tva')?.checked; d.notes = $('#f-notes').value;
  d.deposit = +$('#f-dep').value || 0;
  d.discount = Math.min(100, Math.max(0, parseNum($('#f-disc').value)));
  document.querySelectorAll('[data-line]').forEach(el => {
    const l = d.lines[+el.dataset.line], k = el.dataset.field;
    l[k] = k === 'desc' ? el.value : parseNum(el.value);
  });
}

const acts = {
  go: el => go(el.dataset.view),
  new: el => startDraft(el.dataset.type, el.dataset.client),
  open: (el, e) => { e.preventDefault(); go('doc', {id: el.dataset.id}); },
  filter: el => { ui.filter = el.dataset.f; render(); },
  remind: el => go('doc', {id: el.dataset.id, relance: 'remind'}),
  addLine: () => { readDraft(); ui.draft.lines.push({desc: '', qty: 1, price: 0}); render(); $(`#l-${ui.draft.lines.length - 1}-desc`)?.focus(); },
  delLine: el => { readDraft(); ui.draft.lines.splice(+el.dataset.i, 1); if (!ui.draft.lines.length) ui.draft.lines.push({desc: '', qty: 1, price: 0}); render(); },
  cancelEdit: () => ui.draft?.id ? go('doc', {id: ui.draft.id}) : go('docs'),
  edit: () => { ui.draft = JSON.parse(JSON.stringify(S.docs.find(x => x.id === ui.id))); go('edit'); },
  dup: () => {
    const src = S.docs.find(x => x.id === ui.id), T = today();
    ui.draft = {...JSON.parse(JSON.stringify(src)), id: null, num: '', date: T, due: addDays(T, 15), payments: [], convertedTo: undefined};
    go('edit');
  },
  convert: () => {
    const dv = S.docs.find(x => x.id === ui.id), T = today();
    const f = {id: uid(), type: 'FAC', num: nextNum('FAC', T), clientId: dv.clientId, cur: dv.cur, date: T, due: addDays(T, 15), tva: dv.tva,
      discount: dv.discount, deposit: dv.deposit, lines: JSON.parse(JSON.stringify(dv.lines)), notes: dv.notes, payments: []};
    S.docs.push(f); dv.convertedTo = f.id; persist(`Facture ${f.num} créée à partir du devis`); go('doc', {id: f.id});
  },
  payToggle: () => { ui.pay = !ui.pay; ui.relance = false; ui.err = ''; render(); if (ui.pay) $('#p-amount')?.focus(); },
  share: el => { ui.relance = el.dataset.mode; ui.pay = false; render(); },
  closeShare: () => { ui.relance = false; render(); },
  copy: () => {
    const ta = $('#relmsg');
    navigator.clipboard.writeText(ta.value).then(() => toast('Message copié')).catch(() => { ta.select(); toast('Texte sélectionné : copiez-le avec Ctrl+C'); });
  },
  askDel: () => { ui.confirm = 'del'; render(); },
  cancelConfirm: () => { ui.confirm = null; render(); },
  del: () => {
    const d = S.docs.find(x => x.id === ui.id);
    S.docs = S.docs.filter(x => x.id !== ui.id);
    S.docs.forEach(x => { if (x.convertedTo === ui.id) delete x.convertedTo; });
    persist(`${d.num} supprimé`); go('docs');
  },
  clientNew: el => { if (el.dataset.back === 'edit') readDraft(); ui.back = el.dataset.back || null; ui.clientDraft = {id: null, name: '', contact: '', phone: '', email: '', address: '', ninea: ''}; go('client'); },
  clientEdit: el => { ui.back = null; ui.clientDraft = {...client(el.dataset.id)}; go('client'); },
  clientCancel: () => ui.back === 'edit' ? go('edit') : go('clients'),
  clientAskDel: () => {
    if (S.docs.some(d => d.clientId === ui.clientDraft.id)) { toast('Ce client a des documents : il ne peut pas être supprimé.'); return; }
    ui.confirm = 'cdel'; render();
  },
  clientDel: () => { S.clients = S.clients.filter(c => c.id !== ui.clientDraft.id); persist('Client supprimé'); go('clients'); },
  expNew: () => { ui.expDraft = {id: null, date: today(), desc: '', supplier: '', category: CATS[0], amount: 0, method: 'Wave', tva: false, photo: ''}; ui.err = ''; render(true); $('#e-desc')?.focus(); },
  expEdit: el => { ui.expDraft = {...S.expenses.find(x => x.id === el.dataset.id)}; ui.err = ''; render(true); },
  expCancel: () => { ui.expDraft = null; ui.err = ''; render(); },
  expDel: () => { S.expenses = S.expenses.filter(x => x.id !== ui.expDraft.id); ui.expDraft = null; persist('Dépense supprimée'); render(); },
  expPhotoDel: () => { readExp(); ui.expDraft.photo = ''; render(); },
  exportExp: () => {
    const rows = [['Date', 'Libellé', 'Fournisseur', 'Catégorie', 'Payé avec', 'Montant (FCFA)']]
      .concat([...S.expenses].sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, e.desc, e.supplier, e.category, e.method, e.amount]));
    copyText(rows.map(r => r.map(cell).join('\t')).join('\n'), 'Dépenses copiées : collez-les dans Excel ou Google Sheets');
  },
  exportDocs: () => {
    const rows = [['N°', 'Type', 'Client', 'Devise', 'Date', 'Échéance', 'Total', 'Payé', 'Reste', 'Statut']]
      .concat([...S.docs].sort((a, b) => a.date.localeCompare(b.date)).map(d => { const t = totals(d); return [d.num, d.type === 'DEV' ? 'Devis' : 'Facture', cName(d.clientId), isEur(d) ? 'EUR' : 'FCFA', d.date, d.due, t.ttc, t.paid, t.reste, ST[st(d)][0]]; }));
    copyText(rows.map(r => r.map(cell).join('\t')).join('\n'), 'Tableau copié : collez-le dans Excel ou Google Sheets');
  },
  catNew: () => { ui.catDraft = {id: null, name: '', unit: '', price: 0}; ui.err = ''; render(true); $('#g-name')?.focus(); },
  catEdit: el => { ui.catDraft = {...S.catalog.find(x => x.id === el.dataset.id)}; ui.err = ''; render(true); },
  catCancel: () => { ui.catDraft = null; ui.err = ''; render(); },
  catDel: () => { S.catalog = S.catalog.filter(x => x.id !== ui.catDraft.id); ui.catDraft = null; persist('Prestation supprimée'); render(); },
  demo: () => { S = seed(); persist('Exemples rechargés'); go('dash'); },
  askWipe: () => { ui.confirm = 'wipe'; render(); },
  wipe: () => { S = blank(); persist('Toutes les données ont été effacées'); go('settings'); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && acts[el.dataset.act]) acts[el.dataset.act](el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('tr[data-act]')) e.target.click();
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#doclist').innerHTML = docList(); return; }
  if (e.target.closest('#editor')) {
    readDraft();
    if (e.target.id === 'f-type' || e.target.id === 'f-cur') { render(); return; }
    if (e.target.dataset.field === 'desc' && !isEur(ui.draft)) {
      const i = +e.target.dataset.line, l = ui.draft.lines[i], it = S.catalog.find(c => c.name === l.desc);
      if (it && !l.price) { l.price = it.price; const p = $(`#l-${i}-price`); if (p) p.value = it.price; }
    }
    const d = ui.draft;
    d.lines.forEach((l, i) => { const a = $(`[data-amt="${i}"]`); if (a) a.textContent = amtShort(d, rnd(d, l.qty * l.price)); });
    $('#totals').innerHTML = totalsBox(d);
  }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const id = e.target.id;
  if (id === 'editor') {
    readDraft();
    const d = ui.draft;
    d.lines = d.lines.filter(l => l.desc.trim() || l.price > 0);
    if (!d.lines.length) d.lines = [{desc: '', qty: 1, price: 0}];
    if (!d.clientId) { ui.err = 'Choisissez un client, ou ajoutez-en un.'; return render(true); }
    if (d.lines.some(l => !l.desc.trim())) { ui.err = 'Chaque ligne doit avoir une prestation.'; return render(true); }
    if (totals(d).ttc <= 0) { ui.err = 'Ajoutez au moins une ligne avec un prix.'; return render(true); }
    if (d.id) S.docs = S.docs.map(x => x.id === d.id ? d : x);
    else { d.id = uid(); d.num = nextNum(d.type, d.date); S.docs.push(d); }
    persist(`${d.num} enregistré`); go('doc', {id: d.id});
  }
  if (id === 'payform') {
    const d = S.docs.find(x => x.id === ui.id), amount = rnd(d, parseNum($('#p-amount').value)), reste = totals(d).reste;
    if (amount <= 0) { ui.err = 'Indiquez un montant supérieur à zéro.'; return render(); }
    if (amount > reste) { ui.err = `Le montant dépasse le reste à payer (${amt(d, reste)}).`; return render(); }
    d.payments.push({date: $('#p-date').value || today(), amount, method: $('#p-method').value});
    persist(totals(d).reste === 0 ? `${d.num} est entièrement payée` : `Paiement de ${amt(d, amount)} enregistré`);
    go('doc', {id: d.id});
  }
  if (id === 'clientform') {
    const c = ui.clientDraft;
    ['name', 'contact', 'phone', 'email', 'address', 'ninea'].forEach(k => c[k] = $('#k-' + k).value.trim());
    if (!c.name) { ui.err = 'Le nom du client est obligatoire.'; return render(); }
    if (c.id) S.clients = S.clients.map(x => x.id === c.id ? c : x);
    else { c.id = uid(); S.clients.push(c); }
    persist('Client enregistré');
    if (ui.back === 'edit') { ui.draft.clientId = c.id; ui.back = null; go('edit'); } else go('clients');
  }
  if (id === 'expform') {
    readExp();
    const x = ui.expDraft;
    if (!x.desc) { ui.err = 'Indiquez un libellé.'; return render(); }
    if (x.amount <= 0) { ui.err = 'Indiquez un montant supérieur à zéro.'; return render(); }
    if (x.id) S.expenses = S.expenses.map(y => y.id === x.id ? x : y);
    else { x.id = uid(); S.expenses.push(x); }
    ui.expDraft = null; ui.err = '';
    persist('Dépense enregistrée'); render();
  }
  if (id === 'catform') {
    const c = ui.catDraft;
    c.name = $('#g-name').value.trim(); c.unit = $('#g-unit').value.trim(); c.price = Math.round(parseNum($('#g-price').value));
    if (!c.name) { ui.err = 'Le nom de la prestation est obligatoire.'; return render(); }
    if (c.id) S.catalog = S.catalog.map(y => y.id === c.id ? c : y);
    else { c.id = uid(); S.catalog.push(c); }
    ui.catDraft = null; ui.err = '';
    persist('Prestation enregistrée'); render();
  }
  if (id === 'setform') {
    ['name', 'job', 'phone', 'email', 'address', 'ninea', 'mentions'].forEach(k => S.company[k] = $('#s-' + k).value.trim());
    S.company.goal = Math.round(parseNum($('#s-goal').value));
    S.company.tvaOn = $('#s-tvaOn').checked;
    S.demo = false;
    persist('Profil enregistré'); render();
  }
});

// Photo du reçu : réduite avant d'être gardée, pour ne pas saturer le stockage
document.addEventListener('change', e => {
  if (e.target.id !== 'e-photo' || !e.target.files[0]) return;
  readExp();
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      ui.expDraft.photo = c.toDataURL('image/jpeg', 0.6); render();
    };
    img.onerror = () => toast('Image illisible. Essayez une photo JPG ou PNG.');
    img.src = r.result;
  };
  r.readAsDataURL(e.target.files[0]);
});

render();
