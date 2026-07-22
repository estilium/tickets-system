#!/usr/bin/env node
/*
 Usage:
  node scripts/retry_failed_rows.js --csv /path/original.csv --errors /path/errors.json --out /path/failed-only.csv

 - `errors.json` should be the `details.errors` array returned by the backend, example:
   [{"row":2,"error":"requester not found (foo@bar)"}, {"row":5,"error":"assigned user not found"}]

 The script will create a CSV with the same headers as the original but containing only the failed rows (preserving order).
*/

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      out[k] = v;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const csvPath = args.csv;
  const errorsPath = args.errors;
  const outPath = args.out || path.join(process.cwd(), 'failed_rows.csv');

  if (!csvPath || !errorsPath) {
    console.error('Missing required args. See header comments.');
    process.exit(2);
  }

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    process.exit(2);
  }
  if (!fs.existsSync(errorsPath)) {
    console.error('Errors file not found:', errorsPath);
    process.exit(2);
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const errorsText = fs.readFileSync(errorsPath, 'utf8');

  let errors;
  try {
    errors = JSON.parse(errorsText);
  } catch (e) {
    console.error('Failed to parse errors JSON:', e.message || e);
    process.exit(2);
  }

  // Expect errors to be array of { row: number }
  const rowsToPick = new Set(errors.map((r) => Number(r.row)).filter(Boolean));
  if (rowsToPick.size === 0) {
    console.error('No rows found in errors JSON (expected array of {row:number}).');
    process.exit(2);
  }

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: false });
  const data = parsed.data; // array of objects
  const fields = parsed.meta.fields || Object.keys(data[0] || {});

  // Our earlier backend reported row numbers starting at 1 for first data row.
  const selected = [];
  rowsToPick.forEach((rowNum) => {
    const idx = rowNum - 1; // convert to 0-based
    if (idx >= 0 && idx < data.length) selected.push(data[idx]);
  });

  if (selected.length === 0) {
    console.error('No matching rows found in CSV for the provided row numbers.');
    process.exit(2);
  }

  const outCsv = Papa.unparse({ fields, data: selected });
  fs.writeFileSync(outPath, outCsv, 'utf8');
  console.log(`Wrote ${selected.length} rows to ${outPath}`);
  console.log('You can now upload this CSV via the UI (Importar CSV) or with curl to POST /api/tickets/import');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
