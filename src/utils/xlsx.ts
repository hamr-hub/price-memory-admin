import * as XLSX from "xlsx";

export function buildXlsxBlob(sheetName: string, rows: any[], headers?: { key: string; label: string }[]) {
  let data = rows;
  let ws;
  if (headers && headers.length) {
    const mapped = rows.map((r) => {
      const obj: any = {};
      headers.forEach((h) => { obj[h.label] = r[h.key]; });
      return obj;
    });
    ws = XLSX.utils.json_to_sheet(mapped);
  } else {
    ws = XLSX.utils.json_to_sheet(data);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const array = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

