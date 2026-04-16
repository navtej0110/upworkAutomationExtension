"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  CheckCircle,
  Star,
  Loader2,
  Zap,
  SkipForward,
  RefreshCw,
  Play,
  Square,
  Clock,
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
}

interface CronStatus {
  active: boolean;
  lastRun: string | null;
  isRunning: boolean;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [matching, setMatching] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [cronStatus, setCronStatus] = useState<CronStatus>({
    active: false,
    lastRun: null,
    isRunning: false,
  });

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/jobs?sort=score");
    const data = await res.json();
    setJobs(data.jobs);
    setLoading(false);
  }, []);

  const fetchCronStatus = useCallback(async () => {
    const res = await fetch("/api/cron");
    const data = await res.json();
    setCronStatus(data);
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchCronStatus();
    const interval = setInterval(() => {
      fetchJobs();
      fetchCronStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchJobs, fetchCronStatus]);

  useEffect(() => {
    function handleScrapeResult(event: MessageEvent) {
      if (event.data?.type === "UPWORK_SCRAPE_RESULT") {
        const data = event.data.data;
        setScraping(false);
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

  async function handleScrape() {
    setScraping(true);
    setMessage("Scraping Upwork jobs...");
    window.postMessage({ type: "UPWORK_SCRAPE_TRIGGER" }, "*");
  }

  async function handleMatch() {
    setMatching(true);
    setMessage("");
    const res = await fetch("/api/match", { method: "POST" });
    const data = await res.json();
    setMessage(data.message || data.error);
    setMatching(false);
    fetchJobs();
  }

  async function handleCronToggle() {
    const action = cronStatus.active ? "stop" : "start";
    const res = await fetch("/api/cron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setMessage(data.message);
    fetchCronStatus();
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
            Automated Upwork job scraping and AI matching
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {scraping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {scraping ? "Scraping..." : "Scrape Now"}
          </button>
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

      {/* Auto-Scrape Control */}
      <div className="mb-6 p-4 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              cronStatus.active
                ? cronStatus.isRunning
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-green-500"
                : "bg-zinc-300"
            }`}
          />
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Auto-Scrape{" "}
              <span
                className={
                  cronStatus.active ? "text-green-600" : "text-zinc-400"
                }
              >
                {cronStatus.active ? "(Active — every 30 min)" : "(Off)"}
              </span>
            </p>
            {cronStatus.lastRun && (
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last run: {new Date(cronStatus.lastRun).toLocaleTimeString()}
                {cronStatus.isRunning && " — scraping now..."}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleCronToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            cronStatus.active
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-green-50 text-green-600 hover:bg-green-100"
          }`}
        >
          {cronStatus.active ? (
            <>
              <Square className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Auto-Scrape
            </>
          )}
        </button>
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
        <StatsCard
          label="Total Jobs"
          value={totalJobs}
          icon={Briefcase}
          color="text-blue-600"
        />
        <StatsCard
          label="High Matches (70+)"
          value={highMatches}
          icon={Star}
          color="text-green-600"
        />
        <StatsCard
          label="Applied"
          value={appliedJobs}
          icon={CheckCircle}
          color="text-purple-600"
        />
        <StatsCard
          label="Skipped"
          value={skippedJobs}
          icon={SkipForward}
          color="text-zinc-500"
        />
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
              Click &quot;Scrape Now&quot; or start Auto-Scrape to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
