let cronInterval: ReturnType<typeof setInterval> | null = null;
let lastRun: Date | null = null;
let isRunning = false;

export function getCronStatus() {
  return {
    active: cronInterval !== null,
    lastRun: lastRun?.toISOString() || null,
    isRunning,
  };
}

export function startCron(intervalMs: number, task: () => Promise<void>) {
  if (cronInterval) return; // Already running

  console.log(`Cron started: running every ${intervalMs / 60000} minutes`);

  // Run immediately on start
  runTask(task);

  cronInterval = setInterval(() => runTask(task), intervalMs);
}

export function stopCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("Cron stopped");
  }
}

async function runTask(task: () => Promise<void>) {
  if (isRunning) {
    console.log("Cron: previous run still in progress, skipping");
    return;
  }

  isRunning = true;
  lastRun = new Date();
  console.log(`Cron: running at ${lastRun.toISOString()}`);

  try {
    await task();
    console.log("Cron: task completed");
  } catch (err) {
    console.error("Cron: task failed:", err);
  } finally {
    isRunning = false;
  }
}
