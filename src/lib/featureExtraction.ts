export interface URLFeatures {
  urlLength: number;
  hasHttps: boolean;
  dotCount: number;
  specialCharCount: number;
  hasIPAddress: boolean;
  suspiciousKeywords: string[];
  subdomainCount: number;
  pathDepth: number;
  domainAge: number; // mock days
  hasAtSymbol: boolean;
  redirectCount: number;
  shortUrl: boolean;
}

const SUSPICIOUS_KEYWORDS = [
  "login", "verify", "account", "secure", "update", "confirm",
  "banking", "paypal", "signin", "password", "credential",
  "suspend", "unusual", "alert", "expired", "locked",
  "free", "winner", "prize", "gift", "reward",
];

const SHORT_URL_DOMAINS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd",
  "buff.ly", "ow.ly", "rebrand.ly",
];

// Deterministic domain age estimation based on hostname hash
function estimateDomainAge(hostname: string): number {
  const wellKnown = ["google.com","facebook.com","amazon.com","apple.com","microsoft.com",
    "github.com","wikipedia.org","youtube.com","twitter.com","linkedin.com","netflix.com",
    "reddit.com","stackoverflow.com","paypal.com","ebay.com","yahoo.com","bing.com"];
  const h = hostname.replace(/^www\./, "");
  if (wellKnown.some(d => h === d || h.endsWith("." + d))) return 5000;
  // Hash-based deterministic age: short clean domains → older, long messy → newer
  let hash = 0;
  for (let i = 0; i < h.length; i++) hash = ((hash << 5) - hash + h.charCodeAt(i)) | 0;
  const parts = h.split(".");
  const penalty = Math.max(0, parts.length - 3) * 200 + Math.max(0, h.length - 20) * 30;
  const base = Math.abs(hash % 3000) + 30;
  return Math.max(30, base - penalty);
}

export function extractFeatures(url: string): URLFeatures {
  let parsed: URL;
  try {
    parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    parsed = new URL("https://invalid.example.com");
  }

  const hostname = parsed.hostname;
  const fullUrl = parsed.href;

  return {
    urlLength: fullUrl.length,
    hasHttps: parsed.protocol === "https:",
    dotCount: fullUrl.split(".").length - 1,
    specialCharCount: (fullUrl.match(/[-@!#$%^&*()_+=~`{}\[\]|\\:;"'<>,?]/g) || []).length,
    hasIPAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hostname),
    suspiciousKeywords: SUSPICIOUS_KEYWORDS.filter((kw) =>
      fullUrl.toLowerCase().includes(kw)
    ),
    subdomainCount: hostname.split(".").length - 2,
    pathDepth: parsed.pathname.split("/").filter(Boolean).length,
    domainAge: estimateDomainAge(hostname),
    hasAtSymbol: fullUrl.includes("@"),
    redirectCount: (fullUrl.match(/\/\//g) || []).length - 1,
    shortUrl: SHORT_URL_DOMAINS.some((d) => hostname.includes(d)),
  };
}

export function featureToRiskFactors(features: URLFeatures): { label: string; value: number; risk: "low" | "medium" | "high" }[] {
  const factors: { label: string; value: number; risk: "low" | "medium" | "high" }[] = [];

  const urlRisk = features.urlLength > 75 ? 0.8 : features.urlLength > 54 ? 0.5 : 0.1;
  factors.push({ label: "URL Length", value: urlRisk, risk: urlRisk > 0.6 ? "high" : urlRisk > 0.3 ? "medium" : "low" });

  factors.push({ label: "HTTPS", value: features.hasHttps ? 0.1 : 0.9, risk: features.hasHttps ? "low" : "high" });

  const dotRisk = Math.min(features.dotCount / 8, 1);
  factors.push({ label: "Dot Count", value: dotRisk, risk: dotRisk > 0.6 ? "high" : dotRisk > 0.3 ? "medium" : "low" });

  const kwRisk = Math.min(features.suspiciousKeywords.length / 3, 1);
  factors.push({ label: "Suspicious Keywords", value: kwRisk, risk: kwRisk > 0.5 ? "high" : kwRisk > 0 ? "medium" : "low" });

  factors.push({ label: "IP Address", value: features.hasIPAddress ? 1 : 0, risk: features.hasIPAddress ? "high" : "low" });

  const subRisk = Math.min(features.subdomainCount / 4, 1);
  factors.push({ label: "Subdomains", value: subRisk, risk: subRisk > 0.5 ? "high" : subRisk > 0 ? "medium" : "low" });

  factors.push({ label: "Short URL", value: features.shortUrl ? 0.8 : 0, risk: features.shortUrl ? "high" : "low" });

  const ageRisk = features.domainAge < 180 ? 0.8 : features.domainAge < 365 ? 0.4 : 0.1;
  factors.push({ label: "Domain Age", value: ageRisk, risk: ageRisk > 0.6 ? "high" : ageRisk > 0.3 ? "medium" : "low" });

  return factors;
}
