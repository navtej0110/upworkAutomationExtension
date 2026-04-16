"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Clock,
  Calendar,
  DollarSign,
  Zap,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Tag,
  CheckCircle,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  link: string;
  budget: string | null;
  skills: string | null;
}

interface ProposalData {
  proposal: string;
  estimatedHours: number;
  estimatedDays: number;
  estimatedBudget: string;
  complexity: string;
  keyPoints: string[];
  job: Job;
}

const complexityColors: Record<string, string> = {
  Simple: "bg-green-100 text-green-700",
  Moderate: "bg-yellow-100 text-yellow-700",
  Complex: "bg-red-100 text-red-700",
};

export default function ProposalPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [data, setData] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generate() {
      setLoading(true);
      setError("");

      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to generate proposal");
        setLoading(false);
        return;
      }

      setData(result);
      setLoading(false);
    }

    generate();
  }, [jobId]);

  async function handleCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setLoading(true);
    setError("");
    setData(null);

    const res = await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Failed to generate proposal");
    } else {
      setData(result);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="text-zinc-500 text-sm">Generating proposal with AI...</p>
        <p className="text-zinc-400 text-xs">This may take 10-15 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const skillsList = data.job.skills
    ? data.job.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-3xl">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Job Summary */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              {data.job.title}
            </h1>
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
              {data.job.description}
            </p>
            {skillsList.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-3">
                <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                {skillsList.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <a
            href={data.job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            View on Upwork
          </a>
        </div>
      </div>

      {/* Estimates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-zinc-900">
            {data.estimatedHours}h
          </p>
          <p className="text-xs text-zinc-500">Est. Hours</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-zinc-900">
            {data.estimatedDays}d
          </p>
          <p className="text-xs text-zinc-500">Est. Days</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-zinc-900">
            {data.estimatedBudget}
          </p>
          <p className="text-xs text-zinc-500">Suggested Bid</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
          <Zap className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-zinc-900">
            <span
              className={`text-sm px-2 py-0.5 rounded-full ${
                complexityColors[data.complexity] || "bg-zinc-100 text-zinc-600"
              }`}
            >
              {data.complexity}
            </span>
          </p>
          <p className="text-xs text-zinc-500 mt-1">Complexity</p>
        </div>
      </div>

      {/* Key Points */}
      {data.keyPoints.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            Why You&apos;re a Good Fit
          </h2>
          <ul className="space-y-2">
            {data.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-600"
              >
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Proposal */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            Generated Proposal
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors"
            >
              <Zap className="w-3 h-3" />
              Regenerate
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Proposal
                </>
              )}
            </button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap leading-relaxed">
          {data.proposal}
        </div>
      </div>
    </div>
  );
}
