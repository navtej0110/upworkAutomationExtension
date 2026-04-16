export const maxDuration = 300;

export async function POST() {
  return Response.json(
    {
      error: "Use the Chrome extension to scrape jobs. Click the extension icon in Chrome toolbar.",
      useExtension: true,
    },
    { status: 400 }
  );
}
