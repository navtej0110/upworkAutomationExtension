"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  Star,
  Clock,
  DollarSign,
  Tag,
  FileText,
  MapPin,
  Users,
  Briefcase,
  BadgeCheck,
} from "lucide-react";

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

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  saved: "bg-yellow-100 text-yellow-700",
  applied: "bg-green-100 text-green-700",
  skipped: "bg-zinc-100 text-zinc-500",
};

export default function JobCard({
  job,
  onStatusChange,
}: {
  job: Job;
  onStatusChange: (id: string, status: string) => void;
}) {
  const scoreColor =
    (job.matchScore ?? 0) >= 70
      ? "text-green-600 bg-green-50 border-green-200"
      : (job.matchScore ?? 0) >= 40
      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
      : "text-zinc-500 bg-zinc-50 border-zinc-200";

  const skillsList = job.skills
    ? job.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Status + meta badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                statusColors[job.status]
              }`}
            >
              {job.status}
            </span>
            {job.jobType && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                {job.jobType}
              </span>
            )}
            {job.experienceLevel && (
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {job.experienceLevel}
              </span>
            )}
            {job.publishedAt && (
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(job.publishedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-zinc-900">{job.title}</h3>
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
            {job.description}
          </p>

          {/* Skills */}
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

          {/* Budget + Job details row */}
          <div className="flex items-center gap-3 flex-wrap mt-2">
            {job.budget && (
              <span className="text-xs text-zinc-600 font-medium flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-zinc-400" />
                {job.budget}
              </span>
            )}
            {job.duration && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {job.duration}
              </span>
            )}
            {job.weeklyHours && (
              <span className="text-xs text-zinc-500">
                {job.weeklyHours}
              </span>
            )}
            {job.proposals && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Users className="w-3 h-3 text-zinc-400" />
                Proposals: {job.proposals}
              </span>
            )}
          </div>

          {/* Client info row */}
          {(job.clientVerified || job.clientSpent || job.clientCountry) && (
            <div className="flex items-center gap-3 flex-wrap mt-1.5">
              {job.clientVerified && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  Payment verified
                </span>
              )}
              {job.clientSpent && (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-zinc-400" />
                  {job.clientSpent}
                </span>
              )}
              {job.clientCountry && (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  {job.clientCountry}
                </span>
              )}
            </div>
          )}

          {job.matchReason && (
            <p className="text-xs text-zinc-500 mt-2 italic">
              {job.matchReason}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0">
          {job.matchScore !== null && (
            <div
              className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg border ${scoreColor}`}
            >
              <Star className="w-4 h-4" />
              {job.matchScore}
            </div>
          )}
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            View
          </a>
          <Link
            href={`/proposal/${job.id}`}
            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            Generate Proposal
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-100">
        {["saved", "applied", "skipped"].map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(job.id, s)}
            disabled={job.status === s}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              job.status === s
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
