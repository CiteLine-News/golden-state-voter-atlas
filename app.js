const {
  snapshotDate,
  maxCompare,
  issueOrder,
  ballotSourceUrl,
  voterGuideUrl,
  certificationUrl,
  candidates
} = window.ATLAS_DATA;

const STORAGE_KEY = "golden-state-voter-atlas-state";

const state = {
  query: "",
  party: "all",
  sort: "curated",
  issues: [],
  bookmarksOnly: false,
  compare: [],
  bookmarks: [],
  spotlight: candidates[0].id
};

const ui = {
  statusMessage: document.getElementById("statusMessage"),
  shareViewButton: document.getElementById("shareViewButton"),
  clearFiltersButton: document.getElementById("clearFiltersButton"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  bookmarksOnly: document.getElementById("bookmarksOnly"),
  partyFilters: document.getElementById("partyFilters"),
  issueFilters: document.getElementById("issueFilters"),
  activeFilters: document.getElementById("activeFilters"),
  cardsGrid: document.getElementById("cardsGrid"),
  spotlightPanel: document.getElementById("spotlightPanel"),
  resultsHeading: document.getElementById("resultsHeading"),
  resultsMeta: document.getElementById("resultsMeta"),
  comparePills: document.getElementById("comparePills"),
  compareSummary: document.getElementById("compareSummary"),
  issueMap: document.getElementById("issueMap"),
  compareTable: document.getElementById("compareTable"),
  copyBriefButton: document.getElementById("copyBriefButton"),
  clearCompareButton: document.getElementById("clearCompareButton")
};

function init() {
  hydrateState();
  bindEvents();
  renderAll();
}

function hydrateState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (typeof saved.query === "string") {
      state.query = saved.query;
    }
    if (typeof saved.party === "string") {
      state.party = saved.party;
    }
    if (typeof saved.sort === "string") {
      state.sort = saved.sort;
    }
    if (Array.isArray(saved.issues)) {
      state.issues = saved.issues.filter(isKnownIssue);
    }
    if (Array.isArray(saved.compare)) {
      state.compare = saved.compare.filter(hasCandidate).slice(0, maxCompare);
    }
    if (Array.isArray(saved.bookmarks)) {
      state.bookmarks = saved.bookmarks.filter(hasCandidate);
    }
    if (typeof saved.bookmarksOnly === "boolean") {
      state.bookmarksOnly = saved.bookmarksOnly;
    }
    if (typeof saved.spotlight === "string" && hasCandidate(saved.spotlight)) {
      state.spotlight = saved.spotlight;
    }
  } catch {
    // Ignore storage failures and continue with defaults.
  }

  const params = new URLSearchParams(window.location.search);
  if (params.has("q")) {
    state.query = params.get("q") || "";
  }
  if (params.has("party")) {
    state.party = params.get("party") || "all";
  }
  if (params.has("sort")) {
    state.sort = params.get("sort") || "curated";
  }
  if (params.has("issues")) {
    state.issues = (params.get("issues") || "")
      .split(",")
      .map((part) => part.trim())
      .filter(isKnownIssue);
  }
  if (params.has("compare")) {
    state.compare = (params.get("compare") || "")
      .split(",")
      .map((part) => part.trim())
      .filter(hasCandidate)
      .slice(0, maxCompare);
  }
  if (params.has("spotlight") && hasCandidate(params.get("spotlight") || "")) {
    state.spotlight = params.get("spotlight") || state.spotlight;
  }
  if (params.get("bookmarks") === "1") {
    state.bookmarksOnly = true;
  }

  ui.searchInput.value = state.query;
  ui.sortSelect.value = state.sort;
  ui.bookmarksOnly.checked = state.bookmarksOnly;
}

function bindEvents() {
  ui.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trimStart();
    persistAndRender();
  });

  ui.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    persistAndRender();
  });

  ui.bookmarksOnly.addEventListener("change", (event) => {
    state.bookmarksOnly = event.target.checked;
    persistAndRender();
  });

  ui.partyFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-party]");
    if (!button) {
      return;
    }
    state.party = button.dataset.party || "all";
    persistAndRender();
  });

  ui.issueFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-issue]");
    if (!button) {
      return;
    }
    toggleIssue(button.dataset.issue || "");
    persistAndRender();
  });

  ui.activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");
    if (!button) {
      return;
    }

    const kind = button.dataset.removeFilter;
    if (kind === "query") {
      state.query = "";
      ui.searchInput.value = "";
    } else if (kind === "party") {
      state.party = "all";
    } else if (kind === "bookmarks") {
      state.bookmarksOnly = false;
      ui.bookmarksOnly.checked = false;
    } else if (kind === "issue") {
      toggleIssue(button.dataset.value || "");
    }

    persistAndRender();
  });

  ui.clearFiltersButton.addEventListener("click", () => {
    state.query = "";
    state.party = "all";
    state.sort = "curated";
    state.issues = [];
    state.bookmarksOnly = false;
    ui.searchInput.value = "";
    ui.sortSelect.value = state.sort;
    ui.bookmarksOnly.checked = false;
    persistAndRender();
  });

  ui.cardsGrid.addEventListener("click", handleCandidateAction);
  ui.spotlightPanel.addEventListener("click", handleCandidateAction);
  ui.comparePills.addEventListener("click", handleCandidateAction);

  ui.clearCompareButton.addEventListener("click", () => {
    state.compare = [];
    persistAndRender("Compare selection cleared.");
  });

  ui.copyBriefButton.addEventListener("click", async () => {
    const brief = buildCompareBrief();
    if (!brief) {
      setStatus("Pick at least two candidates to copy a compare brief.");
      return;
    }
    const success = await copyText(brief);
    setStatus(success ? "Compare brief copied to clipboard." : "Could not copy the compare brief.");
  });

  ui.shareViewButton.addEventListener("click", async () => {
    syncUrl();
    const success = await copyText(window.location.href);
    setStatus(success ? "Share link copied to clipboard." : "Could not copy the share link.");
  });
}

function handleCandidateAction(event) {
  const control = event.target.closest("[data-action]");
  if (!control) {
    return;
  }

  const action = control.dataset.action;
  const id = control.dataset.id;
  if (!hasCandidate(id)) {
    return;
  }

  if (action === "spotlight") {
    state.spotlight = id;
    persistAndRender();
    return;
  }

  if (action === "bookmark") {
    toggleBookmark(id);
    persistAndRender(isBookmarked(id) ? "Candidate bookmarked." : "Bookmark removed.");
    return;
  }

  if (action === "compare") {
    toggleCompare(id);
    persistAndRender();
    return;
  }

  if (action === "remove-compare") {
    state.compare = state.compare.filter((candidateId) => candidateId !== id);
    persistAndRender();
  }
}

function persistAndRender(message) {
  persistState();
  renderAll();
  if (message) {
    setStatus(message);
  }
}

function persistState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        query: state.query,
        party: state.party,
        sort: state.sort,
        issues: state.issues,
        bookmarksOnly: state.bookmarksOnly,
        compare: state.compare,
        bookmarks: state.bookmarks,
        spotlight: state.spotlight
      })
    );
  } catch {
    // Ignore storage failures and keep the UI moving.
  }
  syncUrl();
}

function syncUrl() {
  const params = new URLSearchParams();
  if (state.query) {
    params.set("q", state.query);
  }
  if (state.party !== "all") {
    params.set("party", state.party);
  }
  if (state.sort !== "curated") {
    params.set("sort", state.sort);
  }
  if (state.issues.length) {
    params.set("issues", state.issues.join(","));
  }
  if (state.compare.length) {
    params.set("compare", state.compare.join(","));
  }
  if (state.spotlight) {
    params.set("spotlight", state.spotlight);
  }
  if (state.bookmarksOnly) {
    params.set("bookmarks", "1");
  }

  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

function renderAll() {
  renderPartyFilters();
  renderIssueFilters();
  renderActiveFilters();
  renderResults();
  renderSpotlight();
  renderCompare();
}

function renderPartyFilters() {
  const parties = [
    { value: "all", label: "All parties" },
    { value: "Democratic", label: "Democratic" },
    { value: "Republican", label: "Republican" }
  ];

  ui.partyFilters.innerHTML = parties
    .map(
      (party) => `
        <button class="filter-button ${state.party === party.value ? "is-active" : ""}" type="button" data-party="${party.value}">
          ${party.label}
        </button>
      `
    )
    .join("");
}

function renderIssueFilters() {
  const counts = countIssues(candidates);
  ui.issueFilters.innerHTML = issueOrder
    .filter((issue) => counts.has(issue))
    .map((issue) => {
      const active = state.issues.includes(issue);
      return `
        <button class="chip-button ${active ? "is-active" : ""}" type="button" data-issue="${issue}" aria-pressed="${active}">
          ${issue}
          <span class="chip-type">${counts.get(issue)}</span>
        </button>
      `;
    })
    .join("");
}

function renderActiveFilters() {
  const tokens = [];
  if (state.query) {
    tokens.push(`<button class="filter-token" type="button" data-remove-filter="query">Search: ${escapeHtml(state.query)} x</button>`);
  }
  if (state.party !== "all") {
    tokens.push(`<button class="filter-token" type="button" data-remove-filter="party">${escapeHtml(state.party)} x</button>`);
  }
  if (state.bookmarksOnly) {
    tokens.push(`<button class="filter-token" type="button" data-remove-filter="bookmarks">Bookmarks only x</button>`);
  }
  for (const issue of state.issues) {
    tokens.push(`<button class="filter-token" type="button" data-remove-filter="issue" data-value="${issue}">${issue} x</button>`);
  }
  ui.activeFilters.innerHTML = tokens.join("");
}

function renderResults() {
  const results = getFilteredCandidates();
  ui.resultsHeading.textContent = `${results.length} candidate${results.length === 1 ? "" : "s"} in the atlas`;
  ui.resultsMeta.textContent = `Starter slate updated ${snapshotDate}. Use bookmarks for a shortlist and compare mode for side-by-side review.`;

  if (!results.length) {
    ui.cardsGrid.innerHTML = `
      <article class="empty-state">
        No candidates match the current search. Try a broader term, clear a filter, or switch off bookmarks-only mode.
      </article>
    `;
    return;
  }

  ui.cardsGrid.innerHTML = results.map(renderCandidateCard).join("");
}

function renderCandidateCard(candidate) {
  const compared = state.compare.includes(candidate.id);
  const bookmarked = isBookmarked(candidate.id);
  const spotlight = state.spotlight === candidate.id;

  return `
    <article class="candidate-card ${compared ? "is-compared" : ""} ${spotlight ? "is-spotlight" : ""}">
      <div class="candidate-top">
        <div class="candidate-avatar" aria-hidden="true">${initials(candidate.name)}</div>
        <div>
          <span class="party-pill ${candidate.party.toLowerCase()}">${candidate.party}</span>
          <h3>${candidate.name}</h3>
          <p class="candidate-subhead">${candidate.designation}</p>
        </div>
      </div>

      <div class="candidate-meta">
        <span><strong>Lane:</strong> ${candidate.lane}</span>
        <span><strong>Compare:</strong> ${compared ? "Selected" : "Available"}</span>
      </div>

      <div class="lane-card">
        <span class="eyebrow">Campaign summary</span>
        <strong>${candidate.summary}</strong>
      </div>

      <div class="tag-row">
        ${candidate.tags.map((tag) => `<span class="issue-tag">${tag}</span>`).join("")}
      </div>

      <div class="signature-card">
        <span class="eyebrow">Signature proposals</span>
        <div class="policy-snippets">
          ${candidate.signatures.map((item) => `<p>${item}</p>`).join("")}
        </div>
      </div>

      <div class="source-card">
        <span class="eyebrow">Source material</span>
        <div class="material-links">
          ${candidate.materials
            .map(
              (source) => `
                <a class="material-link" href="${source.url}" target="_blank" rel="noreferrer">
                  ${source.label}
                  <span class="source-type">${source.type}</span>
                </a>
              `
            )
            .join("")}
        </div>
      </div>

      <div class="card-actions">
        <button class="action-pill ${spotlight ? "is-active" : ""}" type="button" data-action="spotlight" data-id="${candidate.id}">
          Open profile
        </button>
        <button class="action-pill ${compared ? "is-active" : ""}" type="button" data-action="compare" data-id="${candidate.id}">
          ${compared ? "Remove compare" : "Add to compare"}
        </button>
        <button class="bookmark-chip ${bookmarked ? "is-active" : ""}" type="button" data-action="bookmark" data-id="${candidate.id}">
          ${bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
    </article>
  `;
}

function renderSpotlight() {
  const candidate = getCandidate(state.spotlight) || getFilteredCandidates()[0] || candidates[0];
  state.spotlight = candidate.id;
  const compared = state.compare.includes(candidate.id);
  const bookmarked = isBookmarked(candidate.id);

  ui.spotlightPanel.classList.toggle("is-compared", compared);
  ui.spotlightPanel.innerHTML = `
    <div class="spotlight-top">
      <div class="candidate-avatar" aria-hidden="true">${initials(candidate.name)}</div>
      <div>
        <p class="eyebrow">Spotlight profile</p>
        <h2>${candidate.name}</h2>
        <p class="spotlight-subhead">${candidate.designation}</p>
      </div>
    </div>

    <div class="spotlight-meta">
      <span><strong>Party:</strong> ${candidate.party}</span>
      <span><strong>Lane:</strong> ${candidate.lane}</span>
      <span><strong>Snapshot:</strong> ${snapshotDate}</span>
    </div>

    <p>${candidate.summary}</p>

    <div class="spotlight-actions">
      <button class="action-pill ${compared ? "is-active" : ""}" type="button" data-action="compare" data-id="${candidate.id}">
        ${compared ? "Remove from compare" : "Add to compare"}
      </button>
      <button class="bookmark-chip ${bookmarked ? "is-active" : ""}" type="button" data-action="bookmark" data-id="${candidate.id}">
        ${bookmarked ? "Bookmarked" : "Bookmark"}
      </button>
    </div>

    <section class="spotlight-section">
      <span class="eyebrow">Signature proposals</span>
      <div class="spotlight-signatures">
        ${candidate.signatures.map((item) => `<span class="signature-pill">${item}</span>`).join("")}
      </div>
    </section>

    <section class="spotlight-section">
      <span class="eyebrow">Comparison profile</span>
      <div class="spotlight-grid">
        ${renderSpotlightIssue("Affordability", candidate.comparison.affordability)}
        ${renderSpotlightIssue("Housing", candidate.comparison.housing)}
        ${renderSpotlightIssue("Energy and climate", candidate.comparison.energy)}
        ${renderSpotlightIssue("Safety, rights, and social policy", `${candidate.comparison.safety} ${candidate.comparison.social}`)}
        ${renderSpotlightIssue("Governing pitch", candidate.comparison.governance)}
      </div>
    </section>

    <section class="spotlight-section">
      <span class="eyebrow">Official source links</span>
      <div class="material-links">
        ${candidate.materials
          .map(
            (source) => `
              <a class="material-link" href="${source.url}" target="_blank" rel="noreferrer">
                ${source.label}
                <span class="source-type">${source.type}</span>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSpotlightIssue(label, copy) {
  return `
    <article class="spotlight-issue">
      <strong>${label}</strong>
      <p>${copy}</p>
    </article>
  `;
}

function renderCompare() {
  const selected = state.compare.map(getCandidate).filter(Boolean);

  ui.comparePills.innerHTML = selected.length
    ? selected
        .map(
          (candidate) => `
            <span class="compare-pill">
              ${candidate.name}
              <button class="remove-pill" type="button" data-action="remove-compare" data-id="${candidate.id}" aria-label="Remove ${candidate.name} from compare">
                Remove
              </button>
            </span>
          `
        )
        .join("")
    : `<span class="empty-state">Select up to ${maxCompare} candidates to start comparing.</span>`;

  ui.compareSummary.innerHTML = renderCompareSummary(selected);
  ui.issueMap.innerHTML = renderIssueMap(selected);
  ui.compareTable.innerHTML = renderCompareTable(selected);
}

function renderCompareSummary(selected) {
  if (selected.length < 2) {
    return `
      <h3>Compare summary</h3>
      <p>Add at least two candidates to generate a structured comparison.</p>
    `;
  }

  const shared = getSharedTags(selected);
  const partyMix =
    new Set(selected.map((candidate) => candidate.party)).size > 1
      ? "This set crosses party lines, so the clearest differences are about taxes, regulation, immigration, and the role of state government."
      : "This set stays within one party, so the clearest differences are about governing style, delivery strategy, and emphasis."
  ;

  return `
    <h3>Compare summary</h3>
    <p>Shared ground: ${shared.length ? shared.join(", ") : "no single issue overlaps across every selected campaign"}.</p>
    <p>${partyMix}</p>
    <div class="summary-points">
      ${selected.map((candidate) => `<p><strong>${candidate.name}:</strong> ${candidate.signatures[0]}</p>`).join("")}
    </div>
  `;
}

function renderIssueMap(selected) {
  if (!selected.length) {
    return `
      <h3>Issue overlap</h3>
      <p>Select candidates to see where their issue lanes cluster.</p>
    `;
  }

  const counts = countIssues(selected);
  const rows = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([issue, count]) => {
      const width = Math.max(8, (count / selected.length) * 100);
      return `
        <div class="map-row">
          <div>
            <div class="table-label">${issue}</div>
            <div class="map-track"><div class="map-fill" style="width:${width}%"></div></div>
          </div>
          <strong>${count}/${selected.length}</strong>
        </div>
      `;
    })
    .join("");

  return `
    <h3>Issue overlap</h3>
    <div class="issue-map-list">${rows}</div>
  `;
}

function renderCompareTable(selected) {
  if (!selected.length) {
    return "";
  }

  const rows = [
    { label: "Ballot designation", value: (candidate) => candidate.designation },
    { label: "Campaign lane", value: (candidate) => candidate.lane },
    { label: "Affordability", value: (candidate) => candidate.comparison.affordability },
    { label: "Housing", value: (candidate) => candidate.comparison.housing },
    { label: "Energy and climate", value: (candidate) => candidate.comparison.energy },
    { label: "Safety and immigration", value: (candidate) => candidate.comparison.safety },
    { label: "Health, education, and families", value: (candidate) => candidate.comparison.social },
    { label: "Governing pitch", value: (candidate) => candidate.comparison.governance },
    {
      label: "Source material",
      value: (candidate) => `
        <div class="compare-links">
          ${candidate.materials
            .map((source) => `<a href="${source.url}" target="_blank" rel="noreferrer">${source.label}</a>`)
            .join("")}
        </div>
      `
    }
  ];

  return `
    <table class="compare-table">
      <thead>
        <tr>
          <th scope="col">Category</th>
          ${selected
            .map(
              (candidate) => `
                <th scope="col">
                  ${candidate.name}
                  <div class="chip-type">${candidate.party}</div>
                </th>
              `
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td><span class="table-label">${row.label}</span></td>
                ${selected
                  .map(
                    (candidate) => `
                      <td>
                        <div class="compare-cell">
                          ${row.label === "Source material" ? row.value(candidate) : `<p>${row.value(candidate)}</p>`}
                        </div>
                      </td>
                    `
                  )
                  .join("")}
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function getFilteredCandidates() {
  const queryTerms = normalizeText(state.query).split(/\s+/).filter(Boolean);

  const filtered = candidates.filter((candidate) => {
    if (state.party !== "all" && candidate.party !== state.party) {
      return false;
    }
    if (state.bookmarksOnly && !isBookmarked(candidate.id)) {
      return false;
    }
    if (state.issues.length && !state.issues.every((issue) => candidate.tags.includes(issue))) {
      return false;
    }
    if (queryTerms.length) {
      const haystack = normalizeText(searchText(candidate));
      return queryTerms.every((term) => haystack.includes(term));
    }
    return true;
  });

  return sortCandidates(filtered);
}

function sortCandidates(list) {
  const next = [...list];
  if (state.sort === "alphabetical") {
    return next.sort((left, right) => left.name.localeCompare(right.name));
  }
  if (state.sort === "party") {
    return next.sort((left, right) => {
      const partyCompare = left.party.localeCompare(right.party);
      return partyCompare || left.name.localeCompare(right.name);
    });
  }
  return next.sort((left, right) => left.order - right.order);
}

function searchText(candidate) {
  return [
    candidate.name,
    candidate.party,
    candidate.designation,
    candidate.lane,
    candidate.summary,
    ...candidate.tags,
    ...candidate.signatures,
    ...Object.values(candidate.comparison),
    ...candidate.materials.map((source) => `${source.label} ${source.type}`)
  ].join(" ");
}

function getSharedTags(selected) {
  if (!selected.length) {
    return [];
  }
  return selected[0].tags.filter((tag) => selected.every((candidate) => candidate.tags.includes(tag)));
}

function countIssues(list) {
  const counts = new Map();
  for (const candidate of list) {
    for (const issue of candidate.tags) {
      counts.set(issue, (counts.get(issue) || 0) + 1);
    }
  }
  return counts;
}

function toggleIssue(issue) {
  if (!isKnownIssue(issue)) {
    return;
  }
  if (state.issues.includes(issue)) {
    state.issues = state.issues.filter((value) => value !== issue);
  } else {
    state.issues = [...state.issues, issue];
  }
}

function toggleBookmark(id) {
  if (isBookmarked(id)) {
    state.bookmarks = state.bookmarks.filter((candidateId) => candidateId !== id);
  } else {
    state.bookmarks = [...state.bookmarks, id];
  }
}

function toggleCompare(id) {
  if (state.compare.includes(id)) {
    state.compare = state.compare.filter((candidateId) => candidateId !== id);
    return;
  }
  if (state.compare.length >= maxCompare) {
    setStatus(`Compare mode is full. Remove someone first to stay within ${maxCompare} candidates.`);
    return;
  }
  state.compare = [...state.compare, id];
  setStatus(`${getCandidate(id).name} added to compare.`);
}

function buildCompareBrief() {
  const selected = state.compare.map(getCandidate).filter(Boolean);
  if (selected.length < 2) {
    return "";
  }

  const shared = getSharedTags(selected);
  return [
    "Golden State Voter Atlas compare brief",
    `Snapshot: ${snapshotDate}`,
    `Candidates: ${selected.map((candidate) => `${candidate.name} (${candidate.party})`).join(", ")}`,
    `Shared issue lanes: ${shared.length ? shared.join(", ") : "No single issue overlaps across all selected candidates."}`,
    "",
    ...selected.map(
      (candidate) =>
        `${candidate.name}: ${candidate.signatures[0]} | ${candidate.signatures[1]} | ${candidate.signatures[2]}`
    ),
    "",
    `Certified list: ${ballotSourceUrl}`,
    `State voter guide: ${voterGuideUrl}`,
    `Certification notice: ${certificationUrl}`
  ].join("\n");
}

function setStatus(message) {
  ui.statusMessage.textContent = message;
}

function hasCandidate(id) {
  return candidates.some((candidate) => candidate.id === id);
}

function getCandidate(id) {
  return candidates.find((candidate) => candidate.id === id) || null;
}

function isBookmarked(id) {
  return state.bookmarks.includes(id);
}

function isKnownIssue(issue) {
  return issueOrder.includes(issue);
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function copyText(text) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

init();
