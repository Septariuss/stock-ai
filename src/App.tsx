import { useState, useRef, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── IHSG CHART DATA ──────────────────────────────────────────────────────────
const IHSG_DATA = [
  { date: "Jan '24", val: 7280 },
  { date: "Feb '24", val: 7311 },
  { date: "Mar '24", val: 7288 },
  { date: "Apr '24", val: 7119 },
  { date: "May '24", val: 6970 },
  { date: "Jun '24", val: 7063 },
  { date: "Jul '24", val: 7228 },
  { date: "Aug '24", val: 7504 },
  { date: "Sep '24", val: 7697 },
  { date: "Okt '24", val: 7456 },
  { date: "Nov '24", val: 7162 },
  { date: "Des '24", val: 7079 },
  { date: "Jan '25", val: 6922 },
  { date: "Feb '25", val: 6780 },
  { date: "Mar '25", val: 6596 },
  { date: "Apr '25", val: 6253 },
  { date: "May '25", val: 6489 },
  { date: "Jun '25", val: 6714 },
  { date: "Jul '25", val: 6831 },
  { date: "Aug '25", val: 6908 },
  { date: "Sep '25", val: 7012 },
  { date: "Okt '25", val: 6988 },
  { date: "Nov '25", val: 6947 },
  { date: "Des '25", val: 6978 },
  { date: "Jan '26", val: 7034 },
  { date: "Feb '26", val: 7112 },
  { date: "Mar '26", val: 7089 },
  { date: "Apr '26", val: 6955 },
  { date: "May '26", val: 6858 },
];

const IHSG_DAILY = [
  { t: "08:00", v: 6905 },
  { t: "08:15", v: 6897 },
  { t: "08:30", v: 6882 },
  { t: "08:45", v: 6871 },
  { t: "09:00", v: 6865 },
  { t: "09:15", v: 6858 },
  { t: "09:30", v: 6863 },
  { t: "09:45", v: 6859 },
  { t: "10:00", v: 6855 },
  { t: "10:15", v: 6852 },
  { t: "10:30", v: 6848 },
  { t: "10:45", v: 6853 },
  { t: "11:00", v: 6857 },
  { t: "11:15", v: 6861 },
  { t: "11:30", v: 6858 },
];
// —— FETCH HARGA REAL-TIME ——————————————————————
async function fetchHargaRealtime(kode: string): Promise<number | null> {
  const endpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/" + kode + ".JK")}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://query2.finance.yahoo.com/v8/finance/chart/" + kode + ".JK")}`,
    `https://corsproxy.io/?${encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/" + kode + ".JK")}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const d = await r.json();
      const harga = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (harga && harga > 0) return harga;
    } catch {
      continue;
    }
  }
  return null;
}
// —— FETCH DATA HISTORIS GRAFIK ——————————————————————
async function fetchChartData(kode: string, range: string = "1mo"): Promise<{date: string, val: number}[] | null> {
  const intervalMap: Record<string, string> = {
    "1D": "5m", "1W": "1h", "1M": "1d", "3M": "1d", "1Y": "1wk", "5Y": "1mo"
  };
  const rangeMap: Record<string, string> = {
    "1D": "1d", "1W": "5d", "1M": "1mo", "3M": "3mo", "1Y": "1y", "5Y": "5y"
  };
  const interval = intervalMap[range] || "1d";
  const rangeVal = rangeMap[range] || "1mo";
  const endpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/" + kode + ".JK?interval=" + interval + "&range=" + rangeVal)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://query2.finance.yahoo.com/v8/finance/chart/" + kode + ".JK?interval=" + interval + "&range=" + rangeVal)}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const d = await r.json();
      const result = d?.chart?.result?.[0];
      if (!result) continue;
      const timestamps: number[] = result.timestamp || [];
      const closes: number[] = result.indicators?.quote?.[0]?.close || [];
      if (timestamps.length === 0) continue;
      return timestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        const label = range === "1D"
          ? date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          : date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        return { date: label, val: Math.round(closes[i] || 0) };
      }).filter(p => p.val > 0);
    } catch {
      continue;
    }
  }
  return null;
}

// ─── IDX FULL STOCK LIST ──────────────────────────────────────────────────────
const STOCKS = [
  // LQ45 / Blue Chips
  {
    code: "BBCA",
    name: "Bank Central Asia",
    sector: "Perbankan",
    price: 9250,
    change: 1.2,
    vol: "142.3M",
    mktcap: "1.14T",
    pe: 24.1,
    pb: 4.2,
    roe: 18.2,
    der: 0.8,
    rec: "BUY",
    target: 10200,
    desc: "Bank swasta terbesar di Indonesia dengan kualitas aset premium",
  },
  {
    code: "BBRI",
    name: "Bank Rakyat Indonesia",
    sector: "Perbankan",
    price: 4180,
    change: -0.48,
    vol: "389.1M",
    mktcap: "628.4B",
    pe: 11.8,
    pb: 2.1,
    roe: 17.4,
    der: 1.1,
    rec: "BUY",
    target: 4800,
    desc: "Bank BUMN fokus UMKM, jaringan terluas di Indonesia",
  },
  {
    code: "BMRI",
    name: "Bank Mandiri",
    sector: "Perbankan",
    price: 5475,
    change: 0.64,
    vol: "201.7M",
    mktcap: "507.2B",
    pe: 12.3,
    pb: 2.3,
    roe: 18.9,
    der: 1.0,
    rec: "BUY",
    target: 6200,
    desc: "Bank BUMN terbesar dari sisi aset, ekspansi kredit agresif",
  },
  {
    code: "TLKM",
    name: "Telekomunikasi Indonesia",
    sector: "Telekomunikasi",
    price: 2890,
    change: 0.35,
    vol: "98.4M",
    mktcap: "286.1B",
    pe: 15.2,
    pb: 2.8,
    roe: 19.1,
    der: 0.9,
    rec: "HOLD",
    target: 3100,
    desc: "Operator telco terbesar, transformasi digital via Telkomsel",
  },
  {
    code: "ASII",
    name: "Astra International",
    sector: "Otomotif",
    price: 4940,
    change: -1.1,
    vol: "167.2M",
    mktcap: "200.3B",
    pe: 9.7,
    pb: 1.4,
    roe: 14.8,
    der: 1.3,
    rec: "HOLD",
    target: 5200,
    desc: "Konglomerat otomotif, alat berat, dan jasa keuangan",
  },
  {
    code: "UNVR",
    name: "Unilever Indonesia",
    sector: "Konsumsi",
    price: 1835,
    change: 0.82,
    vol: "44.8M",
    mktcap: "70.1B",
    pe: 21.4,
    pb: 8.9,
    roe: 41.2,
    der: 0.6,
    rec: "HOLD",
    target: 2000,
    desc: "Pemimpin FMCG dengan portofolio brand consumer kuat",
  },
  {
    code: "GOTO",
    name: "GoTo Gojek Tokopedia",
    sector: "Teknologi",
    price: 68,
    change: 2.94,
    vol: "8.2B",
    mktcap: "65.8B",
    pe: null,
    pb: 1.1,
    roe: -4.2,
    der: 0.4,
    rec: "SPEC",
    target: 90,
    desc: "Ekosistem super-app terbesar Indonesia, on-track profitabilitas",
  },
  {
    code: "CUAN",
    name: "Petrindo Jaya Kreasi",
    sector: "Tambang",
    price: 845,
    change: -8.04,
    vol: "1.2B",
    mktcap: "125.9B",
    pe: 423,
    pb: 14.5,
    roe: 3.1,
    der: 3.2,
    rec: "SELL",
    target: 600,
    desc: "Batu bara kokas milik Prajogo Pangestu, terdepak MSCI",
  },
  {
    code: "BREN",
    name: "Barito Renewables Energy",
    sector: "Energi",
    price: 3120,
    change: -5.2,
    vol: "312.4M",
    mktcap: "298.7B",
    pe: 45.2,
    pb: 9.1,
    roe: 20.3,
    der: 2.1,
    rec: "SELL",
    target: 2400,
    desc: "EBT geothermal Barito Pacific, terdepak dari MSCI",
  },
  {
    code: "AMMN",
    name: "Amman Mineral Internasional",
    sector: "Tambang",
    price: 8900,
    change: -3.7,
    vol: "88.1M",
    mktcap: "342.1B",
    pe: 18.4,
    pb: 3.2,
    roe: 17.4,
    der: 0.7,
    rec: "HOLD",
    target: 9500,
    desc: "Produsen tembaga & emas Sumbawa, terdampak MSCI rebalancing",
  },
  {
    code: "INDF",
    name: "Indofood Sukses Makmur",
    sector: "Konsumsi",
    price: 6250,
    change: 0.48,
    vol: "55.3M",
    mktcap: "54.7B",
    pe: 8.9,
    pb: 1.1,
    roe: 12.4,
    der: 0.9,
    rec: "BUY",
    target: 7000,
    desc: "Induk usaha ICBP, Bogasari, dan perkebunan sawit",
  },
  {
    code: "ICBP",
    name: "Indofood CBP Sukses Makmur",
    sector: "Konsumsi",
    price: 8750,
    change: 1.16,
    vol: "33.7M",
    mktcap: "101.8B",
    pe: 16.2,
    pb: 3.4,
    roe: 21.1,
    der: 0.5,
    rec: "BUY",
    target: 9800,
    desc: "Produsen mi instan Indomie, ekspansi ke Nigeria & Eropa",
  },
  // Perbankan tambahan
  {
    code: "BNGA",
    name: "Bank CIMB Niaga",
    sector: "Perbankan",
    price: 1285,
    change: 0.39,
    vol: "28.4M",
    mktcap: "31.7B",
    pe: 7.8,
    pb: 0.9,
    roe: 12.1,
    der: 1.2,
    rec: "BUY",
    target: 1500,
    desc: "Bank swasta menengah atas, anak usaha CIMB Group Malaysia",
  },
  {
    code: "BBNI",
    name: "Bank Negara Indonesia",
    sector: "Perbankan",
    price: 4280,
    change: -0.23,
    vol: "76.3M",
    mktcap: "160.8B",
    pe: 9.1,
    pb: 1.4,
    roe: 15.4,
    der: 1.0,
    rec: "BUY",
    target: 4900,
    desc: "Bank BUMN terbesar ke-4, kuat di segmen korporasi",
  },
  {
    code: "BRIS",
    name: "Bank Syariah Indonesia",
    sector: "Perbankan",
    price: 1725,
    change: 1.47,
    vol: "112.4M",
    mktcap: "81.4B",
    pe: 18.3,
    pb: 2.1,
    roe: 12.8,
    der: 0.7,
    rec: "BUY",
    target: 2100,
    desc: "Bank syariah terbesar di Indonesia, pertumbuhan solid",
  },
  {
    code: "MEGA",
    name: "Bank Mega",
    sector: "Perbankan",
    price: 6250,
    change: 0.8,
    vol: "4.1M",
    mktcap: "24.5B",
    pe: 10.2,
    pb: 1.6,
    roe: 16.8,
    der: 0.8,
    rec: "HOLD",
    target: 6800,
    desc: "Bank swasta menengah milik CT Corp, fokus ritel premium",
  },
  {
    code: "ARTO",
    name: "Bank Jago",
    sector: "Perbankan",
    price: 2430,
    change: 3.18,
    vol: "18.9M",
    mktcap: "36.9B",
    pe: null,
    pb: 4.2,
    roe: 1.3,
    der: 0.2,
    rec: "SPEC",
    target: 3000,
    desc: "Neobank digital mitra GoTo, dalam proses menuju profitabilitas",
  },
  {
    code: "BTPS",
    name: "Bank BTPN Syariah",
    sector: "Perbankan",
    price: 1020,
    change: -0.97,
    vol: "6.3M",
    mktcap: "16.3B",
    pe: 11.4,
    pb: 1.8,
    roe: 16.4,
    der: 0.5,
    rec: "HOLD",
    target: 1150,
    desc: "Bank syariah fokus segmen prasejahtera (pembiayaan produktif)",
  },
  {
    code: "PNBN",
    name: "Bank Pan Indonesia",
    sector: "Perbankan",
    price: 1045,
    change: 0.48,
    vol: "12.5M",
    mktcap: "27.8B",
    pe: 7.2,
    pb: 0.7,
    roe: 9.3,
    der: 1.1,
    rec: "HOLD",
    target: 1200,
    desc: "Bank menengah swasta nasional, fokus korporasi & komersial",
  },
  {
    code: "BDMN",
    name: "Bank Danamon Indonesia",
    sector: "Perbankan",
    price: 2230,
    change: -0.22,
    vol: "5.8M",
    mktcap: "21.3B",
    pe: 8.9,
    pb: 0.9,
    roe: 10.5,
    der: 0.9,
    rec: "HOLD",
    target: 2500,
    desc: "Bank dengan fokus consumer & SME, anak usaha MUFG Jepang",
  },
  // Energi & Pertambangan
  {
    code: "ADRO",
    name: "Adaro Energy Indonesia",
    sector: "Tambang",
    price: 1625,
    change: -0.61,
    vol: "145.6M",
    mktcap: "52.1B",
    pe: 7.3,
    pb: 1.1,
    roe: 15.2,
    der: 0.5,
    rec: "HOLD",
    target: 1850,
    desc: "Produsen batu bara thermal terbesar ke-2 Indonesia",
  },
  {
    code: "PTBA",
    name: "Bukit Asam",
    sector: "Tambang",
    price: 2890,
    change: 0.87,
    vol: "34.2M",
    mktcap: "33.4B",
    pe: 8.1,
    pb: 1.3,
    roe: 16.4,
    der: 0.3,
    rec: "BUY",
    target: 3300,
    desc: "BUMN batu bara, diversifikasi ke pembangkit listrik & EBT",
  },
  {
    code: "ITMG",
    name: "Indo Tambangraya Megah",
    sector: "Tambang",
    price: 25100,
    change: 1.21,
    vol: "4.8M",
    mktcap: "28.4B",
    pe: 7.8,
    pb: 2.1,
    roe: 27.4,
    der: 0.2,
    rec: "BUY",
    target: 28000,
    desc: "Produsen batu bara premium, dividen yield tinggi konsisten",
  },
  {
    code: "INCO",
    name: "Vale Indonesia",
    sector: "Tambang",
    price: 3420,
    change: -1.44,
    vol: "9.2M",
    mktcap: "33.8B",
    pe: 14.2,
    pb: 1.2,
    roe: 8.6,
    der: 0.3,
    rec: "HOLD",
    target: 3800,
    desc: "Produsen nikel matte terbesar Indonesia, mitra Vale Brasil",
  },
  {
    code: "ANTM",
    name: "Aneka Tambang",
    sector: "Tambang",
    price: 1480,
    change: 2.07,
    vol: "102.3M",
    mktcap: "35.5B",
    pe: 18.6,
    pb: 2.0,
    roe: 10.9,
    der: 0.9,
    rec: "HOLD",
    target: 1700,
    desc: "BUMN pertambangan emas, nikel, bauksit, dan logam mulia",
  },
  {
    code: "MEDC",
    name: "Medco Energi Internasional",
    sector: "Energi",
    price: 1285,
    change: 0.78,
    vol: "38.5M",
    mktcap: "26.9B",
    pe: 6.1,
    pb: 1.0,
    roe: 16.2,
    der: 1.8,
    rec: "BUY",
    target: 1550,
    desc: "Perusahaan migas swasta terbesar Indonesia, diversifikasi ke LNG",
  },
  {
    code: "PGAS",
    name: "Perusahaan Gas Negara",
    sector: "Energi",
    price: 1535,
    change: -0.32,
    vol: "47.2M",
    mktcap: "37.4B",
    pe: 12.4,
    pb: 1.5,
    roe: 12.3,
    der: 0.8,
    rec: "HOLD",
    target: 1750,
    desc: "BUMN distribusi dan transmisi gas bumi nasional",
  },
  {
    code: "AKRA",
    name: "AKR Corporindo",
    sector: "Energi",
    price: 1405,
    change: 0.36,
    vol: "13.8M",
    mktcap: "27.0B",
    pe: 10.8,
    pb: 2.3,
    roe: 21.2,
    der: 0.6,
    rec: "BUY",
    target: 1650,
    desc: "Distribusi BBM industri, kawasan industri JIIPE Gresik",
  },
  // Konsumsi & Ritel
  {
    code: "UNTR",
    name: "United Tractors",
    sector: "Alat Berat",
    price: 22750,
    change: 0.22,
    vol: "6.4M",
    mktcap: "85.0B",
    pe: 8.1,
    pb: 1.6,
    roe: 19.8,
    der: 0.6,
    rec: "BUY",
    target: 26000,
    desc: "Distributor alat berat Komatsu, tambang emas & kontraktor",
  },
  {
    code: "HMSP",
    name: "HM Sampoerna",
    sector: "Konsumsi",
    price: 740,
    change: -0.67,
    vol: "43.2M",
    mktcap: "86.0B",
    pe: 14.8,
    pb: 4.3,
    roe: 29.4,
    der: 0.3,
    rec: "HOLD",
    target: 840,
    desc: "Produsen rokok terbesar Indonesia, anak usaha Philip Morris",
  },
  {
    code: "GGRM",
    name: "Gudang Garam",
    sector: "Konsumsi",
    price: 16875,
    change: -0.44,
    vol: "2.1M",
    mktcap: "32.5B",
    pe: 12.3,
    pb: 1.1,
    roe: 9.1,
    der: 0.3,
    rec: "HOLD",
    target: 18500,
    desc: "Produsen rokok kretek nasional, pasar jatuh setelah cukai naik",
  },
  {
    code: "KLBF",
    name: "Kalbe Farma",
    sector: "Farmasi",
    price: 1490,
    change: 0.68,
    vol: "31.4M",
    mktcap: "69.8B",
    pe: 21.3,
    pb: 3.2,
    roe: 15.2,
    der: 0.2,
    rec: "BUY",
    target: 1750,
    desc: "Perusahaan farmasi terbesar Indonesia, ekspansi ke ASEAN",
  },
  {
    code: "SIDO",
    name: "Industri Jamu & Farmasi SIDO",
    sector: "Farmasi",
    price: 595,
    change: 0.85,
    vol: "14.2M",
    mktcap: "17.9B",
    pe: 15.6,
    pb: 3.1,
    roe: 20.1,
    der: 0.1,
    rec: "BUY",
    target: 700,
    desc: "Produsen Tolak Angin & Kuku Bima, kas berlimpah & dividen tinggi",
  },
  {
    code: "MYOR",
    name: "Mayora Indah",
    sector: "Konsumsi",
    price: 2440,
    change: 1.25,
    vol: "9.8M",
    mktcap: "54.8B",
    pe: 17.4,
    pb: 3.6,
    roe: 21.2,
    der: 0.7,
    rec: "BUY",
    target: 2800,
    desc: "Produsen biskuit, wafer, kopi Kopiko, ekspansi ekspor kuat",
  },
  {
    code: "ULTJ",
    name: "Ultra Jaya Milk Industry",
    sector: "Konsumsi",
    price: 1985,
    change: 0.51,
    vol: "8.3M",
    mktcap: "28.5B",
    pe: 19.8,
    pb: 3.1,
    roe: 16.0,
    der: 0.1,
    rec: "HOLD",
    target: 2200,
    desc: "Produsen susu UHT Ultra Milk terbesar Indonesia",
  },
  {
    code: "AMRT",
    name: "Sumber Alfaria Trijaya",
    sector: "Ritel",
    price: 1015,
    change: -3.33,
    vol: "78.4M",
    mktcap: "48.7B",
    pe: 26.4,
    pb: 7.1,
    roe: 26.8,
    der: 1.3,
    rec: "SELL",
    target: 850,
    desc: "Operator Alfamart, terdepak MSCI. Tekanan forced selling",
  },
  {
    code: "MAPI",
    name: "Mitra Adiperkasa",
    sector: "Ritel",
    price: 1315,
    change: 0.38,
    vol: "12.4M",
    mktcap: "22.4B",
    pe: 14.8,
    pb: 2.3,
    roe: 15.5,
    der: 1.1,
    rec: "BUY",
    target: 1550,
    desc: "Operator ritel merek mewah & sport, recovery pasca pandemi solid",
  },
  // Properti & Infrastruktur
  {
    code: "BSDE",
    name: "Bumi Serpong Damai",
    sector: "Properti",
    price: 885,
    change: 1.14,
    vol: "82.4M",
    mktcap: "51.8B",
    pe: 11.4,
    pb: 0.7,
    roe: 6.4,
    der: 0.6,
    rec: "BUY",
    target: 1050,
    desc: "Developer properti terbesar Serpong, konsep township",
  },
  {
    code: "SMRA",
    name: "Summarecon Agung",
    sector: "Properti",
    price: 545,
    change: -0.91,
    vol: "24.6M",
    mktcap: "12.5B",
    pe: 13.2,
    pb: 0.9,
    roe: 7.2,
    der: 1.2,
    rec: "HOLD",
    target: 620,
    desc: "Developer properti Kelapa Gading, Bekasi, Bandung",
  },
  {
    code: "CTRA",
    name: "Ciputra Development",
    sector: "Properti",
    price: 965,
    change: 0.52,
    vol: "62.1M",
    mktcap: "35.7B",
    pe: 14.6,
    pb: 1.3,
    roe: 9.1,
    der: 0.9,
    rec: "HOLD",
    target: 1100,
    desc: "Developer properti skala nasional, 80+ proyek di 33 kota",
  },
  {
    code: "PWON",
    name: "Pakuwon Jati",
    sector: "Properti",
    price: 458,
    change: 0.66,
    vol: "48.3M",
    mktcap: "22.1B",
    pe: 10.8,
    pb: 1.1,
    roe: 10.2,
    der: 0.7,
    rec: "HOLD",
    target: 530,
    desc: "Developer properti dengan recurring income tinggi dari mall",
  },
  {
    code: "JSMR",
    name: "Jasa Marga",
    sector: "Infrastruktur",
    price: 4210,
    change: -0.24,
    vol: "22.1M",
    mktcap: "63.9B",
    pe: 16.4,
    pb: 2.0,
    roe: 12.2,
    der: 3.1,
    rec: "HOLD",
    target: 4700,
    desc: "BUMN operator tol terbesar Indonesia, pendapatan recurring",
  },
  {
    code: "WIKA",
    name: "Wijaya Karya",
    sector: "Infrastruktur",
    price: 298,
    change: -1.98,
    vol: "56.8M",
    mktcap: "6.7B",
    pe: null,
    pb: 0.4,
    roe: -8.2,
    der: 4.8,
    rec: "SELL",
    target: 250,
    desc: "BUMN konstruksi besar, beban utang tinggi pasca proyek IKN",
  },
  {
    code: "WSKT",
    name: "Waskita Karya",
    sector: "Infrastruktur",
    price: 102,
    change: -2.86,
    vol: "112.4M",
    mktcap: "5.6B",
    pe: null,
    pb: 0.3,
    roe: -12.4,
    der: 8.2,
    rec: "SELL",
    target: 80,
    desc: "BUMN konstruksi dalam restrukturisasi utang, risiko sangat tinggi",
  },
  {
    code: "PTPP",
    name: "PP Persero",
    sector: "Infrastruktur",
    price: 412,
    change: 0.49,
    vol: "28.4M",
    mktcap: "6.2B",
    pe: null,
    pb: 0.5,
    roe: -2.1,
    der: 3.6,
    rec: "SELL",
    target: 350,
    desc: "BUMN konstruksi, recovery perlahan dari proyek strategis",
  },
  // Teknologi & Komunikasi
  {
    code: "EMTK",
    name: "Elang Mahkota Teknologi",
    sector: "Teknologi",
    price: 725,
    change: 0.14,
    vol: "9.4M",
    mktcap: "40.3B",
    pe: 28.4,
    pb: 1.3,
    roe: 4.6,
    der: 0.3,
    rec: "HOLD",
    target: 850,
    desc: "Induk SCTV & Indosiar, investasi di ekosistem digital",
  },
  {
    code: "MTEL",
    name: "Dayamitra Telekomunikasi",
    sector: "Telekomunikasi",
    price: 685,
    change: 1.03,
    vol: "52.3M",
    mktcap: "67.9B",
    pe: 21.8,
    pb: 2.1,
    roe: 9.8,
    der: 1.8,
    rec: "BUY",
    target: 800,
    desc: "Tower telco Mitratel anak usaha Telkom, recurring income",
  },
  {
    code: "TBIG",
    name: "Tower Bersama Infrastructure",
    sector: "Telekomunikasi",
    price: 2020,
    change: -0.49,
    vol: "18.6M",
    mktcap: "47.3B",
    pe: 26.3,
    pb: 4.2,
    roe: 16.0,
    der: 5.1,
    rec: "HOLD",
    target: 2300,
    desc: "Operator menara telko terbesar ke-2 Indonesia",
  },
  {
    code: "ISAT",
    name: "Indosat Ooredoo Hutchison",
    sector: "Telekomunikasi",
    price: 2940,
    change: 0.68,
    vol: "24.5M",
    mktcap: "32.0B",
    pe: 13.5,
    pb: 1.2,
    roe: 8.8,
    der: 1.6,
    rec: "HOLD",
    target: 3300,
    desc: "Operator telco ke-2 terbesar pasca merger dengan Hutchison",
  },
  // Keuangan Non-Bank
  {
    code: "BBTN",
    name: "Bank Tabungan Negara",
    sector: "Perbankan",
    price: 1275,
    change: -0.39,
    vol: "68.4M",
    mktcap: "13.5B",
    pe: 6.8,
    pb: 0.5,
    roe: 7.4,
    der: 9.2,
    rec: "HOLD",
    target: 1450,
    desc: "Bank BUMN fokus KPR bersubsidi, sensitivif suku bunga tinggi",
  },
  {
    code: "MFIN",
    name: "Mandiri Utama Finance",
    sector: "Keuangan",
    price: 985,
    change: 0.51,
    vol: "3.2M",
    mktcap: "7.8B",
    pe: 7.8,
    pb: 1.4,
    roe: 18.2,
    der: 2.1,
    rec: "BUY",
    target: 1200,
    desc: "Multifinance anak usaha Bank Mandiri, kuat di pembiayaan motor",
  },
  {
    code: "BFIN",
    name: "BFI Finance Indonesia",
    sector: "Keuangan",
    price: 1145,
    change: 0.88,
    vol: "8.6M",
    mktcap: "11.5B",
    pe: 8.4,
    pb: 1.6,
    roe: 19.4,
    der: 2.4,
    rec: "BUY",
    target: 1350,
    desc: "Perusahaan pembiayaan independen terbesar, fokus kendaraan",
  },
  {
    code: "WOMF",
    name: "Wahana Ottomitra Multiartha",
    sector: "Keuangan",
    price: 334,
    change: -0.59,
    vol: "2.1M",
    mktcap: "2.8B",
    pe: 5.8,
    pb: 0.6,
    roe: 10.4,
    der: 2.8,
    rec: "HOLD",
    target: 380,
    desc: "Pembiayaan motor bekas, anak usaha Bank BNI",
  },
  // Healthcare / Farmasi
  {
    code: "HEAL",
    name: "Medikaloka Hermina",
    sector: "Kesehatan",
    price: 1325,
    change: 2.32,
    vol: "4.8M",
    mktcap: "14.2B",
    pe: 22.4,
    pb: 3.0,
    roe: 13.8,
    der: 0.8,
    rec: "BUY",
    target: 1600,
    desc: "Jaringan rumah sakit Hermina, 44 RS di seluruh Indonesia",
  },
  {
    code: "SILO",
    name: "Siloam International Hospitals",
    sector: "Kesehatan",
    price: 2980,
    change: 1.36,
    vol: "7.1M",
    mktcap: "24.7B",
    pe: 28.4,
    pb: 4.1,
    roe: 14.4,
    der: 0.7,
    rec: "BUY",
    target: 3500,
    desc: "Jaringan RS premium Lippo, 40+ rumah sakit seluruh Indonesia",
  },
  {
    code: "PRDA",
    name: "Prodia Widyahusada",
    sector: "Kesehatan",
    price: 4320,
    change: 0.23,
    vol: "1.4M",
    mktcap: "12.4B",
    pe: 23.8,
    pb: 3.8,
    roe: 16.0,
    der: 0.1,
    rec: "HOLD",
    target: 4800,
    desc: "Jaringan laboratorium klinik swasta terbesar, 290+ outlet",
  },
  {
    code: "SOHO",
    name: "Soho Global Health",
    sector: "Farmasi",
    price: 5100,
    change: 0.39,
    vol: "1.2M",
    mktcap: "8.6B",
    pe: 14.2,
    pb: 2.1,
    roe: 14.8,
    der: 0.4,
    rec: "HOLD",
    target: 5800,
    desc: "Perusahaan farmasi dengan brand Imboost, IPI, dan Curcuma",
  },
  {
    code: "PYFA",
    name: "Pyridam Farma",
    sector: "Farmasi",
    price: 960,
    change: 2.13,
    vol: "0.8M",
    mktcap: "0.7B",
    pe: 13.4,
    pb: 1.2,
    roe: 9.2,
    der: 0.3,
    rec: "HOLD",
    target: 1100,
    desc: "Produsen obat generik & etikal berskala menengah",
  },
  // Agribisnis
  {
    code: "AALI",
    name: "Astra Agro Lestari",
    sector: "Agribisnis",
    price: 8325,
    change: -0.6,
    vol: "3.8M",
    mktcap: "16.5B",
    pe: 9.6,
    pb: 1.1,
    roe: 11.8,
    der: 0.4,
    rec: "HOLD",
    target: 9200,
    desc: "Produsen CPO anak usaha Astra, 286.000 ha kebun sawit",
  },
  {
    code: "LSIP",
    name: "PP London Sumatra Indonesia",
    sector: "Agribisnis",
    price: 1185,
    change: 0.85,
    vol: "7.4M",
    mktcap: "8.1B",
    pe: 7.8,
    pb: 0.7,
    roe: 9.2,
    der: 0.2,
    rec: "BUY",
    target: 1400,
    desc: "Produsen CPO dan karet Lonsum milik Indofood Agri",
  },
  {
    code: "SGRO",
    name: "Sampoerna Agro",
    sector: "Agribisnis",
    price: 1845,
    change: 1.1,
    vol: "2.1M",
    mktcap: "6.5B",
    pe: 9.2,
    pb: 0.8,
    roe: 8.8,
    der: 0.3,
    rec: "HOLD",
    target: 2100,
    desc: "Produsen CPO sagu & biofuel, punya SMART Bioseed",
  },
  // Material & Semen
  {
    code: "SMGR",
    name: "Semen Indonesia",
    sector: "Material",
    price: 3410,
    change: 0.59,
    vol: "24.3M",
    mktcap: "20.3B",
    pe: 11.2,
    pb: 0.8,
    roe: 7.4,
    der: 1.0,
    rec: "HOLD",
    target: 3850,
    desc: "BUMN produsen semen terbesar, kapasitas 54 juta ton/tahun",
  },
  {
    code: "INTP",
    name: "Indocement Tunggal Prakarsa",
    sector: "Material",
    price: 6750,
    change: -0.22,
    vol: "8.1M",
    mktcap: "24.9B",
    pe: 17.4,
    pb: 1.0,
    roe: 5.8,
    der: 0.1,
    rec: "HOLD",
    target: 7500,
    desc: "Produsen semen Tiga Roda, anak usaha HeidelbergMaterials",
  },
  {
    code: "TPIA",
    name: "Chandra Asri Pacific",
    sector: "Material",
    price: 4850,
    change: -4.15,
    vol: "42.4M",
    mktcap: "193.7B",
    pe: 31.2,
    pb: 2.8,
    roe: 9.0,
    der: 1.2,
    rec: "SELL",
    target: 3800,
    desc: "Produsen petrokimia terbesar Asia Tenggara, terdepak MSCI",
  },
  {
    code: "BRPT",
    name: "Barito Pacific",
    sector: "Material",
    price: 1350,
    change: -1.46,
    vol: "34.5M",
    mktcap: "55.0B",
    pe: 12.4,
    pb: 1.2,
    roe: 9.8,
    der: 0.9,
    rec: "HOLD",
    target: 1550,
    desc: "Induk Chandra Asri dan BREN milik Prajogo Pangestu",
  },
  // Transport & Logistik
  {
    code: "GIAA",
    name: "Garuda Indonesia",
    sector: "Transportasi",
    price: 60,
    change: -3.23,
    vol: "184.2M",
    mktcap: "7.0B",
    pe: null,
    pb: 0.7,
    roe: -18.4,
    der: 7.6,
    rec: "SELL",
    target: 45,
    desc: "Maskapai nasional dalam pemulihan pasca restrukturisasi utang",
  },
  {
    code: "BIRD",
    name: "Blue Bird",
    sector: "Transportasi",
    price: 1485,
    change: 0.34,
    vol: "4.2M",
    mktcap: "7.7B",
    pe: 12.4,
    pb: 1.4,
    roe: 11.4,
    der: 0.4,
    rec: "HOLD",
    target: 1700,
    desc: "Operator taksi terbesar Indonesia, transformasi digital Gojek",
  },
  {
    code: "ASSA",
    name: "Adi Sarana Armada",
    sector: "Transportasi",
    price: 342,
    change: 0.59,
    vol: "12.4M",
    mktcap: "4.2B",
    pe: 9.8,
    pb: 1.1,
    roe: 11.2,
    der: 1.8,
    rec: "BUY",
    target: 420,
    desc: "Penyewaan kendaraan armada korporasi & logistik",
  },
  {
    code: "SMDR",
    name: "Samudera Indonesia",
    sector: "Transportasi",
    price: 2480,
    change: 1.23,
    vol: "1.8M",
    mktcap: "5.3B",
    pe: 4.8,
    pb: 0.6,
    roe: 12.2,
    der: 0.8,
    rec: "BUY",
    target: 2900,
    desc: "Pelayaran peti kemas dan logistik terintegrasi",
  },
  // Lainnya
  {
    code: "ACES",
    name: "Ace Hardware Indonesia",
    sector: "Ritel",
    price: 1025,
    change: 0.49,
    vol: "18.6M",
    mktcap: "17.6B",
    pe: 20.8,
    pb: 4.1,
    roe: 19.8,
    der: 0.1,
    rec: "BUY",
    target: 1200,
    desc: "Ritel peralatan rumah tangga & gaya hidup premium",
  },
  {
    code: "ERAA",
    name: "Erajaya Swasembada",
    sector: "Ritel",
    price: 485,
    change: 2.1,
    vol: "16.4M",
    mktcap: "5.9B",
    pe: 8.4,
    pb: 0.9,
    roe: 10.8,
    der: 0.9,
    rec: "BUY",
    target: 580,
    desc: "Distributor smartphone & elektronik terbesar Indonesia",
  },
  {
    code: "MIDI",
    name: "Midi Utama Indonesia",
    sector: "Ritel",
    price: 1285,
    change: 0.78,
    vol: "8.3M",
    mktcap: "10.7B",
    pe: 22.4,
    pb: 5.8,
    roe: 26.4,
    der: 1.4,
    rec: "HOLD",
    target: 1450,
    desc: "Operator Alfamidi dan Lawson, afiliasi Alfamart Group",
  },
  {
    code: "DSSA",
    name: "Dian Swastatika Sentosa",
    sector: "Energi",
    price: 46200,
    change: -3.95,
    vol: "0.4M",
    mktcap: "148.2B",
    pe: 12.8,
    pb: 2.1,
    roe: 16.4,
    der: 0.8,
    rec: "SELL",
    target: 38000,
    desc: "Grup Sinar Mas, batu bara & infrastruktur. Terdepak MSCI",
  },
  {
    code: "SRTG",
    name: "Saratoga Investama Sedaya",
    sector: "Investasi",
    price: 3280,
    change: 0.92,
    vol: "4.2M",
    mktcap: "18.4B",
    pe: 9.8,
    pb: 0.7,
    roe: 7.2,
    der: 0.3,
    rec: "BUY",
    target: 3800,
    desc: "Investment holding Sandiaga Uno & Edwin Soeryadjaya",
  },
  {
    code: "MDKA",
    name: "Merdeka Copper Gold",
    sector: "Tambang",
    price: 2640,
    change: -1.49,
    vol: "28.4M",
    mktcap: "66.2B",
    pe: 42.4,
    pb: 2.8,
    roe: 6.8,
    der: 1.1,
    rec: "HOLD",
    target: 3000,
    desc: "Produsen emas & tembaga, ekosistem baterai EV Merdeka Battery",
  },
  {
    code: "HRUM",
    name: "Harum Energy",
    sector: "Tambang",
    price: 1085,
    change: 0.46,
    vol: "18.4M",
    mktcap: "14.4B",
    pe: 9.8,
    pb: 1.2,
    roe: 12.2,
    der: 0.2,
    rec: "BUY",
    target: 1280,
    desc: "Batu bara & nickel, transisi ke baterai EV",
  },
  {
    code: "INKP",
    name: "Indah Kiat Pulp & Paper",
    sector: "Material",
    price: 7825,
    change: 1.04,
    vol: "12.4M",
    mktcap: "64.8B",
    pe: 7.8,
    pb: 0.9,
    roe: 11.4,
    der: 1.2,
    rec: "BUY",
    target: 9000,
    desc: "Produsen pulp & kertas APP Sinar Mas, ekspor dominan",
  },
  {
    code: "TKIM",
    name: "Pabrik Kertas Tjiwi Kimia",
    sector: "Material",
    price: 4890,
    change: 0.62,
    vol: "3.8M",
    mktcap: "14.8B",
    pe: 6.8,
    pb: 0.8,
    roe: 11.8,
    der: 0.8,
    rec: "BUY",
    target: 5700,
    desc: "Produsen kertas printing & writing terbesar Asia Tenggara",
  },
  {
    code: "SMBR",
    name: "Semen Baturaja",
    sector: "Material",
    price: 248,
    change: -0.8,
    vol: "8.4M",
    mktcap: "3.3B",
    pe: null,
    pb: 0.5,
    roe: -3.2,
    der: 1.4,
    rec: "SELL",
    target: 200,
    desc: "BUMN semen di Sumatera Selatan, kinerja merugi",
  },
  {
    code: "BULL",
    name: "Buana Lintas Lautan",
    sector: "Transportasi",
    price: 152,
    change: 3.4,
    vol: "48.4M",
    mktcap: "6.0B",
    pe: 5.2,
    pb: 0.7,
    roe: 13.4,
    der: 1.6,
    rec: "BUY",
    target: 185,
    desc: "Operator kapal tanker minyak, beneficiary harga minyak tinggi",
  },
  {
    code: "NCKL",
    name: "Trimegah Bangun Persada",
    sector: "Tambang",
    price: 818,
    change: -2.15,
    vol: "62.4M",
    mktcap: "96.3B",
    pe: 14.8,
    pb: 2.2,
    roe: 14.8,
    der: 0.6,
    rec: "HOLD",
    target: 950,
    desc: "Produsen nikel terbesar di Sulawesi, hilirisasi ke EV battery",
  },
  {
    code: "ELSA",
    name: "Elnusa",
    sector: "Energi",
    price: 392,
    change: 0.77,
    vol: "18.4M",
    mktcap: "4.2B",
    pe: 9.8,
    pb: 1.4,
    roe: 14.2,
    der: 0.6,
    rec: "BUY",
    target: 470,
    desc: "Jasa dan fasilitas migas anak usaha Pertamina",
  },
  {
    code: "MPXL",
    name: "MPX Logistics International",
    sector: "Transportasi",
    price: 145,
    change: 1.4,
    vol: "22.4M",
    mktcap: "1.3B",
    pe: 12.4,
    pb: 1.1,
    roe: 9.2,
    der: 0.8,
    rec: "HOLD",
    target: 170,
    desc: "Jasa logistik & kurir pengiriman, momentum e-commerce",
  },
];

const SECTOR_MAP = {
  Perbankan: "#2563eb",
  Telekomunikasi: "#7c3aed",
  Otomotif: "#d97706",
  Teknologi: "#059669",
  Tambang: "#dc2626",
  Energi: "#0891b2",
  Konsumsi: "#db2777",
  Ritel: "#ea580c",
  Properti: "#65a30d",
  Infrastruktur: "#0284c7",
  Keuangan: "#4f46e5",
  Kesehatan: "#0d9488",
  Farmasi: "#6d28d9",
  Agribisnis: "#16a34a",
  Material: "#b45309",
  Transportasi: "#0369a1",
  Investasi: "#9333ea",
  "Alat Berat": "#b45309",
};

const REC_COLOR = {
  BUY: "#22c55e",
  HOLD: "#f59e0b",
  SELL: "#ef4444",
  SPEC: "#a855f7",
};

const NEWS = [
  {
    time: "09:14",
    tag: "MSCI",
    cat: "Market",
    headline:
      "MSCI Depak 6 Saham RI dari Global Standard Index, Outflow Diperkirakan $3,4 Miliar",
    impact: "neg",
    detail:
      "Efektif 29 Mei 2026. CUAN, BREN, AMMN, TPIA, DSSA, AMRT keluar dari indeks bergengsi global.",
  },
  {
    time: "08:47",
    tag: "IHSG",
    cat: "Makro",
    headline:
      "IHSG Rawan Koreksi ke 6.644–6.727 Pasca Pengumuman Hasil MSCI Semi-Annual Review",
    impact: "neg",
    detail:
      "Analis MNC Sekuritas memperkirakan IHSG di wave [v] dari wave A dari wave (2).",
  },
  {
    time: "08:22",
    tag: "BBCA",
    cat: "Emiten",
    headline:
      "BBCA Cetak Laba Bersih Rp12,1 Triliun di Q1-2026, Tumbuh 8,3% Year-on-Year",
    impact: "pos",
    detail:
      "NIM stabil di 5,6%. Kredit tumbuh 10,2% YoY. Manajemen optimistis target tahunan tercapai.",
  },
  {
    time: "07:55",
    tag: "TLKM",
    cat: "Emiten",
    headline:
      "Telkomsel Luncurkan Jaringan 5G di 50 Kota Baru, Dorong Pertumbuhan Layanan Digital",
    impact: "pos",
    detail:
      "Target coverage 100 kota di akhir 2026. Pendapatan digital tumbuh 18% di Q1-2026.",
  },
  {
    time: "07:30",
    tag: "CUAN",
    cat: "MSCI",
    headline:
      "CUAN Resmi Keluar MSCI — Forced Selling ETF Global Bayangi Harga Hingga 29 Mei",
    impact: "neg",
    detail:
      "Saham milik Prajogo Pangestu ini terdampak HSC MSCI. Beta 2.29, volatilitas ekstrem.",
  },
  {
    time: "07:05",
    tag: "BMRI",
    cat: "Emiten",
    headline:
      "Bank Mandiri Ekspansi Kredit UMKM, Targetkan Pertumbuhan 15% Sepanjang 2026",
    impact: "pos",
    detail:
      "Program KUR Bank Mandiri sentuh 2,3 juta debitur. NPL terjaga di 1,2%.",
  },
  {
    time: "06:40",
    tag: "GOTO",
    cat: "Emiten",
    headline:
      "GoTo Catatkan GMV Rp85 Triliun di Q1-2026, Fintech GoPay Semakin Dominan",
    impact: "pos",
    detail:
      "GoPay tumbuh 34% YoY. Adjusted EBITDA positif untuk kuartal ketiga berturut-turut.",
  },
  {
    time: "06:15",
    tag: "BREN",
    cat: "MSCI",
    headline:
      "BREN Terdepak MSCI, Analis Perkirakan Koreksi Lebih Dalam ke Support Rp2.400",
    impact: "neg",
    detail:
      "Dana pasif yang mereplikasi MSCI wajib melikuidasi posisi sebelum 29 Mei 2026.",
  },
];

// —— GROQ API ——————————————————————————————————————————
async function callClaude(messages, system) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer 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",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1200,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "Tidak ada respons.";
}

const SYS = `Anda adalah Senior Financial Analyst IDX profesional dengan 15 tahun pengalaman. Spesialis saham Indonesia (IDX/BEI).
Jawab dalam Bahasa Indonesia yang lugas, tajam, dan profesional seperti laporan riset sekuritas.
Konteks pasar hari ini (13 Mei 2026):
- MSCI depak 6 saham RI (CUAN, BREN, AMMN, TPIA, DSSA, AMRT) efektif 29 Mei 2026
- IHSG di 6.858 (−0,68%), sentimen negatif
- Estimasi outflow asing $3,4 miliar
Format analisis: gunakan angka konkret, persentase, level harga. Selalu sertakan: Rating (BUY/HOLD/SELL), Target Price, Stop Loss.
Akhiri setiap respons dengan: ⚠️ Disclaimer: Analisis ini bersifat edukatif. Bukan saran investasi resmi. DYOR.`;

// ─── Generate chart data per-saham ───────────────────────────────────────────
function genStockData(price, change, points = 30) {
  const data = [];
  let cur = price * (1 - change / 100);
  const labels = ["Apr 14", "Apr 21", "Apr 28", "Mei 5", "Mei 12", "Mei 13"];
  for (let i = 0; i < points; i++) {
    cur = cur * (1 + (Math.random() - 0.49) * 0.018);
    const d = new Date(2026, 3, 13 + i);
    data.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      val: Math.round(cur),
    });
  }
  // force last point to equal current price
  data[data.length - 1].val = price;
  return data;
}

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = "Rp" }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 11,
        color: "#94a3b8",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ color: "#60a5fa", fontWeight: 600, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>
        {prefix}
        {payload[0].value.toLocaleString("id-ID")}
      </div>
    </div>
  );
}

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
function Spark({ up, w = 72, h = 28 }) {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const t = i / 13,
      base = h / 2 - (up ? 1 : -1) * t * 8;
    return `${t * w},${Math.max(
      3,
      Math.min(h - 3, base + Math.sin(i * 2.3 + (up ? 1 : -1)) * 4)
    )}`;
  }).join(" L ");
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ text, color }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 4,
        background: `${color}1a`,
        color,
        border: `1px solid ${color}33`,
        letterSpacing: "0.04em",
      }}
    >
      {text}
    </span>
  );
}

// ─── LOADER ───────────────────────────────────────────────────────────────────
function Loader({ text = "Menganalisis" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 0",
        color: "#64748b",
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#3b82f6",
              animation: `bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
      <span>{text}...</span>
    </div>
  );
}

// ─── RENDER AI TEXT ───────────────────────────────────────────────────────────
function renderText(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return (
        <div
          key={i}
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "#60a5fa",
            margin: "16px 0 6px",
            borderBottom: "1px solid rgba(59,130,246,0.15)",
            paddingBottom: 5,
          }}
        >
          {line.slice(3)}
        </div>
      );
    if (line.startsWith("# "))
      return (
        <div
          key={i}
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#f1f5f9",
            margin: "14px 0 7px",
          }}
        >
          {line.slice(2)}
        </div>
      );
    if (line.match(/^[★💰🎯🛑📊⏱⚡📋📈📰⚖️]/))
      return (
        <div
          key={i}
          style={{
            fontSize: 13,
            color: "#cbd5e1",
            padding: "3px 0",
            lineHeight: 1.7,
          }}
        >
          {line}
        </div>
      );
    if (line.startsWith("✓") || line.startsWith("•") || line.startsWith("-"))
      return (
        <div
          key={i}
          style={{
            fontSize: 12,
            color: "#94a3b8",
            padding: "2px 0 2px 10px",
            lineHeight: 1.6,
            borderLeft: "2px solid rgba(59,130,246,0.4)",
            marginLeft: 4,
            marginBottom: 2,
          }}
        >
          {line.replace(/^[-•✓]\s*/, "")}
        </div>
      );
    if (line.startsWith("⚠️"))
      return (
        <div
          key={i}
          style={{
            fontSize: 11,
            color: "#64748b",
            marginTop: 14,
            padding: "8px 12px",
            background: "rgba(59,130,246,0.06)",
            borderRadius: 6,
            border: "1px solid rgba(59,130,246,0.15)",
          }}
        >
          {line}
        </div>
      );
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    const bold = line.replace(
      /\*\*([^*]+)\*\*/g,
      (_, t) => `<strong style="color:#e2e8f0">${t}</strong>`
    );
    return (
      <div
        key={i}
        style={{
          fontSize: 13,
          color: "#94a3b8",
          lineHeight: 1.75,
          marginBottom: 2,
        }}
        dangerouslySetInnerHTML={{ __html: bold }}
      />
    );
  });
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selStock, setSelStock] = useState(STOCKS[0]);
  const [watchlist, setWatchlist] = useState(["BBCA", "BMRI", "TLKM"]);
  const [filter, setFilter] = useState("Semua");
  const [searchQ, setSearchQ] = useState("");
  const [chartRange, setChartRange] = useState("1M");
  const [chatLog, setChatLog] = useState([
    {
      role: "assistant",
      content:
        "Selamat datang di **StockAI Pro**. Saya siap membahas saham IDX, analisis fundamental & teknikal, strategi portofolio, atau kondisi pasar.\n\nApa yang ingin Anda analisis? 📊",
    },
  ]);
  const [chatIn, setChatIn] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [anResult, setAnResult] = useState("");
  const [anBusy, setAnBusy] = useState(false);
  const [recoRes, setRecoRes] = useState("");
  const [recoBusy, setRecoBusy] = useState(false);
  const [stockChartData, setStockChartData] = useState({});
  const chatRef = useRef(null);
  const [hargaLive, setHargaLive] = useState<Record<string, number>>({});

  useEffect(() => {
    STOCKS.forEach(async (s) => {
      const harga = await fetchHargaRealtime(s.code);
      if (harga) setHargaLive((prev) => ({ ...prev, [s.code]: harga }));
    });
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [chatLog, chatBusy]);

  // fetch chart data real-time untuk saham yang dipilih
  useEffect(() => {
    const key = selStock.code + "_" + chartRange;
    if (!stockChartData[key]) {
      // Tampilkan data generated dulu sementara loading
      setStockChartData((p) => ({
        ...p,
        [key]: genStockData(hargaLive[selStock.code] || selStock.price, selStock.change),
      }));
      // Fetch data real dari Yahoo Finance
      fetchChartData(selStock.code, chartRange).then((data) => {
        if (data && data.length > 0) {
          setStockChartData((p) => ({ ...p, [key]: data }));
        }
      });
    }
  }, [selStock.code, chartRange]);

  const sectors = [
    "Semua",
    ...[...new Set(STOCKS.map((s) => s.sector))].sort(),
  ];
  const visStocks = STOCKS.filter((s) => {
    const secOk = filter === "Semua" || s.sector === filter;
    const searchOk =
      !searchQ ||
      s.code.includes(searchQ.toUpperCase()) ||
      s.name.toLowerCase().includes(searchQ.toLowerCase());
    return secOk && searchOk;
  });

  const portfolioItems = [
    { code: "BBCA", qty: 100, avgPrice: 8900, currentPrice: hargaLive["BBCA"] || 9250 },
    { code: "CUAN", qty: 500, avgPrice: 1053, currentPrice: hargaLive["CUAN"] || 845 },
    { code: "TLKM", qty: 200, avgPrice: 2750, currentPrice: hargaLive["TLKM"] || 2890 },
  ];
  const totalCost = portfolioItems.reduce((a, i) => a + i.qty * i.avgPrice, 0);
  const totalVal = portfolioItems.reduce((a, i) => a + i.qty * i.currentPrice, 0);
  const totalPnl = totalVal - totalCost;
  const totalPct = ((totalPnl / totalCost) * 100).toFixed(2);

  const fmtRp = (n) => `Rp${n.toLocaleString("id-ID")}`;
  const fmtPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

  const sendChat = async () => {
    if (!chatIn.trim() || chatBusy) return;
    const msg = chatIn.trim();
    setChatLog((p) => [...p, { role: "user", content: msg }]);
    setChatIn("");
    setChatBusy(true);
    try {
      const history = [...chatLog, { role: "user", content: msg }]
        .filter((m) => m.role !== "system")
        .slice(-12)
        .map((m) => ({
          role: m.role,
          content: m.content.replace(/\*\*/g, ""),
        }));
      const reply = await callClaude(history, SYS);
      setChatLog((p) => [...p, { role: "assistant", content: reply }]);
    } catch {
      setChatLog((p) => [
        ...p,
        { role: "assistant", content: "⚠️ Koneksi error. Coba lagi." },
      ]);
    }
    setChatBusy(false);
  };

  const runAnalysis = async (s = selStock) => {
    setAnBusy(true);
    setAnResult("");
    try {
      const r = await callClaude(
        [
          {
            role: "user",
            content: `Buat laporan analisis LENGKAP saham ${s.code} (${
              s.name
            }) untuk investor jangka pendek (<12 bulan).\n\nData:\n- Harga: ${fmtRp(
              s.price
            )} (${s.change > 0 ? "+" : ""}${s.change}%)\n- Sektor: ${
              s.sector
            }\n- PE: ${s.pe || "N/A"}x | PBV: ${s.pb}x | ROE: ${
              s.roe
            }% | DER: ${s.der}x\n- Market Cap: Rp${
              s.mktcap
            }\n\nStruktur:\n1. 📋 PROFIL BISNIS\n2. 📊 ANALISIS FUNDAMENTAL\n3. 📈 ANALISIS TEKNIKAL\n4. 📰 SENTIMEN & KATALIS\n5. ⚖️ RISIKO UTAMA\n6. 🎯 REKOMENDASI: Rating | Target | Stop Loss | Horizon`,
          },
        ],
        SYS
      );
      setAnResult(r);
    } catch {
      setAnResult("Gagal memuat analisis.");
    }
    setAnBusy(false);
  };

  const runReco = async () => {
    setRecoBusy(true);
    setRecoRes("");
    try {
      const r = await callClaude(
        [
          {
            role: "user",
            content: `Berikan 5 REKOMENDASI SAHAM IDX TERBAIK untuk dibeli (13 Mei 2026), jangka pendek.\nHindari: CUAN, BREN, AMMN, TPIA, DSSA.\nFormat:\n## [N]. [KODE] — [NAMA]\n★ Rating:\n💰 Harga Saat Ini:\n🎯 Target Price:\n🛑 Stop Loss:\n📊 Alasan Utama: (3 poin)\n⏱ Horizon:`,
          },
        ],
        SYS
      );
      setRecoRes(r);
    } catch {
      setRecoRes("Gagal memuat rekomendasi.");
    }
    setRecoBusy(false);
  };

  const toggleWL = (code) =>
    setWatchlist((p) =>
      p.includes(code) ? p.filter((c) => c !== code) : [...p, code]
    );

  // ─── STYLES ─────────────────────────────────────────────────────────────────
  const C = {
    page: {
      fontFamily: "'DM Sans',system-ui,sans-serif",
      background: "#060d1a",
      color: "#e2e8f0",
      minHeight: "100vh",
    },
    hdr: {
      background: "rgba(6,13,26,0.97)",
      borderBottom: "1px solid rgba(59,130,246,0.12)",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 56,
      position: "sticky",
      top: 0,
      zIndex: 200,
      backdropFilter: "blur(16px)",
    },
    nav: { display: "flex", gap: 2 },
    nb: (a) => ({
      background: a ? "rgba(59,130,246,0.12)" : "transparent",
      color: a ? "#60a5fa" : "#64748b",
      border: a ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
      borderRadius: 7,
      padding: "6px 14px",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 500,
      transition: "all 0.15s",
    }),
    main: { padding: "20px 24px", maxWidth: 1440, margin: "0 auto" },
    card: {
      background: "rgba(10,18,35,0.9)",
      border: "1px solid rgba(59,130,246,0.08)",
      borderRadius: 12,
      padding: 18,
      backdropFilter: "blur(10px)",
    },
    cardB: {
      background: "rgba(10,18,35,0.9)",
      border: "1px solid rgba(59,130,246,0.2)",
      borderRadius: 12,
      padding: 18,
      backdropFilter: "blur(10px)",
    },
    ttl: {
      fontSize: 10,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 12,
    },
    g4: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 14,
      marginBottom: 16,
    },
    g3: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 14,
      marginBottom: 16,
    },
    g2: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 },
    g21: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 },
    scroll: {
      overflowY: "auto",
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(59,130,246,0.2) transparent",
    },
  };

  const logo = {
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg,#3b82f6,#60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const statCard = (
    label,
    val,
    sub,
    color = "#f1f5f9",
    accent = "rgba(59,130,246,0.1)"
  ) => (
    <div
      style={{
        background: "rgba(10,18,35,0.9)",
        border: `1px solid ${accent}`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 22,
          color,
          letterSpacing: "-0.02em",
        }}
      >
        {val}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );

  const sectorColor = (s) => SECTOR_MAP[s] || "#3b82f6";

  // ─── STOCK CHART AREA ─────────────────────────────────────────────────────
  const StockChart = ({ stock }) => {
    const key = stock.code + "_" + chartRange;
    const data =
      stockChartData[key] ||
      genStockData(hargaLive[stock.code] || stock.price, stock.change);
    const isUp = stock.change >= 0;
    const min = Math.min(...data.map((d) => d.val)) * 0.998;
    const max = Math.max(...data.map((d) => d.val)) * 1.002;
    return (
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isUp ? "#22c55e" : "#ef4444"}
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor={isUp ? "#22c55e" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              domain={[min, max]}
              tick={{ fontSize: 9, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              width={38}
            />
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(59,130,246,0.06)"
              vertical={false}
            />
            <Tooltip content={(props: any) => <ChartTooltip {...props} />} />
            <Area
              type="monotone"
              dataKey="val"
              stroke={isUp ? "#22c55e" : "#ef4444"}
              strokeWidth={1.5}
              fill="url(#stockGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ─── IHSG CHART ───────────────────────────────────────────────────────────
  const IHSGChart = () => (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={IHSG_DATA}
          margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="ihsgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#475569" }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            domain={[5800, 7800]}
            tick={{ fontSize: 9, fill: "#475569" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`}
            width={38}
          />
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(59,130,246,0.06)"
            vertical={false}
          />
          <Tooltip content={<ChartTooltip prefix="" />} />
          <ReferenceLine
            y={6858}
            stroke="rgba(239,68,68,0.5)"
            strokeDasharray="4 4"
            label={{ value: "Now", fill: "#ef4444", fontSize: 9 }}
          />
          <Area
            type="monotone"
            dataKey="val"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#ihsgGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const IHSGDaily = () => (
    <div style={{ height: 130 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={IHSG_DAILY}
          margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fontSize: 9, fill: "#475569" }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            domain={[6840, 6920]}
            tick={{ fontSize: 9, fill: "#475569" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString()}
            width={48}
          />
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(59,130,246,0.06)"
            vertical={false}
          />
          <Tooltip content={<ChartTooltip prefix="" />} />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#ef4444"
            strokeWidth={1.5}
            fill="url(#dailyGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  // ─── SECTOR BAR CHART ─────────────────────────────────────────────────────
  const SectorChart = () => {
    const sData = [...new Set(STOCKS.map((s) => s.sector))]
      .map((sec) => {
        const ss = STOCKS.filter((s) => s.sector === sec);
        const avg = ss.reduce((a, s) => a + s.change, 0) / ss.length;
        return {
          name: sec.slice(0, 7),
          val: parseFloat(avg.toFixed(2)),
          color: avg >= 0 ? "#22c55e" : "#ef4444",
        };
      })
      .sort((a, b) => b.val - a.val);
    return (
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sData}
            margin={{ top: 5, right: 0, bottom: 24, left: 0 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={32}
            />
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(59,130,246,0.06)"
              vertical={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div
                    style={{
                      background: "#0f172a",
                      border: "1px solid rgba(59,130,246,0.3)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 11,
                    }}
                  >
                    <div style={{ color: "#60a5fa", fontWeight: 600 }}>
                      {label}
                    </div>
                    <div
                      style={{
                        color: payload[0].value >= 0 ? "#22c55e" : "#ef4444",
                        fontWeight: 700,
                      }}
                    >
                      {payload[0].value}%
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="val" radius={[3, 3, 0, 0]}>
              {sData.map((entry, i) => (
                <rect key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.25);border-radius:2px}
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-5px);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse2{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .fade{animation:fadeUp 0.3s ease both}
        .row-h:hover{background:rgba(59,130,246,0.04)!important;cursor:pointer}
        .btn-p{transition:all 0.2s}
        .btn-p:hover{opacity:0.85;transform:translateY(-1px)}
        .nav-h:hover{color:#60a5fa!important;background:rgba(59,130,246,0.06)!important}
        input,textarea{caret-color:#3b82f6}
        .stock-sel{background:rgba(59,130,246,0.08)!important;border-color:rgba(59,130,246,0.25)!important}
        .pill-active{background:rgba(59,130,246,0.15)!important;color:#60a5fa!important;border-color:rgba(59,130,246,0.4)!important}
      `}</style>

      <div style={C.page}>
        {/* ── HEADER ─────────────────────────────────────── */}
        <header style={C.hdr}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              📈
            </div>
            <span style={logo}>StockAI Pro</span>
            <span
              style={{
                fontSize: 10,
                color: "#334155",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                paddingLeft: 12,
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              IDX ANALYTICS
            </span>
          </div>

          <nav style={C.nav}>
            {[
              ["dashboard", "Dashboard"],
              ["analisis", "Analisis"],
              ["grafik", "Grafik IDX"],
              ["portofolio", "Portofolio"],
              ["rekomendasi", "Rekomendasi"],
              ["chat", "Chat AI"],
            ].map(([id, lb]) => (
              <button
                key={id}
                className="nav-h"
                style={C.nb(page === id)}
                onClick={() => setPage(id)}
              >
                {lb}
                {id === "chat" && (
                  <span
                    style={{
                      marginLeft: 5,
                      background: "#1d4ed8",
                      color: "#93c5fd",
                      borderRadius: 3,
                      fontSize: 9,
                      padding: "1px 5px",
                      fontWeight: 700,
                    }}
                  >
                    AI
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 12,
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  color: "#475569",
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                IHSG
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#ef4444",
                  letterSpacing: "-0.02em",
                }}
              >
                6.858{" "}
                <span style={{ fontSize: 11, fontWeight: 500 }}>▼ 0,68%</span>
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 28,
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <div style={{ fontSize: 11, color: "#64748b" }}>
              <div style={{ color: "#60a5fa", fontWeight: 600 }}>
                13 Mei 2026
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10 }}>
                11:33 WIB
              </div>
            </div>
          </div>
        </header>

        {/* ── TICKER TAPE ─────────────────────────────────── */}
        <div
          style={{
            background: "rgba(8,14,28,0.95)",
            borderBottom: "1px solid rgba(59,130,246,0.08)",
            overflow: "hidden",
            height: 32,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "rgba(29,78,216,0.2)",
              borderRight: "1px solid rgba(59,130,246,0.15)",
              padding: "0 12px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse2 2s infinite",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#3b82f6",
                  letterSpacing: "0.1em",
                }}
              >
                LIVE
              </span>
            </div>
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div
              style={{
                display: "flex",
                gap: 24,
                animation: "ticker 40s linear infinite",
                width: "max-content",
                padding: "0 24px",
              }}
            >
              {[...STOCKS, ...STOCKS].map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelStock(s);
                    setPage("analisis");
                    runAnalysis(s);
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#94a3b8" }}>
                    {s.code}
                  </span>
                  <span
                    style={{
                      color: "#475569",
                      margin: "0 4px",
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 10,
                    }}
                  >
                    {fmtRp(s.price)}
                  </span>
                  <span
                    style={{
                      color: s.change >= 0 ? "#22c55e" : "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {fmtPct(s.change)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <main style={C.main}>
          {/* ════════ DASHBOARD ═══════════════════════════ */}
          {page === "dashboard" && (
            <div className="fade">
              {/* KPI */}
              <div style={C.g4}>
                {statCard(
                  "IHSG",
                  "6.858",
                  "▼ −47pt (−0,68%) hari ini",
                  "#ef4444",
                  "rgba(239,68,68,0.12)"
                )}
                {statCard(
                  "Outflow MSCI",
                  "$3,4M",
                  "Estimasi forced selling 29 Mei",
                  "#f59e0b",
                  "rgba(245,158,11,0.12)"
                )}
                {statCard(
                  "Saham Terdepak",
                  "18",
                  "6 Standard + 13 Small Cap MSCI",
                  "#f97316",
                  "rgba(249,115,22,0.12)"
                )}
                {statCard(
                  "Bobot RI MSCI",
                  "0,63%",
                  "↓ dari 0,86% sebelumnya",
                  "#a855f7",
                  "rgba(168,85,247,0.12)"
                )}
              </div>

              <div style={C.g2}>
                {/* Stock Table */}
                <div style={C.card}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div style={C.ttl}>
                      📋 Daftar Saham IDX ({visStocks.length})
                    </div>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        placeholder="Cari saham..."
                        style={{
                          background: "rgba(59,130,246,0.06)",
                          border: "1px solid rgba(59,130,246,0.15)",
                          borderRadius: 7,
                          padding: "5px 10px",
                          color: "#e2e8f0",
                          fontSize: 12,
                          outline: "none",
                          width: 130,
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  {/* Sector Pills */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    {sectors.slice(0, 10).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={filter === s ? "pill-active" : ""}
                        style={{
                          background:
                            filter === s
                              ? "rgba(59,130,246,0.15)"
                              : "rgba(255,255,255,0.03)",
                          color: filter === s ? "#60a5fa" : "#64748b",
                          border:
                            filter === s
                              ? "1px solid rgba(59,130,246,0.4)"
                              : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 20,
                          padding: "4px 12px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 500,
                          transition: "all 0.15s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Table Header */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "36px 1fr 90px 64px 56px 56px 58px 22px",
                      gap: 6,
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(59,130,246,0.08)",
                      fontSize: 10,
                      color: "#475569",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span />
                    <span>Saham</span>
                    <span style={{ textAlign: "right" }}>Harga</span>
                    <span style={{ textAlign: "right" }}>%</span>
                    <span style={{ textAlign: "right" }}>PE</span>
                    <span style={{ textAlign: "right" }}>ROE</span>
                    <span style={{ textAlign: "center" }}>Rec</span>
                    <span />
                  </div>

                  <div style={{ ...C.scroll, maxHeight: 420 }}>
                    {visStocks.map((s) => (
                      <div
                        key={s.code}
                        className={`row-h ${
                          selStock.code === s.code ? "stock-sel" : ""
                        }`}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "36px 1fr 90px 64px 56px 56px 58px 22px",
                          gap: 6,
                          padding: "8px 8px",
                          borderRadius: 8,
                          alignItems: "center",
                          borderBottom: "1px solid rgba(255,255,255,0.02)",
                          transition: "all 0.15s",
                        }}
                        onClick={() => {
                          setSelStock(s);
                          setPage("analisis");
                          runAnalysis(s);
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 7,
                            background: `${sectorColor(s.sector)}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 10,
                            color: sectorColor(s.sector),
                          }}
                        >
                          {s.code.slice(0, 2)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#f1f5f9",
                            }}
                          >
                            {s.code}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#475569",
                              marginTop: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 160,
                            }}
                          >
                            {s.name}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#f1f5f9",
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {fmtRp(s.price)}
                          </div>
                          <Spark up={s.change >= 0} w={55} h={16} />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: s.change >= 0 ? "#22c55e" : "#ef4444",
                              background:
                                s.change >= 0
                                  ? "rgba(34,197,94,0.1)"
                                  : "rgba(239,68,68,0.1)",
                              padding: "2px 5px",
                              borderRadius: 4,
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {fmtPct(s.change)}
                          </span>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 11,
                            color: "#64748b",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {s.pe || "—"}
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 11,
                            color:
                              s.roe > 15
                                ? "#22c55e"
                                : s.roe > 0
                                ? "#f59e0b"
                                : "#ef4444",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {s.roe}%
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <Badge
                            text={s.rec}
                            color={REC_COLOR[s.rec] || "#64748b"}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWL(s.code);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 14,
                            color: watchlist.includes(s.code)
                              ? "#3b82f6"
                              : "#334155",
                            padding: 0,
                            lineHeight: 1,
                          }}
                        >
                          {watchlist.includes(s.code) ? "★" : "☆"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right col */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {/* Watchlist */}
                  <div style={C.cardB}>
                    <div style={C.ttl}>⭐ Watchlist</div>
                    {STOCKS.filter((s) => watchlist.includes(s.code)).map(
                      (s) => (
                        <div
                          key={s.code}
                          className="row-h"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 6px",
                            borderRadius: 8,
                            transition: "all 0.15s",
                            marginBottom: 2,
                          }}
                          onClick={() => {
                            setSelStock(s);
                            setPage("analisis");
                            runAnalysis(s);
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              background: `${sectorColor(s.sector)}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 10,
                              color: sectorColor(s.sector),
                            }}
                          >
                            {s.code.slice(0, 2)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#f1f5f9",
                              }}
                            >
                              {s.code}
                            </div>
                            <div style={{ fontSize: 10, color: "#475569" }}>
                              {s.sector}
                            </div>
                          </div>
                          <Spark up={s.change >= 0} w={48} h={20} />
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#f1f5f9",
                                fontFamily: "'DM Mono',monospace",
                              }}
                            >
                              {fmtRp(s.price)}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: s.change >= 0 ? "#22c55e" : "#ef4444",
                                fontFamily: "'DM Mono',monospace",
                              }}
                            >
                              {fmtPct(s.change)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    {watchlist.length === 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#475569",
                          padding: "10px 0",
                        }}
                      >
                        Klik ☆ untuk menambah watchlist
                      </div>
                    )}
                  </div>

                  {/* IHSG Daily Chart */}
                  <div style={C.card}>
                    <div style={C.ttl}>📉 IHSG Intraday — 13 Mei 2026</div>
                    <IHSGDaily />
                  </div>

                  {/* Market Sentiment */}
                  <div style={C.card}>
                    <div style={C.ttl}>🌡 Sentimen Pasar</div>
                    {[
                      { label: "Tekanan MSCI", val: 92, color: "#ef4444" },
                      { label: "Outflow Asing", val: 78, color: "#f97316" },
                      { label: "Volatilitas IDX", val: 71, color: "#f59e0b" },
                      {
                        label: "Kekuatan Perbankan",
                        val: 64,
                        color: "#22c55e",
                      },
                    ].map((item) => (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 11,
                            color: "#64748b",
                            marginBottom: 4,
                          }}
                        >
                          <span>{item.label}</span>
                          <span
                            style={{
                              color: item.color,
                              fontWeight: 700,
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {item.val}%
                          </span>
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 4,
                            height: 4,
                          }}
                        >
                          <div
                            style={{
                              background: item.color,
                              width: `${item.val}%`,
                              height: "100%",
                              borderRadius: 4,
                              opacity: 0.8,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Movers */}
                  <div style={C.card}>
                    <div style={C.ttl}>⚡ Top Movers</div>
                    {[...STOCKS]
                      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                      .slice(0, 6)
                      .map((s) => (
                        <div
                          key={s.code}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "5px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                          }}
                          className="row-h"
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#94a3b8",
                              minWidth: 44,
                            }}
                          >
                            {s.code}
                          </span>
                          <Spark up={s.change >= 0} w={44} h={18} />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: s.change >= 0 ? "#22c55e" : "#ef4444",
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {fmtPct(s.change)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* News Grid */}
              <div style={C.card}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={C.ttl}>📰 Berita & Analisis Pasar</div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        background: "#22c55e",
                        borderRadius: "50%",
                        animation: "pulse2 2s infinite",
                      }}
                    />
                    <span
                      style={{
                        color: "#22c55e",
                        fontWeight: 600,
                        fontSize: 10,
                      }}
                    >
                      LIVE UPDATE
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 10,
                  }}
                >
                  {NEWS.map((n, i) => (
                    <div
                      key={i}
                      className="row-h"
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${
                          n.impact === "pos"
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)"
                        }`,
                        background:
                          n.impact === "pos"
                            ? "rgba(34,197,94,0.02)"
                            : "rgba(239,68,68,0.02)",
                        transition: "all 0.15s",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setChatIn(`Diskusikan: "${n.headline}"`);
                        setPage("chat");
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 7,
                        }}
                      >
                        <Badge
                          text={n.tag}
                          color={n.impact === "pos" ? "#22c55e" : "#ef4444"}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            color: "#475569",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {n.time}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#cbd5e1",
                          lineHeight: 1.5,
                          marginBottom: 6,
                          fontWeight: 500,
                        }}
                      >
                        {n.headline}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#475569",
                          lineHeight: 1.45,
                        }}
                      >
                        {n.detail}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 10,
                          color: n.impact === "pos" ? "#22c55e" : "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        {n.impact === "pos" ? "▲ POSITIF" : "▼ NEGATIF"} ·
                        diskusi AI →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ GRAFIK IDX ══════════════════════════ */}
          {page === "grafik" && (
            <div className="fade">
              {/* IHSG Big Chart */}
              <div style={{ ...C.cardB, marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div style={C.ttl}>
                      📈 IHSG — Indeks Harga Saham Gabungan
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 28,
                          color: "#ef4444",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        6.858
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        ▼ −47pt (−0,68%)
                      </span>
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        13 Mei 2026
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["1W", "1M", "3M", "6M", "1Y", "2Y"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setChartRange(r)}
                        style={{
                          background:
                            chartRange === r
                              ? "rgba(59,130,246,0.2)"
                              : "rgba(255,255,255,0.03)",
                          color: chartRange === r ? "#60a5fa" : "#64748b",
                          border:
                            chartRange === r
                              ? "1px solid rgba(59,130,246,0.4)"
                              : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 0.15s",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={IHSG_DATA}
                      margin={{ top: 5, right: 8, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="bigIhsg"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#475569" }}
                        tickLine={false}
                        axisLine={false}
                        interval={2}
                      />
                      <YAxis
                        domain={[5800, 7800]}
                        tick={{ fontSize: 10, fill: "#475569" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`}
                        width={42}
                      />
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="rgba(59,130,246,0.06)"
                        vertical={false}
                      />
                      <Tooltip content={<ChartTooltip prefix="" />} />
                      <ReferenceLine
                        y={7000}
                        stroke="rgba(34,197,94,0.3)"
                        strokeDasharray="4 4"
                      />
                      <ReferenceLine
                        y={6500}
                        stroke="rgba(239,68,68,0.3)"
                        strokeDasharray="4 4"
                      />
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#bigIhsg)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  {[
                    { l: "YTD", v: "-1,64%", c: "#ef4444" },
                    { l: "52W High", v: "7.697", c: "#22c55e" },
                    { l: "52W Low", v: "6.253", c: "#ef4444" },
                    { l: "Vol Avg", v: "12,4B", c: "#60a5fa" },
                    { l: "Market Cap", v: "Rp9.874T", c: "#f1f5f9" },
                    { l: "P/E IHSG", v: "13,2x", c: "#f1f5f9" },
                  ].map((item) => (
                    <div
                      key={item.l}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#475569",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.l}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: item.c,
                          marginTop: 3,
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {item.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Performance Chart */}
              <div style={{ ...C.g2, marginBottom: 16 }}>
                <div style={C.card}>
                  <div style={C.ttl}>📊 Performa Sektor — Hari Ini</div>
                  {(() => {
                    const sData = [...new Set(STOCKS.map((s) => s.sector))]
                      .map((sec) => {
                        const ss = STOCKS.filter((s) => s.sector === sec);
                        const avg =
                          ss.reduce((a, s) => a + s.change, 0) / ss.length;
                        return {
                          name: sec,
                          val: parseFloat(avg.toFixed(2)),
                          color: avg >= 0 ? "#22c55e" : "#ef4444",
                        };
                      })
                      .sort((a, b) => b.val - a.val);
                    return (
                      <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={sData}
                            layout="vertical"
                            margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                          >
                            <XAxis
                              type="number"
                              tick={{ fontSize: 10, fill: "#475569" }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                              tickLine={false}
                              axisLine={false}
                              width={90}
                            />
                            <CartesianGrid
                              strokeDasharray="2 4"
                              stroke="rgba(59,130,246,0.06)"
                              horizontal={false}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div
                                    style={{
                                      background: "#0f172a",
                                      border: "1px solid rgba(59,130,246,0.3)",
                                      borderRadius: 8,
                                      padding: "8px 12px",
                                      fontSize: 11,
                                    }}
                                  >
                                    <div
                                      style={{
                                        color: "#60a5fa",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {label}
                                    </div>
                                    <div
                                      style={{
                                        color:
                                          payload[0].value >= 0
                                            ? "#22c55e"
                                            : "#ef4444",
                                        fontWeight: 700,
                                        fontFamily: "'DM Mono',monospace",
                                      }}
                                    >
                                      {payload[0].value}%
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                              {sData.map((entry, i) => (
                                <rect
                                  key={i}
                                  fill={entry.val >= 0 ? "#22c55e" : "#ef4444"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>

                <div style={C.card}>
                  <div style={C.ttl}>📈 Saham Terpilih — Grafik</div>
                  {/* Stock selector for chart */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    {STOCKS.slice(0, 16).map((s) => (
                      <button
                        key={s.code}
                        onClick={() => setSelStock(s)}
                        style={{
                          background:
                            selStock.code === s.code
                              ? "rgba(59,130,246,0.15)"
                              : "rgba(255,255,255,0.03)",
                          color:
                            selStock.code === s.code ? "#60a5fa" : "#64748b",
                          border:
                            selStock.code === s.code
                              ? "1px solid rgba(59,130,246,0.35)"
                              : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 6,
                          padding: "3px 9px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 0.15s",
                        }}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 20,
                        color: "#f1f5f9",
                        letterSpacing: "-0.02em",
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {fmtRp(hargaLive[selStock.code] || selStock.price)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: selStock.change >= 0 ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {fmtPct(selStock.change)}
                    </span>
                    <Badge
                      text={selStock.rec}
                      color={REC_COLOR[selStock.rec]}
                    />
                  </div>
                  <StockChart stock={selStock} />
                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {[
                      { l: "Target", v: fmtRp(selStock.target), c: "#22c55e" },
                      { l: "PE", v: `${selStock.pe || "N/A"}x` },
                      {
                        l: "ROE",
                        v: `${selStock.roe}%`,
                        c: selStock.roe > 15 ? "#22c55e" : "#f59e0b",
                      },
                    ].map((m) => (
                      <div
                        key={m.l}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 7,
                          padding: "7px 10px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: "#475569",
                            marginBottom: 2,
                            textTransform: "uppercase",
                          }}
                        >
                          {m.l}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: m.c || "#94a3b8",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {m.v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All stocks mini charts grid */}
              <div style={C.card}>
                <div style={C.ttl}>📊 Grafik Semua Saham IDX — Ringkasan</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6,1fr)",
                    gap: 10,
                  }}
                >
                  {STOCKS.map((s) => (
                    <div
                      key={s.code}
                      className="row-h"
                      style={{
                        padding: "10px 10px 8px",
                        borderRadius: 9,
                        border: `1px solid ${
                          selStock.code === s.code
                            ? "rgba(59,130,246,0.35)"
                            : "rgba(255,255,255,0.04)"
                        }`,
                        background:
                          selStock.code === s.code
                            ? "rgba(59,130,246,0.06)"
                            : "rgba(255,255,255,0.01)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onClick={() => {
                        setSelStock(s);
                        setPage("analisis");
                        runAnalysis(s);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 11,
                            color: "#f1f5f9",
                          }}
                        >
                          {s.code}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: s.change >= 0 ? "#22c55e" : "#ef4444",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {fmtPct(s.change)}
                        </span>
                      </div>
                      <Spark up={s.change >= 0} w={"100%"} h={26} />
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748b",
                          marginTop: 5,
                          fontFamily: "'DM Mono',monospace",
                          textAlign: "right",
                        }}
                      >
                        {fmtRp(s.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ ANALISIS ════════════════════════════ */}
          {page === "analisis" && (
            <div className="fade" style={C.g21}>
              <div>
                <div style={{ ...C.cardB, marginBottom: 14 }}>
                  <div style={C.ttl}>🔍 Pilih Saham</div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    {STOCKS.map((s) => (
                      <button
                        key={s.code}
                        onClick={() => {
                          setSelStock(s);
                          setAnResult("");
                        }}
                        style={{
                          background:
                            selStock.code === s.code
                              ? "rgba(59,130,246,0.15)"
                              : "rgba(255,255,255,0.03)",
                          color:
                            selStock.code === s.code ? "#60a5fa" : "#64748b",
                          border:
                            selStock.code === s.code
                              ? "1px solid rgba(59,130,246,0.35)"
                              : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 0.15s",
                        }}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      background: "rgba(6,11,22,0.8)",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid rgba(59,130,246,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: `${sectorColor(selStock.sector)}1a`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: sectorColor(selStock.sector),
                          }}
                        >
                          {selStock.code.slice(0, 2)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: "#f1f5f9",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {selStock.code}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              marginTop: 1,
                            }}
                          >
                            {selStock.name}
                          </div>
                          <div
                            style={{ marginTop: 5, display: "flex", gap: 6 }}
                          >
                            <Badge
                              text={selStock.sector}
                              color={sectorColor(selStock.sector)}
                            />
                            <Badge
                              text={selStock.rec}
                              color={REC_COLOR[selStock.rec]}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 24,
                            color: "#f1f5f9",
                            letterSpacing: "-0.02em",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {fmtRp(hargaLive[selStock.code] || selStock.price)}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: selStock.change >= 0 ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {fmtPct(selStock.change)} hari ini
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#475569",
                            marginTop: 2,
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          Target: {fmtRp(selStock.target)}
                        </div>
                      </div>
                    </div>

                    {/* Mini chart */}
                    <StockChart stock={selStock} />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4,1fr)",
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      {[
                        {
                          l: "P/E",
                          v: selStock.pe ? `${selStock.pe}x` : "N/A",
                          c:
                            selStock.pe && selStock.pe < 20
                              ? "#22c55e"
                              : selStock.pe > 40
                              ? "#ef4444"
                              : "#f59e0b",
                        },
                        {
                          l: "P/BV",
                          v: `${selStock.pb}x`,
                          c:
                            selStock.pb < 3
                              ? "#22c55e"
                              : selStock.pb > 8
                              ? "#ef4444"
                              : "#f59e0b",
                        },
                        {
                          l: "ROE",
                          v: `${selStock.roe}%`,
                          c:
                            selStock.roe > 15
                              ? "#22c55e"
                              : selStock.roe > 8
                              ? "#f59e0b"
                              : "#ef4444",
                        },
                        {
                          l: "DER",
                          v: `${selStock.der}x`,
                          c:
                            selStock.der < 1.5
                              ? "#22c55e"
                              : selStock.der > 2.5
                              ? "#ef4444"
                              : "#f59e0b",
                        },
                      ].map((item) => (
                        <div
                          key={item.l}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: 8,
                            padding: "9px 11px",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9,
                              color: "#475569",
                              marginBottom: 3,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {item.l}
                          </div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 17,
                              color: item.c,
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {item.v}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 12,
                        color: "#64748b",
                        lineHeight: 1.5,
                        padding: "8px 0",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {selStock.desc}
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button
                        className="btn-p"
                        onClick={() => runAnalysis(selStock)}
                        disabled={anBusy}
                        style={{
                          flex: 1,
                          background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 9,
                          padding: "10px 0",
                          cursor: anBusy ? "wait" : "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          transition: "all 0.2s",
                        }}
                      >
                        {anBusy
                          ? "⏳ Menganalisis..."
                          : "🔍 Analisis Lengkap AI"}
                      </button>
                      <button
                        className="btn-p"
                        onClick={() => {
                          setChatIn(`Analisis singkat ${selStock.code}`);
                          setPage("chat");
                        }}
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          color: "#60a5fa",
                          border: "1px solid rgba(59,130,246,0.25)",
                          borderRadius: 9,
                          padding: "10px 16px",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          transition: "all 0.2s",
                        }}
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                </div>

                <div style={C.card}>
                  <div style={C.ttl}>📋 Laporan Analisis AI</div>
                  {anBusy && (
                    <Loader text="AI menyusun laporan analisis mendalam" />
                  )}
                  {anResult && (
                    <div
                      style={{ ...C.scroll, maxHeight: 480, paddingRight: 4 }}
                    >
                      {renderText(anResult)}
                    </div>
                  )}
                  {!anResult && !anBusy && (
                    <div
                      style={{
                        padding: "32px 0",
                        textAlign: "center",
                        color: "#334155",
                        fontSize: 13,
                      }}
                    >
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
                      Klik "Analisis Lengkap AI" untuk laporan riset mendalam
                    </div>
                  )}
                </div>
              </div>

              {/* Right col */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div style={C.card}>
                  <div style={C.ttl}>📰 Berita Terkait</div>
                  {[
                    ...NEWS.filter((n) => n.tag === selStock.code),
                    ...NEWS.filter((n) => n.tag === "MSCI" || n.tag === "IHSG"),
                  ]
                    .slice(0, 5)
                    .map((n, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "9px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Badge
                            text={n.tag}
                            color={n.impact === "pos" ? "#22c55e" : "#ef4444"}
                          />
                          <span
                            style={{
                              fontSize: 10,
                              color: "#475569",
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {n.time}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#cbd5e1",
                            lineHeight: 1.5,
                          }}
                        >
                          {n.headline}
                        </div>
                      </div>
                    ))}
                </div>

                <div style={C.card}>
                  <div style={C.ttl}>📊 Sektor {selStock.sector}</div>
                  {STOCKS.filter(
                    (s) =>
                      s.sector === selStock.sector && s.code !== selStock.code
                  )
                    .slice(0, 6)
                    .map((s) => (
                      <div
                        key={s.code}
                        className="row-h"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 6px",
                          borderRadius: 8,
                          transition: "all 0.15s",
                          marginBottom: 2,
                        }}
                        onClick={() => {
                          setSelStock(s);
                          setAnResult("");
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            minWidth: 42,
                          }}
                        >
                          {s.code}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            fontSize: 10,
                            color: "#475569",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.name}
                        </div>
                        <Badge text={s.rec} color={REC_COLOR[s.rec]} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: s.change >= 0 ? "#22c55e" : "#ef4444",
                            fontFamily: "'DM Mono',monospace",
                            minWidth: 50,
                            textAlign: "right",
                          }}
                        >
                          {fmtPct(s.change)}
                        </span>
                      </div>
                    ))}
                </div>

                <div style={C.card}>
                  <div style={C.ttl}>⚡ Quick Questions</div>
                  {[
                    `Apakah ${selStock.code} layak dibeli sekarang?`,
                    `Prospek ${selStock.code} jika IHSG koreksi lebih dalam?`,
                    `Bandingkan ${selStock.code} dengan kompetitornya`,
                    `Risiko terbesar investasi di ${selStock.code}?`,
                  ].map((q, i) => (
                    <button
                      key={i}
                      className="row-h"
                      onClick={() => {
                        setChatIn(q);
                        setPage("chat");
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: 7,
                        padding: "8px 11px",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: 12,
                        marginBottom: 5,
                        lineHeight: 1.5,
                        transition: "all 0.15s",
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ PORTOFOLIO ══════════════════════════ */}
          {page === "portofolio" && (
            <div className="fade">
              <div style={C.g4}>
                {statCard(
                  "Total Nilai",
                  `Rp${(totalVal / 1e6).toFixed(1)}M`,
                  `Modal: Rp${(totalCost / 1e6).toFixed(1)}M`,
                  "#f1f5f9"
                )}
                {statCard(
                  "Unrealized P&L",
                  `${totalPnl >= 0 ? "+" : ""}Rp${(
                    Math.abs(totalPnl) / 1e3
                  ).toFixed(0)}K`,
                  `${fmtPct(parseFloat(totalPct))} total return`,
                  totalPnl >= 0 ? "#22c55e" : "#ef4444",
                  totalPnl >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"
                )}
                {statCard("Posisi Aktif", "3", "Saham dalam portofolio")}
                {statCard(
                  "Status",
                  totalPnl >= 0 ? "PROFIT" : "RUGI",
                  "Berdasarkan harga terkini",
                  totalPnl >= 0 ? "#22c55e" : "#ef4444",
                  totalPnl >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"
                )}
              </div>

              <div style={C.g21}>
                <div style={C.card}>
                  <div style={C.ttl}>💼 Posisi Aktif</div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "36px 1fr 100px 100px 120px 100px 72px",
                      gap: 6,
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(59,130,246,0.08)",
                      fontSize: 10,
                      color: "#475569",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span />
                    <span>Saham</span>
                    <span style={{ textAlign: "right" }}>Avg Buy</span>
                    <span style={{ textAlign: "right" }}>Harga</span>
                    <span style={{ textAlign: "right" }}>Nilai</span>
                    <span style={{ textAlign: "right" }}>P&L</span>
                    <span style={{ textAlign: "right" }}>%</span>
                  </div>
                  {portfolioItems.map((item) => {
                    const pnl = (item.currentPrice - item.avgPrice) * item.qty;
                    const pct2 =
                      ((item.currentPrice - item.avgPrice) / item.avgPrice) *
                      100;
                    const s = STOCKS.find((s) => s.code === item.code);
                    return (
                      <div
                        key={item.code}
                        className="row-h"
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "36px 1fr 100px 100px 120px 100px 72px",
                          gap: 6,
                          padding: "11px 8px",
                          borderRadius: 8,
                          alignItems: "center",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          transition: "all 0.15s",
                        }}
                        onClick={() => {
                          if (s) {
                            setSelStock(s);
                            setPage("analisis");
                            runAnalysis(s);
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 7,
                            background: `${sectorColor(s?.sector)}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 10,
                            color: sectorColor(s?.sector),
                          }}
                        >
                          {item.code.slice(0, 2)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#f1f5f9",
                            }}
                          >
                            {item.code}
                          </div>
                          <div style={{ fontSize: 10, color: "#475569" }}>
                            {item.qty.toLocaleString()} lembar
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 11,
                            color: "#94a3b8",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {fmtRp(item.avgPrice)}
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 12,
                            color: "#f1f5f9",
                            fontWeight: 600,
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {fmtRp(item.currentPrice)}
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 11,
                            color: "#94a3b8",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {fmtRp(item.qty * item.currentPrice)}
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 12,
                            fontWeight: 700,
                            color: pnl >= 0 ? "#22c55e" : "#ef4444",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {pnl >= 0 ? "+" : "-"}
                          {fmtRp(Math.abs(pnl))}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 5,
                              background:
                                pct2 >= 0
                                  ? "rgba(34,197,94,0.1)"
                                  : "rgba(239,68,68,0.1)",
                              color: pct2 >= 0 ? "#22c55e" : "#ef4444",
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {fmtPct(pct2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      background: "rgba(59,130,246,0.04)",
                      borderRadius: 9,
                      border: "1px solid rgba(59,130,246,0.12)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#60a5fa",
                        marginBottom: 5,
                      }}
                    >
                      💡 AI Insight Portofolio
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        lineHeight: 1.6,
                      }}
                    >
                      Eksposur CUAN dalam tekanan MSCI forced selling.
                      Pertimbangkan realokasi ke BBCA atau BMRI.
                    </div>
                    <button
                      className="btn-p"
                      onClick={() => {
                        setChatIn(
                          "Analisis portofolio: BBCA 100 lot@8900, CUAN 500@1053, TLKM 200@2750. Strategi?"
                        );
                        setPage("chat");
                      }}
                      style={{
                        marginTop: 8,
                        background: "rgba(59,130,246,0.15)",
                        color: "#60a5fa",
                        border: "1px solid rgba(59,130,246,0.25)",
                        borderRadius: 7,
                        padding: "7px 12px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Diskusi strategi dengan AI →
                    </button>
                  </div>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <div style={C.cardB}>
                    <div style={C.ttl}>📊 Alokasi Portofolio</div>
                    {portfolioItems.map((item) => {
                      const s = STOCKS.find((s) => s.code === item.code);
                      const val = item.qty * item.currentPrice;
                      const pct3 = ((val / totalVal) * 100).toFixed(1);
                      return (
                        <div key={item.code} style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                              color: "#94a3b8",
                              marginBottom: 5,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "#f1f5f9" }}>
                              {item.code}
                            </span>
                            <span
                              style={{
                                color: "#60a5fa",
                                fontWeight: 700,
                                fontFamily: "'DM Mono',monospace",
                              }}
                            >
                              {pct3}%
                            </span>
                          </div>
                          <div
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: 4,
                              height: 5,
                            }}
                          >
                            <div
                              style={{
                                background: sectorColor(s?.sector),
                                width: `${pct3}%`,
                                height: "100%",
                                borderRadius: 4,
                                opacity: 0.7,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={C.card}>
                    <div style={C.ttl}>⚠️ Alert Portofolio</div>
                    {[
                      {
                        code: "CUAN",
                        msg: "Masih dalam tekanan MSCI forced selling",
                        level: "high",
                      },
                      {
                        code: "TLKM",
                        msg: "HOLD — monitor target Rp3.100",
                        level: "low",
                      },
                      {
                        code: "BBCA",
                        msg: "BUY — fundamental kuat, tahan koreksi",
                        level: "ok",
                      },
                    ].map((w, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                          padding: "9px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            marginTop: 4,
                            flexShrink: 0,
                            background:
                              w.level === "high"
                                ? "#ef4444"
                                : w.level === "low"
                                ? "#f59e0b"
                                : "#22c55e",
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#f1f5f9",
                              marginBottom: 2,
                            }}
                          >
                            {w.code}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              lineHeight: 1.5,
                            }}
                          >
                            {w.msg}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ REKOMENDASI ═════════════════════════ */}
          {page === "rekomendasi" && (
            <div className="fade">
              <div style={{ ...C.cardB, marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 22,
                        color: "#f1f5f9",
                        marginBottom: 4,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      ⭐ Rekomendasi AI — IDX
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 8,
                      }}
                    >
                      Berdasarkan fundamental, teknikal & sentimen pasar — 13
                      Mei 2026
                    </div>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <Badge text="⚠ MSCI 29 Mei" color="#ef4444" />
                      <Badge
                        text="Hindari: CUAN BREN AMMN TPIA DSSA"
                        color="#f97316"
                      />
                      <Badge
                        text="Fokus: Perbankan & Konsumsi"
                        color="#22c55e"
                      />
                    </div>
                  </div>
                  <button
                    className="btn-p"
                    onClick={runReco}
                    disabled={recoBusy}
                    style={{
                      background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "11px 24px",
                      cursor: recoBusy ? "wait" : "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {recoBusy
                      ? "⏳ Menganalisis Pasar..."
                      : "🎯 Generate Rekomendasi AI"}
                  </button>
                </div>
              </div>

              {/* BUY picks */}
              <div style={C.g3}>
                {STOCKS.filter((s) => s.rec === "BUY")
                  .slice(0, 3)
                  .map((s) => (
                    <div
                      key={s.code}
                      style={{
                        ...C.card,
                        border: "1px solid rgba(34,197,94,0.15)",
                        cursor: "pointer",
                      }}
                      className="row-h"
                      onClick={() => {
                        setSelStock(s);
                        setPage("analisis");
                        runAnalysis(s);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: "#f1f5f9",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {s.code}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 1,
                            }}
                          >
                            {s.name}
                          </div>
                        </div>
                        <Badge text="✓ BUY" color="#22c55e" />
                      </div>
                      <Spark up={s.change >= 0} w={"100%"} h={40} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: "#f1f5f9",
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {fmtRp(s.price)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: s.change >= 0 ? "#22c55e" : "#ef4444",
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {fmtPct(s.change)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#475569" }}>
                            Target
                          </div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#22c55e",
                              fontFamily: "'DM Mono',monospace",
                            }}
                          >
                            {fmtRp(s.target)}
                          </div>
                          <div style={{ fontSize: 10, color: "#22c55e" }}>
                            +
                            {(((s.target - s.price) / s.price) * 100).toFixed(
                              1
                            )}
                            %
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 7,
                          marginTop: 10,
                        }}
                      >
                        {[
                          { l: "PE", v: `${s.pe || "N/A"}x` },
                          { l: "ROE", v: `${s.roe}%` },
                          { l: "DER", v: `${s.der}x` },
                        ].map((m) => (
                          <div
                            key={m.l}
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 6,
                              padding: "5px 7px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 9,
                                color: "#475569",
                                marginBottom: 2,
                              }}
                            >
                              {m.l}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#94a3b8",
                                fontFamily: "'DM Mono',monospace",
                              }}
                            >
                              {m.v}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* AI Result */}
              <div style={C.card}>
                <div style={C.ttl}>🤖 Laporan Rekomendasi AI Lengkap</div>
                {recoBusy && (
                  <Loader text="AI menyeleksi saham terbaik untuk Anda" />
                )}
                {recoRes && (
                  <div style={{ ...C.scroll, maxHeight: 520, paddingRight: 4 }}>
                    {renderText(recoRes)}
                  </div>
                )}
                {!recoRes && !recoBusy && (
                  <div style={{ padding: "44px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>🎯</div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#475569",
                        marginBottom: 6,
                        fontWeight: 500,
                      }}
                    >
                      Klik "Generate Rekomendasi AI" untuk pilihan saham terbaik
                    </div>
                    <div style={{ fontSize: 12, color: "#334155" }}>
                      AI mempertimbangkan kondisi MSCI, fundamental, teknikal &
                      berita terkini
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ CHAT AI ═════════════════════════════ */}
          {page === "chat" && (
            <div className="fade" style={C.g21}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Chat Header */}
                <div
                  style={{
                    ...C.cardB,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderBottom: "none",
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                        }}
                      >
                        🤖
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#f1f5f9",
                          }}
                        >
                          Senior Analyst AI
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Spesialis IDX · 15 tahun pengalaman
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          background: "#22c55e",
                          borderRadius: "50%",
                          animation: "pulse2 2s infinite",
                        }}
                      />
                      <span
                        style={{
                          color: "#22c55e",
                          fontWeight: 600,
                          fontSize: 10,
                        }}
                      >
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div
                  ref={chatRef}
                  style={{
                    ...C.card,
                    ...C.scroll,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderTop: "none",
                    height: 460,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: 16,
                  }}
                >
                  {chatLog.map((m, i) => (
                    <div
                      key={i}
                      className="fade"
                      style={{
                        alignSelf:
                          m.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "84%",
                      }}
                    >
                      {m.role === "assistant" && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#475569",
                            marginBottom: 3,
                            paddingLeft: 2,
                          }}
                        >
                          🤖 Analyst AI
                        </div>
                      )}
                      <div
                        style={{
                          background:
                            m.role === "user"
                              ? "linear-gradient(135deg,rgba(29,78,216,0.25),rgba(59,130,246,0.2))"
                              : "rgba(10,18,35,0.95)",
                          border:
                            m.role === "user"
                              ? "1px solid rgba(59,130,246,0.3)"
                              : "1px solid rgba(255,255,255,0.05)",
                          borderRadius:
                            m.role === "user"
                              ? "14px 14px 4px 14px"
                              : "14px 14px 14px 4px",
                          padding: "10px 14px",
                          fontSize: 13,
                          lineHeight: 1.7,
                          color: m.role === "user" ? "#bfdbfe" : "#cbd5e1",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {m.role === "assistant"
                          ? renderText(m.content)
                          : m.content}
                      </div>
                    </div>
                  ))}
                  {chatBusy && (
                    <div
                      style={{
                        alignSelf: "flex-start",
                        background: "rgba(10,18,35,0.95)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "10px 14px",
                      }}
                    >
                      <Loader text="Menganalisis" />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div
                  style={{
                    background: "rgba(8,14,28,0.97)",
                    border: "1px solid rgba(59,130,246,0.15)",
                    borderTop: "none",
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                    padding: "9px 12px",
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
                  }}
                >
                  <textarea
                    rows={2}
                    value={chatIn}
                    onChange={(e) => setChatIn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder="Tanyakan apa saja... (Enter kirim, Shift+Enter baris baru)"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#f1f5f9",
                      fontSize: 13,
                      resize: "none",
                      lineHeight: 1.6,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  />
                  <button
                    className="btn-p"
                    onClick={sendChat}
                    disabled={!chatIn.trim() || chatBusy}
                    style={{
                      background:
                        chatIn.trim() && !chatBusy
                          ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                          : "rgba(255,255,255,0.05)",
                      color: chatIn.trim() && !chatBusy ? "#fff" : "#334155",
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 16px",
                      cursor:
                        chatIn.trim() && !chatBusy ? "pointer" : "default",
                      fontSize: 13,
                      fontWeight: 700,
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Kirim ↗
                  </button>
                </div>
              </div>

              {/* Right panel */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div style={C.cardB}>
                  <div style={C.ttl}>⚡ Pertanyaan Cepat</div>
                  {[
                    "Saham apa yang paling aman dibeli sekarang?",
                    "Apakah CUAN layak dibeli setelah keluar MSCI?",
                    "Strategi jika floating loss 20% di BREN?",
                    "Bandingkan BBCA vs BBRI untuk jangka pendek",
                    "Dampak MSCI terhadap IHSG ke depan?",
                    "Sektor apa yang paling menarik di 2026?",
                    "Jelaskan strategi cut loss yang benar",
                    "Rekomendasi saham dividen terbaik IDX",
                  ].map((q, i) => (
                    <button
                      key={i}
                      className="row-h"
                      onClick={() => setChatIn(q)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: 7,
                        padding: "7px 10px",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: 12,
                        marginBottom: 5,
                        lineHeight: 1.5,
                        transition: "all 0.15s",
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>

                <div style={C.card}>
                  <div style={C.ttl}>📰 Klik Berita → Diskusi AI</div>
                  {NEWS.slice(0, 5).map((n, i) => (
                    <div
                      key={i}
                      className="row-h"
                      style={{
                        padding: "8px 6px",
                        borderRadius: 7,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onClick={() =>
                        setChatIn(`Analisis dampak: "${n.headline}"`)
                      }
                    >
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <Badge
                          text={n.tag}
                          color={n.impact === "pos" ? "#22c55e" : "#ef4444"}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            color: "#475569",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {n.time}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          lineHeight: 1.45,
                        }}
                      >
                        {n.headline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ─────────────────────────────────────── */}
        <footer
          style={{
            borderTop: "1px solid rgba(59,130,246,0.08)",
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(6,13,26,0.95)",
            marginTop: 20,
          }}
        >
          <div style={{ fontSize: 11, color: "#334155" }}>
            <span style={{ color: "#3b82f6", fontWeight: 700 }}>
              StockAI Pro
            </span>
            <span style={{ color: "#1e3a5f" }}>
              {" "}
              · IDX Analytics Platform · Data 13 Mei 2026
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#334155" }}>
            ⚠️ Analisis edukatif. Bukan saran investasi resmi. Selalu DYOR.
          </div>
        </footer>
      </div>
    </>
  );
}
