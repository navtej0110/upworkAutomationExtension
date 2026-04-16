const SERVER = "http://localhost:3000/api/import";
const SEARCH_QUERIES = [
  "html css javascript",
  "jquery developer",
  "psd to html",
  "php developer",
  "laravel developer",
  "codeigniter developer",
  "symfony developer",
  "wordpress developer",
  "shopify developer",
  "coldfusion developer",
  "mern stack developer",
  "react developer",
  "node.js developer",
  "react native developer",
  "flutter developer",
  "full stack web developer",
];

function extractUpworkId(link) {
  // Match _~022044370800830633468 or ~01abc format
  const m = link.match(/~(\w{10,})/);
  if (m) return m[1];
  const m2 = link.match(/\/(\d{15,})/);
  if (m2) return m2[1];
  return btoa(link).slice(0, 20);
}

// Send progress to popup
function sendProgress(text, status = "info") {
  chrome.runtime.sendMessage({ type: "scrape-progress", text, status }).catch(() => {});
}

// Content script to extract jobs from Upwork page
function extractJobsScript() {
  const results = [];
  const seen = new Set();

  // Find job links inside the job tile list
  // Upwork URL format: /jobs/Title-Slug_~0220443708.../
  const jobContainer = document.querySelector('[data-test="job-tile-list"]');
  if (!jobContainer) return results;

  const jobLinks = jobContainer.querySelectorAll('a[href*="/jobs/"]');
  // Filter: only actual job links (contain _~ in URL), not skill/category links
  const realJobLinks = Array.from(jobLinks).filter(a => a.href.includes('_~') || a.href.match(/\/jobs\/[^?]*~\d/));

  realJobLinks.forEach((a) => {
    const link = a.href;
    if (seen.has(link)) return;

    const title = a.textContent?.trim() || "";
    if (!title || title.length < 5) return;
    const lower = title.toLowerCase();
    if (lower === "saved jobs" || lower === "my proposals" || lower === "my jobs" || lower === "find work") return;

    seen.add(link);

    // Find the job tile container — look for the nearest parent that is a direct child of the job-tile-list
    let container = a.parentElement;
    while (container && container.parentElement !== jobContainer) {
      container = container.parentElement;
    }
    // Fallback: if we couldn't find a direct child, walk up to a reasonable container
    if (!container) {
      container = a.parentElement;
      for (let i = 0; i < 6 && container; i++) {
        if (container.textContent && container.textContent.length > 200) break;
        container = container.parentElement;
      }
    }

    let description = "";
    let budget = null;
    const skills = [];
    let proposals = null;
    let jobType = null;
    let experienceLevel = null;
    let duration = null;
    let weeklyHours = null;
    let clientCountry = null;
    let clientSpent = null;
    let clientVerified = false;

    if (container) {
      const text = container.textContent || "";

      // DESCRIPTION — use data-test attributes first
      const descEl = container.querySelector('[data-test="job-description-text"]') ||
        container.querySelector('[data-test="job-description-line-clamp"]');
      if (descEl) description = descEl.textContent?.trim() || "";
      // Fallback: longest text block that's NOT feedback/UI text
      const feedbackWords = ["not interested", "vague description", "unrealistic expectations", "too many applicants", "overqualified", "budget too low", "feedback helps", "doesn't match skills", "poor reviews"];
      if (!description) {
        container.querySelectorAll("p, span, div").forEach((el) => {
          const t = el.textContent?.trim() || "";
          if (t.length > 80 && t.length < 2000 && t.length > description.length && t !== title && el.children.length < 5) {
            const lower = t.toLowerCase();
            const isFeedback = feedbackWords.some((w) => lower.includes(w));
            if (!isFeedback) description = t;
          }
        });
      }
      // Clean: remove feedback text if it leaked into description
      if (description) {
        const feedbackIdx = description.toLowerCase().indexOf("job feedback");
        if (feedbackIdx > 0) description = description.substring(0, feedbackIdx).trim();
        const justNotIdx = description.toLowerCase().indexOf("just not interested");
        if (justNotIdx > 0) description = description.substring(0, justNotIdx).trim();
      }

      // BUDGET — data-test="budget" or formatted-amount
      const budgetEl = container.querySelector('[data-test="budget"]') ||
        container.querySelector('[data-test="formatted-amount"]');
      if (budgetEl) budget = budgetEl.textContent?.trim() || null;
      if (!budget) {
        const budgetMatch = text.match(/Est\.\s*Budget:\s*\$[\d,]+/) ||
          text.match(/\$[\d,]+(?:\.\d{2})?\s*-\s*\$[\d,]+/) ||
          text.match(/\$[\d,]+(?:\.\d{2})?(?:\/hr)?/);
        if (budgetMatch) budget = budgetMatch[0];
      }

      // SKILLS — token-container children or attr-item
      const skipSkills = ["previous skills", "next skills", "update list", "previous skills. update list", "next skills. update list"];
      const tokenContainer = container.querySelector('[data-test="token-container"]');
      if (tokenContainer) {
        tokenContainer.querySelectorAll('a, span').forEach((t) => {
          const s = t.textContent?.trim() || "";
          if (s.length > 1 && s.length < 40 && !skills.includes(s) && !s.includes("search") && !skipSkills.includes(s.toLowerCase())) {
            skills.push(s);
          }
        });
      }
      if (skills.length === 0) {
        container.querySelectorAll('[data-test="attr-item"], [data-test="token"]').forEach((t) => {
          const s = t.textContent?.trim() || "";
          if (s.length > 1 && s.length < 40 && !skills.includes(s) && !skipSkills.includes(s.toLowerCase())) skills.push(s);
        });
      }

      // PROPOSALS
      const proposalsEl = container.querySelector('[data-test="proposals"]');
      if (proposalsEl) proposals = proposalsEl.textContent?.trim() || null;
      if (!proposals) {
        const pm = text.match(/Proposals:\s*([\w\s]+?)(?:\n|$)/i);
        if (pm) proposals = pm[1]?.trim();
      }

      // JOB TYPE
      const jobTypeEl = container.querySelector('[data-test="job-type"]');
      if (jobTypeEl) {
        const jt = jobTypeEl.textContent || "";
        if (jt.includes("Fixed")) jobType = "Fixed-price";
        else if (jt.includes("Hourly")) jobType = "Hourly";
      }
      if (!jobType) {
        if (text.includes("Fixed-price") || text.includes("Fixed price")) jobType = "Fixed-price";
        else if (text.includes("Hourly")) jobType = "Hourly";
      }

      // EXPERIENCE LEVEL
      const tierEl = container.querySelector('[data-test="contractor-tier"]');
      if (tierEl) experienceLevel = tierEl.textContent?.trim() || null;
      if (!experienceLevel) {
        if (text.includes("Expert")) experienceLevel = "Expert";
        else if (text.includes("Intermediate")) experienceLevel = "Intermediate";
        else if (text.includes("Entry")) experienceLevel = "Entry";
      }

      // DURATION
      const durMatch = text.match(/Est\.\s*Time:\s*([^,\n]+)/i) ||
        text.match(/(Less than (?:1 month|1 week)|(?:\d+ to \d+ months?)|(?:More than \d+ months?))/i);
      if (durMatch) duration = durMatch[1]?.trim() || durMatch[0]?.trim();

      // WEEKLY HOURS
      if (text.includes("Less than 30 hrs")) weeklyHours = "Less than 30 hrs/week";
      else if (text.includes("30+ hrs")) weeklyHours = "30+ hrs/week";

      // CLIENT COUNTRY
      const countryEl = container.querySelector('[data-test="client-country"]');
      if (countryEl) clientCountry = countryEl.textContent?.trim() || null;

      // CLIENT SPENT
      const spentEl = container.querySelector('[data-test="client-spendings"]');
      if (spentEl) clientSpent = spentEl.textContent?.trim() || null;
      if (!clientSpent) {
        const sm = text.match(/\$[\d.]+[KkMm]?\+?\s*spent/);
        if (sm) clientSpent = sm[0];
      }

      // PAYMENT VERIFIED
      const verifiedEl = container.querySelector('[data-test="payment-verification-status"]');
      clientVerified = verifiedEl ? verifiedEl.textContent?.includes("verified") || false : text.includes("Payment verified");
    }

    results.push({
      title, description, link, budget, skills,
      proposals, jobType, experienceLevel, duration, weeklyHours,
      clientCountry, clientSpent, clientVerified,
    });
  });

  return results;
}

// Scrape a single URL in a tab
async function scrapeUrl(tab, url) {
  await chrome.tabs.update(tab.id, { url });

  // Wait for page to load
  await new Promise((resolve) => {
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

  // Extra wait for dynamic content
  await new Promise((r) => setTimeout(r, 4000));

  // Scroll down
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      for (let i = 0; i < 3; i++) {
        window.scrollBy(0, window.innerHeight);
        await new Promise((r) => setTimeout(r, 1500));
      }
    },
  });

  await new Promise((r) => setTimeout(r, 2000));

  // Extract jobs
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractJobsScript,
  });

  return results[0]?.result || [];
}

// Build Upwork search URL with filters
function buildSearchUrl(query, filters) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("sort", "recency");
  params.set("per_page", "20");

  // Posted within (days)
  if (filters.postedWithin) {
    params.set("t", filters.postedWithin);
  }

  // Job type: 1 = fixed, 0 = hourly
  if (filters.jobType) {
    params.set("job_type", filters.jobType);
  }

  // Experience level: 1=entry, 2=intermediate, 3=expert
  if (filters.experience) {
    params.set("contractor_tier", filters.experience);
  }

  // Budget range
  if (filters.budgetMin || filters.budgetMax) {
    const min = filters.budgetMin || "0";
    const max = filters.budgetMax || "";
    params.set("amount", max ? `${min}-${max}` : `${min}-`);
  }

  // Payment verified
  if (filters.paymentVerified) {
    params.set("payment_verified", "1");
  }

  // Client has hire history
  if (filters.clientHires) {
    params.set("client_hires", "1-9,10-");
  }

  return `https://www.upwork.com/nx/search/jobs/?${params.toString()}`;
}

// Main scrape — called from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scrape") {
    const filters = {
      selectedQueries: msg.selectedQueries || [],
      postedWithin: msg.postedWithin || "",
      jobType: msg.jobType || "",
      experience: msg.experience || "",
      budgetMin: msg.budgetMin || "",
      budgetMax: msg.budgetMax || "",
      paymentVerified: msg.paymentVerified || false,
      clientHires: msg.clientHires || false,
    };
    doScrape(filters)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

async function doScrape(filters) {
  const allJobs = [];
  const seen = new Set();
  const queries = filters.selectedQueries || [];

  const tab = await chrome.tabs.create({ url: "about:blank", active: false });

  try {
    // 1. Scrape Find Work feed
    sendProgress("Scraping Find Work feed...", "searching");
    const feedJobs = await scrapeUrl(tab, "https://www.upwork.com/nx/find-work/");

    for (const job of feedJobs) {
      const id = extractUpworkId(job.link);
      if (!seen.has(id)) {
        seen.add(id);
        allJobs.push({ ...job, upworkId: id, category: null });
      }
    }
    sendProgress(`Find Work — ${feedJobs.length} jobs found`, "done");

    // 2. Scrape selected skill queries
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      sendProgress(`[${i + 1}/${queries.length}] Searching: ${query}`, "searching");

      try {
        const url = buildSearchUrl(query, filters);
        const jobs = await scrapeUrl(tab, url);

        let newCount = 0;
        for (const job of jobs) {
          const id = extractUpworkId(job.link);
          if (!seen.has(id)) {
            seen.add(id);
            allJobs.push({ ...job, upworkId: id, category: null });
            newCount++;
          }
        }
        sendProgress(`${query} — ${jobs.length} found, ${newCount} new`, "done");
      } catch (err) {
        sendProgress(`${query} — failed: ${err.message}`, "error");
      }
    }

    // 3. Send to server
    if (allJobs.length > 0) {
      sendProgress(`Sending ${allJobs.length} jobs to dashboard...`, "searching");
      const res = await fetch(SERVER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: allJobs }),
      });
      const data = await res.json();
      sendProgress(data.message || "Done!", "done");
      return { total: allJobs.length, ...data };
    }

    sendProgress("No jobs found. Make sure you're logged into Upwork.", "error");
    return { total: 0, message: "No jobs found" };
  } finally {
    chrome.tabs.remove(tab.id);

    // Open or refresh the dashboard tab
    try {
      const dashboardTabs = await chrome.tabs.query({ url: "http://localhost:3000/*" });

      if (dashboardTabs.length > 0) {
        const dt = dashboardTabs[0];
        await chrome.tabs.reload(dt.id);
        await chrome.tabs.update(dt.id, { active: true });
        await chrome.windows.update(dt.windowId, { focused: true });
      } else {
        await chrome.tabs.create({ url: "http://localhost:3000" });
      }
    } catch (e) {
      // Fallback: just open a new tab
      chrome.tabs.create({ url: "http://localhost:3000" });
    }
  }
}
