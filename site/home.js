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

const nf = new Intl.NumberFormat('fr-FR');
const amount = document.getElementById('amount'), out = document.getElementById('words');
function update() {
  const digits = amount.value.replace(/\D/g, '').slice(0, 12);
  const n = digits ? parseInt(digits, 10) : 0;
  if (digits) amount.value = nf.format(n);
  const w = enLettres(n);
  out.innerHTML = digits
    ? `${w.charAt(0).toUpperCase() + w.slice(1)} francs CFA<small>Arrêtée la présente facture à la somme de ${w} (${nf.format(n)}) francs CFA TTC.</small>`
    : `<small>Tapez un montant pour le voir écrit en lettres.</small>`;
}
amount.addEventListener('input', update);
update();

document.getElementById('joinform')?.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('j-name').value.trim(), phone = document.getElementById('j-phone').value.replace(/[^\d+]/g, '');
  const err = document.getElementById('j-err');
  if (!name) { err.textContent = 'Indiquez votre nom.'; err.hidden = false; return; }
  if (phone.replace(/\D/g, '').length < 9) { err.textContent = 'Indiquez un numéro WhatsApp complet, par exemple +221 77 000 00 00.'; err.hidden = false; return; }
  const first = name.split(/\s+/)[0].replace(/[<>&"]/g, '');
  document.getElementById('joinbox').innerHTML = `<div class="form done" role="status"><b>Merci ${first} !</b>
    <p>Dans la version finale, vous recevrez un message WhatsApp de bienvenue.</p>
    <p>Cette page est une maquette : votre inscription n’a pas été enregistrée.</p></div>`;
});
