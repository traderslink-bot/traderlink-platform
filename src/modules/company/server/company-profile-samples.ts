type CompanyProfile = {
  sector: string;
  industry: string;
  headquarters: string;
  employees?: number;
  founded?: number;
  fiscalYearEnd: string;
  website: string;
  description: string;
  source: string;
};

// Verified preview sample. Keyed by issuer CIK so a reused ticker cannot inherit a profile.
const profiles: Readonly<Record<number, CompanyProfile>> = {
  1854963: {
    sector: "Financial Services", industry: "Banks – Regional", headquarters: "Golden, Colorado",
    employees: 39, founded: 2015, fiscalYearEnd: "December 31", website: "https://www.shfinancial.org",
    description: "SHF Holdings helps financial institutions serve cannabis businesses. Its services cover banking access, commercial lending, payments, cash handling, and regulatory compliance.",
    source: "https://uk.finance.yahoo.com/quote/SHFS/",
  },
  1966750: {
    sector: "Financial Services", industry: "Insurance Brokers", headquarters: "Shanghai, China",
    employees: 137, founded: 2015, fiscalYearEnd: "June 30", website: "https://www.zhibao-tech.com",
    description: "Zhibao provides digital insurance brokerage and underwriting services in China. Its platform helps partners design, distribute, and manage insurance products.",
    source: "https://finance.yahoo.com/quote/ZBAO/",
  },
  1825452: {
    sector: "Communication Services", industry: "Internet Content & Information", headquarters: "Wilmington, Delaware",
    employees: 27, founded: 2019, fiscalYearEnd: "December 31", website: "https://www.onfolio.com",
    description: "Onfolio acquires and operates internet businesses. Its portfolio earns revenue from digital services, advertising, and product sales to businesses and consumers.",
    source: "https://sg.finance.yahoo.com/quote/ONFO/",
  },
  2028293: {
    sector: "Industrials", industry: "Pollution & Treatment Controls", headquarters: "Naples, Florida",
    founded: 2022, fiscalYearEnd: "December 31", website: "https://rainwatertech.com",
    description: "Rain Enhancement Technologies develops ionization-based technology intended to increase precipitation. It uses weather stations, rain gauges, and monitoring software to measure results.",
    source: "https://finance.yahoo.com/quote/RAIN/?p=RAIN",
  },
  1888014: {
    sector: "Healthcare", industry: "Drug Manufacturers – Specialty & Generic", headquarters: "Toronto, Canada",
    fiscalYearEnd: "December 31", website: "https://www.akandacorp.com",
    description: "Akanda operates in medical cannabis cultivation, manufacturing, and sales. Its subsidiaries also lease fiber-optic networks and telecommunications towers.",
    source: "https://uk.finance.yahoo.com/quote/AKAN/",
  },
  1944902: {
    sector: "Real Estate", industry: "Real Estate Services", headquarters: "Singapore",
    employees: 150, founded: 2016, fiscalYearEnd: "December 31", website: "https://ohmyhome.com",
    description: "Ohmyhome operates a property technology platform in Singapore and Malaysia. It provides brokerage, property management, renovation, and digital marketing services.",
    source: "https://uk.finance.yahoo.com/quote/OMH/",
  },
  1378140: {
    sector: "Industrials", industry: "Specialty Industrial Machinery", headquarters: "Monroe Township, New Jersey",
    employees: 65, fiscalYearEnd: "April 30", website: "https://www.oceanpowertechnologies.com",
    description: "Ocean Power Technologies supplies equipment and data services for offshore operations. Its products include PowerBuoy platforms and autonomous surface vessels used in defense, energy, and marine research.",
    source: "https://uk.finance.yahoo.com/quote/OPTT/",
  },
};

export function readCompanyProfileSample(cik: number | undefined) {
  return cik === undefined ? undefined : profiles[cik];
}

export function previewCompanyCik(symbol: string) {
  const entry = Object.entries(profiles).find(([, profile]) => new URL(profile.source).pathname === `/quote/${symbol}/`);
  return entry ? Number(entry[0]) : undefined;
}
