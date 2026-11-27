const accessionPattern = /^\d{10}-\d{2}-\d{6}$/;
const filingDatePattern = /^\d{4}-\d{2}-\d{2}$/;
export const periodicCompanyFiling = /^(?:10-K|10-KT|10-Q|20-F|40-F)(?:\/A)?$/;
const earningsForm = /^(?:8-K|6-K)(?:\/A)?$/;

/** Convert the SEC submissions' aligned columns into independent filing evidence. */
export function companyFilingRows(cik, recent, since, through) {
  return recent.filingDate.flatMap((date, i) => {
    const accession = recent.accessionNumber[i];
    const document = recent.primaryDocument[i];
    const form = recent.form[i];
    if (!filingDatePattern.test(date) || date < since || date > through || !accessionPattern.test(accession) || !form) return [];
    const base = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll("-", "")}`;
    const safeDocument = typeof document === "string" && /^[\w.-]+(?:\/[\w.-]+)*$/.test(document) &&
      !document.split("/").some(part => part === ".." || part === ".");
    return [{
      date, form, accession,
      href: safeDocument ? `${base}/${document}` : `${base}/${accession}-index.htm`,
      reportDate: recent.reportDate?.[i] || undefined,
      acceptedAt: recent.acceptanceDateTime?.[i] || undefined,
      hasStructuredFacts: recent.isXBRL?.[i] === 1 || recent.isInlineXBRL?.[i] === 1,
      earningsAnnouncement: earningsForm.test(form) && (form.startsWith("6-K")
        ? /(?:earning|financial result|operating result)/i.test(recent.primaryDocDescription?.[i] ?? "")
        : /(?:^|,\s*)2\.02(?:,|$)/.test(recent.items?.[i] ?? "")),
    }];
  });
}

export function secFeedFilings(text) {
  if (!/<feed\b/.test(text) || !/<\/feed>\s*$/.test(text)) throw new Error("Invalid SEC filings feed");
  return Array.from(text.matchAll(/<entry>([\s\S]*?)<\/entry>/g), ([, entry]) => {
    const accession = /accession-number=(\d{10}-\d{2}-\d{6})/.exec(entry)?.[1];
    const cik = /\/Archives\/edgar\/data\/(\d+)\//i.exec(entry)?.[1];
    const form = /label="form type" term="([^"]+)"/.exec(entry)?.[1];
    return accession && cik && form ? { accession, cik: cik.padStart(10, "0"), form } : null;
  }).filter(Boolean);
}

export function secIndexFilings(text) {
  const columns = "CIK|Company Name|Form Type|Date Filed|File Name";
  const header = text.indexOf(columns);
  if (header < 0) throw new Error("Invalid SEC filing index");
  const results = [];
  for (const line of text.slice(header + columns.length).split(/\r?\n/).slice(2)) {
    if (!line.trim()) continue;
    const [cik, , form, , path] = line.split("|");
    const accession = /(\d{10}-\d{2}-\d{6})\.txt$/.exec(path)?.[1];
    if (!/^\d{1,10}$/.test(cik) || !accession || !form) throw new Error("Incomplete SEC filing index");
    results.push({ accession, cik: cik.padStart(10, "0"), form });
  }
  return results;
}
