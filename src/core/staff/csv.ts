/** Reads comma separated text. Handles quotes and line breaks inside quotes. The first line names the columns. */
export function parseCsv(text: string): { header: string[]; rows: Array<Record<string, string>>; error?: string } {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((value) => value.trim() !== '')) lines.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) lines.push(row);
  if (quoted) return { header: [], rows: [], error: 'A quote was opened and never closed.' };
  if (lines.length === 0) return { header: [], rows: [], error: 'The file is empty.' };
  const header = lines[0].map((name) => name.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map((values) => Object.fromEntries(header.map((name, index) => [name, (values[index] ?? '').trim()])));
  return { header, rows };
}
