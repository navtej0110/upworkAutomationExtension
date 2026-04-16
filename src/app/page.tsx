"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  CheckCircle,
  Star,
  Loader2,
  SkipForward,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import JobCard from "@/components/JobCard";

interface Job {
  id: string;
  title: string;
  description: string;
  link: string;
  budget: string | null;
  skills: string | null;
  matchScore: number | null;
  matchReason: string | null;
  status: string;
  publishedAt: string | null;
  proposals: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  duration: string | null;
  weeklyHours: string | null;
  clientCountry: string | null;
  clientSpent: string | null;
  clientVerified: boolean;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/jobs?sort=score");
    const data = await res.json();
    setJobs(data.jobs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 15000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // Listen for extension scrape results
  useEffect(() => {
    function handleScrapeResult(event: MessageEvent) {
      if (event.data?.type === "UPWORK_SCRAPE_RESULT") {
        const data = event.data.data;
        if (data?.error) {
          setMessage(data.error);
        } else {
          setMessage(data?.message || `Scraped ${data?.total || 0} jobs!`);
        }
        fetchJobs();
      }
    }
    window.addEventListener("message", handleScrapeResult);
    return () => window.removeEventListener("message", handleScrapeResult);
  }, [fetchJobs]);

  async function handleMatch() {
    setMatching(true);
    setMessage("");
    const res = await fetch("/api/match", { method: "POST" });
    const data = await res.json();
    setMessage(data.message || data.error);
    setMatching(false);
    fetchJobs();
  }

  async function handleDeleteAll() {
    if (!confirm("Are you sure you want to delete ALL jobs?")) return;
    setDeleting(true);
    setMessage("");
    const res = await fetch("/api/jobs", { method: "DELETE" });
    const data = await res.json();
    setMessage(data.message || data.error);
    setDeleting(false);
    fetchJobs();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchJobs();
  }

  const totalJobs = jobs.length;
  const highMatches = jobs.filter((j) => (j.matchScore ?? 0) >= 70).length;
  const appliedJobs = jobs.filter((j) => j.status === "applied").length;
  const skippedJobs = jobs.filter((j) => j.status === "skipped").length;
  const matchedJobs = jobs.filter((j) => j.matchScore !== null);
  const topJobs = matchedJobs.length > 0 ? matchedJobs.slice(0, 10) : jobs.slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            Upwork job scraping and AI matching
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleMatch}
            disabled={matching}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {matching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Star className="w-4 h-4" />
            )}
            {matching ? "Matching..." : "AI Match"}
          </button>
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 px-3 py-2.5 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={deleting || jobs.length === 0}
            className="flex items-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
            title="Delete all jobs"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="ml-2 hover:text-blue-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Jobs" value={totalJobs} icon={Briefcase} color="text-blue-600" />
        <StatsCard label="High Matches (70+)" value={highMatches} icon={Star} color="text-green-600" />
        <StatsCard label="Applied" value={appliedJobs} icon={CheckCircle} color="text-purple-600" />
        <StatsCard label="Skipped" value={skippedJobs} icon={SkipForward} color="text-zinc-500" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          {matchedJobs.length > 0 ? "Top Matches" : "Recent Jobs"}
          {matchedJobs.length === 0 && jobs.length > 0 && (
            <span className="text-sm font-normal text-zinc-400 ml-2">
              — Click &quot;AI Match&quot; to score these jobs
            </span>
          )}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : topJobs.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No jobs yet</p>
            <p className="text-sm mt-1">
              Use the Chrome extension to scrape Upwork jobs
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topJobs.map((job) => (
              <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
