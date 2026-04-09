import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, X, CreditCard, Shield, Loader2, RefreshCw, Copy, Terminal, Receipt, Eye, EyeOff, 
  Globe, Webhook, User, LogIn, LogOut, QrCode, IndianRupee, Smartphone, Languages, 
  AlertCircle, Banknote, Wallet, Bitcoin, Gift, Percent, ShieldCheck, BarChart2, 
  Download, FileText, Settings, HelpCircle, Bell, Share2, PieChart, Calendar, Filter,
  ChevronDown, ChevronUp, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Lottie from "lottie-react";
import successAnimation from "@/assets/success-animation.json";
import errorAnimation from "@/assets/error-animation.json";
import { toast, Toaster } from 'react-hot-toast';
import Lenis from '@studio-freight/lenis';

// Sound effects
const playSuccessSound = () => {
  const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-cash-register-ping-2576.mp3");
  audio.volume = 0.3;
  audio.play().catch(e => console.log("Audio play failed:", e));
};

const playErrorSound = () => {
  const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3");
  audio.volume = 0.3;
  audio.play().catch(e => console.log("Audio play failed:", e));
};

// --- Utility helpers ---
const formatCardNumber = (val) =>
  val
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (val) => {
  const v = val.replace(/\D/g, "").slice(0, 4);
  if (v.length < 3) return v;
  return v.slice(0, 2) + "/" + v.slice(2);
};

const maskCard = (num) => {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••• •••• •••• ${digits.slice(-4)}`;
};

const randId = (prefix = "txn_") => prefix + Math.random().toString(36).slice(2, 10);

const nowIso = () => new Date().toISOString();

// --- Demo crypto-ish tokenization (fake for UI only) ---
const fakeTokenize = (cardNumber) => {
  const clean = cardNumber.replace(/\s/g, "");
  const base = btoa(clean).replace(/=+$/, "");
  return `tok_${base.slice(0, 8)}${clean.slice(-4)}`;
};

// Persist/restore to localStorage
const useLocalStorage = (key, initial) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
};

// Tax rates by country/region
const taxRates = {
  US: {
    CA: 0.0825, // California
    NY: 0.08875, // New York
    TX: 0.0819, // Texas
    FL: 0.07,
    IL: 0.085,
    default: 0.06 // Average US tax
  },
  IN: {
    MH: 0.18, // Maharashtra
    DL: 0.18, // Delhi
    KA: 0.18, // Karnataka
    TN: 0.18, // Tamil Nadu
    default: 0.18 // GST in India
  },
  GB: {
    default: 0.2 // UK VAT
  },
  CA: {
    ON: 0.13, // Ontario
    QC: 0.14975, // Quebec
    BC: 0.12, // British Columbia
    default: 0.13 // Canada HST
  },
  AU: {
    NSW: 0.1, // New South Wales
    VIC: 0.1, // Victoria
    QLD: 0.1, // Queensland
    default: 0.1 // Australia GST
  },
  default: 0.1 // Fallback rate
};

// Password strength checker
const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "None" };
  
  let score = 0;
  // Length
  if (password.length > 5) score++;
  if (password.length > 8) score++;
  // Complexity
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)]
  };
};

// Exchange rate API (mock)
const getExchangeRate = async (from, to) => {
  // In a real app, you'd call an API here
  const rates = {
    INR: { USD: 0.012, EUR: 0.011, GBP: 0.0095, CAD: 0.016, AUD: 0.018, INR: 1 },
    USD: { INR: 83.5, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.52, USD: 1 },
    EUR: { INR: 90.2, USD: 1.09, GBP: 0.86, CAD: 1.47, AUD: 1.65, EUR: 1 },
    GBP: { INR: 105.3, USD: 1.27, EUR: 1.16, CAD: 1.71, AUD: 1.92, GBP: 1 },
    CAD: { INR: 61.5, USD: 0.74, EUR: 0.68, GBP: 0.58, AUD: 0.89, CAD: 1 },
    AUD: { INR: 55.2, USD: 0.66, EUR: 0.61, GBP: 0.52, CAD: 0.89, AUD: 1 }
  };
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return rates[from]?.[to] || 1;
};

// Language translations
const translations = {
  en: {
    title: "Mini Payment Gateway (Demo)",
    checkout: "Checkout",
    amount: "Amount",
    name: "Customer Name",
    email: "Email",
    cardNumber: "Card Number",
    expiry: "Expiry (MM/YY)",
    cvv: "CVV",
    pay: "Pay",
    processing: "Processing",
    success: "Payment Successful",
    failed: "Payment Failed",
    transactionId: "Transaction ID",
    date: "Date",
    refund: "Refund",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    tax: "Tax",
    total: "Total",
    password: "Password",
    passwordStrength: "Password Strength",
    convertCurrency: "Convert Currency",
    country: "Country",
    region: "State/Region",
    calculating: "Calculating...",
    initialBalance: "Initial Balance",
    currentBalance: "Current Balance",
    deposit: "Deposit Amount",
    netBanking: "Net Banking",
    wallet: "Digital Wallet",
    crypto: "Crypto",
    upi: "UPI",
    card: "Card",
    couponCode: "Coupon Code",
    applyCoupon: "Apply Coupon",
    discount: "Discount",
    loyaltyPoints: "Loyalty Points",
    usePoints: "Use Points",
    fraudDetection: "Fraud Detection",
    twoFactorAuth: "2FA Verification",
    pciCompliance: "PCI Compliance",
    merchantDashboard: "Merchant Dashboard",
    analytics: "Analytics",
    settlements: "Settlements",
    disputes: "Disputes",
    reports: "Reports",
    export: "Export",
    splitPayments: "Split Payments",
    vendorFee: "Vendor Fee",
    platformFee: "Platform Fee",
    escrow: "Escrow",
    webhookTesting: "Webhook Testing",
    testPayload: "Test Payload",
    mockEndpoint: "Mock Endpoint",
    mobileApp: "Mobile App",
    pwa: "PWA",
    moreCountries: "More Countries",
    moreLanguages: "More Languages",
  },
  hi: {
    title: "मिनी पेमेंट गेटवे (डेमो)",
    checkout: "चेकआउट",
    amount: "राशि",
    name: "ग्राहक का नाम",
    email: "ईमेल",
    cardNumber: "कार्ड नंबर",
    expiry: "समाप्ति (महीना/साल)",
    cvv: "सीवीवी",
    pay: "भुगतान करें",
    processing: "प्रसंस्करण",
    success: "भुगतान सफल",
    failed: "भुगतान विफल",
    transactionId: "लेनदेन आईडी",
    date: "तारीख",
    refund: "वापसी",
    login: "लॉग इन",
    signup: "साइन अप",
    logout: "लॉग आउट",
    tax: "कर",
    total: "कुल",
    password: "पासवर्ड",
    passwordStrength: "पासवर्ड स्ट्रेंथ",
    convertCurrency: "मुद्रा बदलें",
    country: "देश",
    region: "राज्य/क्षेत्र",
    calculating: "गणना कर रहे हैं...",
    initialBalance: "प्रारंभिक शेष",
    currentBalance: "वर्तमान शेष",
    deposit: "जमा राशि",
    netBanking: "नेट बैंकिंग",
    wallet: "डिजिटल वॉलेट",
    crypto: "क्रिप्टो",
    upi: "यूपीआई",
    card: "कार्ड",
    couponCode: "कूपन कोड",
    applyCoupon: "कूपन लागू करें",
    discount: "छूट",
    loyaltyPoints: "लॉयल्टी पॉइंट्स",
    usePoints: "पॉइंट्स का उपयोग करें",
    fraudDetection: "फ्रॉड डिटेक्शन",
    twoFactorAuth: "2FA सत्यापन",
    pciCompliance: "PCI अनुपालन",
    merchantDashboard: "मर्चेंट डैशबोर्ड",
    analytics: "एनालिटिक्स",
    settlements: "सेटलमेंट्स",
    disputes: "डिस्प्यूट्स",
    reports: "रिपोर्ट्स",
    export: "एक्सपोर्ट",
    splitPayments: "स्प्लिट पेमेंट्स",
    vendorFee: "वेंडर फीस",
    platformFee: "प्लेटफॉर्म फीस",
    escrow: "एस्क्रो",
    webhookTesting: "वेबहुक टेस्टिंग",
    testPayload: "टेस्ट पेलोड",
    mockEndpoint: "मॉक एंडपॉइंट",
    mobileApp: "मोबाइल ऐप",
    pwa: "PWA",
    moreCountries: "अधिक देश",
    moreLanguages: "अधिक भाषाएं",
  },
  es: {
    title: "Mini Pasarela de Pago (Demo)",
    checkout: "Pagar",
    amount: "Cantidad",
    name: "Nombre del Cliente",
    email: "Correo Electrónico",
    cardNumber: "Número de Tarjeta",
    expiry: "Expiración (MM/AA)",
    cvv: "CVV",
    pay: "Pagar",
    processing: "Procesando",
    success: "Pago Exitoso",
    failed: "Pago Fallido",
    transactionId: "ID de Transacción",
    date: "Fecha",
    refund: "Reembolso",
    login: "Iniciar Sesión",
    signup: "Registrarse",
    logout: "Cerrar Sesión",
    tax: "Impuesto",
    total: "Total",
    password: "Contraseña",
    passwordStrength: "Fuerza de Contraseña",
    convertCurrency: "Convertir Moneda",
    country: "País",
    region: "Estado/Región",
    calculating: "Calculando...",
    initialBalance: "Saldo Inicial",
    currentBalance: "Saldo Actual",
    deposit: "Cantidad de Depósito",
    netBanking: "Banca en Línea",
    wallet: "Billetera Digital",
    crypto: "Cripto",
    upi: "UPI",
    card: "Tarjeta",
    couponCode: "Código de Cupón",
    applyCoupon: "Aplicar Cupón",
    discount: "Descuento",
    loyaltyPoints: "Puntos de Lealtad",
    usePoints: "Usar Puntos",
    fraudDetection: "Detección de Fraude",
    twoFactorAuth: "Verificación 2FA",
    pciCompliance: "Cumplimiento PCI",
    merchantDashboard: "Panel de Comerciante",
    analytics: "Analíticas",
    settlements: "Liquidaciones",
    disputes: "Disputas",
    reports: "Informes",
    export: "Exportar",
    splitPayments: "Pagos Divididos",
    vendorFee: "Tarifa de Vendedor",
    platformFee: "Tarifa de Plataforma",
    escrow: "Escrow",
    webhookTesting: "Prueba de Webhook",
    testPayload: "Carga de Prueba",
    mockEndpoint: "Endpoint Simulado",
    mobileApp: "Aplicación Móvil",
    pwa: "PWA",
    moreCountries: "Más Países",
    moreLanguages: "Más Idiomas",
  },
  fr: {
    title: "Mini Passerelle de Paiement (Demo)",
    checkout: "Paiement",
    amount: "Montant",
    name: "Nom du Client",
    email: "E-mail",
    cardNumber: "Numéro de Carte",
    expiry: "Expiration (MM/AA)",
    cvv: "CVV",
    pay: "Payer",
    processing: "Traitement",
    success: "Paiement Réussi",
    failed: "Paiement Échoué",
    transactionId: "ID de Transaction",
    date: "Date",
    refund: "Remboursement",
    login: "Se Connecter",
    signup: "S'inscrire",
    logout: "Se Déconnecter",
    tax: "Taxe",
    total: "Total",
    password: "Mot de Passe",
    passwordStrength: "Force du Mot de Passe",
    convertCurrency: "Convertir Devise",
    country: "Pays",
    region: "État/Région",
    calculating: "Calcul en Cours...",
    initialBalance: "Solde Initial",
    currentBalance: "Solde Actuel",
    deposit: "Montant du Dépôt",
    netBanking: "Services Bancaires en Ligne",
    wallet: "Portefeuille Numérique",
    crypto: "Crypto",
    upi: "UPI",
    card: "Carte",
    couponCode: "Code Promo",
    applyCoupon: "Appliquer le Code Promo",
    discount: "Remise",
    loyaltyPoints: "Points de Fidélité",
    usePoints: "Utiliser les Points",
    fraudDetection: "Détection de Fraude",
    twoFactorAuth: "Vérification 2FA",
    pciCompliance: "Conformité PCI",
    merchantDashboard: "Tableau de Bord du Marchand",
    analytics: "Analyses",
    settlements: "Règlements",
    disputes: "Litiges",
    reports: "Rapports",
    export: "Exporter",
    splitPayments: "Paiements Divididos",
    vendorFee: "Frais du Vendeur",
    platformFee: "Frais de Plateforme",
    escrow: "Escrow",
    webhookTesting: "Test de Webhook",
    testPayload: "Charge de Test",
    mockEndpoint: "Endpoint Simulé",
    mobileApp: "Application Mobile",
    pwa: "PWA",
    moreCountries: "Plus de Pays",
    moreLanguages: "Plus de Langues",
  },
  de: {
    title: "Mini Zahlungsgateway (Demo)",
    checkout: "Kasse",
    amount: "Betrag",
    name: "Kundenname",
    email: "E-Mail",
    cardNumber: "Kartennummer",
    expiry: "Ablauf (MM/JJ)",
    cvv: "CVV",
    pay: "Bezahlen",
    processing: "Verarbeitung",
    success: "Zahlung Erfolgreich",
    failed: "Zahlung Fehlgeschlagen",
    transactionId: "Transaktions-ID",
    date: "Datum",
    refund: "Rückerstattung",
    login: "Anmelden",
    signup: "Registrieren",
    logout: "Abmelden",
    tax: "Steuer",
    total: "Gesamt",
    password: "Passwort",
    passwordStrength: "Passwortstärke",
    convertCurrency: "Währung Umrechnen",
    country: "Land",
    region: "Bundesland/Region",
    calculating: "Berechnung...",
    initialBalance: "Anfangsguthaben",
    currentBalance: "Aktuelles Guthaben",
    deposit: "Einzahlungsbetrag",
    netBanking: "Net Banking",
    wallet: "Digitale Geldbörse",
    crypto: "Krypto",
    upi: "UPI",
    card: "Karte",
    couponCode: "Gutscheincode",
    applyCoupon: "Gutschein Anwenden",
    discount: "Rabatt",
    loyaltyPoints: "Treuepunkte",
    usePoints: "Punkte Verwenden",
    fraudDetection: "Betrugserkennung",
    twoFactorAuth: "2FA-Verifizierung",
    pciCompliance: "PCI-Konformität",
    merchantDashboard: "Händler-Dashboard",
    analytics: "Analysen",
    settlements: "Abrechnungen",
    disputes: "Streitfälle",
    reports: "Berichte",
    export: "Exportieren",
    splitPayments: "Geteilte Zahlungen",
    vendorFee: "Verkäufergebühr",
    platformFee: "Plattformgebühr",
    escrow: "Treuhand",
    webhookTesting: "Webhook-Testen",
    testPayload: "Test Payload",
    mockEndpoint: "Mock Endpoint",
    mobileApp: "Mobile App",
    pwa: "PWA",
    moreCountries: "Mehr Länder",
    moreLanguages: "Mehr Sprachen",
  },
  // Add more languages as needed (e.g., zh, ja, ar, etc.) with similar structures
  zh: {
    title: "迷你支付网关 (演示)",
    checkout: "结账",
    amount: "金额",
    name: "客户姓名",
    email: "电子邮件",
    cardNumber: "卡号",
    expiry: "到期 (月/年)",
    cvv: "CVV",
    pay: "支付",
    processing: "处理中",
    success: "支付成功",
    failed: "支付失败",
    transactionId: "交易ID",
    date: "日期",
    refund: "退款",
    login: "登录",
    signup: "注册",
    logout: "登出",
    tax: "税",
    total: "总计",
    password: "密码",
    passwordStrength: "密码强度",
    convertCurrency: "转换货币",
    country: "国家",
    region: "州/地区",
    calculating: "计算中...",
    initialBalance: "初始余额",
    currentBalance: "当前余额",
    deposit: "存款金额",
    netBanking: "网上银行",
    wallet: "数字钱包",
    crypto: "加密货币",
    upi: "UPI",
    card: "卡",
    couponCode: "优惠码",
    applyCoupon: "应用优惠码",
    discount: "折扣",
    loyaltyPoints: "忠诚积分",
    usePoints: "使用积分",
    fraudDetection: "欺诈检测",
    twoFactorAuth: "2FA验证",
    pciCompliance: "PCI合规",
    merchantDashboard: "商家仪表板",
    analytics: "分析",
    settlements: "结算",
    disputes: "争议",
    reports: "报告",
    export: "导出",
    splitPayments: "分拆支付",
    vendorFee: "供应商费用",
    platformFee: "平台费用",
    escrow: "托管",
    webhookTesting: "Webhook测试",
    testPayload: "测试负载",
    mockEndpoint: "模拟端点",
    mobileApp: "移动应用",
    pwa: "PWA",
    moreCountries: "更多国家",
    moreLanguages: "更多语言",
  },
  ja: {
    title: "ミニペイメントゲートウェイ (デモ)",
    checkout: "チェックアウト",
    amount: "金額",
    name: "顧客名",
    email: "メール",
    cardNumber: "カード番号",
    expiry: "有効期限 (月/年)",
    cvv: "CVV",
    pay: "支払う",
    processing: "処理中",
    success: "支払い成功",
    failed: "支払い失敗",
    transactionId: "取引ID",
    date: "日付",
    refund: "払い戻し",
    login: "ログイン",
    signup: "サインアップ",
    logout: "ログアウト",
    tax: "税",
    total: "合計",
    password: "パスワード",
    passwordStrength: "パスワード強度",
    convertCurrency: "通貨変換",
    country: "国",
    region: "州/地域",
    calculating: "計算中...",
    initialBalance: "初期残高",
    currentBalance: "現在の残高",
    deposit: "入金額",
    netBanking: "ネットバンキング",
    wallet: "デジタルウォレット",
    crypto: "暗号通貨",
    upi: "UPI",
    card: "カード",
    couponCode: "クーポンコード",
    applyCoupon: "クーポンを適用",
    discount: "割引",
    loyaltyPoints: "ロイヤリティポイント",
    usePoints: "ポイントを使用",
    fraudDetection: "詐欺検知",
    twoFactorAuth: "2FA検証",
    pciCompliance: "PCI準拠",
    merchantDashboard: "マーチャントダッシュボード",
    analytics: "分析",
    settlements: "決済",
    disputes: "紛争",
    reports: "レポート",
    export: "エクスポート",
    splitPayments: "分割支払い",
    vendorFee: "ベンダー手数料",
    platformFee: "プラットフォーム手数料",
    escrow: "エスクロー",
    webhookTesting: "Webhookテスト",
    testPayload: "テストペイロード",
    mockEndpoint: "モックエンドポイント",
    mobileApp: "モバイルアプリ",
    pwa: "PWA",
    moreCountries: "もっと国",
    moreLanguages: "もっと言語",
  },
  ar: {
    title: "بوابة الدفع المصغرة (تجريبي)",
    checkout: "الدفع",
    amount: "المبلغ",
    name: "اسم العميل",
    email: "البريد الإلكتروني",
    cardNumber: "رقم البطاقة",
    expiry: "الانتهاء (شهر/سنة)",
    cvv: "CVV",
    pay: "دفع",
    processing: "معالجة",
    success: "الدفع ناجح",
    failed: "الدفع فاشل",
    transactionId: "معرف المعاملة",
    date: "التاريخ",
    refund: "استرداد",
    login: "تسجيل الدخول",
    signup: "التسجيل",
    logout: "تسجيل الخروج",
    tax: "الضريبة",
    total: "الإجمالي",
    password: "كلمة المرور",
    passwordStrength: "قوة كلمة المرور",
    convertCurrency: "تحويل العملة",
    country: "البلد",
    region: "الولاية/المنطقة",
    calculating: "جار الحساب...",
    initialBalance: "الرصيد الأولي",
    currentBalance: "الرصيد الحالي",
    deposit: "مبلغ الإيداع",
    netBanking: "الخدمات المصرفية عبر الإنترنت",
    wallet: "محفظة رقمية",
    crypto: "عملة مشفرة",
    upi: "UPI",
    card: "بطاقة",
    couponCode: "رمز الكوبون",
    applyCoupon: "تطبيق الكوبون",
    discount: "خصم",
    loyaltyPoints: "نقاط الولاء",
    usePoints: "استخدام النقاط",
    fraudDetection: "كشف الاحتيال",
    twoFactorAuth: "التحقق 2FA",
    pciCompliance: "امتثال PCI",
    merchantDashboard: "لوحة تحكم التاجر",
    analytics: "التحليلات",
    settlements: "التسويات",
    disputes: "النزاعات",
    reports: "التقارير",
    export: "تصدير",
    splitPayments: "مدفوعات مقسمة",
    vendorFee: "رسوم البائع",
    platformFee: "رسوم المنصة",
    escrow: "الضمان",
    webhookTesting: "اختبار Webhook",
    testPayload: "حمولة الاختبار",
    mockEndpoint: "نقطة النهاية المزيفة",
    mobileApp: "تطبيق الهاتف المحمول",
    pwa: "PWA",
    moreCountries: "مزيد من البلدان",
    moreLanguages: "مزيد من اللغات",
  },
  // Additional languages can be added similarly
};

// Currency configurations
const currencies = {
  INR: { symbol: "₹", name: "Indian Rupee" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  CAD: { symbol: "CA$", name: "Canadian Dollar" },
  AUD: { symbol: "AU$", name: "Australian Dollar" }
};

// Country list for tax calculation
const countries = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" },
];

// States/regions for countries
const countryRegions = {
  US: [
    { code: "CA", name: "California" },
    { code: "NY", name: "New York" },
    { code: "TX", name: "Texas" },
    { code: "FL", name: "Florida" },
    { code: "IL", name: "Illinois" },
  ],
  IN: [
    { code: "MH", name: "Maharashtra" },
    { code: "DL", name: "Delhi" },
    { code: "KA", name: "Karnataka" },
    { code: "TN", name: "Tamil Nadu" },
    { code: "UP", name: "Uttar Pradesh" },
  ],
  CA: [
    { code: "ON", name: "Ontario" },
    { code: "QC", name: "Quebec" },
    { code: "BC", name: "British Columbia" },
    { code: "AB", name: "Alberta" },
  ],
  AU: [
    { code: "NSW", name: "New South Wales" },
    { code: "VIC", name: "Victoria" },
    { code: "QLD", name: "Queensland" },
    { code: "WA", name: "Western Australia" },
  ],
  DE: [
    { code: "BE", name: "Berlin" },
    { code: "BY", name: "Bavaria" },
    { code: "NW", name: "North Rhine-Westphalia" },
  ],
  AE: [
    { code: "DXB", name: "Dubai" },
    { code: "AUH", name: "Abu Dhabi" },
    { code: "SHJ", name: "Sharjah" },
  ]
};

// Mock banks by country
const banksByCountry = {
  IN: [
    { id: "sbi", name: "State Bank of India", code: "SBIN0000001" },
    { id: "hdfc", name: "HDFC Bank", code: "HDFC0000001" },
    { id: "icici", name: "ICICI Bank", code: "ICIC0000001" },
    { id: "axis", name: "Axis Bank", code: "UTIB0000001" },
    { id: "kotak", name: "Kotak Mahindra Bank", code: "KKBK0000001" },
    { id: "indusind", name: "IndusInd Bank", code: "INDB0000001" },
    { id: "yes", name: "YES Bank", code: "YESB0000001" },
    { id: "pnb", name: "Punjab National Bank", code: "PUNB0000001" },
    { id: "bob", name: "Bank of Baroda", code: "BARB0000001" },
    { id: "boi", name: "Bank of India", code: "BKID0000001" },
    { id: "canara", name: "Canara Bank", code: "CNRB0000001" },
    { id: "union", name: "Union Bank of India", code: "UBIN0000001" },
    { id: "idbi", name: "IDBI Bank", code: "IBKL0000001" },
    { id: "federal", name: "Federal Bank", code: "FDRL0000001" },
    { id: "sib", name: "South Indian Bank", code: "SIBL0000001" },
    // Add more Indian banks as needed
  ],
  US: [
    { id: "chase", name: "Chase Bank", code: "CHASUS33" },
    { id: "boa", name: "Bank of America", code: "BOFAUS3N" },
    { id: "wellsfargo", name: "Wells Fargo", code: "WFBIUS6S" },
    { id: "citi", name: "Citibank", code: "CITIUS33" },
    { id: "usbank", name: "U.S. Bank", code: "USBKUS44" },
    { id: "pnc", name: "PNC Bank", code: "PNCCUS33" },
    { id: "td", name: "TD Bank", code: "NRTHUS33" },
    { id: "capitalone", name: "Capital One", code: "HIBKUS44" },
    { id: "suntrust", name: "Truist Bank", code: "SNTRUS3A" },
    { id: "fifththird", name: "Fifth Third Bank", code: "FTBCUS3C" },
    // Add more US banks as needed
  ],
  GB: [
    { id: "hsbc", name: "HSBC UK", code: "MIDLGB22" },
    { id: "barclays", name: "Barclays Bank", code: "BARCGB22" },
    { id: "lloyds", name: "Lloyds Bank", code: "LOYDGB2L" },
    { id: "natwest", name: "NatWest", code: "NWBKGB2L" },
    { id: "santander", name: "Santander UK", code: "ABBYGB2L" },
    // Add more UK banks
  ],
  CA: [
    { id: "rbc", name: "Royal Bank of Canada", code: "ROYCCAT2" },
    { id: "tdcanada", name: "TD Canada Trust", code: "TDOMCATTTOR" },
    { id: "scotiabank", name: "Scotiabank", code: "NOSCCATT" },
    { id: "bmo", name: "Bank of Montreal", code: "BOFMCAT2" },
    { id: "cibc", name: "CIBC", code: "CIBCCATT" },
    // Add more Canadian banks
  ],
  AU: [
    { id: "commbank", name: "Commonwealth Bank", code: "CTBAAU2S" },
    { id: "anz", name: "ANZ Bank", code: "ANZBAU3M" },
    { id: "westpac", name: "Westpac", code: "WPACAU2S" },
    { id: "nab", name: "National Australia Bank", code: "NATAAU3303M" },
    // Add more Australian banks
  ],
  default: [
    { id: "citi", name: "Citi Bank", code: "CITI0000001" },
    { id: "hsbc", name: "HSBC Bank", code: "HSBC0000001" },
  ]
};

// Mock digital wallets
const wallets = [
  { id: "paytm", name: "Paytm Wallet" },
  { id: "phonepe", name: "PhonePe" },
  { id: "amazonpay", name: "Amazon Pay" },
  { id: "mobikwik", name: "MobiKwik" },
  { id: "freecharge", name: "FreeCharge" },
];

// Mock cryptocurrencies
const cryptocurrencies = [
  { id: "btc", name: "Bitcoin (BTC)", rate: 0.000025 },
  { id: "eth", name: "Ethereum (ETH)", rate: 0.0004 },
  { id: "usdt", name: "Tether (USDT)", rate: 0.012 },
  { id: "xrp", name: "Ripple (XRP)", rate: 0.5 },
  { id: "doge", name: "Dogecoin (DOGE)", rate: 10 },
];

// Mock coupons
const coupons = [
  { code: "WELCOME10", discount: 10, type: "percent" },
  { code: "FESTIVE20", discount: 20, type: "percent" },
  { code: "FLAT50", discount: 50, type: "fixed" },
  { code: "NEWUSER100", discount: 100, type: "fixed" },
];

// Export the payment gateway functions for developers
export const MPG = {
  checkout: (options) => {
    // In a real implementation, this would open the payment gateway
    toast.success('Payment gateway initialized with options: ' + JSON.stringify(options));
    console.log('Payment gateway initialized with options:', options);
  },
  redirectToCheckout: (options) => {
    // In a real implementation, this would redirect to the payment page
    toast.success('Redirecting to checkout with options: ' + JSON.stringify(options));
    console.log('Redirecting to checkout with options:', options);
  },
  elements: () => {
    // In a real implementation, this would return elements for custom UI
    toast.success('Elements initialized for custom payment UI');
    console.log('Elements initialized for custom payment UI');
    return {
      create: (type, options) => {
        console.log(`Creating ${type} element with options:`, options);
        return {
          mount: (selector) => {
            console.log(`Mounting ${type} element to ${selector}`);
          }
        };
      }
    };
  }
};

// --- Main component ---
export default function MiniPaymentGateway() {
  // Authentication state
  const [auth, setAuth] = useLocalStorage("mpg_auth_v1", null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authProcessing, setAuthProcessing] = useState(false);
  const [authError, setAuthError] = useState("");
  const [initialBalance, setInitialBalance] = useState(0);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSent, setTwoFactorSent] = useState("");
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);

  // Payment state
  const [amount, setAmount] = useState(499);
  const [name, setName] = useState(auth?.name || "");
  const [email, setEmail] = useState(auth?.email || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showCvv, setShowCvv] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState("");
  const otpRef = useRef(null);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'netbanking', 'wallet', 'crypto'
  const [vpa, setVpa] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCode] = useState(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=demo-upi://pay?pa=merchant@upi&pn=MiniPG&am=${amount}&tn=Payment`);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(auth?.loyaltyPoints || 0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [fraudDetected, setFraudDetected] = useState(false);
  const [pciComplianceChecked, setPciComplianceChecked] = useState(false);
  const [splitPaymentEnabled, setSplitPaymentEnabled] = useState(false);
  const [vendorPercentage, setVendorPercentage] = useState(70);
  const [platformPercentage, setPlatformPercentage] = useState(30);
  const [escrowEnabled, setEscrowEnabled] = useState(false);
  const [escrowReleaseDays, setEscrowReleaseDays] = useState(7);

  // Settings state
  const [language, setLanguage] = useLocalStorage("mpg_language", "en");
  const [currency, setCurrency] = useLocalStorage("mpg_currency", "INR");
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [selectedRegion, setSelectedRegion] = useState("");

  // Exchange rate state
  const [convertCurrency, setConvertCurrency] = useState("INR");
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  // Data state
  const [users, setUsers] = useLocalStorage("mpg_users_v1", []);
  const [transactions, setTransactions] = useLocalStorage("mpg_transactions_v1", []);
  const [webhooks, setWebhooks] = useLocalStorage("mpg_webhooks_v1", []);
  const [apiKeys, setApiKeys] = useLocalStorage("mpg_keys_v1", {
    publishable: "pk_test_" + Math.random().toString(36).slice(2, 10),
    secret: "sk_test_" + Math.random().toString(36).slice(2, 14),
  });
  const [activeTab, setActiveTab] = useState("checkout");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [failureModal, setFailureModal] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastSuccessfulTxn, setLastSuccessfulTxn] = useState(null);
  const [lastFailedTxn, setLastFailedTxn] = useState(null);
  const [accountBalance, setAccountBalance] = useLocalStorage("mpg_account_balance", 0);
  const [dateRange, setDateRange] = useState("7days");
  const [exportFormat, setExportFormat] = useState("csv");
  const [webhookPayload, setWebhookPayload] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://api.example.com/webhooks");
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);

  // Filter transactions for current user
  const userTransactions = useMemo(() => {
    return auth ? transactions.filter(t => t.userId === auth.id) : [];
  }, [transactions, auth]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let fromDate = new Date();
    
    switch(dateRange) {
      case "today":
        fromDate.setHours(0, 0, 0, 0);
        break;
      case "7days":
        fromDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        fromDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        fromDate.setDate(now.getDate() - 90);
        break;
      default:
        return userTransactions;
    }
    
    return userTransactions.filter(t => new Date(t.created) >= fromDate);
  }, [userTransactions, dateRange]);

  // Get current translations
  const t = translations[language] || translations.en;

  // Calculate tax
  const taxRate = useMemo(() => {
    const countryTax = taxRates[selectedCountry] || taxRates.default;
    if (typeof countryTax === 'object') {
      return countryTax[selectedRegion] || countryTax.default;
    }
    return countryTax;
  }, [selectedCountry, selectedRegion]);

  const taxAmount = useMemo(() => {
    return amount * taxRate;
  }, [amount, taxRate]);

  // Calculate discount
  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.type === "percent") {
        setDiscountAmount(amount * (appliedCoupon.discount / 100));
      } else {
        setDiscountAmount(Math.min(appliedCoupon.discount, amount));
      }
    } else {
      setDiscountAmount(0);
    }
  }, [appliedCoupon, amount]);

  // Calculate loyalty points discount (1 point = 0.1 currency unit)
  const loyaltyDiscount = useMemo(() => {
    if (!useLoyaltyPoints || !auth) return 0;
    const maxPoints = Math.min(pointsToUse, loyaltyPoints, Math.floor(amount * 10));
    return maxPoints * 0.1;
  }, [useLoyaltyPoints, pointsToUse, loyaltyPoints, amount, auth]);

  const subtotal = useMemo(() => {
    return amount - discountAmount - loyaltyDiscount;
  }, [amount, discountAmount, loyaltyDiscount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal + taxAmount);
  }, [subtotal, taxAmount]);

  // Calculate crypto amount when currency or selected crypto changes
  useEffect(() => {
    if (selectedCrypto && cryptocurrencies.find(c => c.id === selectedCrypto)) {
      const crypto = cryptocurrencies.find(c => c.id === selectedCrypto);
      setCryptoAmount(totalAmount * crypto.rate);
    }
  }, [selectedCrypto, totalAmount]);

  // Validation
  const cardValid = useMemo(() => {
    const digits = cardNumber.replace(/\D/g, "");
    return digits.length === 16;
  }, [cardNumber]);

  const expiryValid = useMemo(() => {
    const [mm, yy] = expiry.split("/");
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return false;
    const m = parseInt(mm, 10);
    const y = parseInt("20" + yy, 10);
    if (isNaN(m) || m < 1 || m > 12) return false;
    const now = new Date();
    const exp = new Date(y, m);
    return exp > now;
  }, [expiry]);

  const cvvValid = cvv.replace(/\D/g, "").length >= 3;
  
  const canPay = amount > 0 && name.length >= 2 && /@/.test(email) && 
    ((paymentMethod === 'card' && cardValid && expiryValid && cvvValid) || 
     (paymentMethod === 'upi' && (showQR || vpa)) ||
     (paymentMethod === 'netbanking' && selectedBank) ||
     (paymentMethod === 'wallet' && selectedWallet) ||
     (paymentMethod === 'crypto' && selectedCrypto)) && 
    !processing &&
    (accountBalance >= totalAmount || !auth); // Check balance only for logged in users

  // Password strength
  const passwordStrength = useMemo(() => {
    return checkPasswordStrength(authPassword);
  }, [authPassword]);

  // Convert currency
  const handleConvertCurrency = async () => {
    if (convertCurrency === currency) {
      setConvertedAmount(amount);
      return;
    }
    
    setIsConverting(true);
    try {
      const rate = await getExchangeRate(currency, convertCurrency);
      setConvertedAmount(amount * rate);
    } catch (error) {
      console.error("Currency conversion failed", error);
      setConvertedAmount(0);
    } finally {
      setIsConverting(false);
    }
  };

  // Effect to convert currency when amount or currency changes
  useEffect(() => {
    handleConvertCurrency();
  }, [amount, currency, convertCurrency]);

  // Generate random coupons when amount changes
  useEffect(() => {
    if (amount > 1000 && Math.random() > 0.5) {
      const randomCoupons = [...coupons]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      setAvailableCoupons(randomCoupons);
    } else {
      setAvailableCoupons([]);
    }
  }, [amount]);

  // Authentication handlers
  const handleAuth = async () => {
    setAuthProcessing(true);
    setAuthError("");
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (authMode === "login") {
        const user = users.find(u => u.email === authEmail && u.password === authPassword);
        if (!user) throw new Error("Invalid email or password");
        
        // Always show 2FA for demo purposes
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setTwoFactorSent(code);
        setShowTwoFactor(true);
        return;
      } else {
        // Signup
        if (users.some(u => u.email === authEmail)) throw new Error("Email already exists");
        if (authPassword.length < 6) throw new Error("Password must be at least 6 characters");
        
        const newUser = {
          id: `user_${Math.random().toString(36).slice(2, 10)}`,
          name: authName,
          email: authEmail,
          password: authPassword,
          balance: initialBalance || 0,
          loyaltyPoints: 43, // Starting with 43 points
          createdAt: nowIso()
        };
        
        setUsers(prev => [...prev, newUser]);
        completeLogin(newUser);
      }
    } catch (err) {
      setAuthError(err.message);
      toast.error(err.message);
    } finally {
      setAuthProcessing(false);
    }
  };

  const completeLogin = (user) => {
    setAuth(user);
    setAccountBalance(user.balance || 0);
    setLoyaltyPoints(user.loyaltyPoints || 0);
    setName(user.name);
    setEmail(user.email);
    setShowAuthModal(false);
    setShowTwoFactor(false);
    toast.success(`Welcome ${user.name}!`);
  };

  const verifyTwoFactor = () => {
    if (twoFactorCode === twoFactorSent) {
      const user = users.find(u => u.email === authEmail && u.password === authPassword);
      if (user) {
        completeLogin(user);
      }
    } else {
      setAuthError("Invalid verification code");
      toast.error("Invalid verification code");
    }
  };

  const handleLogout = () => {
    setAuth(null);
    setName("");
    setEmail("");
    setAccountBalance(0);
    setLoyaltyPoints(0);
    toast.success("Logged out successfully");
  };

  // Payment handlers
  const startOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpSent(code);
    setOtp("");
    setOtpStep(true);
    setTimeout(() => otpRef.current?.focus(), 50);
    toast.success(`OTP sent: ${code} (Demo only)`);
  };

  const simulateWebhook = (type, payload) => {
    const event = { id: randId("evt_"), type, created: nowIso(), payload };
    setWebhooks((prev) => [event, ...prev].slice(0, 100));
  };

  const handleUPIPayment = async () => {
    setProcessing(true);
    setResult(null);
    
    // Simulate UPI app opening
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate payment processing with random delay (1-3 sec)
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 80% success rate for demo
    const success = Math.random() > 0.2;
    
    const txn = {
      id: randId(),
      status: success ? "succeeded" : "failed",
      amount: Number(amount),
      customer: { name, email },
      paymentMethod: 'upi',
      details: {
        vpa: vpa || 'customer@upi',
        txnId: `upi_${Math.random().toString(36).slice(2, 10)}`
      },
      created: nowIso(),
      refunded: false,
      userId: auth?.id || null,
      tax: taxAmount,
      discount: discountAmount + loyaltyDiscount,
      total: totalAmount,
      ...(appliedCoupon && { coupon: appliedCoupon.code }),
      ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse })
    };

    setTransactions((prev) => [txn, ...prev]);
    simulateWebhook(`payment.${success ? "succeeded" : "failed"}`, txn);

    if (success) {
      if (auth) {
        setAccountBalance(prev => prev - totalAmount);
        // Add loyalty points (1 point per 10 currency units)
        const pointsEarned = Math.floor(totalAmount / 10);
        setLoyaltyPoints(prev => prev + pointsEarned);
        // Update user in storage
        setUsers(prev => prev.map(u => 
          u.id === auth.id ? { ...u, loyaltyPoints: u.loyaltyPoints + pointsEarned } : u
        ));
      }
      setLastSuccessfulTxn(txn);
      setShowAnimation(true);
      playSuccessSound();
      setTimeout(() => {
        setShowAnimation(false);
        setSuccessModal(true);
        setActiveTab("dashboard");
      }, 2000);
    } else {
      setLastFailedTxn(txn);
      setShowAnimation(true);
      playErrorSound();
      setTimeout(() => {
        setShowAnimation(false);
        setFailureModal(true);
      }, 2000);
    }
    
    setProcessing(false);
  };

  const handleNetBankingPayment = async () => {
    setProcessing(true);
    setResult(null);
    
    // Simulate bank page loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate payment processing with random delay (2-4 sec)
    const delay = 2000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 85% success rate for demo
    const success = Math.random() > 0.15;
    
    const bank = (banksByCountry[selectedCountry] || banksByCountry.default).find(b => b.id === selectedBank);
    
    const txn = {
      id: randId(),
      status: success ? "succeeded" : "failed",
      amount: Number(amount),
      customer: { name, email },
      paymentMethod: 'netbanking',
      details: {
        bank: bank?.name || 'Unknown Bank',
        bankCode: bank?.code || 'UNKNOWN',
        txnId: `nb_${Math.random().toString(36).slice(2, 10)}`
      },
      created: nowIso(),
      refunded: false,
      userId: auth?.id || null,
      tax: taxAmount,
      discount: discountAmount + loyaltyDiscount,
      total: totalAmount,
      ...(appliedCoupon && { coupon: appliedCoupon.code }),
      ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse })
    };

    setTransactions((prev) => [txn, ...prev]);
    simulateWebhook(`payment.${success ? "succeeded" : "failed"}`, txn);

    if (success) {
      if (auth) {
        setAccountBalance(prev => prev - totalAmount);
        // Add loyalty points (1 point per 10 currency units)
        const pointsEarned = Math.floor(totalAmount / 10);
        setLoyaltyPoints(prev => prev + pointsEarned);
        // Update user in storage
        setUsers(prev => prev.map(u => 
          u.id === auth.id ? { ...u, loyaltyPoints: u.loyaltyPoints + pointsEarned } : u
        ));
      }
      setLastSuccessfulTxn(txn);
      setShowAnimation(true);
      playSuccessSound();
      setTimeout(() => {
        setShowAnimation(false);
        setSuccessModal(true);
        setActiveTab("dashboard");
      }, 2000);
    } else {
      setLastFailedTxn(txn);
      setShowAnimation(true);
      playErrorSound();
      setTimeout(() => {
        setShowAnimation(false);
        setFailureModal(true);
      }, 2000);
    }
    
    setProcessing(false);
  };

  const handleWalletPayment = async () => {
    setProcessing(true);
    setResult(null);
    
    // Simulate wallet app opening
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate payment processing with random delay (1-3 sec)
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 90% success rate for demo
    const success = Math.random() > 0.1;
    
    const wallet = wallets.find(w => w.id === selectedWallet);
    
    const txn = {
      id: randId(),
      status: success ? "succeeded" : "failed",
      amount: Number(amount),
      customer: { name, email },
      paymentMethod: 'wallet',
      details: {
        wallet: wallet?.name || 'Unknown Wallet',
        txnId: `wallet_${Math.random().toString(36).slice(2, 10)}`
      },
      created: nowIso(),
      refunded: false,
      userId: auth?.id || null,
      tax: taxAmount,
      discount: discountAmount + loyaltyDiscount,
      total: totalAmount,
      ...(appliedCoupon && { coupon: appliedCoupon.code }),
      ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse })
    };

    setTransactions((prev) => [txn, ...prev]);
    simulateWebhook(`payment.${success ? "succeeded" : "failed"}`, txn);

    if (success) {
      if (auth) {
        setAccountBalance(prev => prev - totalAmount);
        // Add loyalty points (1 point per 10 currency units)
        const pointsEarned = Math.floor(totalAmount / 10);
        setLoyaltyPoints(prev => prev + pointsEarned);
        // Update user in storage
        setUsers(prev => prev.map(u => 
          u.id === auth.id ? { ...u, loyaltyPoints: u.loyaltyPoints + pointsEarned } : u
        ));
      }
      setLastSuccessfulTxn(txn);
      setShowAnimation(true);
      playSuccessSound();
      setTimeout(() => {
        setShowAnimation(false);
        setSuccessModal(true);
        setActiveTab("dashboard");
      }, 2000);
    } else {
      setLastFailedTxn(txn);
      setShowAnimation(true);
      playErrorSound();
      setTimeout(() => {
        setShowAnimation(false);
        setFailureModal(true);
      }, 2000);
    }
    
    setProcessing(false);
  };

  const handleCryptoPayment = async () => {
    setProcessing(true);
    setResult(null);
    
    // Simulate crypto wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate payment processing with random delay (3-5 sec)
    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 95% success rate for demo
    const success = Math.random() > 0.05;
    
    const crypto = cryptocurrencies.find(c => c.id === selectedCrypto);
    
    const txn = {
      id: randId(),
      status: success ? "succeeded" : "failed",
      amount: Number(amount),
      customer: { name, email },
      paymentMethod: 'crypto',
      details: {
        cryptocurrency: crypto?.name || 'Unknown Crypto',
        cryptoAmount,
        txnId: `crypto_${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`,
        blockchainHash: `0x${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`
      },
      created: nowIso(),
      refunded: false,
      userId: auth?.id || null,
      tax: taxAmount,
      discount: discountAmount + loyaltyDiscount,
      total: totalAmount,
      ...(appliedCoupon && { coupon: appliedCoupon.code }),
      ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse })
    };

    setTransactions((prev) => [txn, ...prev]);
    simulateWebhook(`payment.${success ? "succeeded" : "failed"}`, txn);

    if (success) {
      if (auth) {
        setAccountBalance(prev => prev - totalAmount);
        // Add loyalty points (1 point per 10 currency units)
        const pointsEarned = Math.floor(totalAmount / 10);
        setLoyaltyPoints(prev => prev + pointsEarned);
        // Update user in storage
        setUsers(prev => prev.map(u => 
          u.id === auth.id ? { ...u, loyaltyPoints: u.loyaltyPoints + pointsEarned } : u
        ));
      }
      setLastSuccessfulTxn(txn);
      setShowAnimation(true);
      playSuccessSound();
      setTimeout(() => {
        setShowAnimation(false);
        setSuccessModal(true);
        setActiveTab("dashboard");
      }, 2000);
    } else {
      setLastFailedTxn(txn);
      setShowAnimation(true);
      playErrorSound();
      setTimeout(() => {
        setShowAnimation(false);
        setFailureModal(true);
      }, 2000);
    }
    
    setProcessing(false);
  };

  const handlePay = async () => {
    // Check fraud detection (randomly flag 10% of transactions)
    setFraudDetected(Math.random() < 0.1);
    
    // Check PCI compliance for card payments
    if (paymentMethod === 'card') {
      setPciComplianceChecked(true);
    }
    
    switch(paymentMethod) {
      case 'upi':
        return handleUPIPayment();
      case 'netbanking':
        return handleNetBankingPayment();
      case 'wallet':
        return handleWalletPayment();
      case 'crypto':
        return handleCryptoPayment();
      case 'card':
      default:
        return handleCardPayment();
    }
  };

  const handlePaymentCancel = () => {
    const txn = {
      id: randId(),
      status: "failed",
      amount: Number(amount),
      customer: { name, email },
      paymentMethod,
      created: nowIso(),
      userId: auth?.id || null,
      failureReason: "User cancelled transaction",
      tax: taxAmount,
      discount: discountAmount + loyaltyDiscount,
      total: totalAmount,
      ...(appliedCoupon && { coupon: appliedCoupon.code }),
      ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse })
    };

    setTransactions((prev) => [txn, ...prev]);
    setLastFailedTxn(txn);
    setFailureModal(true);
    simulateWebhook("payment.failed", txn);
    setOtpStep(false);
    playErrorSound();
    toast.error("Payment cancelled by user");
  };

  // Enhanced PDF generator with professional styling
  const generatePdfReceipt = (txn) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "A5" });
      
      // Add logo and header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Blue-500
      doc.text("Mini Payment Gateway", 40, 60);
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text("Payment Receipt", 40, 80);
      
      // Divider line
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.setLineWidth(1);
      doc.line(40, 90, 160, 90);
      
      // Transaction details
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`Receipt #: ${txn.id}`, 40, 110);
      doc.text(`Date: ${new Date(txn.created).toLocaleString()}`, 40, 125);
      doc.text(`Status: ${txn.status.toUpperCase()}`, 40, 140);
      
      // Customer details
      doc.text(`Customer: ${txn.customer.name}`, 40, 160);
      doc.text(`Email: ${txn.customer.email}`, 40, 175);
      
      // Payment summary table
      autoTable(doc, {
        startY: 200,
        head: [['Description', `Amount (${currency})`]],
        body: [
          ['Payment Amount', `${currencies[currency].symbol}${txn.amount.toFixed(2)}`],
          ...(txn.discount ? [['Discount', `-${currencies[currency].symbol}${txn.discount.toFixed(2)}`]] : []),
          ['Subtotal', `${currencies[currency].symbol}${(txn.amount - (txn.discount || 0)).toFixed(2)}`],
          ['Tax', `${currencies[currency].symbol}${txn.tax.toFixed(2)}`],
          ['Total', `${currencies[currency].symbol}${txn.total.toFixed(2)}`]
        ],
        headStyles: {
          fillColor: [241, 245, 249], // Slate-50
          textColor: [71, 85, 105], // Slate-600
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50
        },
        margin: { left: 40 }
      });
      
      // Payment method details
      if (txn.paymentMethod === 'upi') {
        doc.text(`Payment Method: UPI (${txn.details.vpa})`, 40, doc.lastAutoTable.finalY + 20);
      } else if (txn.paymentMethod === 'netbanking') {
        doc.text(`Payment Method: Net Banking (${txn.details.bank})`, 40, doc.lastAutoTable.finalY + 20);
      } else if (txn.paymentMethod === 'wallet') {
        doc.text(`Payment Method: Digital Wallet (${txn.details.wallet})`, 40, doc.lastAutoTable.finalY + 20);
      } else if (txn.paymentMethod === 'crypto') {
        doc.text(`Payment Method: Cryptocurrency (${txn.details.cryptocurrency})`, 40, doc.lastAutoTable.finalY + 20);
        doc.text(`Amount: ${txn.details.cryptoAmount.toFixed(6)}`, 40, doc.lastAutoTable.finalY + 35);
        doc.text(`Transaction Hash: ${txn.details.blockchainHash}`, 40, doc.lastAutoTable.finalY + 50);
      } else {
        doc.text(`Payment Method: Card ending ${txn.cardLast4}`, 40, doc.lastAutoTable.finalY + 20);
        doc.text(`Token: ${txn.token}`, 40, doc.lastAutoTable.finalY + 35);
      }
      
      // Split payment details
      if (splitPaymentEnabled) {
        doc.text(`Split Payment:`, 40, doc.lastAutoTable.finalY + (txn.paymentMethod === 'crypto' ? 65 : 50));
        doc.text(`- Vendor (${vendorPercentage}%): ${currencies[currency].symbol}${(txn.total * vendorPercentage / 100).toFixed(2)}`, 50, doc.lastAutoTable.finalY + (txn.paymentMethod === 'crypto' ? 80 : 65));
        doc.text(`- Platform (${platformPercentage}%): ${currencies[currency].symbol}${(txn.total * platformPercentage / 100).toFixed(2)}`, 50, doc.lastAutoTable.finalY + (txn.paymentMethod === 'crypto' ? 95 : 80));
        
        if (escrowEnabled) {
          doc.text(`Escrow Release: ${escrowReleaseDays} days after delivery`, 50, doc.lastAutoTable.finalY + (txn.paymentMethod === 'crypto' ? 110 : 95));
        }
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text("Thank you for your payment!", 40, doc.internal.pageSize.height - 40);
      doc.text("This is a demo receipt. No actual money was transferred.", 40, doc.internal.pageSize.height - 25);
      
      // Save PDF
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment_receipt_${txn.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded successfully");
    } catch (e) {
      console.error("PDF generation failed", e);
      toast.error("PDF generation failed. Check console for details.");
    }
  };

  const generateInvoice = (txn) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "A4" });
      
      // Invoice header
      doc.setFontSize(24);
      doc.setTextColor(59, 130, 246);
      doc.text("INVOICE", 250, 50, { align: "center" });
      
      // Invoice details
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Invoice #: INV-${txn.id.slice(-8)}`, 50, 80);
      doc.text(`Date: ${new Date(txn.created).toLocaleDateString()}`, 50, 95);
      doc.text(`Status: ${txn.status.toUpperCase()}`, 50, 110);
      
      // Customer details
      doc.text("Bill To:", 50, 140);
      doc.text(txn.customer.name, 50, 155);
      doc.text(txn.customer.email, 50, 170);
      
      // Tax details
      doc.text(`Tax Rate: ${(taxRate * 100).toFixed(2)}%`, 400, 80);
      doc.text(`Tax Amount: ${currencies[currency].symbol}${txn.tax.toFixed(2)}`, 400, 95);
      
      // Items table
      autoTable(doc, {
        startY: 200,
        head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
        body: [
          ['Demo Product', '1', `${currencies[currency].symbol}${txn.amount.toFixed(2)}`, `${currencies[currency].symbol}${txn.amount.toFixed(2)}`],
        ],
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 50, right: 50 }
      });
      
      // Discounts if any
      if (txn.discount) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          body: [
            ['Discount', `-${currencies[currency].symbol}${txn.discount.toFixed(2)}`],
          ],
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'right' },
            1: { fontStyle: 'bold' }
          },
          margin: { left: 350 }
        });
      }
      
      // Total
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + (txn.discount ? 10 : 20),
        body: [
          ['Subtotal', `${currencies[currency].symbol}${(txn.amount - (txn.discount || 0)).toFixed(2)}`],
          ['Tax', `${currencies[currency].symbol}${txn.tax.toFixed(2)}`],
          ['Total', `${currencies[currency].symbol}${txn.total.toFixed(2)}`]
        ],
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'right' },
          1: { fontStyle: 'bold' }
        },
        margin: { left: 350 }
      });
      
      // Payment method
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Payment Method: ${getPaymentMethodName(txn.paymentMethod)}`, 50, doc.lastAutoTable.finalY + 30);
      
      // Split payment details if enabled
      if (splitPaymentEnabled) {
        doc.text(`Split Payment Details:`, 50, doc.lastAutoTable.finalY + 50);
        doc.text(`- Vendor (${vendorPercentage}%): ${currencies[currency].symbol}${(txn.total * vendorPercentage / 100).toFixed(2)}`, 60, doc.lastAutoTable.finalY + 65);
        doc.text(`- Platform (${platformPercentage}%): ${currencies[currency].symbol}${(txn.total * platformPercentage / 100).toFixed(2)}`, 60, doc.lastAutoTable.finalY + 80);
        
        if (escrowEnabled) {
          doc.text(`Escrow Release: ${escrowReleaseDays} days after delivery`, 60, doc.lastAutoTable.finalY + 95);
        }
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Thank you for your business!", 250, doc.internal.pageSize.height - 40, { align: "center" });
      
      // Save PDF
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${txn.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch (e) {
      console.error("Invoice generation failed", e);
      toast.error("Invoice generation failed. Check console for details.");
    }
  };

  const getPaymentMethodName = (method) => {
    switch(method) {
      case 'upi': return 'UPI';
      case 'netbanking': return 'Net Banking';
      case 'wallet': return 'Digital Wallet';
      case 'crypto': return 'Cryptocurrency';
      case 'card': return 'Credit/Debit Card';
      default: return method;
    }
  };

  const verifyOtpAndCharge = async () => {
    if (otp !== otpSent) {
      const txn = {
        id: randId(),
        status: "failed",
        amount: Number(amount),
        customer: { name, email },
        paymentMethod: 'card',
        created: nowIso(),
        refunded: false,
        userId: auth?.id || null,
        failureReason: "Invalid OTP",
        tax: taxAmount,
        discount: discountAmount + loyaltyDiscount,
        total: totalAmount,
        ...(appliedCoupon && { coupon: appliedCoupon.code }),
        ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse })
      };

      setTransactions((prev) => [txn, ...prev]);
      setLastFailedTxn(txn);
      setFailureModal(true);
      simulateWebhook("payment.failed", txn);
      setOtpStep(false);
      playErrorSound();
      toast.error("Invalid OTP entered");
      return;
    }

    setProcessing(true);
    // Simulate processing delay (1-3 sec)
    const delay = 1000 + Math.random() * 2000;
    await new Promise((r) => setTimeout(r, delay));

    const token = fakeTokenize(cardNumber);
    const digits = cardNumber.replace(/\D/g, "");
    const ok = digits.length === 16 && expiryValid && cvvValid;

    const txn = {
      id: randId(),
      status: ok ? "succeeded" : "failed",
      amount: Number(amount),
      customer: { name, email },
      paymentMethod: 'card',
      cardLast4: digits.slice(-4),
      token,
      created: nowIso(),
      refunded: false,
      userId: auth?.id || null,
      tax: taxAmount,
      discount: discountAmount + loyaltyDiscount,
      total: totalAmount,
      ...(appliedCoupon && { coupon: appliedCoupon.code }),
      ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse }),
      ...(!ok && { failureReason: "Payment failed" })
    };

    setTransactions((prev) => [txn, ...prev]);
    setResult({ status: txn.status, txnId: txn.id, token, amount: txn.amount, customer: txn.customer, cardLast4: txn.cardLast4 });
    setOtpStep(false);
    setProcessing(false);
    simulateWebhook(`payment.${ok ? "succeeded" : "failed"}`, txn);

    if (ok) {
      if (auth) {
        setAccountBalance(prev => prev - totalAmount);
        // Add loyalty points (1 point per 10 currency units)
        const pointsEarned = Math.floor(totalAmount / 10);
        setLoyaltyPoints(prev => prev + pointsEarned);
        // Update user in storage
        setUsers(prev => prev.map(u => 
          u.id === auth.id ? { 
            ...u, 
            loyaltyPoints: u.loyaltyPoints + pointsEarned 
          } : u
        ));
      }
      setLastSuccessfulTxn(txn);
      setShowAnimation(true);
      playSuccessSound();
      setTimeout(() => {
        setShowAnimation(false);
        setSuccessModal(true);
        setActiveTab("dashboard");
      }, 2000);
    } else {
      setLastFailedTxn(txn);
      setShowAnimation(true);
      playErrorSound();
      setTimeout(() => {
        setShowAnimation(false);
        setFailureModal(true);
      }, 2000);
    }
  };

  const refundTxn = (id) => {
    const txn = transactions.find(t => t.id === id);
    if (txn) {
      const updatedTxn = { ...txn, refunded: true };
      setTransactions(prev => prev.map(t => t.id === id ? updatedTxn : t));
      if (auth) {
        setAccountBalance(prev => prev + txn.total);
      }
      simulateWebhook("payment.refunded", { id, amount: txn.total });
      toast.success(`Refund processed for ${currencies[currency].symbol}${txn.total.toFixed(2)}`);
    }
  };

  const deleteTxn = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setWebhooks(prev => prev.filter(w => w.payload.id !== id));
    toast.success(`Transaction ${id} deleted`);
  };

  const copy = async (txt) => {
    try { 
      await navigator.clipboard.writeText(txt); 
      toast.success("Copied to clipboard!");
    } catch (e) {
      toast.error("Failed to copy");
    }
  };

  const widgetSnippet = `<script src=\"https://cdn.example.com/mpg.js\"></script>\n<script>\n  const btn = document.getElementById('pay-btn');\n  btn.addEventListener('click', () => MPG.checkout({\n    key: '${apiKeys.publishable}',\n    amount: ${amount},\n    customer: { name: '${name || "YOUR_NAME"}', email: '${email || "you@example.com"}' }\n  }));\n<\/script>`;

  const applyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setShowCouponDropdown(false);
    toast.success(`Coupon applied! ${coupon.type === 'percent' ? `${coupon.discount}% off` : `${currencies[currency].symbol}${coupon.discount} off`}`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setShowCouponDropdown(false);
    toast.success("Coupon removed");
  };

  const toggleLoyaltyPoints = () => {
    setUseLoyaltyPoints(!useLoyaltyPoints);
    if (!useLoyaltyPoints) {
      setPointsToUse(Math.min(loyaltyPoints, Math.floor(amount * 10)));
    }
  };

  const exportTransactions = () => {
    let data;
    const headers = ["ID", "Date", "Customer", "Amount", "Tax", "Discount", "Total", "Method", "Status"];
    
    if (exportFormat === "csv") {
      // Generate CSV with proper formatting
      let csv = headers.join(",") + "\n";
      filteredTransactions.forEach(t => {
        csv += [
          `"${t.id}"`,
          `"${new Date(t.created).toLocaleString()}"`,
          `"${t.customer.name}"`,
          t.amount,
          t.tax || 0,
          t.discount || 0,
          t.total,
          `"${getPaymentMethodName(t.paymentMethod)}"`,
          `"${t.status}${t.refunded ? " (refunded)" : ""}"`
        ].join(",") + "\n";
      });
      
      data = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    } else {
      // Generate JSON
      data = new Blob([JSON.stringify(filteredTransactions, null, 2)], { type: "application/json" });
    }
    
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0,10)}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Transactions exported as ${exportFormat.toUpperCase()}`);
  };

  const testWebhook = () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }
    
    const payload = {
      id: randId("evt_test_"),
      type: "payment.succeeded",
      created: nowIso(),
      payload: {
        id: randId("txn_test_"),
        amount: 1000,
        currency: currency,
        customer: { name: "Test Customer", email: "test@example.com" },
        payment_method: "card",
        status: "succeeded"
      }
    };
    
    setWebhookPayload(JSON.stringify(payload, null, 2));
    simulateWebhook("test.webhook", payload);
    toast.success(`Test webhook sent to ${webhookUrl}`);
  };

  const installPwa = () => {
    // In a real PWA, you would trigger the install prompt here
    toast.success("In a real PWA, this would trigger the install prompt");
    setPwaInstalled(true);
    setShowMobilePrompt(false);
  };

  const liveReceipt = useMemo(() => {
    let paymentDetails = {};
    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, "");
      paymentDetails = {
        type: "card",
        last4: digits.slice(-4) || ""
      };
    } else if (paymentMethod === 'upi') {
      paymentDetails = {
        type: "upi",
        vpa: vpa || ""
      };
    } else if (paymentMethod === 'netbanking') {
      const bank = (banksByCountry[selectedCountry] || banksByCountry.default).find(b => b.id === selectedBank);
      paymentDetails = {
        type: "netbanking",
        bank: bank?.name || ""
      };
    } else if (paymentMethod === 'wallet') {
      const walletObj = wallets.find(w => w.id === selectedWallet);
      paymentDetails = {
        type: "wallet",
        wallet: walletObj?.name || ""
      };
    } else if (paymentMethod === 'crypto') {
      const cryptoObj = cryptocurrencies.find(c => c.id === selectedCrypto);
      paymentDetails = {
        type: "crypto",
        cryptocurrency: cryptoObj?.name || "",
        cryptoAmount: cryptoAmount
      };
    }

    if (result) {
      return {
        amount: result.amount ?? amount,
        currency: currency,
        customer: result.customer ?? { name, email },
        ...(paymentMethod === 'card' ? { card: result.cardLast4 ? `•••• •••• •••• ${result.cardLast4}` : maskCard(cardNumber) } : {}),
        ...(paymentMethod === 'card' ? { expiry } : {}),
        status: result.status,
        token: result.token ?? null,
        txnId: result.txnId ?? null,
        tax: taxAmount,
        discount: discountAmount + loyaltyDiscount,
        subtotal: subtotal,
        total: totalAmount,
        balance: auth ? accountBalance : null,
        paymentMethod: paymentMethod,
        ...(appliedCoupon && { coupon: appliedCoupon.code }),
        ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse }),
        ...(splitPaymentEnabled && { 
          splitPayment: {
            vendor: vendorPercentage,
            platform: platformPercentage,
            escrow: escrowEnabled ? escrowReleaseDays : false
          }
        }),
        paymentDetails
      };
    }

    if (lastSuccessfulTxn) {
      return {
        amount: lastSuccessfulTxn.amount,
        currency: currency,
        customer: lastSuccessfulTxn.customer,
        ...(lastSuccessfulTxn.paymentMethod === 'card' ? { card: `•••• •••• •••• ${lastSuccessfulTxn.cardLast4}` } : {}),
        ...(lastSuccessfulTxn.paymentMethod === 'card' ? { expiry } : {}),
        status: lastSuccessfulTxn.status,
        token: lastSuccessfulTxn.token,
        txnId: lastSuccessfulTxn.id,
        tax: lastSuccessfulTxn.tax,
        discount: lastSuccessfulTxn.discount,
        subtotal: lastSuccessfulTxn.amount - (lastSuccessfulTxn.discount || 0),
        total: lastSuccessfulTxn.total,
        balance: auth ? accountBalance : null,
        paymentMethod: lastSuccessfulTxn.paymentMethod,
        ...(lastSuccessfulTxn.coupon && { coupon: lastSuccessfulTxn.coupon }),
        ...(lastSuccessfulTxn.loyaltyPointsUsed && { loyaltyPointsUsed: lastSuccessfulTxn.loyaltyPointsUsed }),
        ...(splitPaymentEnabled && { 
          splitPayment: {
            vendor: vendorPercentage,
            platform: platformPercentage,
            escrow: escrowEnabled ? escrowReleaseDays : false
          }
        }),
        paymentDetails
      };
    }

    return {
      amount,
      currency: currency,
      customer: { name, email },
      ...(paymentMethod === 'card' ? { card: maskCard(cardNumber) } : {}),
      ...(paymentMethod === 'card' ? { expiry } : {}),
      status: "pending",
      token: null,
      txnId: null,
      tax: taxAmount,
      discount: discountAmount + loyaltyDiscount,
      subtotal: subtotal,
      total: totalAmount,
      balance: auth ? accountBalance : null,
      paymentMethod: paymentMethod,
      ...(appliedCoupon && { coupon: appliedCoupon.code }),
      ...(useLoyaltyPoints && { loyaltyPointsUsed: pointsToUse }),
      ...(splitPaymentEnabled && { 
        splitPayment: {
          vendor: vendorPercentage,
          platform: platformPercentage,
          escrow: escrowEnabled ? escrowReleaseDays : false
        }
      }),
      paymentDetails
    };
  }, [result, lastSuccessfulTxn, amount, name, email, cardNumber, expiry, paymentMethod, 
      currency, taxAmount, discountAmount, loyaltyDiscount, subtotal, totalAmount, 
      accountBalance, auth, appliedCoupon, useLoyaltyPoints, pointsToUse, splitPaymentEnabled,
      vendorPercentage, platformPercentage, escrowEnabled, escrowReleaseDays, vpa, selectedBank, selectedWallet, selectedCrypto, cryptoAmount, selectedCountry]);

  // Check for mobile device and show PWA prompt
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !pwaInstalled) {
      setTimeout(() => setShowMobilePrompt(true), 5000);
    }
  }, [pwaInstalled]);

  // Lenis Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Computed banks based on selected country
  const currentBanks = banksByCountry[selectedCountry] || banksByCountry.default;

  const resetPaymentForm = () => {
    setAmount(499);
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setPaymentMethod('card');
    setVpa('');
    setShowQR(false);
    setSelectedBank("");
    setSelectedWallet("");
    setSelectedCrypto("");
    setCryptoAmount(0);
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setUseLoyaltyPoints(false);
    setPointsToUse(0);
    setFraudDetected(false);
    setPciComplianceChecked(false);
    setSplitPaymentEnabled(false);
    setVendorPercentage(70);
    setPlatformPercentage(30);
    setEscrowEnabled(false);
    setEscrowReleaseDays(7);
    setResult(null);
    setLastSuccessfulTxn(null);
    setLastFailedTxn(null);
  };

  const handleCardPayment = () => {
    startOtp();
  };

  return (
    <div className={`min-h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-800 p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white shadow">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
              <p className="text-sm text-slate-500">Run & test right here — no setup, no servers.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs">
              <Shield className="w-4 h-4" />
              <span>Tokenization • Fake 3DS • Webhooks</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[80px]">
                  <Languages className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  {/* Add more language options as needed */}
                </SelectContent>
              </Select>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(currencies).map(curr => (
                    <SelectItem key={curr} value={curr}>
                      {curr} - {currencies[curr].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {auth ? (
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:inline">{auth.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" /> {t.logout}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)}>
                <LogIn className="w-4 h-4 mr-1" /> {t.login}/{t.signup}
              </Button>
            )}
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:w-[560px]">
            <TabsTrigger value="checkout">{t.checkout}</TabsTrigger>
            <TabsTrigger value="dashboard">{t.merchantDashboard}</TabsTrigger>
            <TabsTrigger value="keys">API & Webhooks</TabsTrigger>
          </TabsList>

          {/* Checkout Tab */}
          <TabsContent value="checkout" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5"/>{t.checkout}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!auth && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                      <p>You're checking out as guest. <button className="font-medium underline underline" onClick={() => setShowAuthModal(true)}>Login or sign up</button> to save your transaction history.</p>
                    </div>
                  )}

                  {auth && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      <p>{t.currentBalance}: <strong>{currencies[currency].symbol}{accountBalance.toFixed(2)}</strong></p>
                      <p className="mt-1">{t.loyaltyPoints}: <strong>{loyaltyPoints}</strong> (1 point = {currencies[currency].symbol}0.10)</p>
                    </div>
                  )}

                  <div>
                    <Label>{t.amount} ({currency})</Label>
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(Number(e.target.value))} 
                      min={1} 
                      className="mt-1" 
                    />
                  </div>

                  {/* Currency Converter */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t.convertCurrency}</Label>
                      <Select value={convertCurrency} onValueChange={setConvertCurrency} showFilter={true}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Convert to" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(currencies).map(curr => (
                            <SelectItem key={curr} value={curr} disabled={curr === currency}>
                              {curr} - {currencies[curr].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Converted Amount</Label>
                      <div className="mt-1 p-2 rounded-md border bg-slate-50 text-sm h-10 flex items-center">
                        {isConverting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          `${currencies[convertCurrency]?.symbol || ''}${convertedAmount.toFixed(2)}`
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <Label>{t.couponCode}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        disabled={!!appliedCoupon}
                      />
                      {appliedCoupon ? (
                        <Button variant="outline" onClick={removeCoupon}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => setShowCouponDropdown(!showCouponDropdown)}>
                          <Percent className="w-4 h-4 mr-1" /> {t.applyCoupon}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <div className="text-xs text-emerald-600 mt-1">
                        Coupon applied: {appliedCoupon.code} ({appliedCoupon.type === 'percent' ? 
                        `${appliedCoupon.discount}% off` : `${currencies[currency].symbol}${appliedCoupon.discount} off`})
                      </div>
                    )}
                    
                    {/* Coupon Dropdown */}
                    {showCouponDropdown && availableCoupons.length > 0 && (
                      <div className="relative">
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                          <div className="p-2">
                            {availableCoupons.map(coupon => (
                              <div 
                                key={coupon.code}
                                className="p-2 hover:bg-slate-50 rounded cursor-pointer flex justify-between items-center"
                                onClick={() => applyCoupon(coupon)}
                              >
                                <div>
                                  <div className="font-medium">{coupon.code}</div>
                                  <div className="text-xs text-slate-500">
                                    {coupon.type === 'percent' ? `${coupon.discount}% off` : `${currencies[currency].symbol}${coupon.discount} off`}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={(e) => {
                                  e.stopPropagation();
                                  applyCoupon(coupon);
                                }}>
                                  Apply
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Loyalty Points */}
                  {auth && loyaltyPoints > 0 && (
                    <div className="border rounded-lg p-3 bg-amber-50">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={useLoyaltyPoints}
                            onChange={toggleLoyaltyPoints}
                            className="w-4 h-4"
                          />
                          {t.usePoints} ({loyaltyPoints} {t.loyaltyPoints})
                        </Label>
                        {useLoyaltyPoints && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={pointsToUse}
                              onChange={(e) => setPointsToUse(Math.min(Number(e.target.value), loyaltyPoints, Math.floor(amount * 10)))}
                              min={0}
                              max={Math.min(loyaltyPoints, Math.floor(amount * 10))}
                              className="w-20 h-8"
                            />
                            <span className="text-xs">Max: {Math.min(loyaltyPoints, Math.floor(amount * 10))}</span>
                          </div>
                        )}
                      </div>
                      {useLoyaltyPoints && (
                        <div className="text-xs text-amber-700 mt-1">
                          Using {pointsToUse} points ({currencies[currency].symbol}{loyaltyDiscount.toFixed(2)} discount)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tax Calculation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t.country}</Label>
                      <Select 
                        value={selectedCountry} showFilter={true}
                        onValueChange={(value) => {
                          setSelectedCountry(value);
                          setSelectedRegion("");
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t.region}</Label>
                      {countryRegions[selectedCountry] ? (
                        <Select value={selectedRegion} onValueChange={setSelectedRegion} showFilter={true}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select state/region" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryRegions[selectedCountry].map(region => (
                              <SelectItem key={region.code} value={region.code}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          value={selectedRegion} 
                          onChange={(e) => setSelectedRegion(e.target.value)} 
                          placeholder="Region/State" 
                          className="mt-1" 
                        />
                      )}
                    </div>
                  </div>

                  {/* Tax Display */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-500">{t.tax} Rate</div>
                      <div className="font-medium">{(taxRate * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-500">{t.tax} Amount</div>
                      <div className="font-medium">{currencies[currency].symbol}{taxAmount.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-500">{t.total}</div>
                      <div className="font-medium">{currencies[currency].symbol}{totalAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  <div>
                    <Label>{t.name}</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="A.P.J. Abdul Kalam" 
                      className="mt-1" 
                      disabled={!!auth}
                    />
                  </div>
                  <div>
                    <Label>{t.email}</Label>
                    <Input 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="you@example.com" 
                      className="mt-1" 
                      disabled={!!auth}
                    />
                  </div>

                  {/* Payment Method Tabs */}
                  <Tabs defaultValue="card" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="card" onClick={() => setPaymentMethod('card')}>
                        <CreditCard className="w-4 h-4 mr-2" /> {t.card}
                      </TabsTrigger>
                      <TabsTrigger value="upi" onClick={() => setPaymentMethod('upi')}>
                        <Smartphone className="w-4 h-4 mr-2" /> {t.upi}
                      </TabsTrigger>
                    </TabsList>
                    <TabsList className="grid grid-cols-3 w-full mt-2">
                      <TabsTrigger value="netbanking" onClick={() => setPaymentMethod('netbanking')}>
                        <Banknote className="w-4 h-4 mr-2" /> {t.netBanking}
                      </TabsTrigger>
                      <TabsTrigger value="wallet" onClick={() => setPaymentMethod('wallet')}>
                        <Wallet className="w-4 h-4 mr-2" /> {t.wallet}
                      </TabsTrigger>
                      <TabsTrigger value="crypto" onClick={() => setPaymentMethod('crypto')}>
                        <Bitcoin className="w-4 h-4 mr-2" /> {t.crypto}
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Card Payment */}
                    <TabsContent value="card" className="mt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>{t.cardNumber}</Label>
                          <Input
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="4242 4242 4242 4242"
                            className={`mt-1 tracking-widest ${cardNumber && (cardValid ? 'ring-1 ring-emerald-300' : 'ring-1 ring-rose-300')}`}
                          />
                          <div className="text-xs text-slate-500 mt-1">Enter any 16-digit card (spaces allowed). Expiry & CVV must be valid for success.</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{t.expiry}</Label>
                            <Input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="12/27" className="mt-1" />
                          </div>
                          <div>
                            <Label>{t.cvv}</Label>
                            <div className="relative">
                              <Input type={showCvv ? "text" : "password"} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0,4))} placeholder="123" className="mt-1 pr-10" />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowCvv((s) => !s)}>
                                {showCvv ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-slate-500">PCI DSS compliant payment processing</span>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* UPI Payment */}
                    <TabsContent value="upi" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <Button 
                            variant={!showQR ? "black" : "outline"} 
                            onClick={() => setShowQR(false)}
                            className="flex-1"
                          >
                            <Smartphone className="w-4 h-4 mr-2" /> UPI ID
                          </Button>
                          <Button 
                            variant={showQR ? "black" : "outline"} 
                            onClick={() => setShowQR(true)}
                            className="flex-1"
                          >
                            <QrCode className="w-4 h-4 mr-2" /> Scan QR
                          </Button>
                        </div>

                        {showQR ? (
                          <div className="text-center space-y-2">
                            <div className="border rounded-lg p-4 inline-block">
                              <img src={qrCode} alt="UPI QR Code" className="w-40 h-40 mx-auto" />
                            </div>
                            <p className="text-sm text-slate-500">
                              Scan this QR code with any UPI app
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              placeholder="yourname@upi"
                              value={vpa}
                              onChange={(e) => setVpa(e.target.value)}
                              className="text-center"
                            />
                            <p className="text-xs text-slate-500 text-center">
                              Enter your UPI ID (e.g. mobile@upi)
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Net Banking */}
                    <TabsContent value="netbanking" className="mt-4">
                      <div className="space-y-4">
                        <Select value={selectedBank} onValueChange={setSelectedBank} showFilter={true}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentBanks.map(bank => (
                              <SelectItem key={bank.id} value={bank.id}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-slate-500">
                          You'll be redirected to your bank's secure payment page
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Digital Wallet */}
                    <TabsContent value="wallet" className="mt-4">
                      <div className="space-y-4">
                        <Select value={selectedWallet} onValueChange={setSelectedWallet} showFilter={true}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your wallet" />
                          </SelectTrigger>
                          <SelectContent>
                            {wallets.map(wallet => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-slate-500">
                          You'll be redirected to your wallet app for payment
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Cryptocurrency */}
                    <TabsContent value="crypto" className="mt-4">
                      <div className="space-y-4">
                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto} showFilter={true}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cryptocurrency" />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptocurrencies.map(crypto => (
                              <SelectItem key={crypto.id} value={crypto.id}>
                                {crypto.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedCrypto && (
                          <div className="bg-slate-50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Amount to pay:</span>
                              <span className="font-medium">{cryptoAmount.toFixed(6)} {selectedCrypto.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-slate-500">Exchange rate:</span>
                              <span className="font-medium">1 {selectedCrypto.toUpperCase()} = {currencies[currency].symbol}{(1 / cryptocurrencies.find(c => c.id === selectedCrypto).rate).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-slate-500">
                          You'll be redirected to your crypto wallet to complete the transaction
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Split Payments */}
                  <div className="border rounded-lg p-3 bg-purple-50">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={splitPaymentEnabled}
                          onChange={() => setSplitPaymentEnabled(!splitPaymentEnabled)}
                          className="w-4 h-4"
                        />
                        {t.splitPayments}
                      </Label>
                    </div>
                    
                    {splitPaymentEnabled && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{t.vendorFee} (%)</Label>
                            <Input
                              type="number"
                              value={vendorPercentage}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0 && val <= 100) {
                                  setVendorPercentage(val);
                                  setPlatformPercentage(100 - val);
                                }
                              }}
                              min={0}
                              max={100}
                            />
                          </div>
                          <div>
                            <Label>{t.platformFee} (%)</Label>
                            <Input
                              type="number"
                              value={platformPercentage}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0 && val <= 100) {
                                  setPlatformPercentage(val);
                                  setVendorPercentage(100 - val);
                                }
                              }}
                              min={0}
                              max={100}
                              disabled
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={escrowEnabled}
                            onChange={() => setEscrowEnabled(!escrowEnabled)}
                            className="w-4 h-4"
                          />
                          <Label>{t.escrow}</Label>
                        </div>
                        
                        {escrowEnabled && (
                          <div>
                            <Label>Release After (Days)</Label>
                            <Input
                              type="number"
                              value={escrowReleaseDays}
                              onChange={(e) => setEscrowReleaseDays(Number(e.target.value))}
                              min={1}
                              max={30}
                            />
                          </div>
                        )}
                        
                        <div className="text-xs text-purple-700">
                          Vendor will receive: {currencies[currency].symbol}{(totalAmount * vendorPercentage / 100).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fraud Detection */}
                  {fraudDetected && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Potential fraud detected. Please verify your identity or use a different payment method.</span>
                    </div>
                  )}

                  <Button 
                    variant="black" 
                    disabled={!canPay || fraudDetected} 
                    onClick={handlePay} 
                    className="w-full h-11 rounded-xl mt-2"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        {t.processing}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {paymentMethod === 'upi' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : paymentMethod === 'netbanking' ? (
                          <Banknote className="w-4 h-4" />
                        ) : paymentMethod === 'wallet' ? (
                          <Wallet className="w-4 h-4" />
                        ) : paymentMethod === 'crypto' ? (
                          <Bitcoin className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        {t.pay} {currencies[currency].symbol}{totalAmount.toFixed(2)}
                      </span>
                    )}
                  </Button>

                  {auth && accountBalance < totalAmount && (
                    <div className="text-sm text-rose-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Insufficient balance. Please add funds to your account.
                    </div>
                  )}

                  <AnimatePresence>
                    {result && (
                      <motion.div 
                        initial={{opacity:0, y:10}} 
                        animate={{opacity:1, y:0}} 
                        exit={{opacity:0, y:-10}} 
                        className={`mt-4 p-3 rounded-xl border ${
                          result.status === 'succeeded' ? 
                          'bg-emerald-50 border-emerald-200' : 
                          'bg-rose-50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          {result.status === 'succeeded' ? <Check className="w-4 h-4"/> : <X className="w-4 h-4"/>}
                          <span>Payment {result.status}. Txn ID: <code>{result.txnId}</code></span>
                        </div>
                        {result.token && (
                          <div className="text-xs text-slate-500 mt-1">Token: <code>{result.token}</code></div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Terminal className="w-5 h-5"/>Live Receipt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm bg-slate-50 rounded-xl p-4 border h-[360px] overflow-auto">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(liveReceipt, null, 2)}</pre>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => {
                      const blob = new Blob([JSON.stringify(liveReceipt, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `receipt_${Date.now()}.json`; a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      <Receipt className="w-4 h-4 mr-2"/>Download JSON
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const txn = lastSuccessfulTxn || userTransactions.find(t => t.status === "succeeded");
                      if (!txn) {
                        toast.error("No successful transaction yet to generate PDF.");
                        return;
                      }
                      generatePdfReceipt(txn);
                    }}>
                      <FileText className="w-4 h-4 mr-2"/>Download Receipt
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const txn = lastSuccessfulTxn || userTransactions.find(t => t.status === "succeeded");
                      if (!txn) {
                        toast.error("No successful transaction yet to generate invoice.");
                        return;
                      }
                      generateInvoice(txn);
                    }}>
                      <FileText className="w-4 h-4 mr-2"/>Download Invoice
                    </Button>
                    <Button variant="ghost" onClick={() => setWidgetOpen(true)}>
                      <Copy className="w-4 h-4 mr-2"/>Widget Snippet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Transactions
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {dateRange === 'today' ? 'Today' : 
                     dateRange === '7days' ? 'Last 7 days' : 
                     dateRange === '30days' ? 'Last 30 days' : 
                     'All time'}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Successful Payments
                  </CardTitle>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredTransactions.filter(t => t.status === 'succeeded').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredTransactions.length > 0 ? 
                      `${Math.round(filteredTransactions.filter(t => t.status === 'succeeded').length / filteredTransactions.length * 100)}% success rate` : 
                      'No transactions'}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currencies[currency].symbol}
                    {filteredTransactions
                      .filter(t => t.status === 'succeeded')
                      .reduce((sum, t) => sum + t.total, 0)
                      .toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredTransactions.filter(t => t.status === 'succeeded').length} successful payments
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transactions {auth ? "" : "(Guest)"}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-[120px]">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="w-[100px]">
                        <Download className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={exportTransactions}>
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    {auth ? "No transactions yet. Make a test payment in the Checkout tab." : "Login to see your transaction history."}
                  </div>
                ) : (
                  <div className="overflow-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-3">Txn ID</th>
                          <th className="text-left p-3">Customer</th>
                          <th className="text-left p-3">Amount</th>
                          <th className="text-left p-3">Method</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Refund</th>
                          <th className="text-left p-3">Delete</th>
                          <th className="text-left p-3">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t) => (
                          <tr key={t.id} className="border-t">
                            <td className="p-3 font-mono text-xs">{t.id}</td>
                            <td className="p-3">{t.customer.name}<div className="text-xs text-slate-500">{t.customer.email}</div></td>
                            <td className="p-3">{currencies[currency].symbol}{t.amount}</td>
                            <td className="p-3">
                              {t.paymentMethod === 'upi' ? (
                                <div className="flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" />
                                  <span>UPI</span>
                                </div>
                              ) : t.paymentMethod === 'netbanking' ? (
                                <div className="flex items-center gap-1">
                                  <Banknote className="w-3 h-3" />
                                  <span>Net Banking</span>
                                </div>
                              ) : t.paymentMethod === 'wallet' ? (
                                <div className="flex items-center gap-1">
                                  <Wallet className="w-3 h-3" />
                                  <span>Wallet</span>
                                </div>
                              ) : t.paymentMethod === 'crypto' ? (
                                <div className="flex items-center gap-1">
                                  <Bitcoin className="w-3 h-3" />
                                  <span>Crypto</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  <span>Card</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                t.status === 'succeeded' ? 'bg-emerald-100' : 
                                t.status === 'failed' ? 'bg-rose-100' : 'bg-amber-100'
                              }`}>
                                {t.status}
                                {t.refunded ? ' • refunded' : ''}
                              </span>
                              {t.failureReason && (
                                <div className="text-xs text-slate-500 mt-1">{t.failureReason}</div>
                              )}
                            </td>
                            <td className="p-3">
                              {t.status === 'succeeded' && !t.refunded ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => refundTxn(t.id)}
                                >
                                  <RefreshCw className="w-3 h-3 mr-1"/>Refund
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="p-3">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => deleteTxn(t.id)}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </td>
                            <td className="p-3 text-xs">{new Date(t.created).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keys/Webhooks Tab */}
          <TabsContent value="keys" className="mt-6 space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>API Keys (Demo)</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Publishable Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={apiKeys.publishable} />
                    <Button variant="outline" onClick={() => copy(apiKeys.publishable)}><Copy className="w-4 h-4"/></Button>
                  </div>
                </div>
                <div>
                  <Label>Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={apiKeys.secret} />
                    <Button variant="outline" onClick={() => copy(apiKeys.secret)}><Copy className="w-4 h-4"/></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Webhook className="w-5 h-5"/>Webhook Events (Simulated)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-500 mb-3">Events appear here when payments succeed/fail/refund.</div>
                <div className="rounded-xl border bg-slate-50 max-h-[300px] overflow-auto p-3">
                  {webhooks.length === 0 ? (
                    <div className="text-sm text-slate-500">No events yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {webhooks.map((e) => (
                        <li key={e.id} className="bg-white rounded-lg p-3 shadow-sm border">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono">{e.id}</span>
                            <span className="text-[11px] text-slate-500">{new Date(e.created).toLocaleString()}</span>
                          </div>
                          <div className="text-sm font-medium mt-1">{e.type}</div>
                          <pre className="text-xs mt-2 whitespace-pre-wrap break-words">{JSON.stringify(e.payload, null, 2)}</pre>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Terminal className="w-5 h-5"/>Webhook Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Webhook URL</Label>
                  <Input 
                    value={webhookUrl} 
                    onChange={(e) => setWebhookUrl(e.target.value)} 
                    placeholder="https://api.example.com/webhooks" 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label>Test Payload</Label>
                  <Textarea 
                    value={webhookPayload} 
                    onChange={(e) => setWebhookPayload(e.target.value)} 
                    placeholder="Enter JSON payload" 
                    className="mt-1 h-32 font-mono text-xs" 
                  />
                </div>
                <Button onClick={testWebhook} className="mt-2">
                  <Share2 className="w-4 h-4 mr-2" /> Send Test Webhook
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* OTP Modal */}
        <AnimatePresence>
          {otpStep && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5"/>
                    <h3 className="text-lg font-semibold">3D Secure / OTP</h3>
                  </div>
                  <p className="text-sm text-slate-600">We sent a one-time password to <span className="font-medium">{email || "your email"}</span>. For demo, your OTP is <span className="font-mono">{otpSent}</span>.</p>
                  <Input ref={otpRef} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} className="mt-3 text-center tracking-widest" placeholder="Enter 6-digit OTP"/>
                  <div className="flex gap-2 mt-4">
                    <Button variant="ghost" onClick={handlePaymentCancel}><X className="w-4 h-4 mr-1"/>Cancel</Button>
                    <Button variant="black" onClick={verifyOtpAndCharge} disabled={processing} className="ml-auto">
                      {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 mr-1"/>}
                      Confirm & Pay
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animation Modal */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div 
              initial={{opacity:0}} 
              animate={{opacity:1}} 
              exit={{opacity:0}} 
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{scale:0.9}} 
                animate={{scale:1}} 
                exit={{scale:0.9}} 
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 flex flex-col items-center"
              >
                <div className="w-48 h-48">
                  <Lottie 
                    animationData={lastFailedTxn ? errorAnimation : successAnimation} 
                    loop={false} 
                    style={{ width: '100%', height: '100%' }} 
                  />
                </div>
                <h2 className="text-xl font-semibold mt-4">
                  {lastFailedTxn ? t.failed : t.success}
                </h2>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {successModal && lastSuccessfulTxn && (
            <motion.div 
              initial={{opacity:0}} 
              animate={{opacity:1}} 
              exit={{opacity:0}} 
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
              onClick={() => { setSuccessModal(false); resetPaymentForm(); }}
            >
              <motion.div 
                initial={{y:20, opacity:0}} 
                animate={{y:0, opacity:1}} 
                exit={{y:20, opacity:0}} 
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 rounded-full p-2">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{t.success}</h2>
                        <div className="text-sm text-slate-500">Thank you! Your payment was completed.</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSuccessModal(false); resetPaymentForm(); }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    <div><strong>{t.transactionId}:</strong> <span className="font-mono">{lastSuccessfulTxn.id}</span></div>
                    <div><strong>Amount:</strong> {currencies[currency].symbol}{lastSuccessfulTxn.amount}</div>
                    {lastSuccessfulTxn.discount > 0 && (
                      <div><strong>Discount:</strong> - -{currencies[currency].symbol}{lastSuccessfulTxn.discount.toFixed(2)}</div>
                    )}
                    <div><strong>Tax:</strong> {currencies[currency].symbol}{lastSuccessfulTxn.tax.toFixed(2)}</div>
                    <div><strong>Total:</strong> {currencies[currency].symbol}{lastSuccessfulTxn.total.toFixed(2)}</div>
                    {auth && <div><strong>{t.currentBalance}:</strong> {currencies[currency].symbol}{accountBalance.toFixed(2)}</div>}
                    {lastSuccessfulTxn.paymentMethod === 'upi' ? (
                      <div><strong>UPI ID:</strong> {lastSuccessfulTxn.details.vpa}</div>
                    ) : lastSuccessfulTxn.paymentMethod === 'netbanking' ? (
                      <div><strong>Bank:</strong> {lastSuccessfulTxn.details.bank}</div>
                    ) : lastSuccessfulTxn.paymentMethod === 'wallet' ? (
                      <div><strong>Wallet:</strong> {lastSuccessfulTxn.details.wallet}</div>
                    ) : lastSuccessfulTxn.paymentMethod === 'crypto' ? (
                      <>
                        <div><strong>Cryptocurrency:</strong> {lastSuccessfulTxn.details.cryptocurrency}</div>
                        <div><strong>Amount Paid:</strong> {lastSuccessfulTxn.details.cryptoAmount.toFixed(6)}</div>
                      </>
                    ) : (
                      <div><strong>Card (last4):</strong> {lastSuccessfulTxn.cardLast4}</div>
                    )}
                    <div><strong>{t.date}:</strong> {new Date(lastSuccessfulTxn.created).toLocaleString()}</div>
                    {lastSuccessfulTxn.coupon && (
                      <div><strong>Coupon:</strong> {lastSuccessfulTxn.coupon}</div>
                    )}
                    {lastSuccessfulTxn.loyaltyPointsUsed && (
                      <div><strong>Loyalty Points Used:</strong> {lastSuccessfulTxn.loyaltyPointsUsed}</div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3 flex-wrap">
                    <Button onClick={() => generatePdfReceipt(lastSuccessfulTxn)}>Download Receipt</Button>
                    <Button onClick={() => generateInvoice(lastSuccessfulTxn)}>Download Invoice</Button>
                    <Button variant="outline" onClick={() => { setSuccessModal(false); resetPaymentForm(); }}>Back to Dashboard</Button>
                    <Button variant="ghost" onClick={() => { setSuccessModal(false); resetPaymentForm(); setActiveTab("checkout"); }}>Pay Again</Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Failure Modal */}
        <AnimatePresence>
          {failureModal && lastFailedTxn && (
            <motion.div 
              initial={{opacity:0}} 
              animate={{opacity:1}} 
              exit={{opacity:0}} 
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
              onClick={() => setFailureModal(false)}
            >
              <motion.div 
                initial={{y:20, opacity:0}} 
                animate={{y:0, opacity:1}} 
                exit={{y:20, opacity:0}} 
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-100 rounded-full p-2">
                        <X className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{t.failed}</h2>
                        <div className="text-sm text-slate-500">Your payment could not be completed.</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFailureModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    <div><strong>{t.transactionId}:</strong> <span className="font-mono">{lastFailedTxn.id}</span></div>
                    <div><strong>Amount:</strong> {currencies[currency].symbol}{lastFailedTxn.amount}</div>
                    {lastFailedTxn.paymentMethod === 'upi' ? (
                      <div><strong>UPI ID:</strong> {lastFailedTxn.details?.vpa || 'N/A'}</div>
                    ) : lastFailedTxn.paymentMethod === 'netbanking' ? (
                      <div><strong>Bank:</strong> {lastFailedTxn.details?.bank || 'N/A'}</div>
                    ) : lastFailedTxn.paymentMethod === 'wallet' ? (
                      <div><strong>Wallet:</strong> {lastFailedTxn.details?.wallet || 'N/A'}</div>
                    ) : lastFailedTxn.paymentMethod === 'crypto' ? (
                      <div><strong>Cryptocurrency:</strong> {lastFailedTxn.details?.cryptocurrency || 'N/A'}</div>
                    ) : (
                      <div><strong>Card (last4):</strong> {lastFailedTxn.cardLast4 || 'N/A'}</div>
                    )}
                    <div><strong>Reason:</strong> {lastFailedTxn.failureReason || 'Payment failed'}</div>
                    <div><strong>{t.date}:</strong> {new Date(lastFailedTxn.created).toLocaleString()}</div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" onClick={() => { setFailureModal(false); setResult(null); }}>Back to Dashboard</Button>
                    <Button onClick={() => { setFailureModal(false); setResult(null); setActiveTab("checkout"); }}>Try Again</Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
              <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5"/>
                    <h3 className="text-lg font-semibold">{authMode === 'login' ? t.login : t.signup}</h3>
                  </div>
                  
                  {authError && (
                    <div className="bg-rose-50 text-rose-700 p-3 rounded-lg mb-4 text-sm">
                      {authError}
                    </div>
                  )}
                  
                  {authMode === 'signup' && (
                    <>
                      <div className="mb-3">
                        <Label>Full Name</Label>
                        <Input 
                          value={authName} 
                          onChange={(e) => setAuthName(e.target.value)} 
                          placeholder="Your Name" 
                          className="mt-1"
                        />
                      </div>
                      <div className="mb-3">
                        <Label>{t.initialBalance}</Label>
                        <Input 
                          type="number"
                          value={initialBalance} 
                          onChange={(e) => setInitialBalance(Number(e.target.value))} 
                          placeholder="Enter initial deposit amount" 
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="mb-3">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={authEmail} 
                      onChange={(e) => setAuthEmail(e.target.value)} 
                      placeholder="you@example.com" 
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label>{t.password}</Label>
                    <Input 
                      type="password"
                      value={authPassword} 
                      onChange={(e) => setAuthPassword(e.target.value)} 
                      placeholder={authMode === 'login' ? 'Your password' : 'At least 6 characters'} 
                      className="mt-1"
                    />
                    {authMode === 'signup' && authPassword && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">{t.passwordStrength}</span>
                          <span className={`font-medium ${
                            passwordStrength.score >= 4 ? 'text-emerald-600' :
                            passwordStrength.score >= 2 ? 'text-amber-600' :
                            'text-rose-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div 
                              key={i}
                              className={`h-1 flex-1 rounded-full ${
                                i <= passwordStrength.score ? 
                                  passwordStrength.score >= 4 ? 'bg-emerald-500' :
                                  passwordStrength.score >= 2 ? 'bg-amber-500' : 'bg-rose-500' :
                                'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <button 
                      className="text-sm text-blue-600 hover:underline" 
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    >
                      {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
                    </button>
                    
                    <Button 
                      onClick={handleAuth} 
                      disabled={authProcessing}
                      className="ml-auto"
                    >
                      {authProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin"/>
                      ) : authMode === 'login' ? (
                        <LogIn className="w-4 h-4 mr-1"/>
                      ) : (
                        <User className="w-4 h-4 mr-1"/>
                      )}
                      {authMode === 'login' ? t.login : t.signup}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2FA Modal */}
        <AnimatePresence>
          {showTwoFactor && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5"/>
                    <h3 className="text-lg font-semibold">{t.twoFactorAuth}</h3>
                  </div>
                  <p className="text-sm text-slate-600">We sent a verification code to your email. For demo, your code is <span className="font-mono">{twoFactorSent}</span>.</p>
                  
                  {/* 2FA Code Input */}
                  <div className="flex justify-center gap-2 mt-4">
                    {[...Array(6)].map((_, i) => (
                      <Input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={twoFactorCode[i] || ''}
                        onChange={(e) => {
                          const newCode = [...twoFactorCode];
                          newCode[i] = e.target.value;
                          setTwoFactorCode(newCode.join('').slice(0, 6));
                          // Auto-focus next input
                          if (e.target.value && i < 5) {
                            document.getElementById(`2fa-${i+1}`)?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace to move to previous input
                          if (e.key === 'Backspace' && !e.target.value && i > 0) {
                            document.getElementById(`2fa-${i-1}`)?.focus();
                          }
                        }}
                        id={`2fa-${i}`}
                        className="w-12 h-12 text-center text-xl"
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="ghost" onClick={() => { setShowTwoFactor(false); setTwoFactorCode(""); setAuthError(""); }}><X className="w-4 h-4 mr-1"/>Cancel</Button>
                    <Button variant="black" onClick={verifyTwoFactor} disabled={authProcessing} className="ml-auto">
                      {authProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 mr-1"/>}
                      Verify
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget snippet modal */}
        <AnimatePresence>
          {widgetOpen && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-5 h-5"/>
                    <h3 className="text-lg font-semibold">Checkout Button Widget (Demo)</h3>
                  </div>
                  <Textarea readOnly value={widgetSnippet} className="font-mono h-48"/>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" onClick={() => copy(widgetSnippet)}><Copy className="w-4 h-4 mr-2"/>Copy</Button>
                    <Button variant="ghost" onClick={() => setWidgetOpen(false)}><X className="w-4 h-4 mr-2"/>Close</Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile PWA Prompt */}
        <AnimatePresence>
          {showMobilePrompt && (
            <motion.div 
              initial={{opacity:0, y:20}} 
              animate={{opacity:1, y:0}} 
              exit={{opacity:0, y:20}} 
              className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-xl p-4 max-w-md mx-auto border"
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Install Mini Payment Gateway</h3>
                  <p className="text-sm text-slate-500 mt-1">Add to your home screen for a better experience</p>
                </div>
                <button onClick={() => setShowMobilePrompt(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowMobilePrompt(false)} className="flex-1">
                  Not Now
                </Button>
                <Button onClick={installPwa} className="flex-1">
                  Install
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-10 text-center text-xs text-slate-500">
          <div>Demo-only. No real payments. Use for learning & UI flows.</div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}

