const btn = document.getElementById("scrapeBtn");
const logDiv = document.getElementById("log");
const summaryDiv = document.getElementById("summary");
const totalCount = document.getElementById("totalCount");
const summaryText = document.getElementById("summaryText");
const skillsBox = document.getElementById("skillsBox");
const skillsCount = document.getElementById("skillsCount");
const skillsBody = document.getElementById("skillsBody");
const skillsArrow = document.getElementById("skillsArrow");

const SKILLS = [
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

let selectedSkills = new Set(SKILLS);

// Toggle dropdown
document.getElementById("skillsToggle").addEventListener("click", () => {
  skillsBody.classList.toggle("open");
  skillsArrow.classList.toggle("open");
});

function updateCount() {
  skillsCount.textContent = `(${selectedSkills.size} of ${SKILLS.length} selected)`;
}

function renderSkills() {
  skillsBox.innerHTML = "";
  SKILLS.forEach((skill, i) => {
    const div = document.createElement("div");
    div.className = "skill-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selectedSkills.has(skill);
    cb.id = `skill-${i}`;
    cb.addEventListener("change", () => {
      if (cb.checked) selectedSkills.add(skill);
      else selectedSkills.delete(skill);
      updateCount();
    });

    const label = document.createElement("label");
    label.htmlFor = `skill-${i}`;
    label.textContent = skill;

    div.appendChild(cb);
    div.appendChild(label);
    skillsBox.appendChild(div);
  });
  updateCount();
}

document.getElementById("selectAll").addEventListener("click", () => {
  selectedSkills = new Set(SKILLS);
  renderSkills();
});
document.getElementById("selectNone").addEventListener("click", () => {
  selectedSkills.clear();
  renderSkills();
});

function addLog(text, type = "info") {
  logDiv.className = "show";
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = text;
  logDiv.appendChild(entry);
  logDiv.scrollTop = logDiv.scrollHeight;
}

btn.addEventListener("click", () => {
  const queries = [...selectedSkills];
  if (queries.length === 0) {
    addLog("Select at least one skill!", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Scraping...";
  logDiv.innerHTML = "";
  logDiv.className = "show";
  summaryDiv.className = "summary";

  addLog(`Starting scrape of ${queries.length} skills...`, "info");

  try {
    const filters = {
      postedWithin: document.getElementById("postedWithin").value,
      jobType: document.getElementById("jobType").value,
      experience: document.getElementById("experience").value,
      budgetMin: document.getElementById("budgetMin").value,
      budgetMax: document.getElementById("budgetMax").value,
      paymentVerified: document.getElementById("paymentVerified").checked,
      clientHires: document.getElementById("clientHires").checked,
    };

    chrome.runtime.sendMessage(
      { action: "scrape", selectedQueries: queries, ...filters },
      (response) => {
        btn.disabled = false;
        btn.textContent = "Scrape Jobs Now";

        if (chrome.runtime.lastError) {
          addLog("Extension error: " + chrome.runtime.lastError.message, "error");
          return;
        }

        if (!response) {
          addLog("No response from background script. Try removing and re-adding the extension.", "error");
          return;
        }

        if (response.error) {
          addLog("Error: " + response.error, "error");
        } else {
          summaryDiv.className = "summary show";
          totalCount.textContent = response.total || 0;
          const parts = [];
          if (response.created > 0) parts.push(`${response.created} new`);
          if (response.updated > 0) parts.push(`${response.updated} updated`);
          if (response.unchanged > 0) parts.push(`${response.unchanged} unchanged`);
          summaryText.textContent = parts.length > 0 ? parts.join(", ") : "jobs sent to dashboard";
        }
      }
    );
  } catch (err) {
    addLog("JS Error: " + err.message, "error");
    btn.disabled = false;
    btn.textContent = "Scrape Jobs Now";
  }
});

// Listen for progress updates
try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "scrape-progress") {
      addLog(msg.text, msg.status || "info");
    }
  });
} catch (e) {
  // ignore if runtime not available
}

// Init
renderSkills();
skillsBody.classList.add("open");
skillsArrow.classList.add("open");
