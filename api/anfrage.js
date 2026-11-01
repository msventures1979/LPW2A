// Formular-Endpunkt für Vormerkliste und Besichtigungsanfragen (Versand über Resend).
// Umgebungsvariablen in Vercel:
//   RESEND_API_KEY  – Pflicht
//   LPW2A_TO        – Empfänger der Anfragen (Standard: kontakt@marktform.com)
//   LPW2A_FROM      – Absender (Standard: LPW2A Vermietung <lpw2a@marktform.com>)

const TO = process.env.LPW2A_TO || 'kontakt@marktform.com';
const FROM = process.env.LPW2A_FROM || 'LPW2A Vermietung <lpw2a@marktform.com>';
const ALLOWED_HOSTS = ['lpw2a.marktform.com', 'lpw2a.vercel.app', 'localhost'];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s, max) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const isMail = (s) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(s);

async function send(payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()).slice(0, 300));
}

function table(rows) {
  return '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
    rows.filter((r) => r[1]).map((r) => '<tr><td style="color:#5A6164;vertical-align:top">' + esc(r[0]) + '</td><td>' + esc(r[1]).replace(/\n/g, '<br>') + '</td></tr>').join('') +
    '</table>';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }

  const origin = req.headers.origin || req.headers.referer || '';
  let host = '';
  try { host = new URL(origin).hostname; } catch (e) {}
  if (!ALLOWED_HOSTS.includes(host) && !host.endsWith('-marktform.vercel.app')) return res.status(403).json({ ok: false, error: 'origin' });

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }

  // Spamschutz: verstecktes Feld muss leer bleiben, Formular darf nicht in unter 3 Sekunden abgeschickt sein
  if (b.firma) return res.status(200).json({ ok: true });
  if (b.t && Date.now() - Number(b.t) < 3000) return res.status(200).json({ ok: true });

  const type = b.type === 'besichtigung' ? 'besichtigung' : 'vormerken';
  const name = clean(b.name, 120);
  const email = clean(b.email, 200);
  const tel = clean(b.tel, 60);
  const we = clean(b.we || b.wish, 80);
  const termin = clean(b.termin, 120);
  const msg = String(b.msg == null ? '' : b.msg).trim().slice(0, 2000);

  if (!name || !isMail(email) || !b.ok) return res.status(400).json({ ok: false, error: 'input' });
  if (type === 'besichtigung' && (!tel || !termin)) return res.status(400).json({ ok: false, error: 'input' });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: 'config' });

  const label = type === 'besichtigung' ? 'Besichtigungsanfrage' : 'Vormerkung';
  const rows = [['Art', label], ['Name', name], ['E-Mail', email], ['Telefon', tel], ['Termin', termin], ['Wohnung', we], ['Nachricht', msg], ['Eingang', new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })]];

  try {
    await send({
      from: FROM, to: [TO], reply_to: email,
      subject: 'LPW2A – ' + label + ': ' + name + (we ? ' (' + we + ')' : ''),
      html: '<p style="font-family:Arial,sans-serif">Neue ' + label + ' über lpw2a.marktform.com:</p>' + table(rows),
      text: rows.filter((r) => r[1]).map((r) => r[0] + ': ' + r[1]).join('\n')
    });

    const intro = type === 'besichtigung'
      ? 'vielen Dank für Ihre Anfrage zur Besichtigung am Lagerplatzweg 2a. Wir prüfen den gewünschten Termin und bestätigen ihn Ihnen in Kürze persönlich.'
      : 'vielen Dank für Ihr Interesse an LPW2A – Wohnen am Lagerplatzweg. Sie sind vorgemerkt. Wir melden uns, sobald die Vermietung startet, mit Grundrissen, Mietpreisen und Besichtigungsterminen.';
    await send({
      from: FROM, to: [email], reply_to: TO,
      subject: type === 'besichtigung' ? 'Ihre Besichtigungsanfrage – LPW2A' : 'Sie sind vorgemerkt – LPW2A',
      html: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#121618;line-height:1.5"><p>Guten Tag ' + esc(name) + ',</p><p>' + intro + '</p>' + table(rows.slice(1, 7)) +
        '<p>Mit freundlichen Grüßen<br>marktform GmbH – Vermietung LPW2A<br>Turley-Straße 36, 68167 Mannheim</p>' +
        '<p style="font-size:12px;color:#5A6164">Sie erhalten diese E-Mail, weil Ihre Adresse auf lpw2a.marktform.com eingetragen wurde. Waren Sie das nicht, antworten Sie einfach auf diese E-Mail; wir löschen Ihre Daten dann.</p></div>',
      text: 'Guten Tag ' + name + ',\n\n' + intro + '\n\nMit freundlichen Grüßen\nmarktform GmbH – Vermietung LPW2A'
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ ok: false, error: 'send' });
  }
};
