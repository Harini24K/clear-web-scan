import { motion } from "framer-motion";
import type { WebsiteAnalysisResult } from "@/lib/websiteAnalysis";
import {
  Globe, Lock, TrendingUp, Link2, Search, FileText, ShieldCheck,
} from "lucide-react";
import AnalysisModule from "./AnalysisModule";
import StatBadge from "./StatBadge";
import TrustFactorRow from "./TrustFactorRow";

interface AnalysisReportProps {
  result: WebsiteAnalysisResult;
}

const AnalysisReport = ({ result }: AnalysisReportProps) => {
  const { domainInfo, trafficAnalysis, backlinkAnalysis, searchPresence, contentAnalysis, reputationCheck, factors } = result;

  return (
    <div className="space-y-6">
      {/* Trust Factors */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Trust Factor Breakdown
        </h3>
        <div className="grid gap-2">
          {factors.map((f, i) => (
            <TrustFactorRow key={f.label} factor={f} index={i} />
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Domain Info */}
        <AnalysisModule icon={<Globe className="w-4 h-4 text-primary" />} title="Domain & WHOIS" index={0}>
          <div className="grid grid-cols-2 gap-2">
            <StatBadge label="Domain" value={domainInfo.domain} />
            <StatBadge label="TLD" value={domainInfo.tld} status={domainInfo.tldTrustLevel === "high" ? "good" : domainInfo.tldTrustLevel === "medium" ? "warning" : "danger"} />
            <StatBadge label="Domain Age" value={`${domainInfo.registeredDays}d`} status={domainInfo.registeredDays > 365 ? "good" : domainInfo.registeredDays > 90 ? "warning" : "danger"} />
            <StatBadge label="SSL" value={domainInfo.sslValid ? "Valid" : "Invalid"} status={domainInfo.sslValid ? "good" : "danger"} />
            <StatBadge label="WHOIS Privacy" value={domainInfo.whoisPrivacy ? "Yes" : "No"} status="neutral" />
            <StatBadge label="Domain Length" value={`${domainInfo.domainLength} chars`} status={domainInfo.domainLength > 20 ? "warning" : "good"} />
          </div>
          {domainInfo.isIDN && <p className="text-xs text-warning mt-2">⚠️ Internationalized domain name (IDN/Punycode) detected</p>}
          {domainInfo.hasDashes && <p className="text-xs text-muted-foreground mt-1">Domain contains dashes</p>}
        </AnalysisModule>

        {/* Traffic */}
        <AnalysisModule icon={<TrendingUp className="w-4 h-4 text-primary" />} title="Traffic & Popularity" index={1}>
          <div className="grid grid-cols-2 gap-2">
            <StatBadge label="Global Rank" value={trafficAnalysis.estimatedRank > 0 ? `#${trafficAnalysis.estimatedRank.toLocaleString()}` : "Unranked"} status={trafficAnalysis.isPopularDomain ? "good" : trafficAnalysis.trafficLevel === "none" ? "danger" : "warning"} />
            <StatBadge label="Traffic Level" value={trafficAnalysis.trafficLevel.charAt(0).toUpperCase() + trafficAnalysis.trafficLevel.slice(1)} status={trafficAnalysis.trafficLevel === "high" ? "good" : trafficAnalysis.trafficLevel === "medium" ? "warning" : "danger"} />
            <StatBadge label="Category" value={trafficAnalysis.categoryEstimate} status="neutral" />
            <StatBadge label="Popular" value={trafficAnalysis.isPopularDomain ? "Yes" : "No"} status={trafficAnalysis.isPopularDomain ? "good" : "neutral"} />
          </div>
        </AnalysisModule>

        {/* Backlinks */}
        <AnalysisModule icon={<Link2 className="w-4 h-4 text-primary" />} title="Backlink Profile" index={2}>
          <div className="grid grid-cols-2 gap-2">
            <StatBadge label="Backlinks" value={backlinkAnalysis.estimatedBacklinks.toLocaleString()} status={backlinkAnalysis.backlinkQuality === "high" ? "good" : backlinkAnalysis.backlinkQuality === "medium" ? "warning" : "danger"} />
            <StatBadge label="Referring Domains" value={backlinkAnalysis.referringDomains.toLocaleString()} status={backlinkAnalysis.referringDomains > 100 ? "good" : backlinkAnalysis.referringDomains > 10 ? "warning" : "danger"} />
            <StatBadge label="Quality" value={backlinkAnalysis.backlinkQuality.charAt(0).toUpperCase() + backlinkAnalysis.backlinkQuality.slice(1)} status={backlinkAnalysis.backlinkQuality === "high" ? "good" : backlinkAnalysis.backlinkQuality === "medium" ? "warning" : "danger"} />
          </div>
        </AnalysisModule>

        {/* Search Presence */}
        <AnalysisModule icon={<Search className="w-4 h-4 text-primary" />} title="Search Engine Presence" index={3}>
          <div className="grid grid-cols-2 gap-2">
            <StatBadge label="Indexed" value={searchPresence.likelyIndexed ? "Yes" : "No"} status={searchPresence.likelyIndexed ? "good" : "danger"} />
            <StatBadge label="Est. Pages" value={searchPresence.estimatedPages.toLocaleString()} status={searchPresence.estimatedPages > 100 ? "good" : searchPresence.estimatedPages > 0 ? "warning" : "danger"} />
            <StatBadge label="Brand Presence" value={searchPresence.brandPresence ? "Established" : "Not found"} status={searchPresence.brandPresence ? "good" : "warning"} />
          </div>
        </AnalysisModule>

        {/* Content Signals */}
        <AnalysisModule icon={<FileText className="w-4 h-4 text-primary" />} title="Content & Page Signals" index={4}>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <StatBadge label="Login Forms" value={contentAnalysis.hasSuspiciousForm ? "Detected" : "None"} status={contentAnalysis.hasSuspiciousForm ? "danger" : "good"} />
              <StatBadge label="Redirects" value={contentAnalysis.hasHiddenRedirects ? "Suspicious" : "Normal"} status={contentAnalysis.hasHiddenRedirects ? "danger" : "good"} />
              <StatBadge label="Homoglyphs" value={contentAnalysis.homoglyphDetected ? "Detected" : "None"} status={contentAnalysis.homoglyphDetected ? "danger" : "good"} />
              <StatBadge label="Subdomains" value={contentAnalysis.excessiveSubdomains ? "Excessive" : "Normal"} status={contentAnalysis.excessiveSubdomains ? "warning" : "good"} />
            </div>
            {contentAnalysis.mimicsBrand && (
              <p className="text-xs text-danger font-medium">🚨 Possible impersonation of {contentAnalysis.mimicsBrand}</p>
            )}
            {contentAnalysis.suspiciousPathPatterns.length > 0 && (
              <p className="text-xs text-warning">⚠️ Suspicious paths: {contentAnalysis.suspiciousPathPatterns.join(", ")}</p>
            )}
          </div>
        </AnalysisModule>

        {/* Reputation */}
        <AnalysisModule icon={<Lock className="w-4 h-4 text-primary" />} title="Reputation & Blacklist" index={5}>
          <div className="grid grid-cols-2 gap-2">
            <StatBadge label="Phishing Pattern" value={reputationCheck.knownPhishingPattern ? "Match" : "Clean"} status={reputationCheck.knownPhishingPattern ? "danger" : "good"} />
            <StatBadge label="TLD Blacklist" value={reputationCheck.blacklistedTLD ? "Flagged" : "Clean"} status={reputationCheck.blacklistedTLD ? "danger" : "good"} />
            <StatBadge label="Free Hosting" value={reputationCheck.freeHosting ? "Yes" : "No"} status={reputationCheck.freeHosting ? "warning" : "good"} />
            <StatBadge label="Disposable" value={reputationCheck.disposableDomain ? "Yes" : "No"} status={reputationCheck.disposableDomain ? "danger" : "good"} />
          </div>
        </AnalysisModule>
      </div>
    </div>
  );
};

export default AnalysisReport;
