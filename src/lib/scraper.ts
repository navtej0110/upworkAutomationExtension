// Scraping is handled by the Chrome extension (extension/ folder).
// The extension scrapes Upwork pages in the user's real browser
// and sends jobs to /api/import. No headless browser needed.

export interface RawJob {
  upworkId: string;
  title: string;
  description: string;
  link: string;
  publishedAt: Date | null;
  budget: string | null;
  skills: string[];
  category: string | null;
}
