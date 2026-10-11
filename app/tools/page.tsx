"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Crop, 
  Calendar, 
  Landmark, 
  FileCheck2, 
  Coins, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Building2,
  Receipt,
  Calculator,
  PiggyBank,
  TrendingUp,
  Car,
  QrCode,
  MapPin,
  HardDrive,
  FileText,
  Sliders
} from "lucide-react";

// --- HELPERS ---

// Indian Number to Words (English)
function numberToIndianWords(numStr: string): string {
  const num = parseFloat(numStr);
  if (isNaN(num) || num <= 0) return "";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  const parts = num.toFixed(2).split(".");
  const rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  let result = "Rupees " + inWords(rupees);
  if (paise > 0) {
    result += " and " + inWords(paise) + " Paise";
  }
  result += " Only";
  return result;
}

// Verhoeff Algorithm for Aadhaar Validation
const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function validateAadhaarVerhoeff(aadhaar: string): boolean {
  if (!/^\d{12}$/.test(aadhaar)) return false;
  let c = 0;
  const reversed = aadhaar.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    const digit = parseInt(reversed[i], 10);
    c = dTable[c][pTable[i % 8][digit]];
  }
  return c === 0;
}

// Indian GST State Codes Map
const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar",
  "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "28": "Andhra Pradesh (Old)",
  "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh",
  "38": "Ladakh"
};

// Indian Pincode Zones Map
const PINCODE_ZONES: Record<string, { zone: string; states: string }> = {
  "1": { zone: "Northern Zone 1", states: "Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir, Chandigarh" },
  "2": { zone: "Northern Zone 2", states: "Uttar Pradesh, Uttarakhand" },
  "3": { zone: "Western Zone 1", states: "Rajasthan, Gujarat, Daman & Diu, Dadra & Nagar Haveli" },
  "4": { zone: "Western Zone 2", states: "Maharashtra, Goa, Madhya Pradesh, Chhattisgarh" },
  "5": { zone: "Southern Zone 1", states: "Andhra Pradesh, Telangana, Karnataka" },
  "6": { zone: "Southern Zone 2", states: "Tamil Nadu, Kerala, Puducherry, Lakshadweep" },
  "7": { zone: "Eastern Zone 1", states: "West Bengal, Odisha, Assam, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Meghalaya, A&N" },
  "8": { zone: "Eastern Zone 2", states: "Bihar, Jharkhand" },
  "9": { zone: "Military Postal Zone", states: "Army Postal Service (APS) / Field Post Office (FPO)" }
};

type ToolTab = 
  | 'cropper' 
  | 'age' 
  | 'pan_aadhaar' 
  | 'ifsc' 
  | 'num_words'
  | 'gst'
  | 'emi'
  | 'pf'
  | 'tax'
  | 'dl_rc'
  | 'upi_qr'
  | 'pincode'
  | 'doc_size'
  | 'text_case'
  | 'doc_filter';

export default function CitizenToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('cropper');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'identity' | 'finance' | 'utilities'>('all');

  // --- TOOL 1: Photo & Signature Cropper / Compressor ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFileSizeKb, setOriginalFileSizeKb] = useState<number>(0);
  const [targetWidth, setTargetWidth] = useState(200);
  const [targetHeight, setTargetHeight] = useState(230);
  const [targetMaxKb, setTargetMaxKb] = useState(50);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputSizeKb, setOutputSizeKb] = useState<number>(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFileSizeKb(Math.round(file.size / 1024));
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setImageSrc(data);
      processImage(data, targetWidth, targetHeight, targetMaxKb);
    };
    reader.readAsDataURL(file);
  };

  const processImage = (src: string, w: number, h: number, maxKb: number) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        let quality = 0.92;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        let currentSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        while (currentSizeKb > maxKb && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          currentSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        }

        setOutputUrl(dataUrl);
        setOutputSizeKb(currentSizeKb);
      }
    };
    img.src = src;
  };

  const applyPreset = (preset: 'ssc' | 'signature' | 'passport' | 'upsc') => {
    let w = 200, h = 230, kb = 50;
    if (preset === 'signature') {
      w = 140; h = 60; kb = 20;
    } else if (preset === 'passport') {
      w = 350; h = 450; kb = 100;
    } else if (preset === 'ssc') {
      w = 200; h = 230; kb = 50;
    } else if (preset === 'upsc') {
      w = 350; h = 350; kb = 100;
    }
    setTargetWidth(w);
    setTargetHeight(h);
    setTargetMaxKb(kb);
    if (imageSrc) processImage(imageSrc, w, h, kb);
  };

  // --- TOOL 2: Age Calculator ---
  const [dob, setDob] = useState("");
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().split("T")[0]);
  const [ageResult, setAgeResult] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalWeeks: number;
    nextBirthdayDays: number;
  } | null>(null);

  const calculateAge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !cutoffDate) return;

    const birth = new Date(dob);
    const target = new Date(cutoffDate);

    if (birth > target) {
      alert("Date of Birth cannot be in the future of the cut-off date!");
      return;
    }

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonthDays = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
      days += prevMonthDays;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const diffTime = Math.abs(target.getTime() - birth.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);

    const currentYear = new Date().getFullYear();
    let nextBday = new Date(currentYear, birth.getMonth(), birth.getDate());
    if (nextBday < new Date()) {
      nextBday = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
    }
    const nextBirthdayDays = Math.ceil((nextBday.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    setAgeResult({ years, months, days, totalDays, totalWeeks, nextBirthdayDays });
  };

  // --- TOOL 3: PAN & Aadhaar Validator ---
  const [panInput, setPanInput] = useState("");
  const [panStatus, setPanStatus] = useState<{ valid: boolean; message: string; holderType?: string } | null>(null);
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [aadhaarStatus, setAadhaarStatus] = useState<{ valid: boolean; message: string } | null>(null);

  const handleValidatePan = (e: React.FormEvent) => {
    e.preventDefault();
    const pan = panInput.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      setPanStatus({ valid: false, message: "Invalid PAN Format. Must be 10 characters (e.g. ABCDE1234F)." });
      return;
    }

    const fourthChar = pan[3];
    const typeMap: Record<string, string> = {
      P: "Individual (व्यक्तिगत)",
      C: "Company (कंपनी)",
      H: "Hindu Undivided Family (HUF)",
      F: "Firm / Partnership (फर्म)",
      A: "Association of Persons (AOP)",
      T: "Trust (ट्रस्ट)",
      B: "Body of Individuals (BOI)",
      L: "Local Authority (स्थानीय प्राधिकरण)",
      J: "Artificial Juridical Person",
      G: "Government Agency (सरकारी एजेंसी)",
    };

    const holderType = typeMap[fourthChar] || "Official Entity";
    setPanStatus({
      valid: true,
      message: "Valid PAN Structure & Check Character!",
      holderType,
    });
  };

  const handleValidateAadhaar = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = aadhaarInput.replace(/\s+/g, "");
    if (clean.length !== 12 || !/^\d{12}$/.test(clean)) {
      setAadhaarStatus({ valid: false, message: "Aadhaar number must contain exactly 12 numeric digits." });
      return;
    }

    const isValidVerhoeff = validateAadhaarVerhoeff(clean);
    if (isValidVerhoeff) {
      setAadhaarStatus({ valid: true, message: "Valid 12-digit Aadhaar Number (Verhoeff Checksum Passed)!" });
    } else {
      setAadhaarStatus({ valid: false, message: "Invalid Aadhaar Number! Checksum verification failed." });
    }
  };

  // --- TOOL 4: IFSC Lookup ---
  const [ifscCode, setIfscCode] = useState("");
  const [ifscData, setIfscData] = useState<any>(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState<string | null>(null);

  const searchIfsc = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = ifscCode.trim().toUpperCase();
    if (code.length !== 11) {
      setIfscError("IFSC Code must be exactly 11 characters.");
      return;
    }

    setIfscLoading(true);
    setIfscError(null);
    setIfscData(null);

    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code}`);
      if (!res.ok) throw new Error("IFSC Code not found");
      const data = await res.json();
      setIfscData(data);
    } catch {
      setIfscError(`IFSC Code "${code}" not found in national directory. Please verify.`);
    } finally {
      setIfscLoading(false);
    }
  };

  // --- TOOL 5: Number to Words Converter ---
  const [amountInput, setAmountInput] = useState("125450");
  const [copiedWords, setCopiedWords] = useState(false);
  const englishWords = numberToIndianWords(amountInput);

  const handleCopyWords = () => {
    if (!englishWords) return;
    navigator.clipboard.writeText(englishWords);
    setCopiedWords(true);
    setTimeout(() => setCopiedWords(false), 2000);
  };

  // --- NEW TOOL 6: GSTIN / GST Number Validator ---
  const [gstInput, setGstInput] = useState("");
  const [gstResult, setGstResult] = useState<{
    valid: boolean;
    stateName?: string;
    pan?: string;
    entityNum?: string;
    checkDigit?: string;
    message?: string;
  } | null>(null);

  const handleValidateGst = (e: React.FormEvent) => {
    e.preventDefault();
    const gst = gstInput.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) {
      setGstResult({
        valid: false,
        message: "Invalid GSTIN format! Must be 15 alphanumeric characters (e.g., 18AAACH7409R1ZZ)."
      });
      return;
    }

    const stateCode = gst.substring(0, 2);
    const pan = gst.substring(2, 12);
    const entityNum = gst.substring(12, 13);
    const checkDigit = gst.substring(14, 15);
    const stateName = GST_STATE_CODES[stateCode] || "Unknown State Code";

    setGstResult({
      valid: true,
      stateName: `${stateName} (Code: ${stateCode})`,
      pan,
      entityNum,
      checkDigit,
      message: "Valid GST Identification Number (GSTIN) structure!"
    });
  };

  // --- NEW TOOL 7: Loan EMI Calculator ---
  const [emiPrincipal, setEmiPrincipal] = useState(500000);
  const [emiRate, setEmiRate] = useState(10.5);
  const [emiTenureYears, setEmiTenureYears] = useState(5);

  const calculateEmiValues = () => {
    const P = emiPrincipal;
    const r = (emiRate / 12) / 100;
    const n = emiTenureYears * 12;
    if (P <= 0 || r <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalAmount: 0 };

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalAmount = emi * n;
    const totalInterest = totalAmount - P;

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalAmount: Math.round(totalAmount)
    };
  };

  const emiCalc = calculateEmiValues();

  // --- NEW TOOL 8: EPF / PF Balance & Corpus Estimator ---
  const [pfBasic, setPfBasic] = useState(25000);
  const [pfBalance, setPfBalance] = useState(100000);
  const [pfYears, setPfYears] = useState(15);
  const [pfAnnualHike, setPfAnnualHike] = useState(5);

  const calculatePfCorpus = () => {
    let currentBasic = pfBasic;
    let accumulated = pfBalance;
    const interestRate = 0.0825; // EPFO current interest rate 8.25%

    for (let yr = 0; yr < pfYears; yr++) {
      const empShareMonth = currentBasic * 0.12;
      const employerEpfMonth = currentBasic * 0.0367; // 3.67% goes to EPF
      const annualContribution = (empShareMonth + employerEpfMonth) * 12;

      accumulated = (accumulated + annualContribution) * (1 + interestRate);
      currentBasic = currentBasic * (1 + pfAnnualHike / 100);
    }

    const monthlyEmp = Math.round(pfBasic * 0.12);
    const monthlyEmployerEpf = Math.round(pfBasic * 0.0367);
    const monthlyEmployerEps = Math.round(pfBasic * 0.0833);

    return {
      monthlyEmp,
      monthlyEmployerEpf,
      monthlyEmployerEps,
      finalCorpus: Math.round(accumulated)
    };
  };

  const pfData = calculatePfCorpus();

  // --- NEW TOOL 9: Income Tax Regime Comparator ---
  const [taxAnnualIncome, setTaxAnnualIncome] = useState(850000);
  const [taxDeductions80C, setTaxDeductions80C] = useState(150000);
  const [taxDeductionsOther, setTaxDeductionsOther] = useState(50000);

  const computeTaxRegimes = () => {
    // 1. New Regime (FY 2024-25 / FY 2025-26)
    const stdNew = 75000;
    const netNew = Math.max(0, taxAnnualIncome - stdNew);
    let taxNew = 0;

    if (netNew <= 700000) {
      taxNew = 0; // Rebate under Sec 87A up to 7L
    } else {
      if (netNew > 300000) taxNew += Math.min(400000, Math.max(0, netNew - 300000)) * 0.05;
      if (netNew > 700000) taxNew += Math.min(300000, Math.max(0, netNew - 700000)) * 0.10;
      if (netNew > 1000000) taxNew += Math.min(200000, Math.max(0, netNew - 1000000)) * 0.15;
      if (netNew > 1200000) taxNew += Math.min(300000, Math.max(0, netNew - 1200000)) * 0.20;
      if (netNew > 1500000) taxNew += (netNew - 1500000) * 0.30;
      taxNew = taxNew * 1.04; // 4% Cess
    }

    // 2. Old Regime
    const stdOld = 50000;
    const totalDeductions = stdOld + Math.min(150000, taxDeductions80C) + taxDeductionsOther;
    const netOld = Math.max(0, taxAnnualIncome - totalDeductions);
    let taxOld = 0;

    if (netOld <= 500000) {
      taxOld = 0; // Rebate under Sec 87A up to 5L
    } else {
      if (netOld > 250000) taxOld += Math.min(250000, Math.max(0, netOld - 250000)) * 0.05;
      if (netOld > 500000) taxOld += Math.min(500000, Math.max(0, netOld - 500000)) * 0.20;
      if (netOld > 1000000) taxOld += (netOld - 1000000) * 0.30;
      taxOld = taxOld * 1.04; // 4% Cess
    }

    return {
      taxNew: Math.round(taxNew),
      taxOld: Math.round(taxOld),
      diff: Math.abs(Math.round(taxNew - taxOld)),
      recommended: taxNew <= taxOld ? 'New Tax Regime' : 'Old Tax Regime'
    };
  };

  const taxComp = computeTaxRegimes();

  // --- NEW TOOL 10: Driving Licence & Vehicle RC Validator ---
  const [dlRcInput, setDlRcInput] = useState("");
  const [dlRcResult, setDlRcResult] = useState<{
    type: 'DL' | 'RC' | 'unknown';
    valid: boolean;
    state?: string;
    details?: string;
    message?: string;
  } | null>(null);

  const STATE_PREFIX_MAP: Record<string, string> = {
    AS: "Assam", DL: "Delhi", MH: "Maharashtra", UP: "Uttar Pradesh", BR: "Bihar",
    WB: "West Bengal", RJ: "Rajasthan", MP: "Madhya Pradesh", GJ: "Gujarat", KA: "Karnataka",
    TN: "Tamil Nadu", KL: "Kerala", AP: "Andhra Pradesh", TS: "Telangana", HR: "Haryana",
    PB: "Punjab", UK: "Uttarakhand", JH: "Jharkhand", OD: "Odisha", CH: "Chandigarh"
  };

  const handleValidateDlRc = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = dlRcInput.trim().toUpperCase().replace(/[\s-]/g, "");
    
    // DL regex (15-16 chars): e.g. AS0120210012345
    const dlRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
    // RC regex (9-10 chars): e.g. AS01EC1234, DL01AB1234
    const rcRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

    const prefix = clean.substring(0, 2);
    const stateName = STATE_PREFIX_MAP[prefix] || `Indian State / UT (${prefix})`;

    if (dlRegex.test(clean)) {
      const year = clean.substring(4, 8);
      setDlRcResult({
        type: 'DL',
        valid: true,
        state: stateName,
        details: `RTO District: ${clean.substring(2, 4)}, Year of Issue: ${year}`,
        message: "Valid Indian Driving Licence (DL) standard format!"
      });
    } else if (rcRegex.test(clean)) {
      setDlRcResult({
        type: 'RC',
        valid: true,
        state: stateName,
        details: `RTO Circle Code: ${clean.substring(0, 4)}`,
        message: "Valid Indian Vehicle Registration (RC) number structure!"
      });
    } else {
      setDlRcResult({
        type: 'unknown',
        valid: false,
        message: "Invalid format! Enter valid DL (e.g. AS01 20210012345) or Vehicle RC (e.g. AS01 EC 1234)."
      });
    }
  };

  // --- NEW TOOL 11: Bharat / UPI QR Code Generator ---
  const [upiVpa, setUpiVpa] = useState("pay.netduniya@sbi");
  const [upiName, setUpiName] = useState("NetDuniya Digital Kendra");
  const [upiAmount, setUpiAmount] = useState("50");
  const [upiNote, setUpiNote] = useState("PVC Card / Seva Fee");
  const [upiCopied, setUpiCopied] = useState(false);

  const upiLink = `upi://pay?pa=${encodeURIComponent(upiVpa.trim())}&pn=${encodeURIComponent(upiName.trim())}&am=${upiAmount.trim()}&tn=${encodeURIComponent(upiNote.trim())}&cu=INR`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiLink)}&margin=10`;

  const copyUpiLink = () => {
    navigator.clipboard.writeText(upiLink);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  // --- NEW TOOL 12: Indian Pincode Directory Finder ---
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeResult, setPincodeResult] = useState<{
    valid: boolean;
    zone?: string;
    states?: string;
    sortingOffice?: string;
    message?: string;
  } | null>(null);

  const handleValidatePincode = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pincodeInput.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPincodeResult({
        valid: false,
        message: "Invalid PIN code! Indian postal PIN must be exactly 6 digits starting with 1-9."
      });
      return;
    }

    const firstDigit = pin[0];
    const info = PINCODE_ZONES[firstDigit] || { zone: "Special Region", states: "India Post Circle" };
    const sortingOffice = `Sorting District: ${pin.substring(0, 3)}, Post Office Code: ${pin.substring(3, 6)}`;

    setPincodeResult({
      valid: true,
      zone: info.zone,
      states: info.states,
      sortingOffice,
      message: "Valid 6-Digit Indian Postal Index Number (PIN)!"
    });
  };

  // --- NEW TOOL 13: Portal File Size & KB/MB Checker ---
  const [docSizeBytes, setDocSizeBytes] = useState<number>(145000);
  const [selectedPresetLimit, setSelectedPresetLimit] = useState<number>(200);

  const docSizeKb = Math.round(docSizeBytes / 1024);
  const docSizeMb = (docSizeBytes / (1024 * 1024)).toFixed(2);
  const isDocUnderLimit = docSizeKb <= selectedPresetLimit;

  // --- NEW TOOL 14: Govt Form Text Sanitizer (UPPERCASE) ---
  const [sanitizeText, setSanitizeText] = useState("");
  const [copiedSanitize, setCopiedSanitize] = useState(false);

  const uppercaseText = sanitizeText.toUpperCase();
  const cleanedSingleSpaceText = uppercaseText.replace(/\s+/g, " ").trim();
  const charCount = sanitizeText.length;
  const wordCount = sanitizeText.trim() ? sanitizeText.trim().split(/\s+/).length : 0;

  const copySanitizedText = () => {
    navigator.clipboard.writeText(cleanedSingleSpaceText);
    setCopiedSanitize(true);
    setTimeout(() => setCopiedSanitize(false), 2000);
  };

  // --- NEW TOOL 15: B&W / Grayscale Document Optimizer ---
  const [docFilterSrc, setDocFilterSrc] = useState<string | null>(null);
  const [docFilterMode, setDocFilterMode] = useState<'color' | 'gray' | 'bw'>('gray');
  const [docFilterThreshold, setDocFilterThreshold] = useState<number>(128);
  const [filteredDocUrl, setFilteredDocUrl] = useState<string | null>(null);

  const handleDocFilterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setDocFilterSrc(data);
      applyDocFilter(data, docFilterMode, docFilterThreshold);
    };
    reader.readAsDataURL(file);
  };

  const applyDocFilter = (src: string, mode: 'color' | 'gray' | 'bw', threshold: number) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      if (mode === 'color') {
        setFilteredDocUrl(canvas.toDataURL("image/jpeg", 0.85));
        return;
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        // Luminance formula
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (mode === 'gray') {
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        } else if (mode === 'bw') {
          const bw = gray >= threshold ? 255 : 0;
          d[i] = bw;
          d[i + 1] = bw;
          d[i + 2] = bw;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setFilteredDocUrl(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = src;
  };

  const toolCategories = [
    { id: 'all', label: 'All 15 Tools' },
    { id: 'identity', label: 'Identity & Cards' },
    { id: 'finance', label: 'Banking & Finance' },
    { id: 'utilities', label: 'Forms & Utilities' },
  ];

  const toolsList: { id: ToolTab; name: string; icon: any; category: 'identity' | 'finance' | 'utilities'; desc: string }[] = [
    { id: 'cropper', name: '1. Photo & Sign Resizer', icon: Crop, category: 'identity', desc: 'SSC, UPSC, Passport crop & KB limits' },
    { id: 'age', name: '2. Exam Age Calculator', icon: Calendar, category: 'utilities', desc: 'Exact cut-off date year/month/day' },
    { id: 'pan_aadhaar', name: '3. PAN & Aadhaar Validator', icon: FileCheck2, category: 'identity', desc: 'Verhoeff checksum & structure check' },
    { id: 'ifsc', name: '4. Bank IFSC Lookup', icon: Landmark, category: 'finance', desc: 'Live bank branch and NEFT search' },
    { id: 'num_words', name: '5. Number to Words (INR)', icon: Coins, category: 'finance', desc: 'Cheque & Challan Lakh/Crore format' },
    { id: 'gst', name: '6. GSTIN & State Validator', icon: Receipt, category: 'identity', desc: '15-digit GST & embedded PAN verification' },
    { id: 'emi', name: '7. Loan EMI Calculator', icon: Calculator, category: 'finance', desc: 'Mudra, Home, Personal monthly repayment' },
    { id: 'pf', name: '8. EPF Corpus Estimator', icon: PiggyBank, category: 'finance', desc: 'Monthly 12% PF & 8.25% retirement growth' },
    { id: 'tax', name: '9. Income Tax Comparator', icon: TrendingUp, category: 'finance', desc: 'Compare New vs Old Tax Regime savings' },
    { id: 'dl_rc', name: '10. DL & Vehicle RC Validator', icon: Car, category: 'identity', desc: 'Driving licence & RC RTO state code' },
    { id: 'upi_qr', name: '11. Bharat / UPI QR Generator', icon: QrCode, category: 'finance', desc: 'Instant printable payment QR code' },
    { id: 'pincode', name: '12. Indian Pincode Directory', icon: MapPin, category: 'utilities', desc: 'Postal zone & sorting district lookup' },
    { id: 'doc_size', name: '13. Portal File Size Checker', icon: HardDrive, category: 'utilities', desc: 'Verify 50KB, 200KB, 2MB portal limits' },
    { id: 'text_case', name: '14. Form Text Sanitizer', icon: FileText, category: 'utilities', desc: 'Capitalize ALL UPPERCASE for online forms' },
    { id: 'doc_filter', name: '15. B&W Document Optimizer', icon: Sliders, category: 'identity', desc: 'Convert certificates to pure B&W / Grayscale' },
  ];

  const filteredTools = toolsList.filter(t => categoryFilter === 'all' || t.category === categoryFilter);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      
      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {toolCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                categoryFilter === cat.id
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="text-xs font-bold text-slate-500">
          Selected: <span className="text-brand-blue font-black">{toolsList.find(t => t.id === activeTab)?.name}</span>
        </div>
      </div>

      {/* Horizontal Tool Selector Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-2">
        {filteredTools.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTab === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTab(tool.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap rounded-t-xl ${
                isActive
                  ? 'border-brand-blue text-brand-blue bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 bg-slate-50/70 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tool.name}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TOOL 1: Photo & Signature Resizer
         ======================================================== */}
      {activeTab === 'cropper' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Govt Job Form Photo & Signature Resizer + Compressor</h2>
            <p className="text-xs text-slate-500 mt-0.5">Crop, resize, and compress your photograph or signature to exact pixel dimensions & KB limits for SSC, UPSC, Railway, Police, or Banking forms.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-black text-slate-700 mr-2">Presets:</span>
            <button type="button" onClick={() => applyPreset('ssc')} className="text-xs font-bold bg-white border border-slate-300 hover:border-brand-blue px-3 py-1.5 rounded-lg shadow-2xs">SSC Photo (200x230, 50KB)</button>
            <button type="button" onClick={() => applyPreset('signature')} className="text-xs font-bold bg-white border border-slate-300 hover:border-brand-blue px-3 py-1.5 rounded-lg shadow-2xs">Signature (140x60, 20KB)</button>
            <button type="button" onClick={() => applyPreset('passport')} className="text-xs font-bold bg-white border border-slate-300 hover:border-brand-blue px-3 py-1.5 rounded-lg shadow-2xs">Passport (350x450, 100KB)</button>
            <button type="button" onClick={() => applyPreset('upsc')} className="text-xs font-bold bg-white border border-slate-300 hover:border-brand-blue px-3 py-1.5 rounded-lg shadow-2xs">UPSC Photo (350x350, 100KB)</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-slate-300 hover:border-brand-blue p-6 rounded-2xl text-center cursor-pointer bg-slate-50 transition">
                <Upload className="h-8 w-8 text-brand-blue mx-auto mb-2" />
                <span className="text-xs font-black text-slate-700 block">Upload Photo / Signature</span>
                <span className="text-[11px] text-slate-400">Supports JPG, PNG (Max 15MB)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Width (px)</label>
                  <input type="number" value={targetWidth} onChange={(e) => { const v = parseInt(e.target.value) || 100; setTargetWidth(v); if (imageSrc) processImage(imageSrc, v, targetHeight, targetMaxKb); }} className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Height (px)</label>
                  <input type="number" value={targetHeight} onChange={(e) => { const v = parseInt(e.target.value) || 100; setTargetHeight(v); if (imageSrc) processImage(imageSrc, targetWidth, v, targetMaxKb); }} className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Max KB</label>
                  <input type="number" value={targetMaxKb} onChange={(e) => { const v = parseInt(e.target.value) || 20; setTargetMaxKb(v); if (imageSrc) processImage(imageSrc, targetWidth, targetHeight, v); }} className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[220px]">
              {outputUrl ? (
                <div className="space-y-4 text-center">
                  <img src={outputUrl} alt="Processed" style={{ maxWidth: 200, maxHeight: 200 }} className="mx-auto rounded border border-slate-300 shadow-sm bg-white" />
                  <div className="text-xs font-bold text-slate-700">
                    Size: <span className="text-emerald-700 font-black">{outputSizeKb} KB</span> (Original: {originalFileSizeKb} KB)
                  </div>
                  <a href={outputUrl} download="netduniya_resized_photo.jpg" className="inline-flex items-center space-x-2 bg-brand-blue hover:bg-brand-primary text-white text-xs font-bold py-2 px-5 rounded-xl transition shadow">
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Ready Image</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Upload an image to see live preview and compression results</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOOL 2: Govt Exam Age Calculator
         ======================================================== */}
      {activeTab === 'age' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Govt Job Examination Age Calculator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Calculate your exact age in years, months, and days on the official notification cut-off date (e.g. 01/01/2026 or 01/08/2025).</p>
          </div>

          <form onSubmit={calculateAge} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth (DOB)</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cut-off Date (as on)</label>
              <input type="date" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow transition">
                Calculate Exact Age
              </button>
            </div>
          </form>

          {ageResult && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 max-w-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">Age Calculation Result</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-2xl font-black text-slate-900">{ageResult.years}</span>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Years</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-2xl font-black text-slate-900">{ageResult.months}</span>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Months</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-2xl font-black text-slate-900">{ageResult.days}</span>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Days</span>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-emerald-200/60">
                <p>• Total Days lived: <strong className="text-slate-900">{ageResult.totalDays.toLocaleString('en-IN')} days</strong> ({ageResult.totalWeeks} weeks)</p>
                <p>• Days until next birthday: <strong className="text-slate-900">{ageResult.nextBirthdayDays} days</strong></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TOOL 3: PAN & Aadhaar Validator
         ======================================================== */}
      {activeTab === 'pan_aadhaar' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">PAN & Aadhaar Structure & Checksum Validator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Validate the mathematical Verhoeff checksum algorithm for 12-digit Aadhaar numbers and check the issuing entity category encoded in PAN cards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleValidatePan} className="space-y-4">
              <h3 className="text-sm font-black text-slate-800">1. Permanent Account Number (PAN) Validator</h3>
              <input type="text" value={panInput} onChange={(e) => setPanInput(e.target.value.toUpperCase())} maxLength={10} placeholder="e.g. ABCDE1234F" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-brand-blue" />
              <button type="submit" className="w-full bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-2 px-4 rounded-lg shadow transition">Verify PAN Format</button>
              {panStatus && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${panStatus.valid ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                  <p>{panStatus.message}</p>
                  {panStatus.holderType && <p className="mt-1 font-normal">Holder Category: <strong className="text-slate-900">{panStatus.holderType}</strong></p>}
                </div>
              )}
            </form>

            <form onSubmit={handleValidateAadhaar} className="space-y-4">
              <h3 className="text-sm font-black text-slate-800">2. Aadhaar 12-Digit Verhoeff Algorithm Check</h3>
              <input type="text" value={aadhaarInput} onChange={(e) => setAadhaarInput(e.target.value)} maxLength={14} placeholder="e.g. 5489 1234 5678" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue" />
              <button type="submit" className="w-full bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-2 px-4 rounded-lg shadow transition">Test Aadhaar Verhoeff Checksum</button>
              {aadhaarStatus && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${aadhaarStatus.valid ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                  <p>{aadhaarStatus.message}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          TOOL 4: Bank IFSC Lookup
         ======================================================== */}
      {activeTab === 'ifsc' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">National Bank IFSC Directory & Branch Lookup</h2>
            <p className="text-xs text-slate-500 mt-0.5">Verify 11-digit IFSC codes, branch address, MICR number, and NEFT/RTGS/IMPS clearing facilities.</p>
          </div>

          <form onSubmit={searchIfsc} className="flex flex-col sm:row gap-3 max-w-xl">
            <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234, HDFC0000001" maxLength={11} required className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs uppercase font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue" />
            <button type="submit" disabled={ifscLoading} className="bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow transition">
              {ifscLoading ? "Searching..." : "Lookup Branch Details"}
            </button>
          </form>

          {ifscError && <p className="text-xs text-rose-600 font-semibold">{ifscError}</p>}

          {ifscData && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-xl space-y-4 animate-fadeIn text-xs">
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">{ifscData.BANK}</h3>
                  <p className="text-xs text-slate-500">{ifscData.BRANCH} Branch</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-1 rounded">NEFT / RTGS Enabled</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div><span className="text-slate-400 block text-[10px] font-bold uppercase">IFSC Code</span> <strong className="font-mono text-slate-900">{ifscData.IFSC}</strong></div>
                <div><span className="text-slate-400 block text-[10px] font-bold uppercase">MICR Code</span> <strong className="font-mono text-slate-900">{ifscData.MICR || "N/A"}</strong></div>
                <div><span className="text-slate-400 block text-[10px] font-bold uppercase">City</span> {ifscData.CITY}</div>
                <div><span className="text-slate-400 block text-[10px] font-bold uppercase">State</span> {ifscData.STATE}</div>
                <div className="col-span-2"><span className="text-slate-400 block text-[10px] font-bold uppercase">Complete Branch Address</span> {ifscData.ADDRESS}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TOOL 5: Number to Words Converter
         ======================================================== */}
      {activeTab === 'num_words' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Number to Words (INR Lakh & Crore Converter)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Convert currency numbers to official words in Indian numbering system for bank cheques, deposit slips, and challans.</p>
          </div>

          <div className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter Amount / Number (in Rupees)</label>
              <input type="number" min={1} value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="e.g. 125450" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-black text-slate-900 focus:ring-2 focus:ring-brand-blue" />
            </div>

            {englishWords && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">Indian Currency in Words (Cheque Format)</span>
                  <button type="button" onClick={handleCopyWords} className="text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded-lg transition flex items-center space-x-1">
                    {copiedWords ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedWords ? "Copied!" : "Copy Words"}</span>
                  </button>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200 text-sm font-bold text-slate-900 leading-relaxed shadow-sm">
                  "{englishWords}"
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          NEW TOOL 6: GSTIN / GST Number Validator
         ======================================================== */}
      {activeTab === 'gst' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">GSTIN / GST Number Validator & State Code Finder</h2>
            <p className="text-xs text-slate-500 mt-0.5">Check 15-character Goods and Services Tax Identification Number (GSTIN), embedded business PAN, entity code, and state classification.</p>
          </div>

          <form onSubmit={handleValidateGst} className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter 15-Digit GST Number</label>
              <input type="text" value={gstInput} onChange={(e) => setGstInput(e.target.value.toUpperCase())} maxLength={15} placeholder="e.g. 18AAACH7409R1ZZ or 07AABCU9603R1ZM" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue uppercase" />
            </div>
            <button type="submit" className="bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow transition">
              Verify GST Number
            </button>
          </form>

          {gstResult && (
            <div className={`p-5 rounded-2xl border max-w-xl space-y-3 ${gstResult.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center space-x-2">
                {gstResult.valid ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <AlertCircle className="h-5 w-5 text-rose-700" />}
                <span className={`text-xs font-black uppercase ${gstResult.valid ? 'text-emerald-900' : 'text-rose-900'}`}>{gstResult.message}</span>
              </div>
              {gstResult.valid && (
                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-emerald-200/60">
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Issuing State / UT</span><strong className="text-slate-900">{gstResult.stateName}</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Embedded PAN</span><strong className="text-slate-900 font-mono">{gstResult.pan}</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Business Entity Count</span><strong className="text-slate-900">{gstResult.entityNum}</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Check Code</span><strong className="text-slate-900 font-mono">{gstResult.checkDigit}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          NEW TOOL 7: Loan EMI Calculator
         ======================================================== */}
      {activeTab === 'emi' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Mudra, PMEGP & Personal Loan EMI Calculator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Calculate monthly installment (EMI), total interest payable, and total loan payback amount.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount: ₹{emiPrincipal.toLocaleString('en-IN')}</label>
                <input type="range" min={10000} max={5000000} step={10000} value={emiPrincipal} onChange={(e) => setEmiPrincipal(Number(e.target.value))} className="w-full accent-brand-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Interest Rate (% p.a.): {emiRate}%</label>
                <input type="range" min={5} max={25} step={0.25} value={emiRate} onChange={(e) => setEmiRate(Number(e.target.value))} className="w-full accent-brand-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loan Tenure: {emiTenureYears} Years ({emiTenureYears * 12} Months)</label>
                <input type="range" min={1} max={30} step={1} value={emiTenureYears} onChange={(e) => setEmiTenureYears(Number(e.target.value))} className="w-full accent-brand-blue" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="text-center pb-4 border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Monthly Loan EMI</span>
                <span className="text-3xl font-black text-brand-blue">₹{emiCalc.emi.toLocaleString('en-IN')}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-600">Principal Amount:</span><strong className="text-slate-900">₹{emiPrincipal.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Total Interest Payable:</span><strong className="text-rose-700">₹{emiCalc.totalInterest.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black"><span className="text-slate-800">Total Payment:</span><span className="text-slate-900">₹{emiCalc.totalAmount.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          NEW TOOL 8: EPF / PF Balance & Corpus Estimator
         ======================================================== */}
      {activeTab === 'pf' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">EPF / PF Balance & Retirement Corpus Estimator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Project your Employees' Provident Fund maturity amount at 8.25% p.a. compound interest with monthly employee and employer contribution breakdown.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Monthly Basic Salary + DA (₹)</label>
                <input type="number" min={5000} value={pfBasic} onChange={(e) => setPfBasic(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Current EPF Balance (₹)</label>
                <input type="number" min={0} value={pfBalance} onChange={(e) => setPfBalance(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Years to Retirement: {pfYears} Years</label>
                <input type="range" min={1} max={35} value={pfYears} onChange={(e) => setPfYears(Number(e.target.value))} className="w-full accent-brand-blue" />
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="text-center pb-4 border-b border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Estimated Retirement EPF Corpus</span>
                <span className="text-3xl font-black text-emerald-950">₹{pfData.finalCorpus.toLocaleString('en-IN')}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-600">Your Monthly Share (12%):</span><strong className="text-slate-900">₹{pfData.monthlyEmp.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Employer EPF Share (3.67%):</span><strong className="text-slate-900">₹{pfData.monthlyEmployerEpf.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Employer Pension EPS (8.33%):</span><strong className="text-slate-900">₹{pfData.monthlyEmployerEps.toLocaleString('en-IN')}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          NEW TOOL 9: Income Tax Regime Comparator
         ======================================================== */}
      {activeTab === 'tax' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Income Tax Regime Comparator (New vs Old)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Compare your tax liability under New Tax Regime (with ₹75,000 standard deduction) vs Old Tax Regime (with 80C, 80D deductions) to see which regime saves more money.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Annual Gross Salary / Income (₹)</label>
                <input type="number" min={100000} step={10000} value={taxAnnualIncome} onChange={(e) => setTaxAnnualIncome(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Deduction 80C (PPF, ELSS, EPF, LIC - Max 1.5L)</label>
                <input type="number" min={0} max={150000} step={5000} value={taxDeductions80C} onChange={(e) => setTaxDeductions80C(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Other Deductions (80D Health, HRA, NPS)</label>
                <input type="number" min={0} step={5000} value={taxDeductionsOther} onChange={(e) => setTaxDeductionsOther(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="p-3 bg-brand-blue/10 border border-brand-blue/20 rounded-xl text-center">
                <span className="text-[11px] font-bold text-brand-primary block">Recommended For You</span>
                <span className="text-lg font-black text-brand-blue">{taxComp.recommended}</span>
                {taxComp.diff > 0 && <span className="text-xs text-emerald-700 font-bold block mt-0.5">Saves approx ₹{taxComp.diff.toLocaleString('en-IN')} in tax</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">New Tax Regime</span>
                  <span className="text-xl font-black text-slate-900">₹{taxComp.taxNew.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Old Tax Regime</span>
                  <span className="text-xl font-black text-slate-900">₹{taxComp.taxOld.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          NEW TOOL 10: Driving Licence & Vehicle RC Validator
         ======================================================== */}
      {activeTab === 'dl_rc' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Driving Licence & Vehicle RC Number Validator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Validate Parivahan Sarathi DL format (SS-RRYYYYNNNNNNN) and Vahan RC registration number structure across all states.</p>
          </div>

          <form onSubmit={handleValidateDlRc} className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter DL Number or Vehicle RC</label>
              <input type="text" value={dlRcInput} onChange={(e) => setDlRcInput(e.target.value.toUpperCase())} placeholder="e.g. AS01 20210012345 or AS01EC1234" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-brand-blue" />
            </div>
            <button type="submit" className="bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow transition">
              Verify Document Format
            </button>
          </form>

          {dlRcResult && (
            <div className={`p-5 rounded-2xl border max-w-xl space-y-3 ${dlRcResult.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center space-x-2">
                {dlRcResult.valid ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <AlertCircle className="h-5 w-5 text-rose-700" />}
                <span className={`text-xs font-black uppercase ${dlRcResult.valid ? 'text-emerald-900' : 'text-rose-900'}`}>{dlRcResult.message}</span>
              </div>
              {dlRcResult.valid && (
                <div className="text-xs pt-2 border-t border-emerald-200/60 space-y-1">
                  <p>• State / Jurisdiction: <strong className="text-slate-900">{dlRcResult.state}</strong></p>
                  <p>• Classification: <strong className="text-slate-900">{dlRcResult.details}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          NEW TOOL 11: Bharat / UPI QR Generator
         ======================================================== */}
      {activeTab === 'upi_qr' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Bharat / UPI Payment QR Code Generator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Generate high-contrast UPI QR codes for CSC centers, citizen fee collection, and digital storefront payments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Your UPI ID (VPA)</label>
                <input type="text" value={upiVpa} onChange={(e) => setUpiVpa(e.target.value)} placeholder="e.g. mobile@okaxis, yourname@sbi" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Payee / Kendra Name</label>
                <input type="text" value={upiName} onChange={(e) => setUpiName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Amount (₹ - Optional)</label>
                <input type="number" min={1} value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Remark / Note</label>
                <input type="text" value={upiNote} onChange={(e) => setUpiNote(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900" />
              </div>
              <button type="button" onClick={copyUpiLink} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg transition flex items-center space-x-1.5">
                {upiCopied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{upiCopied ? "Link Copied!" : "Copy UPI Pay Link"}</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 bg-white rounded-2xl border border-slate-300 shadow-sm inline-block">
                <img src={qrImageUrl} alt="UPI QR Code" className="w-56 h-56 rounded-lg" />
              </div>
              <div className="text-xs font-bold text-slate-700">
                <p className="text-slate-900 font-black">{upiName}</p>
                <p className="text-slate-500 font-mono">{upiVpa}</p>
                {upiAmount && <p className="text-emerald-700 font-black text-sm mt-0.5">₹{upiAmount}</p>}
              </div>
              <a href={qrImageUrl} download="upi_payment_qr.png" target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 bg-brand-blue hover:bg-brand-primary text-white text-xs font-bold py-2 px-5 rounded-xl transition shadow">
                <Download className="h-3.5 w-3.5" />
                <span>Download Print-Ready QR</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          NEW TOOL 12: Indian Pincode Directory Finder
         ======================================================== */}
      {activeTab === 'pincode' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Indian Postal Index Number (PIN) Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">Identify postal region, operating zone, state circle, and sorting district for any 6-digit PIN code across India.</p>
          </div>

          <form onSubmit={handleValidatePincode} className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit PIN Code</label>
              <input type="text" value={pincodeInput} onChange={(e) => setPincodeInput(e.target.value)} maxLength={6} placeholder="e.g. 781001, 110001, 400001" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue" />
            </div>
            <button type="submit" className="bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow transition">
              Find Postal Zone
            </button>
          </form>

          {pincodeResult && (
            <div className={`p-5 rounded-2xl border max-w-xl space-y-3 ${pincodeResult.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center space-x-2">
                {pincodeResult.valid ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <AlertCircle className="h-5 w-5 text-rose-700" />}
                <span className={`text-xs font-black uppercase ${pincodeResult.valid ? 'text-emerald-900' : 'text-rose-900'}`}>{pincodeResult.message}</span>
              </div>
              {pincodeResult.valid && (
                <div className="text-xs pt-2 border-t border-emerald-200/60 space-y-2">
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Postal Operating Zone</span><strong className="text-slate-900">{pincodeResult.zone}</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Covered States / UTs</span><p className="text-slate-700">{pincodeResult.states}</p></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Routing Details</span><p className="text-slate-700 font-mono">{pincodeResult.sortingOffice}</p></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          NEW TOOL 13: Portal File Size Checker
         ======================================================== */}
      {activeTab === 'doc_size' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Govt Portal Document Upload Size & KB Checker</h2>
            <p className="text-xs text-slate-500 mt-0.5">Check if your scanned certificate or PDF passes file size limits (50KB, 100KB, 200KB, 2MB) on UPSC, SSC, Assam Sewa Setu, or Passport Seva portals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Target Portal Maximum Limit</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSelectedPresetLimit(50)} className={`p-2 rounded-lg border text-left ${selectedPresetLimit === 50 ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-slate-50'}`}>SSC / UPSC Photo (Max 50 KB)</button>
                  <button type="button" onClick={() => setSelectedPresetLimit(20)} className={`p-2 rounded-lg border text-left ${selectedPresetLimit === 20 ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-slate-50'}`}>Signature (Max 20 KB)</button>
                  <button type="button" onClick={() => setSelectedPresetLimit(200)} className={`p-2 rounded-lg border text-left ${selectedPresetLimit === 200 ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-slate-50'}`}>e-District / Caste (Max 200 KB)</button>
                  <button type="button" onClick={() => setSelectedPresetLimit(2048)} className={`p-2 rounded-lg border text-left ${selectedPresetLimit === 2048 ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-slate-50'}`}>Passport Annexure (Max 2 MB)</button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Enter File Size in Bytes</label>
                <input type="number" min={1} value={docSizeBytes} onChange={(e) => setDocSizeBytes(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900" />
              </div>
            </div>

            <div className={`p-6 rounded-2xl border text-center space-y-4 ${isDocUnderLimit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className={`text-[11px] font-bold uppercase block ${isDocUnderLimit ? 'text-emerald-800' : 'text-rose-800'}`}>Upload Feasibility</span>
              <span className={`text-3xl font-black ${isDocUnderLimit ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isDocUnderLimit ? "PASSED (Safe to Upload)" : "REJECTED (File Too Large)"}
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200/60">
                <div><span className="text-slate-500 block text-[10px] uppercase font-bold">Current Size</span><strong className="text-slate-900">{docSizeKb} KB ({docSizeMb} MB)</strong></div>
                <div><span className="text-slate-500 block text-[10px] uppercase font-bold">Max Allowed</span><strong className="text-slate-900">{selectedPresetLimit} KB</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          NEW TOOL 14: Form Text Sanitizer (UPPERCASE)
         ======================================================== */}
      {activeTab === 'text_case' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Govt Form Data Entry Text Sanitizer & CAPITALIZER</h2>
            <p className="text-xs text-slate-500 mt-0.5">Government application forms strictly mandate capital letters (BLOCK LETTERS). Clean irregular double spaces and instantly convert candidate details.</p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter / Paste Candidate Information</label>
              <textarea rows={4} value={sanitizeText} onChange={(e) => setSanitizeText(e.target.value)} placeholder="Type candidate name, address, father's name, or marks details here..." className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue" />
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-500 font-bold">
              <span>Characters: {charCount}</span>
              <span>Words: {wordCount}</span>
            </div>

            {sanitizeText && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Sanitized Block Letters (UPPERCASE)</span>
                  <button type="button" onClick={copySanitizedText} className="text-xs font-bold bg-brand-blue hover:bg-brand-primary text-white px-3 py-1 rounded-lg transition flex items-center space-x-1">
                    {copiedSanitize ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSanitize ? "Copied!" : "Copy Clean Text"}</span>
                  </button>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900 break-words">
                  {cleanedSingleSpaceText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          NEW TOOL 15: B&W / Grayscale Document Optimizer
         ======================================================== */}
      {activeTab === 'doc_filter' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900">Certificate & Mark-sheet B&W Document Optimizer</h2>
            <p className="text-xs text-slate-500 mt-0.5">Convert colored mobile camera scans of documents into clean High-Contrast Black & White or Grayscale to drastically reduce file size for online portal submissions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-slate-300 hover:border-brand-blue p-6 rounded-2xl text-center cursor-pointer bg-slate-50 transition">
                <Upload className="h-8 w-8 text-brand-blue mx-auto mb-2" />
                <span className="text-xs font-black text-slate-700 block">Upload Document Photo</span>
                <span className="text-[11px] text-slate-400">JPG, PNG Certificate / Marksheet</span>
                <input type="file" accept="image/*" onChange={handleDocFilterUpload} className="hidden" />
              </label>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Filter Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => { setDocFilterMode('color'); if (docFilterSrc) applyDocFilter(docFilterSrc, 'color', docFilterThreshold); }} className={`p-2 text-xs font-bold rounded-lg border ${docFilterMode === 'color' ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-slate-50'}`}>Original Color</button>
                  <button type="button" onClick={() => { setDocFilterMode('gray'); if (docFilterSrc) applyDocFilter(docFilterSrc, 'gray', docFilterThreshold); }} className={`p-2 text-xs font-bold rounded-lg border ${docFilterMode === 'gray' ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-slate-50'}`}>Grayscale</button>
                  <button type="button" onClick={() => { setDocFilterMode('bw'); if (docFilterSrc) applyDocFilter(docFilterSrc, 'bw', docFilterThreshold); }} className={`p-2 text-xs font-bold rounded-lg border ${docFilterMode === 'bw' ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-slate-50'}`}>High-Contrast B&W</button>
                </div>

                {docFilterMode === 'bw' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">B&W Darkness Threshold ({docFilterThreshold})</label>
                    <input type="range" min={50} max={200} value={docFilterThreshold} onChange={(e) => { const v = Number(e.target.value); setDocFilterThreshold(v); if (docFilterSrc) applyDocFilter(docFilterSrc, 'bw', v); }} className="w-full accent-brand-blue" />
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[220px]">
              {filteredDocUrl ? (
                <div className="space-y-4 text-center">
                  <img src={filteredDocUrl} alt="Optimized Doc" style={{ maxHeight: 260 }} className="mx-auto rounded border border-slate-300 shadow-sm bg-white" />
                  <a href={filteredDocUrl} download="netduniya_optimized_document.jpg" className="inline-flex items-center space-x-2 bg-brand-blue hover:bg-brand-primary text-white text-xs font-bold py-2 px-5 rounded-xl transition shadow">
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Optimized B&W Document</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Upload a certificate or document to preview B&W optimization</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
