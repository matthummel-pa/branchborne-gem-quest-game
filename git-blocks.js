/**
 * Branchborne Gem Quest — Bejeweled-style match-3 with Gems of War flavor and WoW-like side quests.
 * Match tech gems, complete pathway quests to Senior / class Expert, collect trophies & loot.
 * Works in the browser (canvas player) and in Node (engine unit tests).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.GitBlocks = api;
  root.Branchborne = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function securityApi() {
    return typeof globalThis !== "undefined" ? globalThis.BranchborneSecurity : null;
  }

  function escapeHtml(value) {
    const api = securityApi();
    if (api && api.escapeHtml) return api.escapeHtml(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeRecordId(value) {
    const api = securityApi();
    if (api && api.safeRecordId) return api.safeRecordId(value);
    const text = String(value || "");
    return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(text) ? text : "";
  }

  function plainLabel(value, max) {
    const api = securityApi();
    if (api && api.plainLabel) return api.plainLabel(value, max);
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001F\u007F<>]/g, "")
      .trim()
      .slice(0, max == null ? 80 : max);
  }

  function safeHex(value, fallback) {
    const api = securityApi();
    if (api && api.safeHex) return api.safeHex(value, fallback);
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value || "") ? value : fallback;
  }

  function safeToken(value, allowed, fallback) {
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function isPlayerUuid(value) {
    const api = securityApi();
    if (api && api.isUuid) return api.isUuid(value);
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  function playerStorageKey(base, userId) {
    const api = securityApi();
    if (api && api.storageKey) return api.storageKey(base, userId);
    if (isPlayerUuid(userId)) return `${base}:u:${String(userId).toLowerCase()}`;
    return `${base}:guest`;
  }

  const SIZE = 8;
  const COLS = SIZE;
  const ROWS = SIZE;
  const MATCH_MIN = 3;
  const GAME_TITLE = "Branchborne Gem Quest";

  /** Shiny tech logo gems (stylized marks — not official trademarks). */
  const GEMS = [
    { id: "html", label: "HTML", color: "#e34c26", accent: "#ff7a4d", ink: "#ffffff", mark: "html" },
    { id: "css", label: "CSS", color: "#264de4", accent: "#5b8cff", ink: "#ffffff", mark: "css" },
    { id: "js", label: "JS", color: "#f0db4f", accent: "#fff3a0", ink: "#1a1a1a", mark: "js" },
    { id: "ts", label: "TS", color: "#3178c6", accent: "#6aa8e8", ink: "#ffffff", mark: "ts" },
    { id: "react", label: "React", color: "#61dafb", accent: "#b6f0ff", ink: "#0b1220", mark: "react" },
    { id: "vue", label: "Vue", color: "#42b883", accent: "#7ee2b0", ink: "#0b1220", mark: "vue" },
    { id: "php", label: "PHP", color: "#777bb4", accent: "#a8abe0", ink: "#ffffff", mark: "php" },
    { id: "wp", label: "WP", color: "#21759b", accent: "#4fa8ce", ink: "#ffffff", mark: "wp" },
    { id: "git", label: "Git", color: "#f05032", accent: "#ff8a6e", ink: "#ffffff", mark: "git" },
    { id: "node", label: "Node", color: "#339933", accent: "#6dcf6d", ink: "#ffffff", mark: "node" },
    { id: "npm", label: "npm", color: "#cb3837", accent: "#f06a68", ink: "#ffffff", mark: "npm" },
    { id: "python", label: "Py", color: "#3776ab", accent: "#ffd343", ink: "#ffffff", mark: "python" },
    { id: "docker", label: "Dock", color: "#2496ed", accent: "#7ec8ff", ink: "#ffffff", mark: "docker" },
    { id: "sql", label: "SQL", color: "#e38c00", accent: "#ffc45c", ink: "#1a1a1a", mark: "sql" },
  ];

  const GEM_IDS = GEMS.map((g) => g.id);
  const META = Object.fromEntries(GEMS.map((g) => [g.id, g]));

  /**
   * Learning path: beginner → senior developer.
   * Each level unlocks an RPG-style skill, themed cloud words, and lesson facts.
   */
  const CURRICULUM = [
    {
      id: "html-bones",
      title: "HTML bones",
      track: "Junior",
      rank: "Intern",
      skill: { id: "markup", name: "Markup Adept", icon: "</>", blurb: "Structure the page with semantic HTML." },
      clouds: ["<!DOCTYPE>", "<html>", "<head>", "<body>", "<h1>", "<p>", "<a>", "semantic", "alt text", "section"],
      facts: [
        "HTML is the skeleton of every webpage — tags describe meaning, not looks.",
        "Prefer semantic tags like <main> and <nav> over endless <div> soup.",
        "Every image needs an alt attribute so assistive tech can describe it.",
      ],
    },
    {
      id: "css-paint",
      title: "CSS paint",
      track: "Junior",
      rank: "Apprentice",
      skill: { id: "styling", name: "Style Caster", icon: "#", blurb: "Paint the UI with selectors and the cascade." },
      clouds: ["color", "font-size", "margin", "padding", "border", "class", "id", "cascade", ":hover", "specificity"],
      facts: [
        "CSS stands for Cascading Style Sheets — later rules can override earlier ones.",
        "Classes (.btn) are reusable; IDs (#hero) should be unique on a page.",
        "The box model is content → padding → border → margin.",
      ],
    },
    {
      id: "layout-lab",
      title: "Layout lab",
      track: "Junior",
      rank: "Apprentice",
      skill: { id: "layout", name: "Flex Sensei", icon: "▦", blurb: "Arrange space with Flexbox and Grid." },
      clouds: ["display:flex", "justify-content", "align-items", "gap", "grid", "fr", "minmax()", "auto-fit", "container", "position"],
      facts: [
        "Flexbox is one-dimensional (row or column); Grid is two-dimensional.",
        "gap replaces most margin hacks between siblings.",
        "Use fr units in Grid to share leftover space fairly.",
      ],
    },
    {
      id: "responsive",
      title: "Responsive craft",
      track: "Junior",
      rank: "Padawan",
      skill: { id: "responsive", name: "Viewport Ranger", icon: "⧉", blurb: "Design fluid layouts for every screen." },
      clouds: ["@media", "min-width", "clamp()", "rem", "vw", "mobile-first", "breakpoint", "fluid", "srcset", "aspect-ratio"],
      facts: [
        "Mobile-first CSS starts simple, then adds @media for larger screens.",
        "rem sizes scale with the root font size — friendlier for a11y.",
        "clamp(min, preferred, max) is a one-line fluid type trick.",
      ],
    },
    {
      id: "js-spark",
      title: "JS spark",
      track: "Junior",
      rank: "Padawan",
      skill: { id: "js-basics", name: "Script Starter", icon: "JS", blurb: "Speak the language of the browser." },
      clouds: ["const", "let", "function", "=>", "array", "object", "if/else", "for", "typeof", "truthy"],
      facts: [
        "Prefer const; use let when a value must change. Avoid var in modern code.",
        "=== checks value and type; == can coerce unexpectedly.",
        "Arrays and objects are reference types — copying needs care.",
      ],
    },
    {
      id: "dom-events",
      title: "DOM & events",
      track: "Junior",
      rank: "Contributor",
      skill: { id: "dom", name: "DOM Whisperer", icon: "⚡", blurb: "Listen, update, and react to the page." },
      clouds: ["querySelector", "addEventListener", "click", "preventDefault", "dataset", "classList", "textContent", "createElement", "bubbling", "delegation"],
      facts: [
        "The DOM is the live tree the browser builds from your HTML.",
        "Event delegation: listen on a parent, handle many children.",
        "prefer textContent over innerHTML when inserting plain text.",
      ],
    },
    {
      id: "git-flow",
      title: "Git flow",
      track: "Junior",
      rank: "Contributor",
      skill: { id: "git", name: "Commit Keeper", icon: "⌥", blurb: "Version history without fear." },
      clouds: ["git init", "git status", "git add", "git commit", "branch", "merge", "pull", "push", "diff", "PR"],
      facts: [
        "Commits are snapshots — write messages that explain why, not only what.",
        "Branches let you experiment without breaking main.",
        "A pull request is a reviewable proposal to merge your work.",
      ],
    },
    {
      id: "tooling",
      title: "Tooling & npm",
      track: "Mid",
      rank: "Engineer",
      skill: { id: "tooling", name: "Package Pilot", icon: "npm", blurb: "Install, script, and ship with confidence." },
      clouds: ["package.json", "npm install", "npx", "scripts", "devDep", "lockfile", "vite", "bundler", "lint", "format"],
      facts: [
        "package.json lists dependencies and npm scripts for your project.",
        "Lockfiles keep installs reproducible across machines.",
        "Separate dependencies (runtime) from devDependencies (build/test).",
      ],
    },
    {
      id: "a11y",
      title: "Accessibility",
      track: "Mid",
      rank: "Engineer",
      skill: { id: "a11y", name: "A11y Guardian", icon: "♿", blurb: "Build for every human, not every mouse." },
      clouds: ["aria-label", "role", "focus", "tabindex", "contrast", "screen reader", "keyboard", "landmark", "WCAG", "skip link"],
      facts: [
        "If it works with keyboard alone, you’re halfway to solid a11y.",
        "Color contrast isn’t decoration — it’s readability.",
        "ARIA should enhance semantics, not replace good HTML.",
      ],
    },
    {
      id: "typescript",
      title: "TypeScript",
      track: "Mid",
      rank: "Engineer",
      skill: { id: "types", name: "Type Warden", icon: "TS", blurb: "Catch bugs before they ship." },
      clouds: ["interface", "type", "generic", "union", "optional?", "strict", "unknown", "as const", "enum", "infer"],
      facts: [
        "TypeScript adds static types that erase to plain JavaScript at build time.",
        "Start with strict mode — it teaches better habits early.",
        "unknown is safer than any when you truly don’t know yet.",
      ],
    },
    {
      id: "react-ui",
      title: "React components",
      track: "Mid",
      rank: "Builder",
      skill: { id: "react", name: "Component Crafter", icon: "⚛", blurb: "Compose UI from reusable pieces." },
      clouds: ["JSX", "props", "component", "children", "key", "Fragment", "composition", "pure", "render", "tree"],
      facts: [
        "Components are functions that return UI descriptions (JSX).",
        "Props flow down; events bubble intent back up.",
        "Stable keys help React reconcile lists without thrashing.",
      ],
    },
    {
      id: "hooks-state",
      title: "State & hooks",
      track: "Mid",
      rank: "Builder",
      skill: { id: "hooks", name: "State Alchemist", icon: "Σ", blurb: "Manage change without losing clarity." },
      clouds: ["useState", "useEffect", "useRef", "useMemo", "dependency", "stale closure", "derived state", "reducer", "context", "batching"],
      facts: [
        "useState holds values that should re-render the UI when they change.",
        "useEffect runs after paint — declare every dependency you read.",
        "Prefer deriving values over mirroring props into state.",
      ],
    },
    {
      id: "php-wp",
      title: "PHP & WordPress",
      track: "Mid",
      rank: "Specialist",
      skill: { id: "wordpress", name: "CMS Artisan", icon: "W", blurb: "Server-render and extend WordPress safely." },
      clouds: ["<?php", "functions.php", "hook", "add_action", "WP_Query", "the_content", "template", "nonce", "sanitize", "escape"],
      facts: [
        "WordPress plugins hang behavior on hooks (actions & filters).",
        "Escape on output, sanitize on input — never trust raw request data.",
        "Themes control presentation; plugins should own features.",
      ],
    },
    {
      id: "apis",
      title: "APIs & data",
      track: "Mid",
      rank: "Specialist",
      skill: { id: "api", name: "Fetch Ranger", icon: "{}", blurb: "Talk to services over HTTP with care." },
      clouds: ["fetch", "JSON", "REST", "GET", "POST", "status", "async/await", "CORS", "GraphQL", "cache"],
      facts: [
        "HTTP status codes tell stories: 2xx ok, 4xx your fault, 5xx theirs.",
        "async/await is syntactic sugar over Promises — still handle errors.",
        "Never put secrets in frontend code; the browser is public.",
      ],
    },
    {
      id: "testing",
      title: "Testing craft",
      track: "Senior track",
      rank: "Lead-path",
      skill: { id: "testing", name: "Spec Sentinel", icon: "✓", blurb: "Prove behavior before users find bugs." },
      clouds: ["unit test", "integration", "e2e", "assert", "mock", "fixture", "coverage", "regression", "CI", "TDD"],
      facts: [
        "Tests document intent — write the name like a sentence.",
        "Mock at boundaries; don’t mock the thing you’re testing.",
        "A red test that fails for the right reason is a gift.",
      ],
    },
    {
      id: "performance",
      title: "Performance",
      track: "Senior track",
      rank: "Lead-path",
      skill: { id: "perf", name: "Perf Pathfinder", icon: "⏱", blurb: "Ship fast experiences on slow networks." },
      clouds: ["LCP", "CLS", "INP", "lazy-load", "code-split", "cache", "CDN", "bundle size", "waterfall", "profile"],
      facts: [
        "Core Web Vitals measure real user experience, not just lab scores.",
        "The fastest request is the one you never make.",
        "Measure before optimizing — profiles beat hunches.",
      ],
    },
    {
      id: "security",
      title: "Web security",
      track: "Senior track",
      rank: "Guardian",
      skill: { id: "security", name: "Threat Shield", icon: "⌁", blurb: "Defend users from the obvious attacks." },
      clouds: ["XSS", "CSRF", "HTTPS", "CSP", "auth", "hash", "salt", "JWT", "owasp", "escape"],
      facts: [
        "XSS injects hostile scripts — treat all user input as untrusted.",
        "HTTPS encrypts traffic so eavesdroppers can’t casually read it.",
        "Least privilege: accounts and tokens should only do what they need.",
      ],
    },
    {
      id: "architecture",
      title: "Architecture",
      track: "Senior",
      rank: "Architect",
      skill: { id: "architecture", name: "System Cartographer", icon: "⬡", blurb: "Design boundaries that survive change." },
      clouds: ["module", "boundary", "coupling", "cohesion", "ADR", "event", "queue", "idempotent", "SLA", "observability"],
      facts: [
        "Good architecture makes the common change easy and the rare change possible.",
        "Coupling is the cost of a shortcut you’ll pay later.",
        "Write ADRs for decisions your future team will debate.",
      ],
    },
    {
      id: "leadership",
      title: "Tech leadership",
      track: "Senior",
      rank: "Staff-path",
      skill: { id: "leadership", name: "Mentor Beacon", icon: "★", blurb: "Raise the team’s ceiling, not just your own." },
      clouds: ["code review", "RFC", "pairing", "mentorship", "roadmap", "tradeoff", "scope", "comms", "incident", "retro"],
      facts: [
        "Senior means multiplying others — reviews, docs, and calm incidents.",
        "Say the tradeoff out loud: speed, quality, or scope — pick two for now.",
        "Retros without blame turn outages into institutional memory.",
      ],
    },
    {
      id: "senior",
      title: "Senior developer",
      track: "Senior",
      rank: "Senior Dev",
      skill: { id: "senior", name: "Senior Sigil", icon: "◆", blurb: "You ship judgment, not just features." },
      clouds: ["ownership", "clarity", "judgment", "impact", "craft", "reliability", "empathy", "systems", "legacy", "ship"],
      facts: [
        "A senior developer reduces ambiguity for everyone around them.",
        "You optimize for long-term leverage: tools, people, and platforms.",
        "Graduation unlocked — keep learning; the web never stands still.",
      ],
    },
  ];

  /**
   * Pathway classes — Gems of War–style heroes. Each biases gems, clouds, curriculum, and powers.
   */
  const PATHWAY_CLASSES = [
    {
      id: "frontend",
      name: "Frontend Mage",
      role: "UI spellcaster",
      blurb: "Paint interfaces, tame the DOM, and ship delightful client craft.",
      accent: "#61dafb",
      secondary: "#264de4",
      ink: "#07111f",
      backdrop:
        "radial-gradient(900px 420px at 12% -10%, rgba(97,218,251,0.28), transparent 55%), radial-gradient(700px 380px at 100% 0%, rgba(38,77,228,0.45), transparent 50%), #071428",
      pattern: "orbit",
      affinity: ["html", "css", "js", "ts", "react", "vue"],
      clouds: ["flex", "grid", "jsx", "hooks", "a11y", "pixels", "cascade", "viewport", "component", "UI"],
      power: {
        id: "ui-burst",
        name: "Style Nova",
        blurb: "Mage spell — detonate one affinity gem type across the board.",
      },
      character: {
        glyph: "⚛",
        title: "Mage",
        idle: "float",
        silhouette: "mage",
        colors: ["#61dafb", "#5b8cff", "#b6f0ff"],
      },
      lessonIds: [
        "html-bones",
        "css-paint",
        "layout-lab",
        "responsive",
        "js-spark",
        "dom-events",
        "a11y",
        "typescript",
        "react-ui",
        "hooks-state",
        "tooling",
        "git-flow",
        "testing",
        "performance",
        "security",
        "architecture",
        "leadership",
        "senior",
      ],
    },
    {
      id: "backend",
      name: "Backend Sentinel",
      role: "Server guardian",
      blurb: "APIs, Node, PHP, and data contracts — hold the line behind the request.",
      accent: "#339933",
      secondary: "#777bb4",
      ink: "#06140c",
      backdrop:
        "radial-gradient(880px 400px at 8% -8%, rgba(51,153,51,0.3), transparent 55%), radial-gradient(640px 360px at 100% 8%, rgba(119,123,180,0.4), transparent 48%), #06140c",
      pattern: "drift",
      affinity: ["node", "php", "js", "ts", "npm", "git", "python", "docker", "sql"],
      clouds: ["async", "REST", "JSON", "queue", "SQL", "auth", "schema", "cache", "worker", "API"],
      power: {
        id: "query-storm",
        name: "Query Storm",
        blurb: "Sentinel protocol — +4 moves and double LOC on the next cascade.",
      },
      character: {
        glyph: "{}",
        title: "Sentinel",
        idle: "pulse",
        silhouette: "sentinel",
        colors: ["#339933", "#6dcf6d", "#777bb4"],
      },
      lessonIds: [
        "js-spark",
        "git-flow",
        "tooling",
        "php-wp",
        "apis",
        "typescript",
        "testing",
        "security",
        "performance",
        "architecture",
        "html-bones",
        "dom-events",
        "a11y",
        "leadership",
        "senior",
      ],
    },
    {
      id: "wordpress",
      name: "WordPress Artisan",
      role: "CMS craftsperson",
      blurb: "Themes, hooks, and safe PHP — sculpt the content platform.",
      accent: "#21759b",
      secondary: "#e34c26",
      ink: "#071820",
      backdrop:
        "radial-gradient(900px 420px at 10% -6%, rgba(33,117,155,0.35), transparent 55%), radial-gradient(680px 340px at 95% 0%, rgba(227,76,38,0.28), transparent 50%), #071820",
      pattern: "sway",
      affinity: ["wp", "php", "html", "css", "js", "git", "sql"],
      clouds: ["hook", "filter", "theme", "plugin", "WP_Query", "nonce", "escape", "block", "template", "CMS"],
      power: {
        id: "hook-cascade",
        name: "Hook Cascade",
        blurb: "Artisan craft — fire every hook: reshuffle and refill hints & shuffles.",
      },
      character: {
        glyph: "W",
        title: "Artisan",
        idle: "bob",
        silhouette: "artisan",
        colors: ["#21759b", "#4fa8ce", "#e34c26"],
      },
      lessonIds: [
        "html-bones",
        "css-paint",
        "php-wp",
        "js-spark",
        "dom-events",
        "git-flow",
        "a11y",
        "apis",
        "security",
        "tooling",
        "testing",
        "performance",
        "architecture",
        "leadership",
        "senior",
      ],
    },
    {
      id: "fullstack",
      name: "Full-Stack Ranger",
      role: "Polyglot scout",
      blurb: "Cross the whole stack — every gem is a tool in your kit.",
      accent: "#f0db4f",
      secondary: "#f05032",
      ink: "#141008",
      backdrop:
        "radial-gradient(920px 430px at 14% -10%, rgba(240,219,79,0.22), transparent 55%), radial-gradient(700px 360px at 100% 0%, rgba(240,80,50,0.32), transparent 48%), #141008",
      pattern: "drift",
      affinity: ["html", "css", "js", "node", "git", "react", "php", "npm", "vue", "python", "docker"],
      clouds: ["ship", "PR", "fullstack", "deploy", "feature", "debug", "scope", "tradeoff", "release", "craft"],
      power: {
        id: "polyglot-pulse",
        name: "Polyglot Pulse",
        blurb: "Ranger surge — convert your combo into a burst of shipped LOC.",
      },
      character: {
        glyph: "◆",
        title: "Ranger",
        idle: "stride",
        silhouette: "ranger",
        colors: ["#f0db4f", "#f05032", "#339933"],
      },
      lessonIds: CURRICULUM.map((l) => l.id),
    },
  ];

  const PATHWAY_BY_ID = Object.fromEntries(PATHWAY_CLASSES.map((p) => [p.id, p]));

  /**
   * Cartoon chibi heroes for pathway select + sidebar. Pure SVG so every class
   * animates like a little RPG sprite without external assets.
   */
  function cartoonCharacterMarkup(silhouette, colors, idle) {
    const c = colors || ["#4f8fd4", "#0d2e57", "#9ec8ef"];
    const primary = safeHex(c[0], "#4f8fd4");
    const secondary = safeHex(c[1] || c[0], "#0d2e57");
    const accent = safeHex(c[2] || "#fff6c8", "#fff6c8");
    const kind = safeToken(silhouette, ["mage", "sentinel", "artisan", "ranger", "classic"], "ranger");
    const motion = safeToken(idle, ["float", "pulse", "bob", "stride"], "float");

    const faces = {
      mage: `
        <g class="chibi-hat">
          <path d="M20 26 C18 10 32 4 40 14 C46 8 54 16 48 26 Z" fill="${secondary}"/>
          <circle cx="42" cy="12" r="3.2" fill="${accent}"/>
          <path d="M22 26 H48 L46 30 H24 Z" fill="${primary}"/>
        </g>
        <g class="chibi-staff">
          <rect x="52" y="28" width="3" height="34" rx="1.5" fill="${accent}"/>
          <circle cx="53.5" cy="26" r="4.5" fill="${primary}" stroke="#fff" stroke-width="1"/>
          <path d="M51 24 L56 24 L53.5 20 Z" fill="${accent}"/>
        </g>
        <ellipse class="chibi-cape" cx="34" cy="52" rx="14" ry="10" fill="${secondary}" opacity="0.85"/>
        <circle class="chibi-head" cx="34" cy="34" r="10" fill="#ffd7b5"/>
        <g class="chibi-eyes"><circle cx="30.5" cy="33" r="1.4" fill="#1a1a2e"/><circle cx="37.5" cy="33" r="1.4" fill="#1a1a2e"/></g>
        <path class="chibi-smile" d="M31 38 Q34 41 37 38" fill="none" stroke="#c47a5a" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M26 44 Q34 48 42 44 L40 62 H28 Z" fill="${primary}"/>
        <g class="chibi-arms">
          <path d="M26 48 Q18 52 16 58" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M42 48 Q50 50 53 34" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
        </g>
        <g class="chibi-boots"><ellipse cx="30" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/><ellipse cx="38" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/></g>
      `,
      sentinel: `
        <ellipse class="chibi-cape" cx="34" cy="50" rx="15" ry="11" fill="${secondary}" opacity="0.55"/>
        <g class="chibi-shield">
          <path d="M10 36 L18 34 L20 54 L10 56 Z" fill="${accent}" stroke="${primary}" stroke-width="1.5"/>
          <text x="12.5" y="48" font-size="7" fill="${primary}" font-family="IBM Plex Mono,monospace">{ }</text>
        </g>
        <circle class="chibi-head" cx="36" cy="30" r="10" fill="#ffd7b5"/>
        <path d="M26 26 Q36 18 46 26 L44 30 H28 Z" fill="${primary}"/>
        <g class="chibi-eyes"><circle cx="32.5" cy="30" r="1.4" fill="#1a1a2e"/><circle cx="39.5" cy="30" r="1.4" fill="#1a1a2e"/></g>
        <path class="chibi-smile" d="M33 35 Q36 37.5 39 35" fill="none" stroke="#c47a5a" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M26 40 Q36 44 46 40 L44 62 H28 Z" fill="${primary}"/>
        <rect x="28" y="46" width="16" height="8" rx="2" fill="${accent}" opacity="0.9"/>
        <g class="chibi-arms">
          <path d="M26 46 Q16 48 14 42" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M46 46 Q54 50 56 56" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
        </g>
        <g class="chibi-boots"><ellipse cx="31" cy="64" rx="4.2" ry="2.2" fill="#1a1a2e"/><ellipse cx="41" cy="64" rx="4.2" ry="2.2" fill="#1a1a2e"/></g>
      `,
      artisan: `
        <ellipse class="chibi-cape" cx="34" cy="52" rx="13" ry="9" fill="${secondary}" opacity="0.5"/>
        <g class="chibi-tool">
          <rect x="50" y="34" width="3" height="22" rx="1" fill="#c9a227"/>
          <path d="M48 34 H56 L53 28 Z" fill="${accent}"/>
        </g>
        <circle class="chibi-head" cx="34" cy="32" r="10" fill="#ffd7b5"/>
        <path d="M24 30 Q34 22 44 30" fill="none" stroke="#3a2a1a" stroke-width="3" stroke-linecap="round"/>
        <g class="chibi-eyes"><circle cx="30.5" cy="32" r="1.4" fill="#1a1a2e"/><circle cx="37.5" cy="32" r="1.4" fill="#1a1a2e"/></g>
        <path class="chibi-smile" d="M31 37 Q34 39.5 37 37" fill="none" stroke="#c47a5a" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M25 42 Q34 46 43 42 L41 62 H27 Z" fill="${primary}"/>
        <circle cx="34" cy="52" r="6" fill="#fff" opacity="0.92"/>
        <text x="30.2" y="55.2" font-size="9" font-weight="700" fill="${primary}" font-family="IBM Plex Sans,sans-serif">W</text>
        <g class="chibi-arms">
          <path d="M25 48 Q18 54 16 58" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M43 48 Q50 50 52 36" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
        </g>
        <g class="chibi-boots"><ellipse cx="30" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/><ellipse cx="38" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/></g>
      `,
      ranger: `
        <ellipse class="chibi-cape" cx="34" cy="50" rx="14" ry="11" fill="${secondary}" opacity="0.75"/>
        <circle class="chibi-head" cx="34" cy="30" r="10" fill="#ffd7b5"/>
        <path d="M24 28 Q34 18 44 28 L42 32 H26 Z" fill="${primary}"/>
        <g class="chibi-eyes"><circle cx="30.5" cy="30" r="1.4" fill="#1a1a2e"/><circle cx="37.5" cy="30" r="1.4" fill="#1a1a2e"/></g>
        <path class="chibi-smile" d="M31 35 Q34 38 37 35" fill="none" stroke="#c47a5a" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M26 40 Q34 45 42 40 L44 50 L34 58 L24 50 Z" fill="${accent}"/>
        <path d="M28 50 L34 62 L40 50" fill="${primary}"/>
        <g class="chibi-arms">
          <path d="M26 46 Q16 44 14 38" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M42 46 Q52 48 54 54" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
        </g>
        <g class="chibi-boots"><ellipse cx="30" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/><ellipse cx="38" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/></g>
        <g class="chibi-spark"><circle cx="14" cy="36" r="2" fill="${primary}"/><circle cx="54" cy="42" r="1.6" fill="${accent}"/></g>
      `,
      classic: `
        <ellipse class="chibi-cape" cx="34" cy="52" rx="13" ry="9" fill="${secondary}" opacity="0.45"/>
        <circle class="chibi-head" cx="34" cy="32" r="10" fill="#ffd7b5"/>
        <path d="M24 30 H44 L42 36 H26 Z" fill="${primary}"/>
        <g class="chibi-eyes"><circle cx="30.5" cy="33" r="1.4" fill="#1a1a2e"/><circle cx="37.5" cy="33" r="1.4" fill="#1a1a2e"/></g>
        <path class="chibi-smile" d="M31 38 Q34 40.5 37 38" fill="none" stroke="#c47a5a" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M26 42 Q34 47 42 42 L40 62 H28 Z" fill="${secondary}"/>
        <path d="M30 48 L34 40 L38 48 Z" fill="${accent}"/>
        <g class="chibi-arms">
          <path d="M26 48 Q18 52 20 58" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M42 48 Q50 52 48 58" fill="none" stroke="#ffd7b5" stroke-width="3.2" stroke-linecap="round"/>
        </g>
        <g class="chibi-boots"><ellipse cx="30" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/><ellipse cx="38" cy="64" rx="4" ry="2.2" fill="#1a1a2e"/></g>
      `,
    };

    const body = faces[kind] || faces.ranger;
    return `
      <span class="chibi chibi-${kind} idle-${motion}" aria-hidden="true">
        <span class="chibi-shadow"></span>
        <svg class="chibi-svg" viewBox="0 0 68 72" width="68" height="72" focusable="false">
          ${body}
        </svg>
        <span class="chibi-sparkle s1"></span>
        <span class="chibi-sparkle s2"></span>
        <span class="chibi-sparkle s3"></span>
      </span>
    `;
  }

  /** Post-senior raids — harder LOC goals, fewer moves, boss flavor. */
  const ENDGAME_CHALLENGES = [
    {
      id: "prod-outage",
      title: "Raid: Production Outage",
      track: "Endgame",
      rank: "On-call",
      skill: { id: "oncall", name: "Incident Commander", icon: "🚨", blurb: "Stabilize prod under pressure." },
      clouds: ["P0", "rollback", "hotifix", "pager", "SLO", "mitigate", "runbook", "status page"],
      facts: [
        "Stop the bleeding first — mitigate, then root-cause.",
        "Communicate early: users forgive outages faster than silence.",
        "A good rollback beats a heroic half-fix.",
      ],
      goal: 2200,
      moves: 18,
      bossHp: 2200,
    },
    {
      id: "legacy-refactor",
      title: "Raid: Legacy Refactor",
      track: "Endgame",
      rank: "Archaeologist",
      skill: { id: "legacy", name: "Code Archaeologist", icon: "⛏", blurb: "Rewrite without breaking the living system." },
      clouds: ["legacy", "strangler", "compat", "migrate", "debt", "shim", "feature flag", "parity"],
      facts: [
        "Leave the campsite cleaner — small safe steps beat big rewrites.",
        "Characterization tests lock behavior before you touch it.",
        "Feature flags let you ship dark and light up gradually.",
      ],
      goal: 2600,
      moves: 16,
      bossHp: 2600,
    },
    {
      id: "black-friday",
      title: "Raid: Traffic Spike",
      track: "Endgame",
      rank: "Scale Lead",
      skill: { id: "scale", name: "Scale Whisperer", icon: "📈", blurb: "Survive the surge without melting the stack." },
      clouds: ["CDN", "cache", "queue", "autoscale", "rate-limit", "load", "failover", "capacity"],
      facts: [
        "Cache what you can; queue what you must; shed what you cannot.",
        "Load tests before the sale beat apologies after it.",
        "Graceful degradation keeps the money path alive.",
      ],
      goal: 3000,
      moves: 14,
      bossHp: 3000,
    },
    {
      id: "security-siege",
      title: "Raid: Security Siege",
      track: "Endgame",
      rank: "Guardian",
      skill: { id: "siege", name: "Siege Breaker", icon: "🛡", blurb: "Hold the perimeter against hostile input." },
      clouds: ["XSS", "CSRF", "CSP", "pentest", "threat model", "patch", "secrets", "zero-trust"],
      facts: [
        "Assume breach — limit blast radius with least privilege.",
        "Patch windows matter more than perfect detection.",
        "Secrets in the client are already public.",
      ],
      goal: 3400,
      moves: 12,
      bossHp: 3400,
    },
  ];

  const ACHIEVEMENTS = [
    { id: "first-match", label: "First commit", test: (s) => s.matches >= 1 },
    { id: "cascade-3", label: "Cascade ×3", test: (s) => s.maxChain >= 3 },
    { id: "combo-5", label: "Combo ×5", test: (s) => s.maxCombo >= 5 },
    { id: "loc-500", label: "500 LOC", test: (s) => s.linesOfCode >= 500 },
    { id: "lesson-5", label: "Lesson 5", test: (s) => s.level >= 5 },
    { id: "four-line", label: "Quad match", test: (s) => s.quads >= 1 },
    { id: "skill-3", label: "3 skills", test: (s) => Object.keys(s.skills || {}).length >= 3 },
    { id: "senior-path", label: "Senior path", test: (s) => s.phase === "endgame" || s.graduated },
    { id: "mana-cast", label: "First cast", test: (s) => s.powersUsed >= 1 },
    { id: "raid-clear", label: "Raid clear", test: (s) => s.challengesCleared >= 1 },
    { id: "endgame-hero", label: "Endgame hero", test: (s) => s.challengesCleared >= ENDGAME_CHALLENGES.length },
    { id: "trophy-hunter", label: "Trophy hunter", test: (s) => Object.keys(s.trophies || {}).length >= 5 },
    { id: "loot-hoard", label: "Loot hoard", test: (s) => Object.keys(s.items || {}).length >= 6 },
    { id: "class-expert", label: "Class expert", test: (s) => s.classExpert },
  ];

  /** Trophy case — tech / web relics earned on the path. */
  const TROPHIES = [
    { id: "rubber-duck", name: "Rubber Duck", icon: "🦆", blurb: "Debugged out loud.", test: (s) => s.matches >= 3 },
    { id: "green-check", name: "Green Check", icon: "✓", blurb: "CI passed in spirit.", test: (s) => s.matches >= 10 },
    { id: "lighthouse", name: "Lighthouse 100", icon: "💡", blurb: "Perf path lit.", test: (s) => s.level >= 4 },
    { id: "a11y-medal", name: "A11y Medal", icon: "♿", blurb: "Inclusive craft.", test: (s) => s.level >= 6 },
    { id: "pr-stamp", name: "PR Stamp", icon: "📑", blurb: "Review-ready.", test: (s) => s.quads >= 2 },
    { id: "ship-bottle", name: "Ship in a Bottle", icon: "🚢", blurb: "Deploy calm.", test: (s) => s.maxChain >= 4 },
    { id: "type-shield", name: "Type Shield", icon: "🛡", blurb: "Strict mode forever.", test: (s) => s.level >= 8 },
    { id: "senior-crest", name: "Senior Crest", icon: "◆", blurb: "Path graduate.", test: (s) => s.graduated },
    { id: "raid-banner", name: "Raid Banner", icon: "🏳", blurb: "First raid cleared.", test: (s) => s.challengesCleared >= 1 },
    { id: "expert-sigil", name: "Expert Sigil", icon: "♛", blurb: "Class mastery.", test: (s) => s.classExpert },
  ];

  /** Collectible tech loot for the item board. */
  const LOOT_ITEMS = [
    { id: "mechanical-kb", name: "Mech Keyboard", icon: "⌨", blurb: "Clicky commits.", test: (s) => s.cleared >= 30 },
    { id: "dual-monitor", name: "Dual Monitor", icon: "🖥", blurb: "More surface area.", test: (s) => s.linesOfCode >= 800 },
    { id: "coffee-mug", name: "Deploy Mug", icon: "☕", blurb: "Fuel for refactors.", test: (s) => s.matches >= 5 },
    { id: "usb-stick", name: "USB Stick", icon: "💾", blurb: "Offline backup vibes.", test: (s) => s.maxCombo >= 4 },
    { id: "api-keycard", name: "API Keycard", icon: "🔑", blurb: "Auth secured.", test: (s) => s.level >= 7 },
    { id: "docker-whale", name: "Container Whale", icon: "🐳", blurb: "Ship anywhere.", test: (s) => s.level >= 9 },
    { id: "graphql-orb", name: "GraphQL Orb", icon: "◈", blurb: "Ask for exactly what you need.", test: (s) => s.powersUsed >= 2 },
    { id: "cdn-feather", name: "CDN Feather", icon: "🪶", blurb: "Edge-delivered.", test: (s) => s.linesOfCode >= 2000 },
    { id: "obs-totem", name: "Observability Totem", icon: "📡", blurb: "Metrics that matter.", test: (s) => s.challengesCleared >= 2 },
    { id: "legacy-amulet", name: "Legacy Amulet", icon: "🕯", blurb: "Refactor without fear.", test: (s) => s.classExpert },
  ];

  const LESSON_BY_ID = Object.fromEntries(CURRICULUM.map((l) => [l.id, l]));

  function pathwayFor(id) {
    return PATHWAY_BY_ID[id] || PATHWAY_CLASSES[PATHWAY_CLASSES.length - 1];
  }

  function pathwayLessons(pathwayId) {
    const path = pathwayFor(pathwayId);
    const lessons = (path.lessonIds || [])
      .map((lid) => LESSON_BY_ID[lid])
      .filter(Boolean);
    return lessons.length ? lessons : CURRICULUM.slice();
  }

  function lessonFor(level, pathwayId, phase, challengeIndex) {
    if (phase === "endgame") {
      const idx = Math.max(0, Math.min(ENDGAME_CHALLENGES.length - 1, challengeIndex || 0));
      return ENDGAME_CHALLENGES[idx];
    }
    const lessons = pathwayLessons(pathwayId);
    const idx = Math.max(0, Math.min(lessons.length - 1, (level || 1) - 1));
    return lessons[idx];
  }

  function sprintName(level, pathwayId) {
    return lessonFor(level, pathwayId).title;
  }

  function curriculumLength(pathwayId) {
    return pathwayLessons(pathwayId).length;
  }

  function goalForLevel(level, pathwayId, phase, challengeIndex) {
    if (phase === "endgame") {
      const challenge = lessonFor(level, pathwayId, "endgame", challengeIndex);
      return challenge.goal || 2200;
    }
    return 600 + (Math.max(1, level) - 1) * 350;
  }

  function movesForLevel(level, pathwayId, phase, challengeIndex) {
    if (phase === "endgame") {
      const challenge = lessonFor(level, pathwayId, "endgame", challengeIndex);
      return challenge.moves || 16;
    }
    // Continuous Bejeweled-style path: generous move pool that refills on quest clears.
    return Math.max(28, 48 - Math.min(10, level - 1));
  }

  function questTipFor(lesson, random) {
    const facts = (lesson && lesson.facts) || [];
    if (!facts.length) return "Match three or more identical tech gems. Cascades write more LOC.";
    const rnd = random || Math.random;
    return facts[Math.floor(rnd() * facts.length)];
  }

  function buildSideQuest(state, lesson, opts) {
    const o = opts || {};
    return {
      id: `${lesson.id || "quest"}-${state.level}-${state.phase}`,
      title: lesson.title,
      track: lesson.track,
      rank: lesson.rank,
      skill: lesson.skill,
      tip: o.tip || questTipFor(lesson, o.random),
      goal: state.goal,
      progress: state.levelScore,
      level: state.level,
      total: o.total || curriculumLength(state.pathwayId),
      phase: state.phase,
      pathway: pathwayFor(state.pathwayId).name,
      bang: o.fresh ? true : false,
      at: Date.now(),
    };
  }

  function gemKindsForLevel(level) {
    // Bejeweled-style: start with fewer colors, unlock more variants as you climb.
    return Math.min(GEM_IDS.length, 6 + Math.min(8, Math.floor((level - 1) / 2)));
  }

  function pickFact(level, random, pathwayId, phase, challengeIndex) {
    const lesson = lessonFor(level, pathwayId, phase, challengeIndex);
    const facts = lesson.facts || [];
    if (!facts.length) return "Keep shipping — every match writes more of your story.";
    const rnd = random || Math.random;
    return facts[Math.floor(rnd() * facts.length)];
  }

  function pickGemId(random, level, pathwayId) {
    const n = gemKindsForLevel(level || 1);
    const base = GEM_IDS.slice(0, n);
    const path = pathwayId ? pathwayFor(pathwayId) : null;
    const affinity = (path && path.affinity) || [];
    if (!affinity.length) {
      return base[Math.floor(random() * base.length)];
    }
    const pool = [];
    base.forEach((id) => {
      pool.push(id);
      if (affinity.includes(id)) {
        pool.push(id, id);
      }
    });
    return pool[Math.floor(random() * pool.length)];
  }

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS;
  }

  function areAdjacent(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  }

  function findMatches(board) {
    const marked = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const groups = [];

    // Horizontal
    for (let y = 0; y < ROWS; y += 1) {
      let x = 0;
      while (x < COLS) {
        const kind = board[y][x];
        if (!kind) {
          x += 1;
          continue;
        }
        let len = 1;
        while (x + len < COLS && board[y][x + len] === kind) len += 1;
        if (len >= MATCH_MIN) {
          const cells = [];
          for (let i = 0; i < len; i += 1) {
            marked[y][x + i] = true;
            cells.push({ x: x + i, y, kind });
          }
          groups.push({ kind, cells, axis: "h" });
        }
        x += len;
      }
    }

    // Vertical
    for (let x = 0; x < COLS; x += 1) {
      let y = 0;
      while (y < ROWS) {
        const kind = board[y][x];
        if (!kind) {
          y += 1;
          continue;
        }
        let len = 1;
        while (y + len < ROWS && board[y + len][x] === kind) len += 1;
        if (len >= MATCH_MIN) {
          const cells = [];
          for (let i = 0; i < len; i += 1) {
            marked[y + i][x] = true;
            cells.push({ x, y: y + i, kind });
          }
          groups.push({ kind, cells, axis: "v" });
        }
        y += len;
      }
    }

    const cells = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (marked[y][x]) cells.push({ x, y, kind: board[y][x] });
      }
    }
    return { cells, groups, marked };
  }

  function boardHasMatch(board) {
    return findMatches(board).cells.length > 0;
  }

  function applyGravity(board, random, level, pathwayId) {
    const next = emptyBoard();
    const falls = [];
    for (let x = 0; x < COLS; x += 1) {
      let write = ROWS - 1;
      for (let y = ROWS - 1; y >= 0; y -= 1) {
        if (board[y][x]) {
          next[write][x] = board[y][x];
          if (write !== y) falls.push({ kind: board[y][x], from: { x, y }, to: { x, y: write } });
          write -= 1;
        }
      }
      while (write >= 0) {
        const kind = pickGemId(random, level, pathwayId);
        next[write][x] = kind;
        falls.push({ kind, from: { x, y: write - ROWS }, to: { x, y: write }, spawn: true });
        write -= 1;
      }
    }
    return { board: next, falls };
  }

  function clearCells(board, cells) {
    const next = cloneBoard(board);
    cells.forEach(({ x, y }) => {
      next[y][x] = null;
    });
    return next;
  }

  function resolveBoard(board, random, level, pathwayId) {
    let working = cloneBoard(board);
    const waves = [];
    let chain = 0;
    for (;;) {
      const found = findMatches(working);
      if (!found.cells.length) break;
      chain += 1;
      working = clearCells(working, found.cells);
      const grav = applyGravity(working, random, level, pathwayId);
      working = grav.board;
      waves.push({
        chain,
        cells: found.cells,
        groups: found.groups,
        falls: grav.falls,
      });
      if (chain > 40) break;
    }
    return { board: working, waves, chain };
  }

  function swapCells(board, a, b) {
    const next = cloneBoard(board);
    const tmp = next[a.y][a.x];
    next[a.y][a.x] = next[b.y][b.x];
    next[b.y][b.x] = tmp;
    return next;
  }

  function wouldMatch(board, a, b) {
    if (!areAdjacent(a, b)) return false;
    return boardHasMatch(swapCells(board, a, b));
  }

  function findHint(board) {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const right = { x: x + 1, y };
        const down = { x, y: y + 1 };
        if (inBounds(right.x, right.y) && wouldMatch(board, { x, y }, right)) {
          return { a: { x, y }, b: right };
        }
        if (inBounds(down.x, down.y) && wouldMatch(board, { x, y }, down)) {
          return { a: { x, y }, b: down };
        }
      }
    }
    return null;
  }

  function hasValidMoves(board) {
    return Boolean(findHint(board));
  }

  function weightedGemPool(level, pathwayId, random) {
    const n = gemKindsForLevel(level || 1);
    const base = GEM_IDS.slice(0, n);
    const path = pathwayId ? pathwayFor(pathwayId) : null;
    const affinity = (path && path.affinity) || [];
    if (!affinity.length) return base.slice();
    const pool = [];
    base.forEach((id) => {
      pool.push(id);
      if (affinity.includes(id)) pool.push(id, id);
    });
    return shuffleArray(pool, random || Math.random);
  }

  function fillBoardNoMatches(random, level, pathwayId) {
    const board = emptyBoard();
    const pool = Array.from(new Set(weightedGemPool(level, pathwayId, random)));
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const order = shuffleArray(pool, random);
        let placed = false;
        for (let i = 0; i < order.length; i += 1) {
          board[y][x] = order[i];
          if (!createsImmediateMatch(board, x, y)) {
            placed = true;
            break;
          }
        }
        if (!placed) board[y][x] = order[0];
      }
    }
    let tries = 0;
    while ((boardHasMatch(board) || !hasValidMoves(board)) && tries < 50) {
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          const order = shuffleArray(pool, random);
          let placed = false;
          for (let i = 0; i < order.length; i += 1) {
            board[y][x] = order[i];
            if (!createsImmediateMatch(board, x, y)) {
              placed = true;
              break;
            }
          }
          if (!placed) board[y][x] = order[x % order.length];
        }
      }
      tries += 1;
    }
    return board;
  }

  function createsImmediateMatch(board, x, y) {
    const kind = board[y][x];
    if (!kind) return false;
    if (x >= 2 && board[y][x - 1] === kind && board[y][x - 2] === kind) return true;
    if (y >= 2 && board[y - 1][x] === kind && board[y - 2][x] === kind) return true;
    return false;
  }

  function scoreMatch(cellCount, chain, level, affinityHits) {
    const base = cellCount * 28;
    const chainBonus = 1 + (chain - 1) * 0.55;
    const affinityBonus = 1 + Math.min(0.45, (affinityHits || 0) * 0.08);
    return Math.round(base * chainBonus * (1 + (level - 1) * 0.08) * affinityBonus);
  }

  const SAVE_STATUSES = ["class-select", "ready", "playing", "paused", "over"];

  function clampSaveInt(value, min, fallback, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const floored = Math.max(min, Math.floor(n));
    return max == null ? floored : Math.min(max, floored);
  }

  function normalizeSaveEntry(id, entry) {
    const safeId = safeRecordId(id);
    if (!safeId) return null;
    const source = entry && typeof entry === "object" ? entry : {};
    const name = plainLabel(source.name || safeId, 80) || safeId;
    const atSource = typeof source.at === "string" ? source.at : source.unlockedAt;
    return {
      id: safeId,
      name,
      at: typeof atSource === "string" ? atSource.slice(0, 40) : null,
      level: source.level != null ? clampSaveInt(source.level, 1, 1, 100) : null,
    };
  }

  function asSaveList(value) {
    const entries = [];
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (!entry || typeof entry !== "object") return;
        const normalized = normalizeSaveEntry(entry.id, entry);
        if (normalized) entries.push(normalized);
      });
    } else if (value && typeof value === "object") {
      Object.keys(value).forEach((id) => {
        const normalized = normalizeSaveEntry(id, value[id]);
        if (normalized) entries.push(normalized);
      });
    }
    const seen = {};
    return entries
      .filter((entry) => {
        if (seen[entry.id]) return false;
        seen[entry.id] = true;
        return true;
      })
      .slice(0, 40);
  }

  /**
   * Compact progress record shared by localStorage and Supabase.
   * `bestScore` is the browser best LOC, separate from the run `score`.
   */
  function cloudSaveFromSnapshot(snap, bestScore) {
    const source = snap || {};
    const score = clampSaveInt(
      source.linesOfCode != null ? source.linesOfCode : source.score,
      0,
      0
    );
    const status = SAVE_STATUSES.indexOf(source.status) >= 0 ? source.status : "ready";
    return {
      pathwayId: source.pathwayId || null,
      level: clampSaveInt(source.level, 1, 1),
      questTitle: source.lessonTitle || source.sprint || null,
      score,
      moves: clampSaveInt(source.moves, 0, 0),
      phase: source.phase === "endgame" ? "endgame" : "path",
      status,
      bestScore: Math.max(score, clampSaveInt(bestScore, 0, 0)),
      trophies: asSaveList(source.trophies),
      loot: asSaveList(source.items != null ? source.items : source.loot),
      skills: asSaveList(source.skills),
      challengeIndex: clampSaveInt(source.challengeIndex, 0, 0),
      levelScore: clampSaveInt(source.levelScore, 0, 0),
      graduated: Boolean(source.graduated),
      classExpert: Boolean(source.classExpert),
      challengesCleared: clampSaveInt(source.challengesCleared, 0, 0),
      updatedAt: new Date().toISOString(),
    };
  }

  /** Row shape for public.branchborne_saves. Omits the auth user id when absent. */
  function toPlayerSaveRow(userId, save) {
    const canonical = canonicalCloudSave(save);
    const row = {
      pathway_id: canonical.pathwayId,
      level: canonical.level,
      quest_title: canonical.questTitle,
      score: canonical.score,
      moves: canonical.moves,
      phase: canonical.phase,
      status: canonical.status,
      high_score: canonical.bestScore,
      trophies: canonical.trophies,
      items: canonical.loot,
      skills: canonical.skills,
      challenge_index: canonical.challengeIndex,
      level_score: canonical.levelScore,
      graduated: canonical.graduated,
      class_expert: canonical.classExpert,
      challenges_cleared: canonical.challengesCleared,
      updated_at: canonical.updatedAt,
    };
    if (isPlayerUuid(userId)) row.user_id = String(userId).toLowerCase();
    return row;
  }

  function canonicalCloudSave(input) {
    if (!input || typeof input !== "object") return null;
    const fromRow =
      input.user_id != null ||
      input.pathway_id != null ||
      input.high_score != null ||
      input.quest_title != null ||
      input.class_expert != null;
    const rawPathway = fromRow ? input.pathway_id || null : input.pathwayId || null;
    const pathwayId = rawPathway && PATHWAY_BY_ID[rawPathway] ? rawPathway : null;
    const score = clampSaveInt(fromRow ? input.score : input.score, 0, 0, 100000000);
    const bestScore = clampSaveInt(fromRow ? input.high_score : input.bestScore, 0, score, 100000000);
    const statusSource = fromRow ? input.status : input.status;
    return {
      pathwayId,
      level: clampSaveInt(input.level, 1, 1, 100),
      questTitle: plainLabel(fromRow ? input.quest_title : input.questTitle, 80) || null,
      score,
      moves: clampSaveInt(input.moves, 0, 0, 999),
      phase: (fromRow ? input.phase : input.phase) === "endgame" ? "endgame" : "path",
      status: SAVE_STATUSES.indexOf(statusSource) >= 0 ? statusSource : "ready",
      bestScore: Math.max(score, bestScore),
      trophies: asSaveList(input.trophies),
      loot: asSaveList(fromRow ? input.items : input.loot != null ? input.loot : input.items),
      skills: asSaveList(input.skills),
      challengeIndex: clampSaveInt(fromRow ? input.challenge_index : input.challengeIndex, 0, 0),
      levelScore: clampSaveInt(fromRow ? input.level_score : input.levelScore, 0, 0),
      graduated: Boolean(input.graduated),
      classExpert: Boolean(fromRow ? input.class_expert : input.classExpert),
      challengesCleared: clampSaveInt(
        fromRow ? input.challenges_cleared : input.challengesCleared,
        0,
        0
      ),
      updatedAt: (fromRow ? input.updated_at : input.updatedAt) || null,
    };
  }

  /** Last-write-wins for the quest, union for trophies, loot, skills, and best LOC. */
  function mergeCloudSaves(localSave, remoteSave) {
    const local = canonicalCloudSave(localSave);
    const remote = canonicalCloudSave(remoteSave);
    if (!local) return remote;
    if (!remote) return local;
    const localTime = Date.parse(local.updatedAt || "") || 0;
    const remoteTime = Date.parse(remote.updatedAt || "") || 0;
    const newer = remoteTime >= localTime ? remote : local;
    const older = newer === remote ? local : remote;
    const union = (a, b) => {
      const map = {};
      asSaveList(a)
        .concat(asSaveList(b))
        .forEach((entry) => {
          map[entry.id] = map[entry.id] ? Object.assign({}, map[entry.id], entry) : entry;
        });
      return Object.keys(map).map((id) => map[id]);
    };
    return {
      pathwayId: newer.pathwayId || older.pathwayId,
      level: newer.level,
      questTitle: newer.questTitle || older.questTitle,
      score: newer.score,
      moves: newer.moves,
      phase: newer.phase,
      status: newer.status,
      bestScore: Math.max(newer.bestScore, older.bestScore),
      trophies: union(newer.trophies, older.trophies),
      loot: union(newer.loot, older.loot),
      skills: union(newer.skills, older.skills),
      challengeIndex: newer.challengeIndex,
      levelScore: newer.levelScore,
      graduated: Boolean(newer.graduated || older.graduated),
      classExpert: Boolean(newer.classExpert || older.classExpert),
      challengesCleared: Math.max(newer.challengesCleared, older.challengesCleared),
      updatedAt: newer.updatedAt || older.updatedAt,
    };
  }

  const PORTABLE_SAVE_KEYS = [
    "pathwayId",
    "level",
    "questTitle",
    "score",
    "moves",
    "phase",
    "status",
    "bestScore",
    "trophies",
    "loot",
    "skills",
    "challengeIndex",
    "levelScore",
    "graduated",
    "classExpert",
    "challengesCleared",
    "updatedAt",
  ];

  function pinProblem(pin) {
    if (pin == null || pin === "") return "";
    if (typeof pin !== "string" || !/^[A-Za-z0-9]{4,8}$/.test(pin)) {
      return "Use 4–8 letters or digits, or leave the PIN blank.";
    }
    return "";
  }

  function bytesToHex(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i += 1) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }

  function webCrypto() {
    const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : null;
    if (!cryptoApi || !cryptoApi.subtle || typeof cryptoApi.getRandomValues !== "function") return null;
    return cryptoApi;
  }

  function sha256Hex(text) {
    const cryptoApi = webCrypto();
    if (!cryptoApi) return Promise.reject(new Error("crypto.subtle unavailable"));
    const bytes = new TextEncoder().encode(text);
    return cryptoApi.subtle.digest("SHA-256", bytes).then((digest) => bytesToHex(new Uint8Array(digest)));
  }

  function hashesEqual(left, right) {
    if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
    let diff = 0;
    for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
    return diff === 0;
  }

  function readPinRecord(input) {
    if (!Object.prototype.hasOwnProperty.call(input, "pin") || input.pin == null) return { pin: null };
    const record = input.pin;
    const keys = record && typeof record === "object" && !Array.isArray(record) ? Object.keys(record) : null;
    const allowed = keys && keys.length === 3 && keys.every((key) => key === "alg" || key === "salt" || key === "hash");
    if (
      !allowed ||
      record.alg !== "SHA-256" ||
      typeof record.salt !== "string" ||
      !/^[0-9a-f]{32}$/.test(record.salt) ||
      typeof record.hash !== "string" ||
      !/^[0-9a-f]{64}$/.test(record.hash) ||
      record.hash === record.salt
    ) {
      return {
        error: "That file's PIN record is not a hash and salt. Ship the save again from this cabinet.",
      };
    }
    return { pin: { alg: "SHA-256", salt: record.salt, hash: record.hash } };
  }

  function portableFieldError(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return "That file is not a Branchborne save. It needs to be one JSON object.";
    }
    const present = PORTABLE_SAVE_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(input, key));
    if (!present.length) {
      return "That file is not a Branchborne save. Ship one from this cabinet first.";
    }
    if (Object.prototype.hasOwnProperty.call(input, "pathwayId")) {
      const pathwayId = input.pathwayId;
      if (pathwayId != null && (typeof pathwayId !== "string" || !PATHWAY_BY_ID[pathwayId])) {
        return "That file is not a Branchborne save. The pathway is not one this cabinet knows.";
      }
    }
    if (Object.prototype.hasOwnProperty.call(input, "questTitle") && input.questTitle != null && typeof input.questTitle !== "string") {
      return "That file is not a Branchborne save. The quest title needs to be text.";
    }
    const numbers = ["score", "moves", "bestScore", "level", "challengeIndex", "levelScore", "challengesCleared"];
    for (let i = 0; i < numbers.length; i += 1) {
      const key = numbers[i];
      if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
      if (typeof input[key] !== "number" || !Number.isFinite(input[key])) {
        return "That file is not a Branchborne save. Lines of code, moves, and scores need to be numbers.";
      }
    }
    if (Object.prototype.hasOwnProperty.call(input, "phase") && input.phase !== "path" && input.phase !== "endgame") {
      return "That file is not a Branchborne save. Phase needs to be path or endgame.";
    }
    if (Object.prototype.hasOwnProperty.call(input, "status") && SAVE_STATUSES.indexOf(input.status) < 0) {
      return "That file is not a Branchborne save. The status is not one this cabinet uses.";
    }
    const lists = ["trophies", "loot", "skills"];
    for (let i = 0; i < lists.length; i += 1) {
      const key = lists[i];
      if (Object.prototype.hasOwnProperty.call(input, key) && !Array.isArray(input[key])) {
        return "That file is not a Branchborne save. Trophies, loot, and skills need to be lists.";
      }
    }
    const flags = ["graduated", "classExpert"];
    for (let i = 0; i < flags.length; i += 1) {
      const key = flags[i];
      if (Object.prototype.hasOwnProperty.call(input, key) && typeof input[key] !== "boolean") {
        return "That file is not a Branchborne save. Graduated and class expert need to be true or false.";
      }
    }
    if (Object.prototype.hasOwnProperty.call(input, "updatedAt") && input.updatedAt != null && typeof input.updatedAt !== "string") {
      return "That file is not a Branchborne save. The timestamp needs to be text.";
    }
    return "";
  }

  /** Accept only the camelCase progress object this cabinet downloads. */
  function inspectPortableSave(input) {
    const error = portableFieldError(input);
    if (error) return { ok: false, error };
    const pinRecord = readPinRecord(input);
    if (pinRecord.error) return { ok: false, error: pinRecord.error };
    const save = canonicalCloudSave(input);
    if (!save) return { ok: false, error: "That file is not a Branchborne save. Ship one from this cabinet first." };
    return { ok: true, save, pin: pinRecord.pin };
  }

  function catalogCount(list, catalog) {
    return (list || []).filter((entry) => catalog.some((item) => item.id === entry.id)).length;
  }

  function portableSaveSummary(save) {
    const canonical = canonicalCloudSave(save);
    if (!canonical) return "That file is not a Branchborne save. Ship one from this cabinet first.";
    const trophies = catalogCount(canonical.trophies, TROPHIES);
    const trophyWord = trophies === 1 ? "trophy" : "trophies";
    const pathway = canonical.pathwayId ? "pathway, " : "";
    return `Restored ${pathway}${trophies} ${trophyWord}, ${canonical.score} lines of code.`;
  }

  /**
   * Lesson copy plus a pretty-printed slice of the player's real save.
   * Trophy rows in the preview are ids only; the trophy case uses catalog names.
   */
  function portableSaveLesson(save) {
    const canonical = canonicalCloudSave(save);
    if (!canonical) {
      return {
        text: "This file is one object. Ship a save after the cabinet has a quest to pack.",
        preview: "",
      };
    }
    const trophyPreview = canonical.trophies.slice(0, 2).map((entry) => ({ id: entry.id }));
    const preview = {
      pathwayId: canonical.pathwayId,
      questTitle: canonical.questTitle,
      score: canonical.score,
      moves: canonical.moves,
      phase: canonical.phase,
      bestScore: canonical.bestScore,
      trophies: trophyPreview,
      loot: canonical.loot.slice(0, 2).map((entry) => ({ id: entry.id })),
      skills: canonical.skills.slice(0, 2).map((entry) => ({ id: entry.id })),
    };
    const stringLine = canonical.pathwayId
      ? `A name like pathwayId is a key. "${canonical.pathwayId}" is a string.`
      : "A name like pathwayId is a key. Yours is empty until you pick a pathway, so there is no string there yet.";
    const more =
      canonical.trophies.length > trophyPreview.length
        ? ` The preview shows the first ${trophyPreview.length} trophies. The file keeps all ${canonical.trophies.length}.`
        : "";
    return {
      text: [
        "The preview below is your real save.",
        "This file is one object, one bundle inside curly braces.",
        stringLine,
        `score is a number — your lines of code (${canonical.score}).`,
        `trophies is an array, a list inside square brackets.${more}`,
      ].join(" "),
      preview: JSON.stringify(preview, null, 2),
    };
  }

  function sealPortableSave(save, pin) {
    const problem = pinProblem(pin);
    if (problem) return Promise.resolve({ ok: false, error: problem });
    const canonical = canonicalCloudSave(save);
    if (!canonical) return Promise.resolve({ ok: false, error: "Nothing to ship yet." });
    const file = Object.assign({}, canonical);
    const secret = typeof pin === "string" ? pin : "";
    if (!secret) return Promise.resolve({ ok: true, file });
    const cryptoApi = webCrypto();
    if (!cryptoApi) {
      return Promise.resolve({ ok: false, error: "This browser cannot hash a PIN, so leave the PIN blank to ship the file." });
    }
    const saltBytes = new Uint8Array(16);
    cryptoApi.getRandomValues(saltBytes);
    const salt = bytesToHex(saltBytes);
    return sha256Hex(`${salt}\n${secret}`).then((hash) => {
      if (!hash || hash === secret || salt === secret) {
        return { ok: false, error: "Could not seal that PIN. Try another, or leave it blank." };
      }
      file.pin = { alg: "SHA-256", salt, hash };
      return { ok: true, file };
    });
  }

  function unlockPortableSave(input, pin) {
    const inspected = inspectPortableSave(input);
    if (!inspected.ok) return Promise.resolve(inspected);
    if (!inspected.pin) {
      return Promise.resolve({
        ok: true,
        save: inspected.save,
        summary: portableSaveSummary(inspected.save),
      });
    }
    const secret = typeof pin === "string" ? pin : "";
    if (!secret) {
      return Promise.resolve({ ok: false, error: "This save has a PIN. Enter it to open the file in the game." });
    }
    return sha256Hex(`${inspected.pin.salt}\n${secret}`).then((hash) => {
      if (!hashesEqual(hash, inspected.pin.hash)) {
        return { ok: false, error: "That PIN does not open this save." };
      }
      return {
        ok: true,
        save: inspected.save,
        summary: portableSaveSummary(inspected.save),
      };
    });
  }

  function knownSkill(id) {
    const lessons = CURRICULUM.concat(ENDGAME_CHALLENGES);
    for (let i = 0; i < lessons.length; i += 1) {
      const skill = lessons[i].skill;
      if (skill && skill.id === id) return skill;
    }
    return null;
  }

  function createGame(options) {
    const opts = options || {};
    const random = opts.random || Math.random;
    const now = opts.now || (() => Date.now());
    const initialPathway = opts.pathwayId && PATHWAY_BY_ID[opts.pathwayId] ? opts.pathwayId : null;
    const startInEndgame = opts.startPhase === "endgame" && initialPathway;
    const state = {
      pathwayId: initialPathway,
      phase: startInEndgame ? "endgame" : "path",
      challengeIndex: startInEndgame ? opts.challengeIndex || 0 : 0,
      challengesCleared: 0,
      graduated: !!startInEndgame,
      mana: 0,
      manaMax: 100,
      powerReady: false,
      powersUsed: 0,
      locMultiplier: 1,
      bossHp: startInEndgame
        ? (lessonFor(1, initialPathway, "endgame", opts.challengeIndex || 0).bossHp ||
            lessonFor(1, initialPathway, "endgame", opts.challengeIndex || 0).goal)
        : 0,
      board: fillBoardNoMatches(random, 1, initialPathway),
      linesOfCode: 0,
      score: 0,
      level: startInEndgame ? curriculumLength(initialPathway) : 1,
      levelScore: 0,
      goal: goalForLevel(
        1,
        initialPathway,
        startInEndgame ? "endgame" : "path",
        startInEndgame ? opts.challengeIndex || 0 : 0
      ),
      moves: movesForLevel(
        1,
        initialPathway,
        startInEndgame ? "endgame" : "path",
        startInEndgame ? opts.challengeIndex || 0 : 0
      ),
      matches: 0,
      cleared: 0,
      combo: 0,
      maxCombo: 0,
      maxChain: 0,
      quads: 0,
      hints: 2,
      shuffles: 2,
      hintsUsed: 0,
      shufflesUsed: 0,
      achievements: {},
      skills: {},
      trophies: {},
      items: {},
      classExpert: false,
      lastFact: null,
      pendingFact: null,
      pendingLessonIntro: null,
      activeQuest: null,
      questPulse: 0,
      pendingTrophy: null,
      pendingLoot: null,
      skillUnlock: null,
      commitLog: [],
      fx: [],
      status: initialPathway ? "ready" : "class-select",
      message: startInEndgame
        ? `Endgame raid — ${lessonFor(1, initialPathway, "endgame", opts.challengeIndex || 0).title}`
        : initialPathway
          ? `Pathway locked — ${pathwayFor(initialPathway).name}. Ready to write LOC.`
          : "Pick a pathway hero to begin.",
      selected: null,
      hint: null,
      levelFlash: 0,
      busy: false,
      characterPulse: 0,
    };
    let progressHook = null;

    function setProgressHook(fn) {
      progressHook = typeof fn === "function" ? fn : null;
    }

    function notifyProgress(reason) {
      if (!progressHook) return;
      try {
        progressHook(snapshot(), reason);
      } catch (_err) {
        /* A cloud-save failure must not stop the match. */
      }
    }

    function currentLesson() {
      return lessonFor(state.level, state.pathwayId, state.phase, state.challengeIndex);
    }

    function pathLen() {
      return curriculumLength(state.pathwayId);
    }

    function grantLessonSkill(level) {
      const lesson = currentLesson();
      if (!lesson.skill) return null;
      if (state.skills[lesson.skill.id]) return null;
      state.skills[lesson.skill.id] = {
        ...lesson.skill,
        level,
        unlockedAt: now(),
      };
      state.skillUnlock = { ...state.skills[lesson.skill.id], lesson: lesson.title };
      pushLog(`skill unlocked: ${lesson.skill.name}`);
      return state.skills[lesson.skill.id];
    }

    function pushLog(entry) {
      state.commitLog.unshift(entry);
      if (state.commitLog.length > 6) state.commitLog.length = 6;
    }

    function unlockAchievements() {
      const unlocked = [];
      ACHIEVEMENTS.forEach((ach) => {
        if (state.achievements[ach.id]) return;
        if (ach.test(state)) {
          state.achievements[ach.id] = true;
          unlocked.push(ach);
          pushLog(`badge: ${ach.label}`);
        }
      });
      return unlocked;
    }

    function unlockTrophiesAndLoot() {
      const gained = { trophies: [], items: [] };
      TROPHIES.forEach((t) => {
        if (state.trophies[t.id]) return;
        if (t.test(state)) {
          state.trophies[t.id] = { ...t, at: now() };
          gained.trophies.push(t);
          state.pendingTrophy = t;
          pushLog(`trophy: ${t.name}`);
        }
      });
      LOOT_ITEMS.forEach((item) => {
        if (state.items[item.id]) return;
        if (item.test(state)) {
          state.items[item.id] = { ...item, at: now() };
          gained.items.push(item);
          state.pendingLoot = item;
          pushLog(`loot: ${item.name}`);
        }
      });
      if (gained.trophies.length || gained.items.length) notifyProgress("trophy");
      return gained;
    }

    function syncActiveQuest(fresh) {
      const lesson = currentLesson();
      state.activeQuest = buildSideQuest(state, lesson, {
        fresh: Boolean(fresh),
        random,
        total: state.phase === "endgame" ? ENDGAME_CHALLENGES.length : pathLen(),
      });
      if (fresh) state.questPulse = now();
    }

    function addMana(amount) {
      state.mana = Math.min(state.manaMax, state.mana + amount);
      state.powerReady = state.mana >= state.manaMax;
    }

    function enterEndgame() {
      state.phase = "endgame";
      state.graduated = true;
      state.challengeIndex = 0;
      state.levelScore = 0;
      const challenge = currentLesson();
      state.goal = challenge.goal;
      state.bossHp = challenge.bossHp || challenge.goal;
      state.moves = Math.max(state.moves, challenge.moves);
      state.hints = Math.min(3, state.hints + 1);
      state.shuffles = Math.min(3, state.shuffles + 1);
      state.levelFlash = now();
      state.message = `Senior unlocked — side quest: ${challenge.title}`;
      pushLog(`endgame → ${challenge.title}`);
      grantLessonSkill(state.level);
      // Keep the board rolling — Bejeweled continuous cascade, no wipe.
      syncActiveQuest(true);
      state.characterPulse = now();
      unlockTrophiesAndLoot();
    }

    function advanceChallenge() {
      state.challengesCleared += 1;
      if (state.challengeIndex >= ENDGAME_CHALLENGES.length - 1) {
        state.classExpert = true;
        state.status = "over";
        state.message = "Class Expert — every raid cleared. Open the trophy case.";
        unlockAchievements();
        unlockTrophiesAndLoot();
        syncActiveQuest(false);
        notifyProgress("end");
        return true;
      }
      state.challengeIndex += 1;
      state.levelScore = 0;
      const challenge = currentLesson();
      state.goal = challenge.goal;
      state.bossHp = challenge.bossHp || challenge.goal;
      state.moves = Math.max(state.moves, challenge.moves + 4);
      state.hints = Math.min(3, state.hints + 1);
      state.shuffles = Math.min(3, state.shuffles + 1);
      state.levelFlash = now();
      state.message = `Raid cleared — next side quest: ${challenge.title}`;
      pushLog(`raid → ${challenge.title}`);
      grantLessonSkill(state.level);
      syncActiveQuest(true);
      unlockTrophiesAndLoot();
      return false;
    }

    function applyWaves(waves) {
      if (!waves.length) {
        state.combo = 0;
        return { sounds: [], fact: null };
      }
      const sounds = [];
      let fact = null;
      const path = pathwayFor(state.pathwayId);
      const affinity = path.affinity || [];
      waves.forEach((wave) => {
        state.combo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.maxChain = Math.max(state.maxChain, wave.chain);
        state.matches += 1;
        state.cleared += wave.cells.length;
        const affinityHits = wave.cells.filter((c) => affinity.includes(c.kind)).length;
        addMana(6 + affinityHits * 4 + (wave.chain - 1) * 3);
        let loc = scoreMatch(wave.cells.length, wave.chain, state.level, affinityHits);
        loc = Math.round(loc * (state.locMultiplier || 1));
        if (state.locMultiplier > 1) state.locMultiplier = 1;
        state.linesOfCode += loc;
        state.score = state.linesOfCode;
        state.levelScore += loc;
        // Bejeweled energy: successful clears refund / bank moves.
        state.moves += 1 + Math.min(3, wave.chain - 1);
        if (state.phase === "endgame") {
          state.bossHp = Math.max(0, (state.bossHp || state.goal) - loc);
        }
        wave.groups.forEach((g) => {
          if (g.cells.length >= 4) state.quads += 1;
        });
        const label = (META[wave.cells[0] && wave.cells[0].kind] || {}).label || "gem";
        pushLog(`+${loc} LOC · ${label} ×${wave.cells.length} · chain ${wave.chain}`);
        fact = pickFact(state.level, random, state.pathwayId, state.phase, state.challengeIndex);
        state.lastFact = fact;
        const lesson = currentLesson();
        state.pendingFact = {
          fact,
          lesson: lesson.title,
          track: lesson.track,
          rank: lesson.rank,
          skill: lesson.skill,
          clouds: (lesson.clouds || []).slice(0, 6),
          loc,
          chain: wave.chain,
          level: state.level,
          total: pathLen(),
          at: now(),
        };
        state.fx.push({
          id: `match-${now()}-${wave.chain}`,
          at: now(),
          type: "match",
          chain: wave.chain,
          cells: wave.cells,
          falls: wave.falls || [],
          fact,
          shatter: true,
        });
        state.characterPulse = now();
        sounds.push(wave.chain >= 3 ? "deploy" : wave.cells.length >= 4 ? "squash" : "clear");
      });
      if (state.activeQuest) {
        state.activeQuest.progress = state.levelScore;
        state.activeQuest.tip = state.pendingFact ? state.pendingFact.fact : state.activeQuest.tip;
      }
      state.message =
        waves.length > 1
          ? `Cascade ×${waves.length} — ${state.pendingFact ? state.pendingFact.loc : 0}+ LOC shipped.`
          : `Gem break — ${waves[0].cells.length} cleared.`;
      let leveled = false;
      if (state.levelScore >= state.goal) {
        if (state.phase === "endgame") {
          const done = advanceChallenge();
          sounds.push("level");
          leveled = !done;
        } else if (state.level >= pathLen()) {
          enterEndgame();
          sounds.push("level");
          leveled = true;
        } else {
          state.level += 1;
          state.levelScore = 0;
          state.goal = goalForLevel(state.level, state.pathwayId);
          state.moves += Math.min(12, 6 + Math.floor(state.level / 2));
          state.hints = Math.min(3, state.hints + 1);
          state.shuffles = Math.min(3, state.shuffles + 1);
          state.levelFlash = now();
          const lesson = currentLesson();
          state.message = `Quest complete — next: ${lesson.title}`;
          pushLog(`quest → ${lesson.title}`);
          grantLessonSkill(state.level);
          // Continuous board — no wipe. Side quest updates with a fresh tip.
          syncActiveQuest(true);
          sounds.push("level");
          leveled = true;
        }
      } else {
        syncActiveQuest(false);
      }
      const badges = unlockAchievements();
      const loot = unlockTrophiesAndLoot();
      if (badges.length || loot.trophies.length || loot.items.length) sounds.push("badge");
      return { sounds, badges, fact, leveled, loot };
    }

    function afterResolveCheck() {
      if (!hasValidMoves(state.board)) {
        if (state.shuffles > 0) {
          state.message = "No moves — auto-shuffling the board.";
          doShuffle(true);
        } else {
          // Soft rescue for continuous play instead of hard game-over.
          state.board = fillBoardNoMatches(random, state.level, state.pathwayId);
          state.moves += 8;
          state.message = "Board refreshed — keep matching toward Senior.";
        }
      }
      if (state.moves <= 0 && state.status === "playing") {
        if (state.phase === "path") {
          state.moves = 12;
          state.message = "Move bank refilled — finish the side quest.";
        } else if (state.levelScore < state.goal) {
          state.status = "over";
          state.message = "Out of moves on this raid — try again.";
          notifyProgress("end");
        }
      }
    }

    function trySwap(a, b) {
      if (state.status !== "playing" || state.busy) return { ok: false };
      if (!a || !b || !areAdjacent(a, b)) return { ok: false };
      if (!inBounds(a.x, a.y) || !inBounds(b.x, b.y)) return { ok: false };

      const swapped = swapCells(state.board, a, b);
      if (!boardHasMatch(swapped)) {
        state.fx.push({ id: `bounce-${now()}`, at: now(), type: "bounce", a, b });
        return { ok: false, bounce: true, sounds: ["move"] };
      }

      state.board = swapped;
      state.moves -= 1;
      state.selected = null;
      state.hint = null;
      state.busy = true;
      const resolved = resolveBoard(state.board, random, state.level, state.pathwayId);
      state.board = resolved.board;
      const outcome = applyWaves(resolved.waves);
      state.busy = false;
      afterResolveCheck();
      state.fx.push({ id: `swap-${now()}`, at: now(), type: "swap", a, b });
      notifyProgress(state.status === "over" ? "end" : "match");
      return { ok: true, waves: resolved.waves, sounds: ["rotate"].concat(outcome.sounds || []) };
    }

    function selectCell(x, y) {
      if (state.status !== "playing" || state.busy || !inBounds(x, y)) return null;
      const cell = { x, y };
      if (!state.selected) {
        state.selected = cell;
        return { selected: cell };
      }
      if (state.selected.x === x && state.selected.y === y) {
        state.selected = null;
        return { selected: null };
      }
      if (areAdjacent(state.selected, cell)) {
        const a = state.selected;
        state.selected = null;
        return trySwap(a, cell);
      }
      state.selected = cell;
      return { selected: cell };
    }

    function doHint() {
      if (state.status !== "playing" || state.hints < 1) return false;
      const hint = findHint(state.board);
      if (!hint) return false;
      state.hints -= 1;
      state.hintsUsed += 1;
      state.hint = hint;
      state.message = "Hint lit — swap the glowing gems.";
      unlockAchievements();
      return true;
    }

    function doShuffle(free) {
      if (state.status !== "playing") return false;
      if (!free) {
        if (state.shuffles < 1) return false;
        state.shuffles -= 1;
        state.shufflesUsed += 1;
      }
      state.board = fillBoardNoMatches(random, state.level, state.pathwayId);
      state.selected = null;
      state.hint = null;
      state.message = "Board reshuffled.";
      pushLog("shuffle: redeployed gem grid");
      state.fx.push({ id: `shuffle-${now()}`, at: now(), type: "shuffle" });
      unlockAchievements();
      return true;
    }

    function castPower() {
      if (state.status !== "playing" || !state.powerReady || state.busy) {
        return { ok: false };
      }
      const path = pathwayFor(state.pathwayId);
      const power = path.power;
      state.mana = 0;
      state.powerReady = false;
      state.powersUsed += 1;
      state.characterPulse = now();
      const sounds = ["deploy"];
      let waves = [];

      if (power.id === "ui-burst") {
        const affinity = path.affinity || [];
        const counts = {};
        for (let y = 0; y < ROWS; y += 1) {
          for (let x = 0; x < COLS; x += 1) {
            const kind = state.board[y][x];
            if (affinity.includes(kind)) counts[kind] = (counts[kind] || 0) + 1;
          }
        }
        const kinds = Object.keys(counts);
        if (kinds.length) {
          const target = kinds[Math.floor(random() * kinds.length)];
          const cells = [];
          for (let y = 0; y < ROWS; y += 1) {
            for (let x = 0; x < COLS; x += 1) {
              if (state.board[y][x] === target) cells.push({ x, y, kind: target });
            }
          }
          state.board = clearCells(state.board, cells);
          const grav = applyGravity(state.board, random, state.level, state.pathwayId);
          state.board = grav.board;
          const resolved = resolveBoard(state.board, random, state.level, state.pathwayId);
          state.board = resolved.board;
          const fakeWave = {
            chain: 1,
            cells,
            groups: [{ kind: target, cells, axis: "power" }],
            falls: grav.falls,
          };
          waves = [fakeWave].concat(resolved.waves);
          const outcome = applyWaves(waves);
          afterResolveCheck();
          pushLog(`cast ${power.name} — cleared ${target}`);
          unlockAchievements();
          notifyProgress(state.status === "over" ? "end" : "match");
          return { ok: true, power, sounds: sounds.concat(outcome.sounds || []) };
        }
      } else if (power.id === "query-storm") {
        state.moves += 4;
        state.locMultiplier = 2;
        state.message = `${power.name} — +4 moves, next cascade deals double LOC.`;
        pushLog(`cast ${power.name}`);
      } else if (power.id === "hook-cascade") {
        state.hints = Math.min(3, state.hints + 2);
        state.shuffles = Math.min(3, state.shuffles + 2);
        doShuffle(true);
        state.message = `${power.name} — board reshuffled, tools refilled.`;
        pushLog(`cast ${power.name}`);
      } else if (power.id === "polyglot-pulse") {
        const surge = Math.max(120, state.combo * 90 + 180);
        state.linesOfCode += surge;
        state.score = state.linesOfCode;
        state.levelScore += surge;
        if (state.phase === "endgame") {
          state.bossHp = Math.max(0, (state.bossHp || state.goal) - surge);
        }
        state.message = `${power.name} — +${surge} LOC surge.`;
        pushLog(`cast ${power.name} · +${surge} LOC`);
        if (state.levelScore >= state.goal) {
          if (state.phase === "endgame") {
            advanceChallenge();
            sounds.push("level");
          } else if (state.level >= pathLen()) {
            enterEndgame();
            sounds.push("level");
          } else {
            state.level += 1;
            state.levelScore = 0;
            state.goal = goalForLevel(state.level, state.pathwayId);
            state.levelFlash = now();
            grantLessonSkill(state.level);
            state.board = fillBoardNoMatches(random, state.level, state.pathwayId);
            sounds.push("level");
          }
        }
      }

      state.fx.push({ id: `power-${now()}`, at: now(), type: "power", power: power.id });
      unlockAchievements();
      notifyProgress(state.status === "over" ? "end" : "match");
      return { ok: true, power, sounds };
    }

    function choosePathway(pathwayId) {
      if (!PATHWAY_BY_ID[pathwayId]) return false;
      state.pathwayId = pathwayId;
      state.phase = "path";
      state.challengeIndex = 0;
      state.challengesCleared = 0;
      state.graduated = false;
      state.mana = 0;
      state.powerReady = false;
      state.powersUsed = 0;
      state.locMultiplier = 1;
      state.bossHp = 0;
      state.level = 1;
      state.levelScore = 0;
      state.goal = goalForLevel(1, pathwayId);
      state.moves = movesForLevel(1, pathwayId);
      state.board = fillBoardNoMatches(random, 1, pathwayId);
      state.hints = 2;
      state.shuffles = 2;
      state.skills = {};
      state.achievements = {};
      state.commitLog = [];
      state.linesOfCode = 0;
      state.score = 0;
      state.matches = 0;
      state.cleared = 0;
      state.combo = 0;
      state.status = "ready";
      const path = pathwayFor(pathwayId);
      state.message = `${path.name} selected — ${path.blurb}`;
      state.levelFlash = now();
      state.characterPulse = now();
      pushLog(`class → ${path.name}`);
      return true;
    }

    function play() {
      if (state.status === "playing") return;
      if (state.status === "class-select") return;
      if (state.status === "over") {
        if (state.graduated && state.challengesCleared >= ENDGAME_CHALLENGES.length) {
          reset();
          return;
        }
        // Retry current lesson/raid without wiping pathway
        state.status = "playing";
        state.levelScore = 0;
        state.moves = movesForLevel(state.level, state.pathwayId, state.phase, state.challengeIndex);
        state.goal = goalForLevel(state.level, state.pathwayId, state.phase, state.challengeIndex);
        if (state.phase === "endgame") {
          const challenge = currentLesson();
          state.bossHp = challenge.bossHp || challenge.goal;
        }
        state.board = fillBoardNoMatches(random, state.level, state.pathwayId);
        state.message = `Retry — ${currentLesson().title}`;
        state.levelFlash = now();
        notifyProgress("start");
        return;
      }
      state.status = "playing";
      const lesson = currentLesson();
      const label = state.phase === "endgame" ? "Raid quest" : "Side quest";
      state.message =
        state.phase === "endgame"
          ? `${label}: ${lesson.title} — write ${state.goal} LOC.`
          : `${label} live: ${lesson.title} — match gems to auto-advance.`;
      state.levelFlash = now();
      grantLessonSkill(state.level);
      syncActiveQuest(true);
      unlockTrophiesAndLoot();
      notifyProgress("start");
    }

    function pause() {
      if (state.status !== "playing") return;
      state.status = "paused";
      state.message = "Working tree paused.";
      notifyProgress("pause");
    }

    function resume() {
      if (state.status !== "paused") return;
      state.status = "playing";
      state.message = "Back on the main branch.";
    }

    function reset() {
      const keepPath = state.pathwayId;
      state.pathwayId = keepPath;
      state.phase = "path";
      state.challengeIndex = 0;
      state.challengesCleared = 0;
      state.graduated = false;
      state.mana = 0;
      state.manaMax = 100;
      state.powerReady = false;
      state.powersUsed = 0;
      state.locMultiplier = 1;
      state.bossHp = 0;
      state.board = fillBoardNoMatches(random, 1, keepPath);
      state.linesOfCode = 0;
      state.score = 0;
      state.level = 1;
      state.levelScore = 0;
      state.goal = goalForLevel(1, keepPath);
      state.moves = movesForLevel(1, keepPath);
      state.matches = 0;
      state.cleared = 0;
      state.combo = 0;
      state.maxCombo = 0;
      state.maxChain = 0;
      state.quads = 0;
      state.hints = 2;
      state.shuffles = 2;
      state.hintsUsed = 0;
      state.shufflesUsed = 0;
      state.achievements = {};
      state.skills = {};
      state.trophies = {};
      state.items = {};
      state.classExpert = false;
      state.lastFact = null;
      state.pendingFact = null;
      state.pendingLessonIntro = null;
      state.activeQuest = null;
      state.questPulse = 0;
      state.pendingTrophy = null;
      state.pendingLoot = null;
      state.skillUnlock = null;
      state.commitLog = [];
      state.fx = [];
      state.status = keepPath ? "ready" : "class-select";
      state.message = keepPath
        ? `${pathwayFor(keepPath).name} — ready for a new career run.`
        : "Pick a pathway hero to begin.";
      state.selected = null;
      state.hint = null;
      state.levelFlash = 0;
      state.busy = false;
      state.characterPulse = 0;
    }

    function reopenClassSelect() {
      state.pathwayId = null;
      state.phase = "path";
      state.challengeIndex = 0;
      state.challengesCleared = 0;
      state.graduated = false;
      state.mana = 0;
      state.powerReady = false;
      state.powersUsed = 0;
      state.locMultiplier = 1;
      state.bossHp = 0;
      state.board = fillBoardNoMatches(random, 1, null);
      state.linesOfCode = 0;
      state.score = 0;
      state.level = 1;
      state.levelScore = 0;
      state.goal = goalForLevel(1);
      state.moves = movesForLevel(1);
      state.matches = 0;
      state.cleared = 0;
      state.combo = 0;
      state.skills = {};
      state.achievements = {};
      state.commitLog = [];
      state.fx = [];
      state.status = "class-select";
      state.message = "Pick a pathway hero to begin.";
      state.selected = null;
      state.hint = null;
      state.busy = false;
      state.characterPulse = 0;
    }

    function consumeFx() {
      const fresh = state.fx.slice();
      state.fx = [];
      return fresh;
    }

    function consumeFact() {
      const fact = state.pendingFact;
      state.pendingFact = null;
      return fact;
    }

    function consumeLessonIntro() {
      // Lesson modals retired — quests live in the side rail.
      state.pendingLessonIntro = null;
      return null;
    }

    function consumeSkillUnlock() {
      const skill = state.skillUnlock;
      state.skillUnlock = null;
      return skill;
    }

    function snapshot() {
      const lesson = currentLesson();
      const path = state.pathwayId ? pathwayFor(state.pathwayId) : null;
      return {
        board: cloneBoard(state.board),
        linesOfCode: state.linesOfCode,
        score: state.linesOfCode,
        level: state.level,
        levelScore: state.levelScore,
        goal: state.goal,
        moves: state.moves,
        matches: state.matches,
        cleared: state.cleared,
        combo: state.combo,
        maxCombo: state.maxCombo,
        maxChain: state.maxChain,
        quads: state.quads,
        hints: state.hints,
        shuffles: state.shuffles,
        sprint: lesson.title,
        lessonTitle: lesson.title,
        lessonTrack: lesson.track,
        lessonRank: lesson.rank,
        lessonSkill: lesson.skill,
        skills: Object.values(state.skills),
        lastFact: state.lastFact,
        pendingFact: state.pendingFact,
        skillUnlock: state.skillUnlock,
        commitLog: state.commitLog.slice(),
        achievements: Object.keys(state.achievements),
        status: state.status,
        message: state.message,
        selected: state.selected ? { ...state.selected } : null,
        hint: state.hint
          ? { a: { ...state.hint.a }, b: { ...state.hint.b } }
          : null,
        levelFlash: state.levelFlash,
        busy: state.busy,
        curriculumLength: pathLen(),
        pathwayId: state.pathwayId,
        pathway: path
          ? {
              id: path.id,
              name: path.name,
              role: path.role,
              blurb: path.blurb,
              accent: path.accent,
              secondary: path.secondary,
              power: path.power,
              character: path.character,
              affinity: path.affinity.slice(),
              pattern: path.pattern,
              backdrop: path.backdrop,
              clouds: path.clouds.slice(),
            }
          : null,
        phase: state.phase,
        challengeIndex: state.challengeIndex,
        challengesCleared: state.challengesCleared,
        graduated: state.graduated,
        mana: state.mana,
        manaMax: state.manaMax,
        powerReady: state.powerReady,
        powersUsed: state.powersUsed,
        bossHp: state.bossHp,
        characterPulse: state.characterPulse,
        endgameLength: ENDGAME_CHALLENGES.length,
        activeQuest: state.activeQuest ? { ...state.activeQuest } : null,
        questPulse: state.questPulse,
        trophies: Object.values(state.trophies || {}),
        items: Object.values(state.items || {}),
        classExpert: Boolean(state.classExpert),
        trophyCatalog: TROPHIES.map((t) => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          blurb: t.blurb,
          owned: Boolean(state.trophies[t.id]),
        })),
        itemCatalog: LOOT_ITEMS.map((t) => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          blurb: t.blurb,
          owned: Boolean(state.items[t.id]),
        })),
        gameTitle: GAME_TITLE,
      };
    }

    function consumeTrophy() {
      const t = state.pendingTrophy;
      state.pendingTrophy = null;
      return t;
    }

    function consumeLoot() {
      const t = state.pendingLoot;
      state.pendingLoot = null;
      return t;
    }

    function restoreCloudSave(payload) {
      const save = canonicalCloudSave(payload);
      if (!save) return false;
      const pathwayId = save.pathwayId && PATHWAY_BY_ID[save.pathwayId] ? save.pathwayId : null;
      state.pathwayId = pathwayId;
      state.phase = save.phase === "endgame" ? "endgame" : "path";
      state.level = save.level;
      state.challengeIndex = save.challengeIndex;
      state.challengesCleared = save.challengesCleared;
      state.graduated = save.graduated;
      state.classExpert = save.classExpert;
      state.linesOfCode = save.score;
      state.score = save.score;
      state.levelScore = save.levelScore;
      state.moves = save.moves;
      state.goal = goalForLevel(state.level, state.pathwayId, state.phase, state.challengeIndex);
      if (state.phase === "endgame") {
        const lesson = currentLesson();
        state.bossHp = Math.max(0, (lesson.bossHp || state.goal) - state.levelScore);
      } else {
        state.bossHp = 0;
      }
      state.trophies = {};
      save.trophies.forEach((entry) => {
        const catalog = TROPHIES.find((trophy) => trophy.id === entry.id);
        if (!catalog) return;
        state.trophies[entry.id] = Object.assign({}, catalog, { at: entry.at || null });
      });
      state.items = {};
      save.loot.forEach((entry) => {
        const catalog = LOOT_ITEMS.find((item) => item.id === entry.id);
        if (!catalog) return;
        state.items[entry.id] = Object.assign({}, catalog, { at: entry.at || null });
      });
      state.skills = {};
      save.skills.forEach((entry) => {
        const skill = knownSkill(entry.id);
        if (!skill) return;
        state.skills[entry.id] = {
          id: skill.id,
          name: skill.name,
          icon: skill.icon,
          blurb: skill.blurb,
          level: entry.level || state.level,
          unlockedAt: entry.at || null,
        };
      });
      let status = SAVE_STATUSES.indexOf(save.status) >= 0 ? save.status : "ready";
      if (!pathwayId) status = "class-select";
      if (status === "playing") status = "paused";
      state.status = status;
      state.board = fillBoardNoMatches(random, Math.max(1, state.level), state.pathwayId);
      state.selected = null;
      state.hint = null;
      state.busy = false;
      state.fx = [];
      state.message = pathwayId
        ? "Progress restored. Resume when you are ready."
        : "Pick a pathway hero to begin.";
      if (pathwayId) syncActiveQuest(false);
      else state.activeQuest = null;
      return true;
    }

    return {
      COLS,
      ROWS,
      SIZE,
      play,
      pause,
      resume,
      reset,
      reopenClassSelect,
      choosePathway,
      castPower,
      selectCell,
      trySwap,
      hint: doHint,
      shuffle: doShuffle,
      consumeFx,
      consumeFact,
      consumeLessonIntro,
      consumeSkillUnlock,
      consumeTrophy,
      consumeLoot,
      snapshot,
      restoreCloudSave,
      setProgressHook,
      findMatches: () => findMatches(state.board),
      get status() {
        return state.status;
      },
      get score() {
        return state.linesOfCode;
      },
      get linesOfCode() {
        return state.linesOfCode;
      },
      get pathwayId() {
        return state.pathwayId;
      },
    };
  }

  const STORAGE = {
    high: "git-blocks-high-score",
    prefs: "git-blocks-prefs-v2",
    progress: "git-blocks-progress-v1",
  };

  let activeScope = "guest";

  function scopeUserId() {
    return activeScope === "guest" ? null : activeScope;
  }

  function scopedStorageKey(base) {
    return playerStorageKey(base, scopeUserId());
  }

  function readStore(base) {
    try {
      if (typeof localStorage === "undefined") return null;
      const scoped = localStorage.getItem(scopedStorageKey(base));
      if (scoped != null) return scoped;
      if (activeScope === "guest") return localStorage.getItem(base);
      return null;
    } catch (_err) {
      return null;
    }
  }

  function writeStore(base, value) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(scopedStorageKey(base), value);
    } catch (_err) {
      /* private mode */
    }
  }

  const BG_PRESETS = [
    {
      id: "navy",
      label: "Navy",
      pattern: "drift",
      css: "radial-gradient(900px 420px at 8% -8%, rgba(79,143,212,.22), transparent 55%), radial-gradient(700px 360px at 100% 0%, rgba(13,46,87,.55), transparent 48%), #0b1220",
    },
    {
      id: "solid-ink",
      label: "Ink",
      pattern: "rise",
      css: "#0b1220",
    },
    {
      id: "aurora",
      label: "Aurora",
      pattern: "orbit",
      css: "radial-gradient(circle at 20% 20%, rgba(61,139,110,.4), transparent 40%), radial-gradient(circle at 80% 0%, rgba(139,124,224,.35), transparent 42%), #0a1220",
    },
    {
      id: "terminal",
      label: "Term",
      pattern: "rise",
      css: "radial-gradient(circle at 30% 20%, rgba(61,139,110,.35), transparent 40%), #07140f",
    },
    {
      id: "ember",
      label: "Ember",
      pattern: "sway",
      css: "radial-gradient(circle at 70% 10%, rgba(224,138,74,.35), transparent 45%), #1a0f0c",
    },
  ];

  const DEV_CLOUD_WORDS = {
    css: ["flex", "grid", "clamp()", ":root", "var(--navy)", "@media", "gap", "aspect-ratio", "::before", "container"],
    php: ["foreach", "namespace", "??=", "match()", "PDO", "Composer", "strict_types", "yield", "enum", "readonly"],
    wordpress: ["add_action", "WP_Query", "the_content", "block.json", "get_posts", "shortcode", "hooks", "REST"],
    react: ["useState", "useEffect", "JSX", "props", "memo", "Suspense", "useRef", "Fragment", "hooks"],
    general: ["git merge", "CI", "API", "GraphQL", "TypeScript", "PR", "lint", "deploy", "a11y", "npm"],
  };

  const WordGenerator = (function createWordGenerator() {
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const LOWER = "abcdefghijklmnopqrstuvwxyz";
    const DIGITS = "0123456789";
    const LANGS = ["css", "php", "wordpress", "react", "general"];
    const PREFIXES = ["git", "npm", "wp", "css", "js", "ts", "api", "ci", "dev", "web"];
    const SUFFIXES = ["fix", "ship", "merge", "build", "lint", "test", "hook", "sync", "diff", "push"];

    function pick(list, random) {
      const rnd = random || Math.random;
      return list[Math.floor(rnd() * list.length)];
    }

    function randomLetters(len, random) {
      const rnd = random || Math.random;
      const n = Math.max(1, Math.min(12, len || 2 + Math.floor(rnd() * 4)));
      let out = "";
      for (let i = 0; i < n; i += 1) {
        const pool = i === 0 ? LETTERS : rnd() > 0.35 ? LOWER : LETTERS;
        out += pool[Math.floor(rnd() * pool.length)];
      }
      return out;
    }

    function randomHexToken(random) {
      const rnd = random || Math.random;
      const n = 3 + Math.floor(rnd() * 4);
      let out = "#";
      for (let i = 0; i < n; i += 1) out += "0123456789abcdef"[Math.floor(rnd() * 16)];
      return out;
    }

    function randomDevCompound(random) {
      const rnd = random || Math.random;
      return `${pick(PREFIXES, rnd)}-${pick(SUFFIXES, rnd)}`;
    }

    function randomDevWord(random) {
      const rnd = random || Math.random;
      const lang = pick(LANGS, rnd);
      const pool = DEV_CLOUD_WORDS[lang] || DEV_CLOUD_WORDS.general;
      return { text: pick(pool, rnd), lang: lang === "wordpress" ? "wp" : lang === "general" ? "dev" : lang };
    }

    function nextCloudToken(random) {
      const rnd = random || Math.random;
      const roll = rnd();
      if (roll < 0.28) return { text: randomLetters(2 + Math.floor(rnd() * 5), rnd), lang: "dev" };
      if (roll < 0.4) return { text: randomHexToken(rnd), lang: "css" };
      if (roll < 0.52) return { text: randomDevCompound(rnd), lang: "dev" };
      if (roll < 0.6) {
        const a = LETTERS[Math.floor(rnd() * 26)];
        const b = DIGITS[Math.floor(rnd() * 10)];
        return { text: `${a}${b}${randomLetters(2, rnd)}`, lang: "dev" };
      }
      return randomDevWord(rnd);
    }

    function generateCloud(count, random) {
      const rnd = random || Math.random;
      const n = Math.max(8, count || 22);
      const tokens = [];
      for (let i = 0; i < n; i += 1) tokens.push(nextCloudToken(rnd));
      return tokens;
    }

    return {
      randomLetters,
      randomHexToken,
      randomDevCompound,
      randomDevWord,
      nextCloudToken,
      generateCloud,
    };
  })();

  function resolveGameAsset(relativePath) {
    if (typeof document === "undefined") return relativePath;
    const el =
      (typeof document.currentScript !== "undefined" && document.currentScript) ||
      document.querySelector('script[src*="git-blocks.js"]');
    if (!el || !el.src) return relativePath;
    try {
      const base = el.src.replace(/[^/]+$/, "");
      if (/\/js\/$/i.test(base)) return new URL(`../${relativePath}`, base).href;
      return new URL(relativePath, base).href;
    } catch (_err) {
      return relativePath;
    }
  }

  const OPEN_SOURCE_POOL = [
    { id: "chip", label: "Chip commit", kind: "generated", style: "chip", credit: "Procedural chip loop — MIT, in-browser." },
    { id: "pad", label: "Soft backlog pad", kind: "generated", style: "pad", credit: "Procedural pad loop — MIT, in-browser." },
    { id: "pulse", label: "Merge pulse", kind: "generated", style: "pulse", credit: "Procedural pulse loop — MIT, in-browser." },
    { id: "arcade", label: "Arcade rebase", kind: "generated", style: "arcade", credit: "Procedural arcade loop — MIT, in-browser." },
    { id: "ambient", label: "Idle deploy hum", kind: "generated", style: "ambient", credit: "Procedural ambient hum — MIT, in-browser." },
    { id: "glitch", label: "Hotfix glitch", kind: "generated", style: "glitch", credit: "Procedural glitch loop — MIT, in-browser." },
  ];

  const THEME_TRACK = {
    id: "stack-sprint",
    label: "Stack sprint theme",
    kind: "url",
    url: resolveGameAsset("audio/stack-sprint.ogg"),
    credit: "Original chiptune — generated for Git Blocks (MIT). Auto-plays when a sprint starts.",
  };

  const MUSIC_TRACKS_BASE = [
    { id: "off", label: "Music off", kind: "off", credit: "Silence — focus mode." },
    THEME_TRACK,
    { id: "custom", label: "Custom open-source URL…", kind: "custom", credit: "Paste a CC0 / CC-BY MP3 or OGG URL you have rights to stream." },
  ];

  let MUSIC_TRACKS = MUSIC_TRACKS_BASE.slice();

  function shuffleArray(list, random) {
    const arr = list.slice();
    const rnd = random || Math.random;
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function discoverFreeTracks(count) {
    const pool = shuffleArray(OPEN_SOURCE_POOL);
    const picked = pool.slice(0, Math.max(3, count || 5)).map((track, i) => ({
      ...track,
      id: `${track.id}-r${i}-${Math.floor(Math.random() * 9999)}`,
      label: `${track.label} · free`,
      discovered: true,
    }));
    MUSIC_TRACKS = [MUSIC_TRACKS_BASE[0], THEME_TRACK].concat(picked, MUSIC_TRACKS_BASE.slice(2));
    THEME_TRACK.url = resolveGameAsset("audio/stack-sprint.ogg");
    return MUSIC_TRACKS;
  }

  discoverFreeTracks(5);

  function defaultPrefs() {
    return {
      background: { mode: "preset", presetId: "navy", css: BG_PRESETS[0].css, image: "" },
      music: { trackId: "stack-sprint", customUrl: "", volume: 0.38 },
      graphics: "advanced",
    };
  }

  function sanitizePrefs(input) {
    const base = defaultPrefs();
    const source = input || {};
    const bg = source.background || {};
    const music = source.music || {};
    const api = securityApi();
    let background = { mode: "preset", presetId: "navy", css: BG_PRESETS[0].css, image: "" };
    if (bg.mode === "preset") {
      const preset = BG_PRESETS.find((item) => item.id === bg.presetId) || BG_PRESETS[0];
      background = { mode: "preset", presetId: preset.id, css: preset.css, image: "" };
    } else if (bg.mode === "image") {
      const image = api ? api.sanitizeHttpsUrl(bg.image) : "";
      if (image) background = { mode: "image", presetId: "", css: "", image };
    } else if (bg.mode === "css") {
      const css = api ? api.sanitizeCssBackground(bg.css) : "";
      if (css) background = { mode: "css", presetId: "", css, image: "" };
    }
    const trackId = (api && api.sanitizeTrackId(music.trackId)) || "stack-sprint";
    const customUrl = api ? api.sanitizeHttpsUrl(music.customUrl) : "";
    const volume = api ? api.clampVolume(music.volume) : base.music.volume;
    return {
      background,
      music: { trackId, customUrl, volume },
      graphics: source.graphics === "simple" ? "simple" : "advanced",
    };
  }

  function shareablePrefs(prefs) {
    const safe = sanitizePrefs(prefs);
    if (safe.background.mode === "image") {
      safe.background = { mode: "preset", presetId: "navy", css: BG_PRESETS[0].css, image: "" };
    }
    safe.music.customUrl = "";
    if (safe.music.trackId === "custom") safe.music.trackId = "stack-sprint";
    return safe;
  }

  function loadPrefs() {
    try {
      const raw = readStore(STORAGE.prefs);
      if (!raw) return defaultPrefs();
      return sanitizePrefs(JSON.parse(raw));
    } catch (_err) {
      return defaultPrefs();
    }
  }

  function savePrefs(prefs) {
    try {
      writeStore(STORAGE.prefs, JSON.stringify(sanitizePrefs(prefs)));
    } catch (_err) {
      /* private mode */
    }
  }

  function randomGradient() {
    const hues = [
      Math.floor(Math.random() * 360),
      Math.floor(Math.random() * 360),
      Math.floor(Math.random() * 360),
    ];
    return `linear-gradient(${120 + Math.floor(Math.random() * 80)}deg, hsl(${hues[0]} 42% 14%), hsl(${hues[1]} 48% 22%) 55%, hsl(${hues[2]} 40% 10%))`;
  }

  function prefersReducedMotion() {
    return Boolean(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function gemPath(ctx, cx, cy, r) {
    // Faceted jewel silhouette (octagon-ish diamond)
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.72, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.72, cy + r * 0.35);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.72, cy + r * 0.35);
    ctx.lineTo(cx - r * 0.72, cy - r * 0.35);
    ctx.closePath();
  }

  function drawLogoMark(ctx, mark, cx, cy, size, ink) {
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1.2, size * 0.07);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const s = size * 0.28;

    if (mark === "html") {
      ctx.font = `700 ${Math.floor(size * 0.28)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("</>", cx, cy + 1);
    } else if (mark === "css") {
      ctx.font = `700 ${Math.floor(size * 0.32)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("#", cx, cy + 1);
    } else if (mark === "js") {
      ctx.font = `800 ${Math.floor(size * 0.34)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("JS", cx, cy + 1);
    } else if (mark === "ts") {
      ctx.font = `800 ${Math.floor(size * 0.34)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TS", cx, cy + 1);
    } else if (mark === "react") {
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 1.35, s * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 1.35, s * 0.55, Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 1.35, s * 0.55, -Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark === "php") {
      ctx.font = `700 ${Math.floor(size * 0.26)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PHP", cx, cy + 1);
    } else if (mark === "wp") {
      ctx.beginPath();
      ctx.arc(cx, cy, s * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `700 ${Math.floor(size * 0.28)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("W", cx, cy + 1);
    } else if (mark === "git") {
      // branching nodes
      ctx.beginPath();
      ctx.arc(cx - s * 0.55, cy + s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.55, cy - s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.55, cy + s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.55, cy + s * 0.55);
      ctx.lineTo(cx + s * 0.55, cy + s * 0.55);
      ctx.lineTo(cx + s * 0.55, cy - s * 0.55);
      ctx.stroke();
    } else if (mark === "node") {
      // hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const ang = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + Math.cos(ang) * s * 1.15;
        const py = cy + Math.sin(ang) * s * 1.15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.font = `700 ${Math.floor(size * 0.22)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("n", cx, cy + 1);
    } else if (mark === "npm") {
      roundedRect(ctx, cx - s * 1.1, cy - s * 0.7, s * 2.2, s * 1.4, 2);
      ctx.stroke();
      ctx.font = `800 ${Math.floor(size * 0.22)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("npm", cx, cy + 1);
    } else if (mark === "vue") {
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.95);
      ctx.lineTo(cx - s * 1.05, cy - s * 0.85);
      ctx.lineTo(cx - s * 0.35, cy - s * 0.85);
      ctx.lineTo(cx, cy - s * 0.05);
      ctx.lineTo(cx + s * 0.35, cy - s * 0.85);
      ctx.lineTo(cx + s * 1.05, cy - s * 0.85);
      ctx.closePath();
      ctx.stroke();
    } else if (mark === "python") {
      ctx.font = `800 ${Math.floor(size * 0.28)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Py", cx, cy + 1);
    } else if (mark === "docker") {
      roundedRect(ctx, cx - s * 0.9, cy - s * 0.15, s * 1.8, s * 0.85, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.55, cy - s * 0.15);
      ctx.lineTo(cx - s * 0.55, cy - s * 0.55);
      ctx.lineTo(cx + s * 0.55, cy - s * 0.55);
      ctx.lineTo(cx + s * 0.55, cy - s * 0.15);
      ctx.stroke();
    } else if (mark === "sql") {
      ctx.font = `800 ${Math.floor(size * 0.26)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SQL", cx, cy + 1);
    }
  }

  function drawGem(ctx, x, y, size, kind, opts) {
    const o = opts || {};
    const meta = META[kind];
    if (!meta) return;
    const advanced = o.advanced !== false;
    const pulse = o.pulse || 0;
    const selected = Boolean(o.selected);
    const hinted = Boolean(o.hinted);
    const scale = o.scale == null ? 1 : o.scale;
    const alpha = o.alpha == null ? 1 : o.alpha;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = (size * 0.38) * scale;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (advanced) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      gemPath(ctx, cx + 1.5, cy + 2.5, r);
      ctx.fill();
    }

    if (pulse > 0 || selected || hinted) {
      ctx.shadowColor = meta.accent;
      ctx.shadowBlur = size * (0.35 + pulse * 0.55 + (selected ? 0.25 : 0));
    }

    const body = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    body.addColorStop(0, meta.accent);
    body.addColorStop(0.45, meta.color);
    body.addColorStop(1, shade(meta.color, -35));
    gemPath(ctx, cx, cy, r);
    ctx.fillStyle = body;
    ctx.fill();

    if (advanced) {
      // facet lines
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r * 0.72, cy - r * 0.35);
      ctx.lineTo(cx + r * 0.72, cy + r * 0.35);
      ctx.moveTo(cx + r * 0.72, cy - r * 0.35);
      ctx.lineTo(cx - r * 0.72, cy + r * 0.35);
      ctx.stroke();

      // specular
      const shine = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 1, cx - r * 0.2, cy - r * 0.3, r * 0.9);
      shine.addColorStop(0, "rgba(255,255,255,0.65)");
      shine.addColorStop(0.35, "rgba(255,255,255,0.18)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      gemPath(ctx, cx, cy, r);
      ctx.fillStyle = shine;
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = Math.max(1, size * 0.03);
      gemPath(ctx, cx, cy, r);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    drawLogoMark(ctx, meta.mark, cx, cy + size * 0.02, size * scale, meta.ink || "#fff");

    if (selected) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, size * 0.05);
      roundedRect(ctx, x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88, size * 0.16);
      ctx.stroke();
    }
    if (hinted && !selected) {
      ctx.strokeStyle = meta.accent;
      ctx.lineWidth = Math.max(2, size * 0.045);
      ctx.setLineDash([4, 3]);
      roundedRect(ctx, x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84, size * 0.16);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function shade(hex, amt) {
    const n = hex.replace("#", "");
    const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function createSfxEngine() {
    let audioCtx = null;
    function ctx() {
      if (typeof AudioContext === "undefined") return null;
      audioCtx = audioCtx || new AudioContext();
      return audioCtx;
    }
    function tone(freq, dur, type, gainVal, slide) {
      const ac = ctx();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = ac.currentTime;
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      gain.gain.setValueAtTime(gainVal || 0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    function play(kind) {
      try {
        if (kind === "move") tone(420, 0.06, "square", 0.03);
        else if (kind === "rotate") {
          tone(560, 0.07, "triangle", 0.04);
          tone(720, 0.08, "triangle", 0.025, 900);
        } else if (kind === "clear") {
          tone(520, 0.1, "triangle", 0.05);
          tone(780, 0.14, "triangle", 0.04, 980);
        } else if (kind === "squash") {
          tone(360, 0.09, "square", 0.045, 280);
          tone(640, 0.12, "triangle", 0.04);
        } else if (kind === "deploy") {
          [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle", 0.05), i * 70));
        } else if (kind === "level") {
          tone(440, 0.12, "square", 0.04);
          setTimeout(() => tone(660, 0.16, "square", 0.045), 90);
          setTimeout(() => tone(880, 0.2, "triangle", 0.05), 180);
        } else if (kind === "badge") {
          tone(880, 0.1, "sine", 0.04);
          setTimeout(() => tone(1320, 0.14, "sine", 0.035), 80);
        } else if (kind === "start") {
          tone(392, 0.1, "triangle", 0.04);
          setTimeout(() => tone(523, 0.14, "triangle", 0.045), 90);
        } else tone(440, 0.08, "square", 0.03);
      } catch (_err) {
        /* ignore */
      }
    }
    return { play, ctx };
  }

  function createMusicEngine() {
    let audioCtx = null;
    let master = null;
    let nodes = [];
    let timer = 0;
    let style = "chip";
    let playing = false;
    let volume = 0.35;
    let htmlAudio = null;
    let previewTimer = 0;

    function ensure() {
      if (typeof AudioContext === "undefined") return null;
      audioCtx = audioCtx || new AudioContext();
      if (!master) {
        master = audioCtx.createGain();
        master.gain.value = volume;
        master.connect(audioCtx.destination);
      }
      return audioCtx;
    }

    function stopGenerated() {
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch (_e) {
          /* */
        }
        try {
          n.disconnect();
        } catch (_e2) {
          /* */
        }
      });
      nodes = [];
      if (timer) {
        clearInterval(timer);
        timer = 0;
      }
    }

    function stopAll() {
      stopGenerated();
      if (previewTimer) {
        clearTimeout(previewTimer);
        previewTimer = 0;
      }
      if (htmlAudio) {
        htmlAudio.pause();
        htmlAudio.src = "";
        htmlAudio = null;
      }
      playing = false;
    }

    function setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume;
      if (htmlAudio) htmlAudio.volume = volume;
    }

    function blip(ctx, freq, type, start, dur, amp) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(amp, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + dur + 0.02);
      nodes.push(osc);
    }

    function scheduleChip(ctx) {
      const t = ctx.currentTime;
      [196, 247, 294, 392, 294, 247].forEach((freq, i) => blip(ctx, freq, "square", t + i * 0.22, 0.18, 0.05));
    }

    function runStyle(ctx) {
      if (style === "pad") {
        const now = ctx.currentTime;
        [130.81, 164.81, 196].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.03 - i * 0.005, now + 0.8);
          gain.gain.linearRampToValueAtTime(0.0001, now + 2.4);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 2.5);
          nodes.push(osc);
        });
      } else if (style === "arcade") {
        const now = ctx.currentTime;
        [262, 330, 392, 523, 392, 330, 294, 262].forEach((freq, i) => blip(ctx, freq, "square", now + i * 0.14, 0.12, 0.045));
      } else if (style === "pulse") {
        const now = ctx.currentTime;
        for (let i = 0; i < 4; i += 1) blip(ctx, i % 2 === 0 ? 98 : 147, "triangle", now + i * 0.35, 0.28, 0.06);
      } else if (style === "ambient") {
        const now = ctx.currentTime;
        [110, 138.59, 164.81].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.value = 0.018 - i * 0.003;
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 3.2);
          nodes.push(osc);
        });
      } else if (style === "glitch") {
        const now = ctx.currentTime;
        for (let i = 0; i < 10; i += 1) {
          blip(ctx, 180 + Math.random() * 640, Math.random() > 0.5 ? "sawtooth" : "square", now + i * 0.09, 0.06, 0.035);
        }
      } else scheduleChip(ctx);
    }

    function startGenerated(nextStyle) {
      const ctx = ensure();
      if (!ctx) return false;
      stopAll();
      style = nextStyle || style;
      playing = true;
      const beat = () => {
        if (!playing) return;
        stopGenerated();
        playing = true;
        runStyle(ctx);
      };
      beat();
      timer = setInterval(beat, style === "pad" || style === "ambient" ? 2800 : style === "arcade" ? 1200 : 1400);
      return true;
    }

    function startUrl(url) {
      stopAll();
      const safe = safeAudioUrl(url);
      if (!safe) return false;
      htmlAudio = new Audio(safe);
      htmlAudio.loop = true;
      htmlAudio.volume = volume;
      htmlAudio.play().catch(() => startGenerated("ambient"));
      playing = true;
      return true;
    }

    function previewGenerated(nextStyle, ms) {
      const ctx = ensure();
      if (!ctx) return false;
      const wasPlaying = playing;
      const prevStyle = style;
      stopGenerated();
      style = nextStyle || "chip";
      playing = true;
      runStyle(ctx);
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        stopGenerated();
        playing = wasPlaying;
        style = prevStyle;
        if (wasPlaying) startGenerated(prevStyle);
      }, ms || 1800);
      return true;
    }

    return {
      setVolume,
      stop: stopAll,
      playGenerated: startGenerated,
      playUrl: startUrl,
      previewGenerated,
      get playing() {
        return playing;
      },
    };
  }

  function patternForBackground(bg) {
    if (bg.mode === "preset") {
      const preset = BG_PRESETS.find((p) => p.id === bg.presetId);
      return (preset && preset.pattern) || "drift";
    }
    if (bg.mode === "image") return "sway";
    return "orbit";
  }

  function mountDevClouds(host, pattern, level, pathwayId, phase, challengeIndex) {
    if (!host) return;
    const lesson = lessonFor(level || 1, pathwayId, phase, challengeIndex);
    const path = pathwayId ? pathwayFor(pathwayId) : null;
    // Background words stay on-topic for the current lesson (learning path).
    const lessonClouds = (lesson.clouds || []).slice();
    const pathClouds = (path && path.clouds) || [];
    const pool = (lessonClouds.length ? lessonClouds : pathClouds).slice();
    if (!pool.length) pool.push("learn", "build", "ship");
    const tokens = [];
    for (let i = 0; i < 28; i += 1) {
      tokens.push({
        text: pool[i % pool.length],
        lang: path ? path.id : "lesson",
        lesson: true,
      });
    }
    host.className = `dev-clouds pattern-${pattern || (path && path.pattern) || "drift"}`;
    host.setAttribute("data-dev-clouds", "");
    host.setAttribute("data-lesson", lesson.id || "");
    host.setAttribute("aria-hidden", "true");
    host.replaceChildren();
    tokens.forEach((token, index) => {
      const span = document.createElement("span");
      span.className = "dev-cloud";
      span.textContent = token.text;
      const col = index % 7;
      const row = Math.floor(index / 7);
      span.style.left = `${4 + col * 13 + Math.random() * 6}%`;
      span.style.top = `${8 + row * 18 + Math.random() * 8}%`;
      span.style.animationDelay = `${(-Math.random() * 18).toFixed(2)}s`;
      span.style.animationDuration = `${12 + Math.random() * 16}s`;
      span.style.fontSize = `${0.65 + Math.random() * 0.75}rem`;
      span.style.opacity = String(0.28 + Math.random() * 0.4);
      span.dataset.lang = token.lang || "dev";
      if (path && path.accent) span.style.color = path.accent;
      host.appendChild(span);
    });
  }

  function refreshDevCloudText(doc, level, pathwayId, phase, challengeIndex) {
    const rootDoc = doc || (typeof document !== "undefined" ? document : null);
    if (!rootDoc) return;
    const lesson = lessonFor(level || 1, pathwayId, phase, challengeIndex);
    const path = pathwayId ? pathwayFor(pathwayId) : null;
    // Keep floating words on the current lesson — do not mix in pathway flavor words.
    const lessonClouds = (lesson.clouds || []).slice();
    const pathClouds = (path && path.clouds) || [];
    const pool = (lessonClouds.length ? lessonClouds : pathClouds).slice();
    if (!pool.length) return;
    rootDoc.querySelectorAll("[data-dev-clouds] .dev-cloud").forEach((el) => {
      el.textContent = pool[Math.floor(Math.random() * pool.length)];
      el.dataset.lang = path ? path.id : "lesson";
      if (path && path.accent) el.style.color = path.accent;
      else el.style.color = "";
    });
  }

  function ensureDevCloudHost(rootEl) {
    if (!rootEl || !rootEl.querySelector) return document.querySelector("[data-dev-clouds]");
    let host = rootEl.querySelector("[data-dev-clouds]");
    if (host) return host;
    const boardWrap = rootEl.querySelector(".board-wrap");
    if (boardWrap) {
      host = document.createElement("div");
      host.setAttribute("data-dev-clouds", "");
      host.setAttribute("aria-hidden", "true");
      boardWrap.insertBefore(host, boardWrap.firstChild);
      return host;
    }
    return document.querySelector("[data-dev-clouds]");
  }

  function safeAudioUrl(url) {
    if (!url || typeof url !== "string") return "";
    try {
      const parsed = new URL(url, typeof location !== "undefined" ? location.href : "https://matthummel.com/");
      const sameOrigin =
        typeof location !== "undefined" &&
        parsed.origin === location.origin &&
        (parsed.protocol === "http:" || parsed.protocol === "https:");
      if (sameOrigin && !parsed.username && !parsed.password) return parsed.href;
      const api = securityApi();
      return api ? api.sanitizeHttpsUrl(url) : "";
    } catch (_err) {
      return "";
    }
  }

  function applyBackground(bg, rootEl) {
    const safe = sanitizePrefs({ background: bg, music: defaultPrefs().music, graphics: "advanced" }).background;
    const target = document.documentElement;
    let value = BG_PRESETS[0].css;
    if (safe.mode === "image" && safe.image) {
      value = `linear-gradient(rgba(7,17,31,.55), rgba(7,17,31,.72)), url("${safe.image}") center / cover no-repeat fixed`;
    } else if (safe.mode === "css" && safe.css) {
      value = safe.css;
    } else if (safe.mode === "preset") {
      const preset = BG_PRESETS.find((p) => p.id === safe.presetId) || BG_PRESETS[0];
      value = preset.css;
    }
    target.style.setProperty("--gb-backdrop", value);
    const pattern = patternForBackground(bg);
    target.dataset.gbPattern = pattern;
    if (rootEl && rootEl.closest) {
      const embed = rootEl.closest(".git-blocks-embed");
      if (embed) {
        embed.style.setProperty("--gb-backdrop", value);
        embed.dataset.gbPattern = pattern;
      }
      mountDevClouds(
        ensureDevCloudHost(rootEl),
        pattern,
        (rootEl && rootEl._gbLevel) || 1,
        rootEl && rootEl._gbPathway,
        rootEl && rootEl._gbPhase,
        rootEl && rootEl._gbChallenge
      );
    }
  }

  function readConfig() {
    const cfg = (typeof window !== "undefined" && window.GitBlocksConfig) || {};
    const fallback =
      typeof location !== "undefined" ? `${location.origin}${location.pathname}` : "https://matthummel.com/git-blocks/";
    const api = securityApi();
    return {
      shareUrl: api && api.safeShareBase ? api.safeShareBase(cfg.shareUrl, fallback) : fallback,
      autoStart: cfg.autoStart === true,
      layout: cfg.layout || "viewport",
    };
  }

  function encodeShareHash(prefs, includePrefs) {
    if (!includePrefs) return "";
    const safe = shareablePrefs(prefs);
    const payload = {
      bg: safe.background,
      music: { trackId: safe.music.trackId, customUrl: "", volume: safe.music.volume },
    };
    try {
      return `#gb=${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
    } catch (_err) {
      return "";
    }
  }

  function decodeShareHash() {
    if (typeof location === "undefined") return null;
    const m = location.hash.match(/#gb=([^&]+)/);
    if (!m || m[1].length > 4000) return null;
    try {
      return JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    } catch (_err) {
      return null;
    }
  }

  function boot(root, options) {
    if (!root || typeof document === "undefined") return null;
    const canvas = root.querySelector("[data-board]");
    if (!canvas) return null;

    const cfg = Object.assign({}, readConfig(), options || {});
    const prefs = loadPrefs();
    const shared = decodeShareHash();
    if (shared) {
      const safeShared = shareablePrefs({
        background: shared.bg || prefs.background,
        music: shared.music || prefs.music,
        graphics: prefs.graphics,
      });
      if (shared.bg) prefs.background = safeShared.background;
      if (shared.music) prefs.music = safeShared.music;
    }

    const overlay = root.querySelector("[data-overlay]");
    const overlayTitle = root.querySelector("[data-overlay-title]");
    const overlayBody = root.querySelector("[data-overlay-body]");
    const overlayLevel = root.querySelector("[data-overlay-level]");
    const playBtn = root.querySelector("[data-play]");
    const messageEl = root.querySelector("[data-message]");
    const scoreEl = root.querySelector("[data-score]");
    const linesEl = root.querySelector("[data-lines]");
    const levelEl = root.querySelector("[data-level]");
    const highEl = root.querySelector("[data-high]");
    const liveEl = root.querySelector("[data-live]");
    const muteBtn = root.querySelector("[data-mute]");
    const pauseBtn = root.querySelector("[data-pause]");
    const customizeBtn = root.querySelector("[data-customize]");
    const shareBtn = root.querySelector("[data-share]");
    const panel = root.querySelector("[data-customize-panel]");

    let high = Number(readStore(STORAGE.high) || 0);
    if (!Number.isFinite(high) || high < 0) high = 0;

    const game = createGame({ reducedMotion: prefersReducedMotion() });
    root._branchborneGame = game;
    let applyingRemote = false;

    function readLocalProgress() {
      try {
        const raw = readStore(STORAGE.progress);
        return raw ? JSON.parse(raw) : null;
      } catch (_err) {
        return null;
      }
    }

    function writeLocalProgress(save) {
      writeStore(STORAGE.progress, JSON.stringify(save));
    }

    function progressWorthKeeping(save) {
      if (!save) return false;
      return Boolean(
        save.pathwayId ||
          save.score > 0 ||
          save.bestScore > 0 ||
          (save.trophies && save.trophies.length) ||
          (save.loot && save.loot.length) ||
          save.status === "paused" ||
          save.status === "over"
      );
    }

    const storedProgress = canonicalCloudSave(readLocalProgress());
    if (progressWorthKeeping(storedProgress)) {
      game.restoreCloudSave(storedProgress);
      high = Math.max(high, storedProgress.bestScore || 0);
    }

    function persistSnapshot(snap) {
      const best = Math.max(high, snap && snap.linesOfCode ? snap.linesOfCode : 0);
      high = best;
      writeStore(STORAGE.high, String(high));
      const save = cloudSaveFromSnapshot(snap, best);
      writeLocalProgress(save);
      return save;
    }

    game.setProgressHook((snap, reason) => {
      if (applyingRemote) return;
      const save = persistSnapshot(snap);
      if (typeof root._branchborneCloudPush === "function") {
        root._branchborneCloudPush(save, reason);
      }
    });

    root._branchborneRemember = (save) => {
      const canonical = canonicalCloudSave(save);
      if (!canonical) return;
      high = Math.max(high, canonical.bestScore || 0);
      writeStore(STORAGE.high, String(high));
      writeLocalProgress(canonical);
    };
    root._branchborneReadProgress = () => canonicalCloudSave(readLocalProgress());
    root._branchborneScope = () => activeScope;
    root._branchborneSetScope = (userId) => {
      const next = isPlayerUuid(userId) ? String(userId).toLowerCase() : "guest";
      if (next === activeScope) return activeScope;
      activeScope = next;
      applyingRemote = true;
      try {
        const stored = canonicalCloudSave(readLocalProgress());
        if (progressWorthKeeping(stored)) {
          game.restoreCloudSave(stored);
          high = Math.max(0, stored.bestScore || 0);
        } else {
          game.reopenClassSelect();
          high = Number(readStore(STORAGE.high) || 0);
          if (!Number.isFinite(high) || high < 0) high = 0;
        }
        const nextPrefs = loadPrefs();
        prefs.background = nextPrefs.background;
        prefs.music = nextPrefs.music;
        prefs.graphics = nextPrefs.graphics;
        applyBackground(prefs.background, root);
        root.classList.toggle("gfx-simple", prefs.graphics === "simple");
        if (highEl) highEl.textContent = String(high);
      } finally {
        applyingRemote = false;
      }
      return activeScope;
    };
    const ctx = canvas.getContext("2d");
    const music = createMusicEngine();
    const sfx = createSfxEngine();
    let muted = false;
    let raf = 0;
    let lastLevelShown = game.snapshot().level || 1;
    let autoStarted = false;
    const particles = [];
    let flashCells = [];
    let anims = [];
    let sparkle = 0;

    applyBackground(prefs.background, root);
    music.setVolume(prefs.music.volume || 0.35);
    root.classList.toggle("gfx-simple", prefs.graphics === "simple");
    const bootSnap = game.snapshot();
    root._gbLevel = bootSnap.level || 1;
    root._gbPathway = bootSnap.pathwayId || null;
    root._gbPhase = bootSnap.phase || "path";
    root._gbChallenge = bootSnap.challengeIndex || 0;

    if (!prefersReducedMotion()) {
      window.setInterval(() => {
        refreshDevCloudText(
          root.ownerDocument,
          root._gbLevel || 1,
          root._gbPathway,
          root._gbPhase,
          root._gbChallenge
        );
      }, 4200);
    }

    function beep(kind) {
      if (muted) return;
      sfx.play(kind);
    }

    function announce(text) {
      if (liveEl) liveEl.textContent = text;
    }

    function dismissFactOverlay() {
      const backdrop = root.querySelector("[data-fact-backdrop]");
      const toast = root.querySelector("[data-fact-toast]");
      if (backdrop) backdrop.classList.remove("is-visible");
      if (toast) toast.classList.remove("is-visible");
      window.clearTimeout(showFactToast._timer);
    }

    function showFactToast() {
      // Retired: web-dev facts only appear as the quest-column tip.
      dismissFactOverlay();
    }

    function showLessonIntro(intro) {
      if (!intro) return;
      let backdrop = root.querySelector("[data-lesson-backdrop]");
      if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "lesson-backdrop";
        backdrop.setAttribute("data-lesson-backdrop", "");
        const boardWrap = root.querySelector(".board-wrap") || root;
        boardWrap.appendChild(backdrop);
      }
      let card = root.querySelector("[data-lesson-intro]");
      if (!card) {
        card = document.createElement("div");
        card.className = "lesson-intro quest-frame";
        card.setAttribute("data-lesson-intro", "");
        card.setAttribute("role", "dialog");
        card.setAttribute("aria-modal", "true");
        card.setAttribute("aria-label", "Available quest");
        const boardWrap = root.querySelector(".board-wrap") || root;
        boardWrap.appendChild(card);
      }
      card.className = "lesson-intro quest-frame";
      const total = intro.total || CURRICULUM.length;
      const step = intro.level || 1;
      const pct = Math.round((step / Math.max(1, total)) * 100);
      const goal = intro.goal || 600;
      const moves = intro.moves != null ? intro.moves : "—";
      const giver = intro.pathway || "Path Mentor";
      const lore =
        (intro.facts && intro.facts[0]) ||
        "Clear matching logo gems — each clear teaches a web-dev fact for this quest.";
      const skillLine = intro.skill
        ? `${intro.skill.icon || "★"} ${intro.skill.name}`
        : "Pathway skill";
      const skillBlurb = (intro.skill && intro.skill.blurb) || "Master this chapter of the craft.";

      card.innerHTML = `
        <div class="quest-bang" aria-hidden="true">!</div>
        <header class="quest-header">
          <p class="quest-availability">${intro.start ? "Available Quest" : "Quest Complete — Next Chapter"}</p>
          <h3 class="quest-title">${escapeHtml(intro.title || "Untitled Quest")}</h3>
          <p class="quest-zone">${escapeHtml(intro.track || "Path")} · ${escapeHtml(intro.rank || "Intern")} · Chapter ${step}/${total}</p>
        </header>
        <div class="quest-scroll">
          <p class="quest-giver"><span>Quest giver</span> ${escapeHtml(giver)}</p>
          <p class="quest-desc">${escapeHtml(lore)}</p>
          <p class="quest-desc muted">${escapeHtml(skillBlurb)} Walk the path toward <strong>Senior Developer</strong>.</p>
          <h4 class="quest-section">Objectives</h4>
          <ul class="quest-objectives">
            <li><span class="quest-check" aria-hidden="true"></span> Write <strong>${goal} LOC</strong> by matching logo gems</li>
            <li><span class="quest-check" aria-hidden="true"></span> Survive on <strong>${moves} moves</strong> (or earn more)</li>
            <li><span class="quest-check" aria-hidden="true"></span> Study the lore — every clear reveals a web-dev fact</li>
            <li><span class="quest-check" aria-hidden="true"></span> Claim skill reward: <strong>${escapeHtml(skillLine)}</strong></li>
          </ul>
          <h4 class="quest-section">Rewards</h4>
          <div class="quest-rewards">
            <div class="quest-reward-item">
              <em>Skill</em>
              <strong>${escapeHtml(skillLine)}</strong>
            </div>
            <div class="quest-reward-item">
              <em>Rank track</em>
              <strong>${escapeHtml(intro.rank || "Intern")} → Senior</strong>
            </div>
            <div class="quest-reward-item">
              <em>Chapter</em>
              <strong>${step} / ${total}</strong>
            </div>
          </div>
          <div class="quest-progress" aria-hidden="true"><span data-quest-meter></span></div>
          <div class="fact-cloud-chips quest-chips"></div>
        </div>
        <footer class="quest-actions">
          <button type="button" class="quest-decline" data-quest-decline>Decline</button>
          <button type="button" class="quest-accept" data-quest-accept>${
            intro.start ? "Accept Quest" : "Continue Quest"
          }</button>
        </footer>
      `;
      const meter = card.querySelector("[data-quest-meter]");
      if (meter) meter.style.width = `${Math.max(0, Math.min(100, Number(pct) || 0))}%`;
      const chips = card.querySelector(".quest-chips");
      (intro.clouds || []).forEach((word) => {
        const chip = document.createElement("span");
        chip.textContent = word;
        chips.appendChild(chip);
      });
      const dismiss = () => {
        card.classList.remove("is-visible");
        backdrop.classList.remove("is-visible");
      };
      card.querySelector("[data-quest-accept]").addEventListener("click", dismiss);
      card.querySelector("[data-quest-decline]").addEventListener("click", dismiss);
      backdrop.onclick = dismiss;
      backdrop.classList.add("is-visible");
      card.classList.add("is-visible");
      window.clearTimeout(showLessonIntro._timer);
      // WoW-style: stay open until Accept — soft timeout as safety net only
      showLessonIntro._timer = window.setTimeout(dismiss, 45000);
    }

    function showSkillUnlock(skill) {
      if (!skill) return;
      let banner = root.querySelector("[data-skill-unlock]");
      if (!banner) {
        banner = document.createElement("div");
        banner.className = "skill-unlock";
        banner.setAttribute("data-skill-unlock", "");
        banner.setAttribute("role", "status");
        const boardWrap = root.querySelector(".board-wrap") || root;
        boardWrap.appendChild(banner);
      }
      banner.innerHTML = "";
      const icon = document.createElement("span");
      icon.className = "skill-unlock-icon";
      icon.textContent = skill.icon || "★";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `Skill unlocked — ${skill.name}`;
      const blurb = document.createElement("p");
      blurb.textContent = skill.blurb || skill.lesson || "";
      copy.append(title, blurb);
      banner.append(icon, copy);
      banner.classList.add("is-visible");
      window.clearTimeout(showSkillUnlock._timer);
      showSkillUnlock._timer = window.setTimeout(() => banner.classList.remove("is-visible"), 3800);
    }

    function paintSkills(skills) {
      const host = root.querySelector("[data-skills]");
      if (!host) return;
      host.replaceChildren();
      (skills || []).forEach((skill) => {
        const chip = document.createElement("span");
        chip.className = "skill-chip";
        chip.title = skill.blurb || skill.name || "";
        const icon = document.createElement("em");
        icon.textContent = skill.icon || "★";
        chip.append(icon, document.createTextNode(` ${skill.name || ""}`));
        host.appendChild(chip);
      });
    }

    function applyPathwayTheme(pathway) {
      if (!pathway) {
        root.removeAttribute("data-pathway");
        root.style.removeProperty("--pathway-accent");
        root.style.removeProperty("--pathway-secondary");
        return;
      }
      root.setAttribute(
        "data-pathway",
        safeToken(pathway.id, ["frontend", "backend", "wordpress", "fullstack"], "frontend")
      );
      root.style.setProperty("--pathway-accent", safeHex(pathway.accent, "#4f8fd4"));
      root.style.setProperty("--pathway-secondary", safeHex(pathway.secondary || pathway.accent, "#4f8fd4"));
      document.documentElement.style.setProperty("--gb-backdrop", pathway.backdrop);
      document.documentElement.dataset.gbPattern = pathway.pattern || "drift";
      const embed = root.closest(".git-blocks-embed");
      if (embed) {
        embed.style.setProperty("--gb-backdrop", pathway.backdrop);
        embed.dataset.gbPattern = pathway.pattern || "drift";
      }
    }

    function ensureHeroPanel() {
      let hero = root.querySelector("[data-hero]");
      if (hero) return hero;
      const side = root.querySelector(".side");
      if (!side) return null;
      hero = document.createElement("div");
      hero.className = "hero-panel";
      hero.setAttribute("data-hero", "");
      const insertBefore = side.querySelector(".stats-row") || side.firstChild;
      side.insertBefore(hero, insertBefore);
      return hero;
    }

    function paintHero(snap) {
      const hero = ensureHeroPanel();
      if (!hero) return;
      const path = snap.pathway;
      if (!path) {
        hero.hidden = true;
        hero.dataset.sig = "";
        return;
      }
      hero.hidden = false;
      const char = path.character || {};
      const pulsing = snap.characterPulse && Date.now() - snap.characterPulse < 700;
      const signature = `${path.id}:${char.silhouette}:${pulsing ? "1" : "0"}`;
      if (hero.dataset.sig === signature) return;
      hero.dataset.sig = signature;
      hero.innerHTML = "";
      hero.className = `hero-panel hero-${char.silhouette || "ranger"} idle-${char.idle || "float"}${
        pulsing ? " is-pulsing" : ""
      }`;
      const figure = document.createElement("div");
      figure.className = "hero-figure";
      figure.setAttribute("aria-hidden", "true");
      figure.innerHTML = cartoonCharacterMarkup(char.silhouette, char.colors, char.idle);
      const meta = document.createElement("div");
      meta.className = "hero-meta";
      const nameEl = document.createElement("strong");
      nameEl.textContent = path.name || "";
      const roleEl = document.createElement("span");
      roleEl.textContent = path.role || "";
      const powerEl = document.createElement("span");
      powerEl.className = "hero-power";
      powerEl.textContent = (path.power && path.power.name) || "Class power";
      const blurbEl = document.createElement("span");
      blurbEl.className = "hero-power-blurb";
      blurbEl.textContent = (path.power && path.power.blurb) || "";
      meta.append(nameEl, roleEl, powerEl, blurbEl);
      hero.appendChild(figure);
      hero.appendChild(meta);
    }

    function paintMana(snap) {
      let row = root.querySelector("[data-mana-row]");
      if (!row) {
        const side = root.querySelector(".side");
        if (!side) return;
        row = document.createElement("div");
        row.className = "mana-row";
        row.setAttribute("data-mana-row", "");
        row.innerHTML = `
          <div class="mana-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Class mana">
            <span data-mana-fill></span>
          </div>
          <button type="button" class="ghost" data-cast-power disabled>Cast power</button>
        `;
        const powerRow = side.querySelector(".power-row");
        if (powerRow) side.insertBefore(row, powerRow);
        else side.appendChild(row);
        const castBtn = row.querySelector("[data-cast-power]");
        if (castBtn) {
          castBtn.addEventListener("click", () => {
            const result = game.castPower();
            if (result && result.ok) {
              (result.sounds || []).forEach((s) => beep(s));
              announce((result.power && result.power.name) || "Power cast");
            }
          });
        }
      }
      const fill = row.querySelector("[data-mana-fill]");
      const castBtn = row.querySelector("[data-cast-power]");
      const pct = Math.max(0, Math.min(100, Math.round(((snap.mana || 0) / Math.max(1, snap.manaMax || 100)) * 100)));
      if (fill) fill.style.width = `${pct}%`;
      const bar = row.querySelector(".mana-bar");
      if (bar) bar.setAttribute("aria-valuenow", String(pct));
      if (castBtn) {
        const powerName = (snap.pathway && snap.pathway.power && snap.pathway.power.name) || "Cast power";
        castBtn.textContent = snap.powerReady ? `Cast ${powerName}` : `${powerName} (${pct}%)`;
        castBtn.disabled = snap.status !== "playing" || !snap.powerReady;
        castBtn.classList.toggle("is-ready", !!snap.powerReady);
      }
      let boss = root.querySelector("[data-boss-row]");
      if (snap.phase === "endgame") {
        if (!boss) {
          boss = document.createElement("div");
          boss.className = "boss-row";
          boss.setAttribute("data-boss-row", "");
          boss.innerHTML = `<span>Raid HP</span><strong data-boss-hp>0</strong>`;
          row.after(boss);
        }
        boss.hidden = false;
        const hpEl = boss.querySelector("[data-boss-hp]");
        if (hpEl) hpEl.textContent = String(Math.max(0, snap.bossHp || 0));
      } else if (boss) {
        boss.hidden = true;
      }
    }

    function paintClassSelect(snap) {
      let host = root.querySelector("[data-class-select]");
      if (snap.status !== "class-select") {
        if (host) {
          host.hidden = true;
          host.replaceChildren();
          delete host.dataset.built;
        }
        return;
      }
      if (!host) {
        host = document.createElement("div");
        host.className = "class-select";
        host.setAttribute("data-class-select", "");
        const overlayInner = overlay && overlay.querySelector("div");
        if (overlayInner) overlayInner.appendChild(host);
        else if (overlay) overlay.appendChild(host);
      }
      host.hidden = false;
      // Rebuild only once per class-select session — recreating every frame
      // killed clicks and reset animations (broken start menu).
      if (host.dataset.built === "1") return;
      host.dataset.built = "1";
      host.replaceChildren();

      const pickPath = (pathwayId, label) => {
        if (!game.choosePathway(pathwayId)) return;
        const path = pathwayFor(pathwayId);
        applyPathwayTheme(path);
        syncLessonClouds(1, pathwayId, "path", 0);
        beep("start");
        announce(label || `${path.name} chosen`);
        handlePlay();
      };

      const classic = document.createElement("button");
      classic.type = "button";
      classic.className = "class-card class-classic";
      classic.style.setProperty("--card-accent", "#4f8fd4");
      classic.innerHTML = `
        <span class="class-card-figure">
          ${cartoonCharacterMarkup("classic", ["#4f8fd4", "#0d2e57", "#e7c35a"], "float")}
        </span>
        <span class="class-card-copy">
          <strong>Classic learning path</strong>
          <em>Intern → Senior Developer</em>
          <span class="class-card-blurb">20 lessons from HTML bones to senior craft. Background words and facts follow each lesson.</span>
          <span class="class-card-gems">Power · Polyglot Pulse · full curriculum</span>
        </span>
      `;
      classic.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        pickPath("fullstack", "Classic path — Intern to Senior");
      });
      host.appendChild(classic);

      PATHWAY_CLASSES.forEach((path) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `class-card class-${safeToken(path.id, ["frontend", "backend", "wordpress", "fullstack"], "frontend")}`;
        card.style.setProperty("--card-accent", safeHex(path.accent, "#4f8fd4"));
        const char = path.character || {};
        card.innerHTML = `
          <span class="class-card-figure">
            ${cartoonCharacterMarkup(char.silhouette, char.colors, char.idle)}
          </span>
          <span class="class-card-copy">
            <strong>${escapeHtml(path.name)}</strong>
            <em>${escapeHtml(path.role)}</em>
            <span class="class-card-blurb">${escapeHtml(path.blurb)}</span>
            <span class="class-card-power">${escapeHtml((path.power && path.power.name) || "Power")} — ${escapeHtml((path.power && path.power.blurb) || "")}</span>
            <span class="class-card-gems">${path.affinity
              .slice(0, 5)
              .map((id) => escapeHtml((META[id] && META[id].label) || id))
              .join(" · ")}</span>
          </span>
        `;
        card.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          pickPath(path.id, `${path.name} chosen`);
        });
        host.appendChild(card);
      });
    }

    function syncLessonClouds(level, pathwayId, phase, challengeIndex) {
      root._gbLevel = level || 1;
      root._gbPathway = pathwayId || root._gbPathway;
      root._gbPhase = phase || root._gbPhase || "path";
      root._gbChallenge = challengeIndex != null ? challengeIndex : root._gbChallenge || 0;
      const path = root._gbPathway ? pathwayFor(root._gbPathway) : null;
      const pattern = (path && path.pattern) || patternForBackground(prefs.background);
      mountDevClouds(
        ensureDevCloudHost(root),
        pattern,
        root._gbLevel,
        root._gbPathway,
        root._gbPhase,
        root._gbChallenge
      );
    }

    function spawnBurst(cells, cellSize) {
      if (prefersReducedMotion()) return;
      cells.forEach((cell) => {
        const color = (META[cell.kind] && META[cell.kind].accent) || "#8ec8ff";
        const base = (META[cell.kind] && META[cell.kind].color) || "#4f8fd4";
        // Bejeweled-style shatter: more shards + sparkle ring
        for (let i = 0; i < 18; i += 1) {
          const ang = (Math.PI * 2 * i) / 18 + Math.random() * 0.2;
          const speed = 3.5 + Math.random() * 5.5;
          particles.push({
            x: (cell.x + 0.5) * cellSize,
            y: (cell.y + 0.5) * cellSize,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed - 1.2,
            life: 1,
            color: i % 2 ? color : base,
            size: 2 + Math.random() * 4.5,
            glow: true,
          });
        }
        for (let i = 0; i < 6; i += 1) {
          particles.push({
            x: (cell.x + 0.5) * cellSize,
            y: (cell.y + 0.5) * cellSize,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.85,
            color: "#ffffff",
            size: 1.5 + Math.random() * 2,
            glow: true,
          });
        }
      });
    }

    function ingestFx(fxList, cellSize) {
      fxList.forEach((fx) => {
        if (fx.type === "match" && fx.cells) {
          flashCells = fx.cells.map((c) => ({ ...c, until: Date.now() + 420 }));
          spawnBurst(fx.cells, cellSize);
          anims.push({ type: "pulse", at: Date.now(), cells: fx.cells });
          anims.push({
            type: "shockwave",
            at: Date.now(),
            x: fx.cells.reduce((s, c) => s + c.x, 0) / fx.cells.length,
            y: fx.cells.reduce((s, c) => s + c.y, 0) / fx.cells.length,
            chain: fx.chain || 1,
          });
        }
        if (fx.type === "bounce") {
          anims.push({ type: "bounce", at: Date.now(), a: fx.a, b: fx.b });
        }
        if (fx.type === "shuffle") {
          anims.push({ type: "shuffle", at: Date.now() });
        }
      });
    }

    function sizeCanvas() {
      const wrap = canvas.parentElement;
      const availW = Math.max(120, wrap.clientWidth - 16);
      const availH = Math.max(160, wrap.clientHeight - 16);
      const cell = Math.max(28, Math.min(Math.floor(availW / COLS), Math.floor(availH / ROWS)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = COLS * cell * dpr;
      canvas.height = ROWS * cell * dpr;
      canvas.style.width = `${COLS * cell}px`;
      canvas.style.height = `${ROWS * cell}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return cell;
    }

    function showLootToast(entry, kind) {
      if (!entry) return;
      let toast = root.querySelector("[data-loot-toast]");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "loot-toast";
        toast.setAttribute("data-loot-toast", "");
        toast.setAttribute("role", "status");
        const boardWrap = root.querySelector(".board-wrap") || root;
        boardWrap.appendChild(toast);
      }
      const toastKind = kind === "trophy" ? "trophy" : "loot";
      toast.className = `loot-toast is-visible is-${toastKind}`;
      toast.replaceChildren();
      const icon = document.createElement("span");
      icon.className = "loot-toast-icon";
      icon.textContent = entry.icon || "★";
      const copy = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent = toastKind === "trophy" ? "Trophy earned" : "Item found";
      const name = document.createElement("p");
      name.textContent = entry.name || "";
      const blurb = document.createElement("em");
      blurb.textContent = entry.blurb || "";
      copy.append(label, name, blurb);
      toast.append(icon, copy);
      window.clearTimeout(showLootToast._timer);
      showLootToast._timer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
    }

    function paintQuestRail(snap) {
      const rail = root.querySelector("[data-quest-rail]");
      if (!rail) return;
      const q = snap.activeQuest;
      if (!q) {
        rail.innerHTML = `
          <div class="quest-rail-empty">
            <p class="quest-bang-sm">!</p>
            <p>Pick a pathway class to open live side quests.</p>
          </div>`;
        rail.classList.remove("has-quest", "is-pulse");
        return;
      }
      const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.goal)) * 100));
      const skillLine = q.skill ? `${q.skill.icon || "★"} ${q.skill.name}` : "Pathway skill";
      rail.classList.add("has-quest");
      if (q.bang || (snap.questPulse && Date.now() - snap.questPulse < 1800)) {
        rail.classList.add("is-pulse");
      } else {
        rail.classList.remove("is-pulse");
      }
      rail.innerHTML = `
        <div class="side-quest-card">
          <div class="side-quest-bang" aria-hidden="true">!</div>
          <p class="side-quest-kicker">${q.phase === "endgame" ? "Raid Quest" : "Available Quest"}</p>
          <h3 class="side-quest-title">${escapeHtml(q.title)}</h3>
          <p class="side-quest-meta">${escapeHtml(q.pathway)} · ${escapeHtml(q.rank || "")} · ${q.level}/${q.total}</p>
          <p class="side-quest-tip"><strong>Dev tip</strong> ${escapeHtml(q.tip || "")}</p>
          <div class="side-quest-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
            <span data-quest-fill></span>
          </div>
          <p class="side-quest-goal">${q.progress}/${q.goal} LOC · Reward: ${escapeHtml(skillLine)}</p>
        </div>`;
      const fill = rail.querySelector("[data-quest-fill]");
      if (fill) fill.style.width = `${pct}%`;
    }

    function paintTrophyBoard(snap, force) {
      let panel = root.querySelector("[data-trophy-case]");
      if (!panel) {
        panel = document.createElement("div");
        panel.className = "trophy-case";
        panel.setAttribute("data-trophy-case", "");
        panel.setAttribute("hidden", "");
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-label", "Trophy and loot case");
        root.appendChild(panel);
      }
      let host = panel.querySelector("[data-trophy-board-inner]");
      if (!host) {
        panel.replaceChildren();
        const scrim = document.createElement("button");
        scrim.type = "button";
        scrim.className = "trophy-case-scrim";
        scrim.setAttribute("data-trophy-scrim", "");
        scrim.setAttribute("aria-label", "Close trophy case");
        scrim.addEventListener("click", () => closeTrophyCase());
        const sheet = document.createElement("div");
        sheet.className = "trophy-case-sheet";
        sheet.setAttribute("data-trophy-sheet", "");
        host = document.createElement("div");
        host.className = "trophy-case-body";
        host.setAttribute("data-trophy-board-inner", "");
        const head = document.createElement("div");
        head.className = "trophy-case-head";
        head.innerHTML = `<div><strong>Trophy &amp; loot case</strong><p data-trophy-status></p></div>`;
        const close = document.createElement("button");
        close.type = "button";
        close.className = "ghost";
        close.setAttribute("data-trophy-close", "");
        close.textContent = "Close";
        close.addEventListener("click", () => closeTrophyCase());
        head.appendChild(close);
        sheet.append(head, host);
        panel.append(scrim, sheet);
      }
      const trophies = snap.trophyCatalog || [];
      const items = snap.itemCatalog || [];
      const ownedT = trophies.filter((t) => t.owned).length;
      const ownedI = items.filter((t) => t.owned).length;
      const sig = `${ownedT}-${ownedI}-${trophies.length}-${items.length}`;
      if (!force && host.dataset.sig === sig) return;
      host.dataset.sig = sig;
      const status = panel.querySelector("[data-trophy-status]");
      if (status) {
        status.textContent = snap.classExpert
          ? "Class Expert — full case unlocked when earned."
          : snap.graduated
            ? `Senior graduate · ${ownedT}/${trophies.length} trophies · ${ownedI}/${items.length} items`
            : `${ownedT}/${trophies.length} trophies · ${ownedI}/${items.length} items earned`;
      }
      const makeGrid = (list, label) => {
        const wrap = document.createElement("div");
        wrap.className = "trophy-section";
        const h = document.createElement("h4");
        h.textContent = `${label} (${list.filter((x) => x.owned).length}/${list.length})`;
        const grid = document.createElement("div");
        grid.className = "trophy-grid";
        list.forEach((t) => {
          const cell = document.createElement("div");
          cell.className = "trophy-cell" + (t.owned ? " is-owned" : " is-locked");
          cell.title = t.owned ? `${t.name} — ${t.blurb}` : `Locked: ${t.name}`;
          const icon = document.createElement("span");
          icon.setAttribute("aria-hidden", "true");
          icon.textContent = t.owned ? t.icon || "★" : "?";
          const name = document.createElement("em");
          name.textContent = t.name || "";
          const note = document.createElement("small");
          note.textContent = t.owned ? t.blurb || "" : "Keep questing";
          cell.append(icon, name, note);
          grid.appendChild(cell);
        });
        wrap.append(h, grid);
        return wrap;
      };
      host.replaceChildren(makeGrid(trophies, "Trophies"), makeGrid(items, "Items"));
    }

    function openTrophyCase() {
      root._gbTrophyOpen = true;
      paintTrophyBoard(game.snapshot(), true);
      const panel = root.querySelector("[data-trophy-case]");
      if (!panel) return;
      panel.removeAttribute("hidden");
      panel.classList.add("is-open");
      root.classList.add("is-trophy-open");
      const btn = root.querySelector("[data-trophies]");
      if (btn) {
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
      }
      const closeBtn = panel.querySelector("[data-trophy-close]");
      if (closeBtn) closeBtn.focus();
    }

    function closeTrophyCase() {
      root._gbTrophyOpen = false;
      const panel = root.querySelector("[data-trophy-case]");
      if (panel) {
        panel.setAttribute("hidden", "");
        panel.classList.remove("is-open");
      }
      root.classList.remove("is-trophy-open");
      const btn = root.querySelector("[data-trophies]");
      if (btn) {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-pressed", "false");
        btn.focus();
      }
    }

    function paintLegend(snap) {
      const host = root.querySelector("[data-gem-legend]");
      if (!host) return;
      const affinity = (snap && snap.pathway && snap.pathway.affinity) || [];
      const key = affinity.join(",") + "|" + ((snap && snap.pathwayId) || "");
      if (host.dataset.ready === key) return;
      host.dataset.ready = key;
      host.replaceChildren();
      GEMS.forEach((gem) => {
        const item = document.createElement("div");
        item.className = "gem-legend-item" + (affinity.includes(gem.id) ? " is-affinity" : "");
        const c = document.createElement("canvas");
        c.width = 36;
        c.height = 36;
        c.setAttribute("aria-hidden", "true");
        drawGem(c.getContext("2d"), 0, 0, 36, gem.id, { advanced: true });
        const cap = document.createElement("span");
        cap.textContent = gem.label;
        item.append(c, cap);
        host.appendChild(item);
      });
    }

    function draw() {
      const cell = sizeCanvas();
      const advancedGfx = prefs.graphics !== "simple";
      const fx = game.consumeFx();
      if (fx.length) {
        ingestFx(fx, cell);
        fx.forEach((item) => {
          if (item.type === "match") {
            const big = item.chain >= 3 || (item.cells && item.cells.length >= 4);
            beep(big ? "deploy" : "clear");
          }
          if (item.type === "bounce") beep("move");
          if (item.type === "shuffle") beep("rotate");
        });
      }

      const snap = game.snapshot();
      const nowTs = Date.now();
      sparkle += 0.04;

      // board backdrop
      ctx.clearRect(0, 0, COLS * cell, ROWS * cell);
      const bg = ctx.createLinearGradient(0, 0, 0, ROWS * cell);
      bg.addColorStop(0, "rgba(10, 21, 40, 0.55)");
      bg.addColorStop(1, "rgba(5, 12, 22, 0.72)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, COLS * cell, ROWS * cell);

      // soft cell wells
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          roundedRect(ctx, x * cell + 2, y * cell + 2, cell - 4, cell - 4, cell * 0.14);
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.fill();
        }
      }

      flashCells = flashCells.filter((c) => c.until > nowTs);
      const flashMap = {};
      flashCells.forEach((c) => {
        flashMap[`${c.x},${c.y}`] = (c.until - nowTs) / 320;
      });

      const hintSet = {};
      if (snap.hint) {
        hintSet[`${snap.hint.a.x},${snap.hint.a.y}`] = true;
        hintSet[`${snap.hint.b.x},${snap.hint.b.y}`] = true;
      }

      // idle sparkles
      if (advancedGfx && !prefersReducedMotion()) {
        for (let i = 0; i < 6; i += 1) {
          const sx = ((Math.sin(sparkle + i * 1.7) * 0.5 + 0.5) * COLS) * cell;
          const sy = ((Math.cos(sparkle * 0.8 + i) * 0.5 + 0.5) * ROWS) * cell;
          ctx.fillStyle = `rgba(255,255,255,${0.04 + (Math.sin(sparkle + i) * 0.5 + 0.5) * 0.08})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      snap.board.forEach((row, y) => {
        row.forEach((kind, x) => {
          if (!kind) return;
          const key = `${x},${y}`;
          const selected = snap.selected && snap.selected.x === x && snap.selected.y === y;
          const pulse = flashMap[key] || (selected ? 0.25 + Math.sin(sparkle * 3) * 0.1 : 0);
          drawGem(ctx, x * cell, y * cell, cell, kind, {
            advanced: advancedGfx,
            pulse,
            selected,
            hinted: hintSet[key],
            scale: flashMap[key] ? 1 + flashMap[key] * 0.18 : selected ? 1.05 : 1,
          });
        });
      });

      // particles + shatter glow
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16;
        p.life -= 0.022;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.glow && advancedGfx) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + p.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // Bejeweled / GoW shockwave rings
      for (let i = anims.length - 1; i >= 0; i -= 1) {
        const a = anims[i];
        if (a.type !== "shockwave") continue;
        const age = (nowTs - a.at) / 480;
        if (age >= 1) {
          anims.splice(i, 1);
          continue;
        }
        const cx = (a.x + 0.5) * cell;
        const cy = (a.y + 0.5) * cell;
        const radius = cell * (0.4 + age * (1.8 + (a.chain || 1) * 0.25));
        ctx.strokeStyle = `rgba(255,255,255,${(1 - age) * 0.55})`;
        ctx.lineWidth = 2 + (1 - age) * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(143, 211, 255,${(1 - age) * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();
      }

      // HUD fields
      if (scoreEl) scoreEl.textContent = String(snap.linesOfCode != null ? snap.linesOfCode : snap.score);
      if (linesEl) linesEl.textContent = String(snap.cleared);
      if (levelEl) levelEl.textContent = String(snap.level);
      if (highEl) highEl.textContent = String(Math.max(high, snap.linesOfCode != null ? snap.linesOfCode : snap.score));
      if (messageEl) messageEl.textContent = snap.message;
      const comboEl = root.querySelector("[data-combo]");
      const movesEl = root.querySelector("[data-moves]");
      const goalEl = root.querySelector("[data-goal]");
      const sprintEl = root.querySelector("[data-sprint]");
      const rankEl = root.querySelector("[data-rank]");
      if (comboEl) comboEl.textContent = String(snap.combo);
      if (movesEl) movesEl.textContent = String(snap.moves);
      if (goalEl) {
        goalEl.textContent =
          snap.phase === "endgame"
            ? `Raid ${snap.levelScore}/${snap.goal}`
            : `${snap.levelScore}/${snap.goal} LOC`;
      }
      if (sprintEl) {
        if (snap.pathway) {
          sprintEl.textContent =
            snap.phase === "endgame"
              ? `Raid ${snap.challengeIndex + 1} · ${snap.lessonTitle}`
              : `L${snap.level} · ${snap.lessonTitle}`;
        } else {
          sprintEl.textContent = snap.lessonTitle ? `L${snap.level} · ${snap.lessonTitle}` : snap.sprint || "";
        }
      }
      if (rankEl) {
        rankEl.textContent = snap.pathway
          ? `${snap.pathway.name} · ${snap.lessonRank || snap.lessonTrack || ""}`
          : snap.lessonRank
            ? `${snap.lessonTrack} · ${snap.lessonRank}`
            : "";
      }
      const pathProgressEl = root.querySelector("[data-path-progress]");
      if (pathProgressEl) {
        const total = snap.curriculumLength || CURRICULUM.length;
        if (snap.phase === "endgame") {
          pathProgressEl.textContent = `Senior graduate · Raid ${snap.challengeIndex + 1}`;
        } else if (snap.graduated) {
          pathProgressEl.textContent = "Senior Developer — path complete";
        } else if (snap.pathway || snap.lessonTitle) {
          pathProgressEl.textContent = `Lesson ${Math.min(snap.level, total)}/${total} · path to Senior Developer`;
        } else {
          pathProgressEl.textContent = "Path to Senior Developer";
        }
      }

      paintHero(snap);
      paintMana(snap);
      paintClassSelect(snap);
      if (snap.pathway) applyPathwayTheme(snap.pathway);

      const fact = typeof game.consumeFact === "function" ? game.consumeFact() : null;
      // Facts live only in the side quest column (dev tip) — no board overlay.
      if (fact) {
        dismissFactOverlay();
        if (snap.activeQuest) {
          snap.activeQuest.tip = fact.fact || snap.activeQuest.tip;
        }
      }
      paintQuestRail(snap);
      if (root._gbTrophyOpen) paintTrophyBoard(snap, true);
      const trophy = typeof game.consumeTrophy === "function" ? game.consumeTrophy() : null;
      if (trophy) {
        showLootToast(trophy, "trophy");
        if (root._gbTrophyOpen) paintTrophyBoard(game.snapshot(), true);
      }
      const loot = typeof game.consumeLoot === "function" ? game.consumeLoot() : null;
      if (loot) {
        showLootToast(loot, "loot");
        if (root._gbTrophyOpen) paintTrophyBoard(game.snapshot(), true);
      }
      const skill = typeof game.consumeSkillUnlock === "function" ? game.consumeSkillUnlock() : null;
      if (skill) {
        showSkillUnlock(skill);
        beep("badge");
      }
      paintSkills(snap.skills);
      if (
        root._gbLevel !== snap.level ||
        root._gbPathway !== snap.pathwayId ||
        root._gbPhase !== snap.phase ||
        root._gbChallenge !== snap.challengeIndex
      ) {
        syncLessonClouds(snap.level, snap.pathwayId, snap.phase, snap.challengeIndex);
      }

      const hintBtn = root.querySelector("[data-hint]");
      const shuffleBtn = root.querySelector("[data-shuffle]");
      if (hintBtn) {
        hintBtn.disabled = snap.status !== "playing" || snap.hints < 1;
        hintBtn.textContent = `Hint (${snap.hints})`;
      }
      if (shuffleBtn) {
        shuffleBtn.disabled = snap.status !== "playing" || snap.shuffles < 1;
        shuffleBtn.textContent = `Shuffle (${snap.shuffles})`;
      }

      const logEl = root.querySelector("[data-commit-log]");
      if (logEl) {
        logEl.replaceChildren();
        (snap.commitLog || []).slice(0, 3).forEach((line) => {
          const li = document.createElement("li");
          li.textContent = line;
          logEl.appendChild(li);
        });
      }
      const badgeEl = root.querySelector("[data-badges]");
      if (badgeEl) {
        badgeEl.replaceChildren();
        (snap.achievements || []).forEach((id) => {
          const ach = ACHIEVEMENTS.find((a) => a.id === id);
          const span = document.createElement("span");
          span.className = "badge-chip";
          span.textContent = ach ? ach.label : id;
          badgeEl.appendChild(span);
        });
      }

      paintLegend(snap);

      const progress = root.querySelector("[data-progress]");
      if (progress) {
        const pct = Math.max(0, Math.min(100, Math.round((snap.levelScore / Math.max(1, snap.goal)) * 100)));
        progress.style.width = `${pct}%`;
        progress.parentElement && progress.parentElement.setAttribute("aria-valuenow", String(pct));
      }

      const flashAge = snap.levelFlash ? Date.now() - snap.levelFlash : 9999;
      const showLevelBanner = snap.status === "playing" && flashAge < 1100;
      const customizing = panel && !panel.hidden;
      if (overlay && overlayTitle && overlayBody) {
        const show =
          !customizing &&
          (snap.status === "class-select" || snap.status !== "playing" || showLevelBanner);
        overlay.hidden = !show;
        overlay.classList.toggle(
          "is-clickable",
          !customizing && snap.status !== "playing"
        );
        overlay.classList.toggle("is-class-select", snap.status === "class-select");
        if (overlayLevel) {
          overlayLevel.hidden = !(showLevelBanner || snap.status === "ready");
          overlayLevel.textContent =
            snap.phase === "endgame"
              ? snap.lessonTitle
              : snap.lessonTitle || snap.sprint || `Lesson ${snap.level}`;
        }
        if (snap.status === "class-select") {
          overlayTitle.textContent = "Choose your pathway";
          overlayBody.textContent =
            "Pick a class to begin. Each hero has a unique power on the path to Senior Developer.";
          if (playBtn) playBtn.hidden = true;
        } else if (showLevelBanner && snap.status === "playing") {
          overlayTitle.textContent =
            snap.phase === "endgame"
              ? `Raid · ${snap.lessonRank || "Boss"}`
              : `Quest ${snap.level}/${snap.curriculumLength || CURRICULUM.length}`;
          overlayBody.textContent =
            snap.phase === "endgame"
              ? `${snap.lessonTitle}. ${(snap.lessonSkill && snap.lessonSkill.blurb) || "Keep matching to clear the raid."}`
              : `${snap.lessonTitle} — accept the quest, write LOC, claim your skill on the path to Senior Developer.`;
          if (playBtn) playBtn.hidden = true;
        } else if (snap.status === "ready") {
          overlayTitle.textContent = snap.pathway ? snap.pathway.name : "Git Blocks";
          overlayBody.textContent = snap.pathway
            ? `${snap.pathway.blurb} Match gems to learn each lesson, unlock facts, and graduate to Senior Developer.`
            : "Learn web development from HTML to Senior Developer. Match shiny logo gems — every clear teaches a fact.";
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = "Start learning";
          }
        } else if (snap.status === "paused") {
          overlayTitle.textContent = "Paused";
          overlayBody.textContent = snap.message;
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = "Resume";
          }
        } else if (snap.status === "over") {
          const clearedAll =
            snap.graduated && snap.challengesCleared >= (snap.endgameLength || 4);
          overlayTitle.textContent = clearedAll
            ? "Legendary senior"
            : snap.graduated
              ? "Raid failed"
              : "Lesson paused";
          overlayBody.textContent = clearedAll
            ? `${snap.linesOfCode} LOC · ${snap.skills.length} skills · all endgame raids cleared as ${
                (snap.pathway && snap.pathway.name) || "a senior"
              }.`
            : snap.graduated
              ? `${snap.linesOfCode} LOC — rebase to retry this raid.`
              : `${snap.linesOfCode} LOC · ${snap.cleared} gems · rebase to continue studying.`;
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = clearedAll ? "New career" : "Rebase";
          }
        }
      }

      if (snap.level !== lastLevelShown && snap.status === "playing") {
        lastLevelShown = snap.level;
        announce(
          snap.phase === "endgame"
            ? `Raid: ${snap.lessonTitle}`
            : `Lesson ${snap.level}: ${snap.lessonTitle}`
        );
        beep("level");
        syncLessonClouds(snap.level, snap.pathwayId, snap.phase, snap.challengeIndex);
      }
      if (pauseBtn) {
        pauseBtn.textContent = snap.status === "paused" ? "Resume" : "Pause";
        pauseBtn.disabled =
          snap.status === "ready" || snap.status === "over" || snap.status === "class-select";
      }
    }

    function persistHigh() {
      high = Math.max(high, game.score);
      writeStore(STORAGE.high, String(high));
    }

    function startLoop() {
      cancelAnimationFrame(raf);
      const loop = () => {
        if (game.status === "over") persistHigh();
        draw();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function playSelectedMusic() {
      THEME_TRACK.url = resolveGameAsset("audio/stack-sprint.ogg");
      const track = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || THEME_TRACK;
      music.setVolume(prefs.music.volume || 0.35);
      if (track.kind === "off") music.stop();
      else if (track.kind === "generated") music.playGenerated(track.style);
      else if (track.kind === "url") music.playUrl(track.url || prefs.music.customUrl || THEME_TRACK.url);
      else if (track.kind === "custom") music.playUrl(prefs.music.customUrl || THEME_TRACK.url);
    }

    function handlePlay() {
      if (game.status === "class-select") return;
      if (game.status === "paused") {
        game.resume();
      } else if (
        game.status === "over" &&
        playBtn &&
        /new career/i.test(playBtn.textContent || "")
      ) {
        game.reopenClassSelect();
        applyPathwayTheme(null);
        syncLessonClouds(1, null, "path", 0);
        beep("start");
        announce("Choose a new pathway class");
      } else {
        game.play();
        beep("start");
        const snap = game.snapshot();
        announce(
          snap.phase === "endgame"
            ? `Raid started: ${snap.lessonTitle}`
            : `${(snap.pathway && snap.pathway.name) || "Lesson"} · L${snap.level}`
        );
        if (prefs.music.trackId === "off") {
          prefs.music.trackId = "stack-sprint";
          savePrefs(prefs);
          renderMusicUi();
        }
        playSelectedMusic();
      }
      canvas.focus({ preventScroll: true });
    }

    function handlePause() {
      if (game.status === "playing") {
        game.pause();
        announce("Paused");
      } else if (game.status === "paused") game.resume();
    }

    function cellFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const cellW = rect.width / COLS;
      const cellH = rect.height / ROWS;
      const x = Math.floor((event.clientX - rect.left) / cellW);
      const y = Math.floor((event.clientY - rect.top) / cellH);
      if (!inBounds(x, y)) return null;
      return { x, y };
    }

    let dragStart = null;

    function onPointerDown(event) {
      if (event.button !== 0) return;
      if (game.status === "class-select") return;
      if (game.status !== "playing") {
        handlePlay();
        return;
      }
      const cell = cellFromEvent(event);
      if (!cell) return;
      dragStart = cell;
      canvas.setPointerCapture(event.pointerId);
    }

    function onPointerUp(event) {
      if (game.status !== "playing") return;
      const end = cellFromEvent(event);
      if (!dragStart) return;
      const start = dragStart;
      dragStart = null;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (_e) {
        /* */
      }
      if (!end) return;
      if (start.x === end.x && start.y === end.y) {
        const result = game.selectCell(end.x, end.y);
        if (result && result.ok) (result.sounds || []).forEach(beep);
        else if (result && result.bounce) beep("move");
        else if (result && result.selected) beep("move");
        draw();
        return;
      }
      if (areAdjacent(start, end)) {
        const result = game.trySwap(start, end);
        if (result.ok) (result.sounds || []).forEach(beep);
        else if (result.bounce) beep("move");
        draw();
      } else {
        game.selectCell(end.x, end.y);
        draw();
      }
    }

    function onKey(event) {
      if (root._gbTrophyOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeTrophyCase();
        }
        return;
      }
      if (panel && !panel.hidden) {
        if (event.key === "Escape") closeCustomize();
        return;
      }
      const accountPanel = root.querySelector("[data-account-panel]");
      if (accountPanel && !accountPanel.hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          accountPanel.hidden = true;
          accountPanel.setAttribute("hidden", "");
        }
        return;
      }
      if (event.key === "Enter" && game.status !== "playing") {
        event.preventDefault();
        handlePlay();
      }
      if ((event.key === "p" || event.key === "P") && (game.status === "playing" || game.status === "paused")) {
        event.preventDefault();
        handlePause();
      }
      if ((event.key === "r" || event.key === "R") && game.status === "over") {
        event.preventDefault();
        handlePlay();
      }
      if ((event.key === "h" || event.key === "H") && game.status === "playing") {
        event.preventDefault();
        if (game.hint()) beep("badge");
      }
      if ((event.key === "s" || event.key === "S") && game.status === "playing" && !event.metaKey && !event.ctrlKey) {
        // avoid stealing browser save — only when focused on canvas
        if (document.activeElement === canvas) {
          event.preventDefault();
          if (game.shuffle()) beep("rotate");
        }
      }
    }

    function openCustomize(tab) {
      if (!panel) return;
      const accountPanel = root.querySelector("[data-account-panel]");
      if (accountPanel) {
        accountPanel.hidden = true;
        accountPanel.setAttribute("hidden", "");
      }
      panel.hidden = false;
      panel.removeAttribute("hidden");
      root.classList.add("is-customizing");
      switchTab(tab || "look");
      renderBgPresets();
      renderMusicUi();
      refreshShareUi();
    }

    function closeCustomize() {
      if (!panel) return;
      panel.hidden = true;
      panel.setAttribute("hidden", "");
      root.classList.remove("is-customizing");
      canvas.focus({ preventScroll: true });
    }

    function switchTab(name) {
      root.querySelectorAll("[data-tab]").forEach((btn) => {
        const on = btn.getAttribute("data-tab") === name;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      root.querySelectorAll("[data-pane]").forEach((pane) => {
        const on = pane.getAttribute("data-pane") === name;
        pane.hidden = !on;
        pane.classList.toggle("is-active", on);
      });
    }

    function renderBgPresets() {
      const host = root.querySelector("[data-bg-presets]");
      if (!host) return;
      host.replaceChildren();
      BG_PRESETS.forEach((preset) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bg-swatch" + (prefs.background.presetId === preset.id ? " is-active" : "");
        btn.style.background = preset.css;
        btn.title = preset.label;
        const cap = document.createElement("span");
        cap.textContent = preset.label;
        btn.appendChild(cap);
        btn.addEventListener("click", () => {
          prefs.background = { mode: "preset", presetId: preset.id, css: preset.css, image: "" };
          applyBackground(prefs.background, root);
          savePrefs(prefs);
          renderBgPresets();
          const cssField = root.querySelector("[data-bg-css]");
          if (cssField) cssField.value = preset.css;
        });
        host.appendChild(btn);
      });
      const cssField = root.querySelector("[data-bg-css]");
      const imgField = root.querySelector("[data-bg-image]");
      if (cssField && !cssField.dataset.bound) {
        cssField.dataset.bound = "1";
        cssField.value = prefs.background.css || "";
      }
      if (imgField && !imgField.dataset.bound) {
        imgField.dataset.bound = "1";
        imgField.value = prefs.background.image || "";
      }
      const gfx = root.querySelector("[data-graphics]");
      if (gfx && !gfx.dataset.bound) {
        gfx.dataset.bound = "1";
        gfx.value = prefs.graphics === "simple" ? "simple" : "advanced";
        gfx.addEventListener("change", () => {
          prefs.graphics = gfx.value === "simple" ? "simple" : "advanced";
          savePrefs(prefs);
          root.classList.toggle("gfx-simple", prefs.graphics === "simple");
          draw();
        });
      } else if (gfx) gfx.value = prefs.graphics === "simple" ? "simple" : "advanced";
    }

    function refillMusicSelect() {
      const select = root.querySelector("[data-music-track]");
      if (!select) return;
      const current = prefs.music.trackId;
      select.replaceChildren();
      MUSIC_TRACKS.forEach((track) => {
        const o = document.createElement("option");
        o.value = track.id;
        o.textContent = track.label;
        select.appendChild(o);
      });
      if (MUSIC_TRACKS.some((t) => t.id === current)) select.value = current;
      else {
        select.value = MUSIC_TRACKS[0].id;
        prefs.music.trackId = select.value;
      }
    }

    function renderMusicUi() {
      const select = root.querySelector("[data-music-track]");
      const credit = root.querySelector("[data-music-credit]");
      const custom = root.querySelector("[data-music-custom]");
      const volume = root.querySelector("[data-music-volume]");
      if (select && !select.dataset.bound) {
        select.dataset.bound = "1";
        select.addEventListener("change", () => {
          prefs.music.trackId = select.value;
          const meta = MUSIC_TRACKS.find((t) => t.id === select.value);
          if (credit) credit.textContent = meta ? meta.credit : "";
          savePrefs(prefs);
        });
      }
      refillMusicSelect();
      const meta = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || MUSIC_TRACKS[0];
      if (credit) credit.textContent = meta ? meta.credit : "";
      if (custom && !custom.dataset.bound) {
        custom.dataset.bound = "1";
        custom.value = prefs.music.customUrl || "";
        custom.addEventListener("change", () => {
          const api = securityApi();
          const safeUrl = api ? api.sanitizeHttpsUrl(custom.value.trim()) : "";
          if (custom.value.trim() && !safeUrl) {
            custom.value = "";
            prefs.music.customUrl = "";
            announce("Audio URL must be a single https address.");
          } else {
            prefs.music.customUrl = safeUrl;
            custom.value = safeUrl;
          }
          savePrefs(prefs);
        });
      }
      if (volume && !volume.dataset.bound) {
        volume.dataset.bound = "1";
        volume.value = String(Math.round((prefs.music.volume || 0.35) * 100));
        volume.addEventListener("input", () => {
          prefs.music.volume = Number(volume.value) / 100;
          music.setVolume(prefs.music.volume);
          savePrefs(prefs);
        });
      }
    }

    function buildShareUrl() {
      const include = root.querySelector("[data-share-include-prefs]");
      const withPrefs = !include || include.checked;
      return `${cfg.shareUrl || location.href.split("#")[0]}${encodeShareHash(prefs, withPrefs)}`;
    }

    function refreshShareUi() {
      const field = root.querySelector("[data-share-url]");
      if (field) field.value = buildShareUrl();
      const x = root.querySelector("[data-share-x]");
      const li = root.querySelector("[data-share-linkedin]");
      const text = encodeURIComponent("Play Branchborne Gem Quest — Bejeweled-style tech gems with live side quests.");
      const url = encodeURIComponent(buildShareUrl());
      if (x) x.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      if (li) li.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }

    if (playBtn) playBtn.addEventListener("click", handlePlay);
    if (pauseBtn) pauseBtn.addEventListener("click", handlePause);
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        muted = !muted;
        muteBtn.textContent = muted ? "Sound off" : "Sound on";
        muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
        if (muted) music.stop();
        else if (game.status === "playing") playSelectedMusic();
      });
    }
    if (customizeBtn) customizeBtn.addEventListener("click", () => openCustomize("look"));
    if (shareBtn) shareBtn.addEventListener("click", () => openCustomize("share"));
    const trophiesBtn = root.querySelector("[data-trophies]");
    if (trophiesBtn) {
      trophiesBtn.setAttribute("aria-pressed", "false");
      trophiesBtn.addEventListener("click", () => {
        if (root._gbTrophyOpen) closeTrophyCase();
        else openTrophyCase();
      });
    }
    // Legacy inline board no longer used as the primary viewer
    const legacyBoard = root.querySelector("[data-trophy-board]");
    if (legacyBoard) legacyBoard.setAttribute("hidden", "");
    root.querySelectorAll("[data-customize-close]").forEach((btn) => btn.addEventListener("click", closeCustomize));
    root.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
    });

    const hintBtn = root.querySelector("[data-hint]");
    const shuffleBtn = root.querySelector("[data-shuffle]");
    if (hintBtn) hintBtn.addEventListener("click", () => { if (game.hint()) beep("badge"); draw(); });
    if (shuffleBtn) shuffleBtn.addEventListener("click", () => { if (game.shuffle()) beep("rotate"); draw(); });

    const bgApply = root.querySelector("[data-bg-apply]");
    const bgRandom = root.querySelector("[data-bg-random]");
    if (bgApply) {
      bgApply.addEventListener("click", () => {
        const css = (root.querySelector("[data-bg-css]") || {}).value || "";
        const image = ((root.querySelector("[data-bg-image]") || {}).value || "").trim();
        const api = securityApi();
        const safeImage = image && api ? api.sanitizeHttpsUrl(image) : "";
        const safeCss = api ? api.sanitizeCssBackground(css) : "";
        if (image && !safeImage) {
          announce("Image URL must be a single https address.");
          return;
        }
        if (!image && css.trim() && !safeCss) {
          announce("That background was rejected. Use a color or gradient without URLs.");
          return;
        }
        if (safeImage) prefs.background = { mode: "image", presetId: "", css: safeCss, image: safeImage };
        else prefs.background = { mode: "css", presetId: "", css: safeCss || BG_PRESETS[0].css, image: "" };
        applyBackground(prefs.background, root);
        savePrefs(prefs);
        renderBgPresets();
      });
    }
    if (bgRandom) {
      bgRandom.addEventListener("click", () => {
        const css = randomGradient();
        prefs.background = { mode: "css", presetId: "", css, image: "" };
        const field = root.querySelector("[data-bg-css]");
        if (field) field.value = css;
        applyBackground(prefs.background, root);
        savePrefs(prefs);
        renderBgPresets();
      });
    }

    const musicApply = root.querySelector("[data-music-apply]");
    const musicStop = root.querySelector("[data-music-stop]");
    const musicPreview = root.querySelector("[data-music-preview]");
    const musicDiscover = root.querySelector("[data-music-discover]");
    if (musicApply) musicApply.addEventListener("click", playSelectedMusic);
    if (musicStop) musicStop.addEventListener("click", () => music.stop());
    if (musicPreview) {
      musicPreview.addEventListener("click", () => {
        const track = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || THEME_TRACK;
        if (track.kind === "generated") music.previewGenerated(track.style, 2000);
        else if (track.kind === "url" || track.kind === "custom") {
          playSelectedMusic();
          window.setTimeout(() => music.stop(), 2200);
        } else music.previewGenerated("chip", 1200);
      });
    }
    if (musicDiscover) {
      musicDiscover.addEventListener("click", () => {
        discoverFreeTracks(5);
        prefs.music.trackId = (MUSIC_TRACKS.find((t) => t.discovered) || MUSIC_TRACKS[1] || MUSIC_TRACKS[0]).id;
        savePrefs(prefs);
        renderMusicUi();
      });
    }
    root.querySelectorAll("[data-sfx-preview]").forEach((btn) => {
      btn.addEventListener("click", () => beep(btn.getAttribute("data-sfx-preview") || "move"));
    });

    const shareCopy = root.querySelector("[data-share-copy]");
    const shareNative = root.querySelector("[data-share-native]");
    const shareStatus = root.querySelector("[data-share-status]");
    const shareInclude = root.querySelector("[data-share-include-prefs]");
    if (shareInclude) shareInclude.addEventListener("change", refreshShareUi);
    if (shareCopy) {
      shareCopy.addEventListener("click", async () => {
        refreshShareUi();
        try {
          await navigator.clipboard.writeText(buildShareUrl());
          if (shareStatus) shareStatus.textContent = "Link copied.";
        } catch (_err) {
          if (shareStatus) shareStatus.textContent = "Copy failed — select the field and copy manually.";
        }
      });
    }
    if (shareNative) {
      shareNative.addEventListener("click", async () => {
        const url = buildShareUrl();
        if (navigator.share) {
          try {
            await navigator.share({ title: "Git Blocks", text: "Match shiny web-dev logo gems.", url });
            if (shareStatus) shareStatus.textContent = "Shared.";
          } catch (_err) {
            if (shareStatus) shareStatus.textContent = "Share cancelled.";
          }
        } else if (shareStatus) shareStatus.textContent = "System share unavailable — use Copy link.";
      });
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("resize", draw);

    renderMusicUi();
    startLoop();
    draw();

    if (cfg.autoStart && !autoStarted) {
      autoStarted = true;
      window.setTimeout(() => {
        if (game.status === "ready") handlePlay();
      }, prefersReducedMotion() ? 200 : 700);
    }

    return game;
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-git-blocks]").forEach((node) => boot(node));
    });
  }

  return {
    COLS,
    ROWS,
    SIZE,
    MATCH_MIN,
    GAME_TITLE,
    GEMS,
    GEM_IDS,
    META,
    CURRICULUM,
    PATHWAY_CLASSES,
    TROPHIES,
    LOOT_ITEMS,
    cartoonCharacterMarkup,
    ENDGAME_CHALLENGES,
    ACHIEVEMENTS,
    BG_PRESETS,
    MUSIC_TRACKS,
    DEV_CLOUD_WORDS,
    WordGenerator,
    pathwayFor,
    pathwayLessons,
    curriculumLength,
    lessonFor,
    sprintName,
    pickFact,
    goalForLevel,
    movesForLevel,
    findMatches,
    findHint,
    wouldMatch,
    hasValidMoves,
    boardHasMatch,
    swapCells,
    applyGravity,
    resolveBoard,
    fillBoardNoMatches,
    areAdjacent,
    scoreMatch,
    cloudSaveFromSnapshot,
    canonicalCloudSave,
    toPlayerSaveRow,
    mergeCloudSaves,
    inspectPortableSave,
    portableSaveLesson,
    portableSaveSummary,
    sealPortableSave,
    unlockPortableSave,
    playerStorageKey,
    createGame,
    createSfxEngine,
    discoverFreeTracks,
    boot,
  };
});
