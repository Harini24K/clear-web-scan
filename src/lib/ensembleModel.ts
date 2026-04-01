import type { URLFeatures } from "./featureExtraction";

export interface ModelPrediction {
  name: string;
  prediction: "phishing" | "legitimate";
  confidence: number;
  weight: number;
}

export interface EnsembleResult {
  models: ModelPrediction[];
  finalPrediction: "phishing" | "legitimate";
  riskScore: number;
  explanation: string;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computeBaseScore(f: URLFeatures): number {
  let score = 0;
  if (f.urlLength > 75) score += 2;
  else if (f.urlLength > 54) score += 1;
  if (!f.hasHttps) score += 2.5;
  if (f.dotCount > 4) score += 1.5;
  if (f.specialCharCount > 10) score += 1;
  if (f.hasIPAddress) score += 3;
  score += f.suspiciousKeywords.length * 1.2;
  if (f.subdomainCount > 2) score += 1.5;
  if (f.shortUrl) score += 2;
  if (f.hasAtSymbol) score += 2;
  if (f.domainAge < 180) score += 1.5;
  if (f.redirectCount > 1) score += 1;
  return score;
}

export function predict(features: URLFeatures): EnsembleResult {
  const base = computeBaseScore(features);

  // Simulate 3 different models with slight variation
  const rfNoise = (Math.random() - 0.5) * 1.5;
  const lrNoise = (Math.random() - 0.5) * 2;
  const xgbNoise = (Math.random() - 0.5) * 1;

  const rfScore = sigmoid(base + rfNoise - 4);
  const lrScore = sigmoid(base + lrNoise - 4.5);
  const xgbScore = sigmoid(base + xgbNoise - 3.8);

  const models: ModelPrediction[] = [
    {
      name: "Random Forest",
      prediction: rfScore > 0.5 ? "phishing" : "legitimate",
      confidence: Math.round(Math.max(rfScore, 1 - rfScore) * 100),
      weight: 0.35,
    },
    {
      name: "Logistic Regression",
      prediction: lrScore > 0.5 ? "phishing" : "legitimate",
      confidence: Math.round(Math.max(lrScore, 1 - lrScore) * 100),
      weight: 0.25,
    },
    {
      name: "XGBoost",
      prediction: xgbScore > 0.5 ? "phishing" : "legitimate",
      confidence: Math.round(Math.max(xgbScore, 1 - xgbScore) * 100),
      weight: 0.4,
    },
  ];

  const weightedScore =
    rfScore * 0.35 + lrScore * 0.25 + xgbScore * 0.4;

  const riskScore = Math.round(weightedScore * 100);
  const finalPrediction = weightedScore > 0.5 ? "phishing" : "legitimate";

  const reasons: string[] = [];
  if (!features.hasHttps) reasons.push("missing HTTPS");
  if (features.hasIPAddress) reasons.push("IP address in URL");
  if (features.suspiciousKeywords.length > 0) reasons.push(`suspicious keywords: ${features.suspiciousKeywords.join(", ")}`);
  if (features.urlLength > 75) reasons.push("unusually long URL");
  if (features.shortUrl) reasons.push("URL shortener detected");

  const explanation = finalPrediction === "phishing"
    ? `⚠️ High risk detected. Concerns: ${reasons.length > 0 ? reasons.join("; ") : "multiple risk indicators flagged"}.`
    : `✅ This URL appears safe. ${reasons.length > 0 ? `Minor notes: ${reasons.join("; ")}.` : "No significant risk factors detected."}`;

  return { models, finalPrediction, riskScore, explanation };
}
