// Upwork Job Scraper — paste this in Chrome Console on any Upwork job page
(async function() {
  const SERVER = 'http://localhost:3000/api/import';

  function extractUpworkId(link) {
    const m = link.match(/~(\w{18,})/);
    if (m) return m[1];
    const m2 = link.match(/\/(\d{15,})/);
    if (m2) return m2[1];
    return btoa(link).slice(0, 20);
  }

  // Find all job links on the page
  const jobLinks = document.querySelectorAll('a[href*="/jobs/"], a[href*="/job/"]');
  const seen = new Set();
  const jobs = [];

  jobLinks.forEach(a => {
    const container = a.closest('article, section, div[class*="tile"], div[class*="card"], div[class*="Job"]')
      || a.parentElement?.parentElement?.parentElement;
    if (!container) return;

    let link = a.href;
    if (link.startsWith('/')) link = 'https://www.upwork.com' + link;

    const upworkId = extractUpworkId(link);
    if (seen.has(upworkId)) return;
    seen.add(upworkId);

    const title = a.textContent?.trim() || '';
    if (!title || title.length < 5) return;

    // Get description from nearby elements
    const descEl = container.querySelector('p, span[class*="clamp"], div[class*="description"], [data-test="job-description-text"], [data-test="UpCLineClamp"] span');
    const description = descEl?.textContent?.trim() || '';

    // Get budget
    const budgetEl = container.querySelector('[data-test="budget"], [data-test="is-fixed-price"], [data-test="job-type-label"]');
    const budget = budgetEl?.textContent?.trim() || null;

    // Get skills
    const skillEls = container.querySelectorAll('[data-test="token"] span, .air3-token span, span[class*="skill"]');
    const skills = Array.from(skillEls).map(el => el.textContent?.trim()).filter(s => s && s.length < 50);

    jobs.push({ upworkId, title, description, link, budget, skills, category: null });
  });

  if (jobs.length === 0) {
    console.log('%c No jobs found on this page. Make sure you are on a page with job listings.', 'color: red; font-size: 14px;');
    return;
  }

  console.log(`%c Found ${jobs.length} jobs. Sending to server...`, 'color: blue; font-size: 14px;');

  try {
    const res = await fetch(SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs }),
    });
    const data = await res.json();
    console.log(`%c ${data.message}`, 'color: green; font-size: 14px; font-weight: bold;');
  } catch (err) {
    console.log('%c Failed to send to server. Is the app running on localhost:3000?', 'color: red; font-size: 14px;');
    console.error(err);
  }
})();
