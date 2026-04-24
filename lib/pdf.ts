import type { WeightEntry } from './weight';
import type { MeasurementEntry } from './measurements';
import type { JournalEntry } from './journal';

interface PdfData {
  prenom: string;
  periodLabel: string;
  fromISO: string;
  toISO: string;
  weightEntries: WeightEntry[];
  measurements: MeasurementEntry[];
  journalEntries: JournalEntry[];
  poidsInitial: number | null;
  poidsObjectif: number | null;
}

const MOOD_LABEL: Record<string, string> = {
  difficile: 'Difficile',
  neutre:    'Neutre',
  bien:      'Bien',
  legere:    'Légère',
};

function dateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dateShort(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function round1(n: number) { return Math.round(n * 10) / 10; }

export function buildPdfHtml(data: PdfData): string {
  const { prenom, periodLabel, fromISO, toISO, weightEntries, measurements, journalEntries, poidsInitial, poidsObjectif } = data;

  const generatedAt = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Weight stats ──────────────────────────────────────────
  const hasWeight = weightEntries.length > 0;
  const firstW = hasWeight ? weightEntries[0].poids_kg : null;
  const lastW  = hasWeight ? weightEntries[weightEntries.length - 1].poids_kg : null;
  const minW   = hasWeight ? Math.min(...weightEntries.map(e => e.poids_kg)) : null;
  const maxW   = hasWeight ? Math.max(...weightEntries.map(e => e.poids_kg)) : null;
  const avgW   = hasWeight ? round1(weightEntries.reduce((s, e) => s + e.poids_kg, 0) / weightEntries.length) : null;
  const deltaW = firstW != null && lastW != null ? round1(firstW - lastW) : null;

  // ── Mood stats ────────────────────────────────────────────
  const moodCounts: Record<string, number> = { difficile: 0, neutre: 0, bien: 0, legere: 0 };
  journalEntries.forEach(e => { if (e.humeur && moodCounts[e.humeur] != null) moodCounts[e.humeur]++; });
  const totalMoods = Object.values(moodCounts).reduce((a, b) => a + b, 0);

  // ── Weight table rows (max 90, show every Nth if too many) ──
  const MAX_ROWS = 90;
  const step = Math.ceil(weightEntries.length / MAX_ROWS);
  const displayedWeights = weightEntries.filter((_, i) => i % step === 0 || i === weightEntries.length - 1);

  // ── Measurements table rows ───────────────────────────────
  const hasMeas = measurements.length > 0;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    color: #121E30;
    background: #fff;
    padding: 28mm 20mm;
    line-height: 1.4;
  }
  .mono { font-family: 'Courier New', monospace; }

  /* Header */
  .doc-header { border-bottom: 2px solid #121E30; padding-bottom: 14px; margin-bottom: 20px; }
  .doc-title { font-size: 22pt; letter-spacing: -1px; margin-bottom: 4px; }
  .doc-meta { font-family: 'Courier New', monospace; font-size: 8pt; color: #7A6E62; letter-spacing: 1px; text-transform: uppercase; }
  .doc-meta span + span::before { content: ' · '; }

  /* Sections */
  .section { margin-bottom: 24px; page-break-inside: avoid; }
  .section-title {
    font-family: 'Courier New', monospace;
    font-size: 8pt; color: #7A6E62;
    letter-spacing: 2px; text-transform: uppercase;
    margin-bottom: 6px;
  }
  .section-rule { height: 1px; background: #121E30; margin-bottom: 12px; }

  /* Stats row */
  .stats-grid { display: flex; gap: 0; border: 1px solid #D4C8B8; }
  .stat-cell { flex: 1; padding: 10px 12px; border-right: 1px solid #D4C8B8; }
  .stat-cell:last-child { border-right: none; }
  .stat-val { font-size: 16pt; letter-spacing: -0.5px; }
  .stat-lbl { font-family: 'Courier New', monospace; font-size: 7.5pt; color: #7A6E62; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
  .stat-delta-pos { color: #2A7D5A; }
  .stat-delta-neg { color: #B03030; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  thead tr { border-bottom: 1px solid #121E30; }
  th { font-family: 'Courier New', monospace; font-size: 7.5pt; color: #7A6E62; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 8px; text-align: left; font-weight: normal; }
  td { padding: 5px 8px; border-bottom: 1px solid #E8E0D4; }
  tr:last-child td { border-bottom: none; }
  .td-num { font-family: 'Courier New', monospace; font-size: 9pt; }

  /* Mood bar */
  .mood-grid { display: flex; gap: 8px; }
  .mood-item { flex: 1; }
  .mood-bar-bg { height: 4px; background: #E8E0D4; margin-top: 4px; }
  .mood-bar-fill { height: 4px; }
  .mood-lbl { font-family: 'Courier New', monospace; font-size: 7.5pt; color: #7A6E62; letter-spacing: 1px; text-transform: uppercase; }
  .mood-count { font-size: 14pt; letter-spacing: -0.5px; margin-top: 6px; }

  /* Footer */
  .doc-footer {
    margin-top: 32px;
    padding-top: 10px;
    border-top: 1px solid #D4C8B8;
    font-family: 'Courier New', monospace;
    font-size: 7.5pt;
    color: #9A8E80;
    letter-spacing: 0.3px;
    line-height: 1.7;
  }

  /* Page break hint */
  .page-break { page-break-before: always; }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="doc-header">
    <div class="doc-title">Rapport de suivi — ${prenom}</div>
    <div class="doc-meta">
      <span class="mono">Méthode KMDC</span>
      <span class="mono">${periodLabel}</span>
      <span class="mono">Du ${dateFr(fromISO)} au ${dateFr(toISO)}</span>
      <span class="mono">Généré le ${generatedAt}</span>
    </div>
  </div>

  <!-- WEIGHT STATS -->
  ${hasWeight ? `
  <div class="section">
    <div class="section-title">Évolution du poids</div>
    <div class="section-rule"></div>
    <div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-cell">
        <div class="stat-val">${firstW} kg</div>
        <div class="stat-lbl">Début période</div>
      </div>
      <div class="stat-cell">
        <div class="stat-val">${lastW} kg</div>
        <div class="stat-lbl">Fin période</div>
      </div>
      <div class="stat-cell">
        <div class="stat-val ${deltaW != null && deltaW > 0 ? 'stat-delta-pos' : deltaW != null && deltaW < 0 ? 'stat-delta-neg' : ''}">
          ${deltaW != null ? (deltaW > 0 ? '↓ ' + deltaW : deltaW < 0 ? '↑ ' + Math.abs(deltaW) : '=') : '—'} kg
        </div>
        <div class="stat-lbl">Variation</div>
      </div>
      <div class="stat-cell">
        <div class="stat-val">${minW} kg</div>
        <div class="stat-lbl">Minimum</div>
      </div>
      <div class="stat-cell">
        <div class="stat-val">${maxW} kg</div>
        <div class="stat-lbl">Maximum</div>
      </div>
      <div class="stat-cell">
        <div class="stat-val">${avgW} kg</div>
        <div class="stat-lbl">Moyenne</div>
      </div>
    </div>
    ${poidsObjectif != null && lastW != null ? `
    <div style="font-family:'Courier New',monospace;font-size:8pt;color:#7A6E62;letter-spacing:1px;margin-bottom:16px">
      OBJECTIF : ${poidsObjectif} kg
      ${lastW <= poidsObjectif
        ? ' · ✓ OBJECTIF ATTEINT'
        : ' · RESTANT : ' + round1(lastW - poidsObjectif) + ' kg'}
    </div>` : ''}
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th style="text-align:right">Poids (kg)</th>
          <th style="text-align:right">Variation</th>
        </tr>
      </thead>
      <tbody>
        ${displayedWeights.map((e, i) => {
          const prev = i > 0 ? displayedWeights[i - 1].poids_kg : null;
          const diff = prev != null ? round1(e.poids_kg - prev) : null;
          const diffStr = diff == null ? '' : (diff > 0 ? '+' + diff : diff === 0 ? '=' : String(diff));
          const diffColor = diff == null ? '' : diff < 0 ? '#2A7D5A' : diff > 0 ? '#B03030' : '#7A6E62';
          return `<tr>
            <td>${dateFr(e.date_mesure)}</td>
            <td class="td-num" style="text-align:right">${e.poids_kg}</td>
            <td class="td-num" style="text-align:right;color:${diffColor}">${diffStr}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>` : `
  <div class="section">
    <div class="section-title">Évolution du poids</div>
    <div class="section-rule"></div>
    <p style="font-family:'Courier New',monospace;font-size:9pt;color:#9A8E80;font-style:italic">Aucune pesée enregistrée sur cette période.</p>
  </div>`}

  <!-- MEASUREMENTS -->
  ${hasMeas ? `
  <div class="section" style="page-break-before: ${weightEntries.length > 20 ? 'always' : 'auto'}">
    <div class="section-title">Mesures corporelles</div>
    <div class="section-rule"></div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th style="text-align:right">Taille (cm)</th>
          <th style="text-align:right">Hanches (cm)</th>
          <th style="text-align:right">Bras (cm)</th>
          <th style="text-align:right">Cuisse (cm)</th>
        </tr>
      </thead>
      <tbody>
        ${measurements.map(m => `<tr>
          <td>${dateFr(m.date_mesure)}</td>
          <td class="td-num" style="text-align:right">${m.tour_taille_cm ?? '—'}</td>
          <td class="td-num" style="text-align:right">${m.tour_hanches_cm ?? '—'}</td>
          <td class="td-num" style="text-align:right">${m.tour_bras_cm ?? '—'}</td>
          <td class="td-num" style="text-align:right">${m.tour_cuisse_cm ?? '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- MOOD SUMMARY -->
  ${totalMoods > 0 ? `
  <div class="section">
    <div class="section-title">Humeur — ${totalMoods} jour${totalMoods > 1 ? 's' : ''} enregistré${totalMoods > 1 ? 's' : ''}</div>
    <div class="section-rule"></div>
    <div class="mood-grid">
      ${(['legere', 'bien', 'neutre', 'difficile'] as const).map(key => {
        const count = moodCounts[key] ?? 0;
        const pct = totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0;
        const colors: Record<string, string> = { legere: '#2A7D5A', bien: '#4A6B9A', neutre: '#8A7A20', difficile: '#B03030' };
        return `<div class="mood-item">
          <div class="mood-lbl">${MOOD_LABEL[key]}</div>
          <div class="mood-count">${count}</div>
          <div style="font-family:'Courier New',monospace;font-size:7.5pt;color:#9A8E80">${pct} %</div>
          <div class="mood-bar-bg"><div class="mood-bar-fill" style="width:${pct}%;background:${colors[key]}"></div></div>
        </div>`;
      }).join('')}
    </div>
  </div>` : ''}

  <!-- FOOTER -->
  <div class="doc-footer">
    Ce document a été généré par l'application Méthode KMDC à des fins de suivi personnel.
    Il ne constitue pas un diagnostic médical. Consultez votre médecin pour toute interprétation clinique.
    Période : ${dateFr(fromISO)} — ${dateFr(toISO)} · ${weightEntries.length} pesée${weightEntries.length > 1 ? 's' : ''} · ${measurements.length} mesure${measurements.length > 1 ? 's' : ''} · ${totalMoods} entrée${totalMoods > 1 ? 's' : ''} journal
  </div>

</body>
</html>`;
}
