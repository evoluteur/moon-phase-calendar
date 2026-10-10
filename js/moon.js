/*
  Moon Phase Calendar
  https://github.com/evoluteur/moon-phase-calendar
  (c) 2026 Olivier Giulieri
*/

const MONTHS = [...Array(12)].map((_, m) =>
  new Date(2000, m, 1).toLocaleDateString(undefined, { month: "long" }),
);
const WEEKDAYS = [...Array(7)].map((_, d) =>
  new Date(2000, 0, 2 + d).toLocaleDateString(undefined, { weekday: "short" }),
); // Jan 2, 2000 was a Sunday

const SUPERMOON_KM = 361000;
const MICROMOON_KM = 405000;
const DAY = 86400000;

const state = {
  view: "month", // "month" or "year"
  year: 2026,
  month: 0,
  hemisphere: "north",
};

// ---------------------------------------------------------------- helpers

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
};

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const sameDay = (a, b) => dayKey(a) === dayKey(b);
const noon = (y, m, d) => new Date(y, m, d, 12);
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

const fmtTime = (d) =>
  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const fmtDate = (d, opts) =>
  d.toLocaleDateString(
    undefined,
    opts || { weekday: "short", month: "short", day: "numeric" },
  );
const fmtLongDate = (d) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
const fmtKm = (km) => Math.round(km).toLocaleString() + " km";
const fmtPct = (x) => Math.round(x * 100) + "%";
const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (e) {
    return "";
  }
};
const angleDiff = (a, b) => {
  const d = (((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
};

const PRINCIPAL_INDEX = { new: 0, first: 2, full: 4, last: 6 };

// phase (0-7) for a day: a principal phase if it happens that day, else the one in between
const phaseIndexFor = (moon, principal) => {
  if (principal) return PRINCIPAL_INDEX[principal.type];
  const e = moon.elongation;
  return e < 90 ? 1 : e < 180 ? 3 : e < 270 ? 5 : 7;
};

// phase (0-7) for an exact moment (the "now" panel): principal phases get about a day
const phaseIndexNow = (moon) => {
  const e = moon.elongation;
  const near = (t) => angleDiff(e, t) < 6.1; // about 12 hours either side
  if (near(0)) return 0;
  if (near(90)) return 2;
  if (near(180)) return 4;
  if (near(270)) return 6;
  return e < 90 ? 1 : e < 180 ? 3 : e < 270 ? 5 : 7;
};

// ---------------------------------------------------------------- year data (named full moons...)

const yearCache = new Map();

const yearData = (y) => {
  if (yearCache.has(y)) return yearCache.get(y);
  const phases = Astro.phasesBetween(new Date(y, 0, 1), new Date(y + 1, 0, 1));
  const fulls = phases.filter((p) => p.type === "full");
  const news = phases.filter((p) => p.type === "new");

  // Harvest Moon: the full moon closest to the September equinox (Sun at 180 degrees)
  let harvest = null;
  let best = 999;
  fulls.forEach((f) => {
    const d = angleDiff(Astro.sunLongitude(f.jd), 180);
    if (d < best) {
      best = d;
      harvest = f;
    }
  });

  fulls.forEach((f, i) => {
    const m = f.date.getMonth();
    const tags = [];
    let info = FULL_MOON_NAMES[m];
    if (f === harvest) info = HARVEST_MOON;
    else if (i > 0 && fulls[i - 1] === harvest)
      info = FULL_MOON_NAMES[9]; // Hunter's Moon
    if (i > 0 && fulls[i - 1].date.getMonth() === m) {
      tags.push({ id: "blue", label: "Blue Moon", text: BLUE_MOON });
    }
    if (f.distance < SUPERMOON_KM)
      tags.push({ id: "super", label: "Supermoon", text: SUPERMOON });
    if (f.distance > MICROMOON_KM)
      tags.push({ id: "micro", label: "Micromoon", text: MICROMOON });
    f.eclipse = Eclipses.atFullMoon(f.jd);
    if (f.eclipse) {
      const ec = LUNAR_ECLIPSES[f.eclipse.type];
      tags.unshift({ id: "eclipse", label: ec.label, text: ec.text });
    }
    f.name = info.name;
    f.nameText = info.text;
    f.tags = tags;
  });
  news.forEach((n, i) => {
    n.tags = [];
    if (i > 0 && news[i - 1].date.getMonth() === n.date.getMonth()) {
      n.tags.push({ id: "black", label: "Black Moon", text: BLACK_MOON });
    }
  });
  phases.forEach((p) => {
    p.sign = Math.floor(p.longitude / 30);
    if (!p.tags) p.tags = [];
  });

  const data = { phases, fulls, news };
  yearCache.set(y, data);
  return data;
};

// principal phases by local day, for a range of years
const phasesByDay = (years) => {
  const map = {};
  years.forEach((y) =>
    yearData(y).phases.forEach((p) => (map[dayKey(p.date)] = p)),
  );
  return map;
};

// ---------------------------------------------------------------- moon drawing

let moonUid = 0;

// Maria (the dark "seas") as seen from the Northern Hemisphere, north up
const MARIA = [
  // [x, y, rx, ry, rotation]
  [-27, 0, 13, 19, 10], // Oceanus Procellarum
  [-15, -21, 12, 10, -20], // Mare Imbrium
  [7, -17, 8, 7, 0], // Mare Serenitatis
  [16, -3, 10, 8, 30], // Mare Tranquillitatis
  [32, -12, 5, 6.5, 0], // Mare Crisium
  [26, 10, 5, 9, -15], // Mare Fecunditatis
  [-6, 16, 9, 6, 10], // Mare Nubium
  [-29, 18, 5, 5, 0], // Mare Humorum
  [2, -2, 5, 4, 0], // Sinus Medii / Vaporum
];

const moonSvg = (illumination, waxing, size, opts = {}) => {
  const r = 48;
  const k = Math.max(0, Math.min(1, illumination));
  const detail = opts.detail !== false && size >= 36;
  const id = "mc" + moonUid++;
  let lit = "";
  if (k > 0.995) {
    lit = `<circle r="${r}" />`;
  } else if (k > 0.005) {
    const rx = (r * Math.abs(1 - 2 * k)).toFixed(2);
    lit = `<path d="M0,-${r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${k > 0.5 ? 1 : 0} 0,-${r} Z" ${waxing ? "" : 'transform="scale(-1,1)"'} />`;
  }
  const south = state.hemisphere === "south";
  const maria =
    detail && lit
      ? `<clipPath id="${id}">${lit}</clipPath><g class="moon-maria" clip-path="url(#${id})">${MARIA.map(
          ([x, y, rx, ry, a]) =>
            `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" />`,
        ).join("")}<circle class="moon-tycho" cx="-6" cy="35" r="2.4" /></g>`
      : "";
  const label = opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"';
  return `<svg class="moon" viewBox="-50 -50 100 100" width="${size}" height="${size}" style="width:${size}px;height:${size}px" ${label}>
    <g${south ? ' transform="rotate(180)"' : ""}>
      <circle class="moon-dark" r="${r}" />
      <g class="moon-lit">${lit}</g>${maria}
      <circle class="moon-rim" r="${r}" />
    </g></svg>`;
};

// ---------------------------------------------------------------- today

const lastPhase = (date, type) => {
  const list = Astro.phasesBetween(new Date(date - 32 * DAY), date).filter(
    (p) => p.type === type,
  );
  return list[list.length - 1];
};
const nextPhase = (date, type) =>
  Astro.phasesBetween(date, new Date(+date + 32 * DAY)).find(
    (p) => p.type === type,
  );

// named info (Harvest Moon, Supermoon...) for a principal phase
const decorate = (p) => {
  const y = p.date.getFullYear();
  return (
    yearData(y).phases.find((q) => Math.abs(q.jd - p.jd) < 0.01) || {
      ...p,
      sign: Math.floor(p.longitude / 30),
      tags: [],
    }
  );
};

const tagsHtml = (tags) =>
  tags
    .map(
      (t) =>
        `<span class="tag tag-${t.id}" title="${t.text}">${t.label}</span>`,
    )
    .join("");

const fmtMinutes = (m) => {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return h ? `${h} h ${pad(mm)} min` : `${mm} min`;
};

// a lunar eclipse: its time, magnitude and how long it lasts
const eclipseHtml = (e) => {
  const ec = LUNAR_ECLIPSES[e.type];
  const { pen, par, tot } = e.semi;
  const lasts = [
    tot ? `totality ${fmtMinutes(2 * tot)}` : "",
    par ? `${tot ? "partial phases" : "partial phase"} ${fmtMinutes(2 * par)}` : "",
    `${par ? "whole eclipse" : "eclipse"} ${fmtMinutes(2 * pen)}`,
  ].filter(Boolean);
  return `<div class="eclipse-info">
    <p><b>${ec.label}</b> · maximum at <b>${fmtTime(e.date)}</b>, magnitude ${e.magnitude.toFixed(2)}${e.type === "penumbral" ? " (penumbral)" : ""}</p>
    <p class="muted">${lasts.join(" · ")}. Visible wherever the Moon is up.</p>
    <p>${ec.text} <a href="https://evoluteur.github.io/eclipse-calendar/?year=${e.date.getFullYear()}">See it in the Eclipse Calendar</a>.</p>
  </div>`;
};

const countdown = (date, from) => {
  const days = (date - from) / DAY;
  if (days < 1) {
    const h = Math.max(1, Math.round(days * 24));
    return `in ${h} hour${h > 1 ? "s" : ""}`;
  }
  const d = Math.round(days);
  return `in ${d} day${d > 1 ? "s" : ""}`;
};

// the big panel: the Moon at one moment, with its phase and sign
const moonPanelHtml = (date, isNow) => {
  const moon = Astro.moonAt(date);
  let idx;
  let principal = null;
  if (isNow) {
    idx = phaseIndexNow(moon);
  } else {
    const byDay = phasesByDay([date.getFullYear()]);
    principal = byDay[dayKey(date)];
    idx = phaseIndexFor(moon, principal);
  }
  const phase = PHASES[idx];
  const sign = SIGNS[moon.sign];
  const lastNew = lastPhase(date, "new");
  const age = lastNew ? (date - lastNew.date) / DAY : null;
  // for a day, "next" means after that day (its own phase is shown as exact)
  const from = isNow
    ? date
    : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const nextFull = decorate(nextPhase(from, "full"));
  const nextNew = decorate(nextPhase(from, "new"));
  const exact = principal ? decorate(principal) : null;
  const dayIngress = !isNow
    ? Astro.ingressesBetween(
        new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      )[0]
    : null;

  const exactHtml = exact
    ? `<p class="exact">Exact ${phase.name.toLowerCase()} at <b>${fmtTime(exact.date)}</b>${
        exact.name ? ` · the <b>${exact.name}</b>` : ""
      } ${tagsHtml(exact.tags)}</p>${exact.nameText ? `<p class="name-text">${exact.nameText}</p>` : ""}`
    : "";
  const ingressHtml = dayIngress
    ? `<p class="ingress">Moon enters ${SIGNS[dayIngress.sign].glyph} ${SIGNS[dayIngress.sign].name} at ${fmtTime(dayIngress.date)}</p>`
    : "";
  const nextRow = (label, p) =>
    `<div class="next"><span class="next-moon">${moonSvg(p.type === "full" ? 1 : 0, true, 26, { detail: false })}</span>
      <div><div class="next-label">${label}${p.name ? ` · ${p.name}` : ""} ${tagsHtml(p.tags)}</div>
      <div class="next-date">${fmtDate(p.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}, ${fmtTime(p.date)}
      <span class="muted">(${countdown(p.date, isNow ? date : from)})</span> in ${SIGNS[p.sign].glyph} ${SIGNS[p.sign].name}</div></div></div>`;

  return `
  <div class="moon-panel">
    <div class="big-moon">${moonSvg(moon.illumination, moon.waxing, 220, { label: phase.name })}</div>
    <div class="moon-facts">
      <div class="when">${isNow ? "Now · " + fmtLongDate(date) + ", " + fmtTime(date) : fmtLongDate(date)}</div>
      <h3 class="phase-name">${phase.name}</h3>
      <div class="kw">${phase.keywords.join(" · ")}</div>
      ${exactHtml}
      ${exact && exact.eclipse ? eclipseHtml(exact.eclipse) : ""}
      <dl class="stats">
        <div><dt>Illumination</dt><dd>${fmtPct(moon.illumination)}</dd></div>
        <div><dt>Moon age</dt><dd>${age !== null ? age.toFixed(1) + " days" : "-"}</dd></div>
        <div><dt>Moon sign</dt><dd><span class="glyph">${sign.glyph}</span> ${sign.name} ${Math.floor(moon.degree)}&deg;</dd></div>
        <div><dt>Distance</dt><dd>${fmtKm(moon.distance)}</dd></div>
      </dl>
      ${ingressHtml}
      ${nextRow("Next full moon", nextFull)}
      ${nextRow("Next new moon", nextNew)}
    </div>
  </div>
  <div class="meanings">
    <div class="meaning">
      <h4>${phase.name}</h4>
      <p>${phase.text}</p>
      <p class="good-for"><b>Good for:</b> ${phase.goodFor.join(", ")}.</p>
    </div>
    <div class="meaning">
      <h4><span class="glyph">${sign.glyph}</span> Moon in ${sign.name} <span class="muted">(${sign.element})</span></h4>
      <p>${sign.text}</p>
      <p class="good-for"><b>Good for:</b> ${sign.goodFor.join(", ")}.</p>
    </div>
  </div>`;
};

const renderToday = () => {
  $("today").innerHTML = moonPanelHtml(new Date(), true);
};

// ---------------------------------------------------------------- toolbar

const renderToolbar = () => {
  const { view, year, month, hemisphere } = state;
  const title = view === "month" ? `${MONTHS[month]} ${year}` : `${year}`;
  $("cal-title").textContent = title;
  $("view-month").classList.toggle("selected", view === "month");
  $("view-year").classList.toggle("selected", view === "year");
  $("hemi-north").classList.toggle("selected", hemisphere === "north");
  $("hemi-south").classList.toggle("selected", hemisphere === "south");
  $("prev").title = view === "month" ? "Previous month" : "Previous year";
  $("next").title = view === "month" ? "Next month" : "Next year";
  document.title =
    view === "month"
      ? `Moon Phase Calendar ${MONTHS[month]} ${year}`
      : `Moon Phase Calendar ${year}`;
};

// ---------------------------------------------------------------- month view

const renderMonth = () => {
  const { year, month } = state;
  const byDay = phasesByDay([year - 1, year, year + 1].filter((y) => y >= 1900));
  const first = new Date(year, month, 1);
  const n = daysInMonth(year, month);
  const ingresses = Astro.ingressesBetween(first, new Date(year, month + 1, 1));
  const ingressByDay = {};
  ingresses.forEach((i) => (ingressByDay[dayKey(i.date)] = i));
  const today = new Date();

  let h = WEEKDAYS.map((w) => `<div class="dow">${w}</div>`).join("");
  for (let i = 0; i < first.getDay(); i++) h += '<div class="day empty"></div>';
  for (let d = 1; d <= n; d++) {
    const date = noon(year, month, d);
    const moon = Astro.moonAt(date);
    const p = byDay[dayKey(date)];
    const idx = phaseIndexFor(moon, p);
    const ing = ingressByDay[dayKey(date)];
    const cls = ["day"];
    if (p) cls.push("principal", "p-" + p.type);
    const ecl = p && p.eclipse;
    if (ecl) cls.push("eclipse", "eclipse-" + ecl.type);
    if (sameDay(date, today)) cls.push("today");
    const label = `${fmtLongDate(date)}: ${PHASES[idx].name}, ${fmtPct(moon.illumination)}${ecl ? `, ${LUNAR_ECLIPSES[ecl.type].label.toLowerCase()}` : ""}`;
    h += `<button class="${cls.join(" ")}" data-day="${d}" aria-label="${label}">
      <span class="dnum">${d}</span>
      <span class="dsign" title="Moon in ${SIGNS[moon.sign].name}">${SIGNS[moon.sign].glyph}</span>
      ${moonSvg(moon.illumination, moon.waxing, 46)}
      <span class="dphase">${p ? `${PHASES[idx].short} <b>${fmtTime(p.date)}</b>` : fmtPct(moon.illumination)}</span>
      ${ecl ? `<span class="decl" title="${LUNAR_ECLIPSES[ecl.type].label}, maximum at ${fmtTime(ecl.date)}">${ecl.type === "penumbral" ? "Penumbral" : ecl.type === "total" ? "Total" : "Partial"} eclipse</span>` : ""}
      ${ing ? `<span class="ding" title="Moon enters ${SIGNS[ing.sign].name} at ${fmtTime(ing.date)}">&rarr;${SIGNS[ing.sign].glyph} ${fmtTime(ing.date)}</span>` : ""}
    </button>`;
  }
  $("calendar").innerHTML = `<div class="month-grid">${h}</div>`;
  $("calendar")
    .querySelectorAll(".day[data-day]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        openDetail(noon(year, month, +el.dataset.day)),
      ),
    );

  // list of the month's principal phases
  const list = Object.values(byDay)
    .filter((p) => p.date.getFullYear() === year && p.date.getMonth() === month)
    .sort((a, b) => a.jd - b.jd);
  $("events").innerHTML = `<h2>Moon phases in ${MONTHS[month]} ${year}</h2>
    <div class="event-list">${list.map(eventCard).join("")}</div>
    <p class="tz muted">Times are in your time zone${timeZone() ? ` (${timeZone()})` : ""}. Moon signs use the tropical zodiac.</p>`;
  bindEventCards();
};

const eventCard = (p) => {
  const idx = PRINCIPAL_INDEX[p.type];
  const sign = SIGNS[p.sign];
  return `<button class="event p-${p.type}" data-t="${+p.date}">
    ${moonSvg(p.type === "full" ? 1 : p.type === "new" ? 0 : 0.5, p.type !== "last", 44)}
    <span class="ev-body">
      <span class="ev-name">${PHASES[idx].name}${p.name ? ` · ${p.name}` : ""}</span>
      <span class="ev-date">${fmtDate(p.date)}, ${fmtTime(p.date)}</span>
      <span class="ev-sign">in ${sign.glyph} ${sign.name} ${tagsHtml(p.tags)}</span>
    </span>
  </button>`;
};

const bindEventCards = () => {
  document.querySelectorAll(".event[data-t]").forEach((el) =>
    el.addEventListener("click", () => {
      const d = new Date(+el.dataset.t);
      openDetail(noon(d.getFullYear(), d.getMonth(), d.getDate()));
    }),
  );
};

// ---------------------------------------------------------------- year view

const renderYear = () => {
  const { year } = state;
  const byDay = phasesByDay([year - 1, year, year + 1].filter((y) => y >= 1900));
  const today = new Date();
  let h = '<div class="year-grid"><div class="yl"></div>';
  for (let d = 1; d <= 31; d++) h += `<div class="yd">${d}</div>`;
  for (let m = 0; m < 12; m++) {
    h += `<button class="yl ym" data-m="${m}" title="Show ${MONTHS[m]}">${MONTHS[m].slice(0, 3)}</button>`;
    const n = daysInMonth(year, m);
    for (let d = 1; d <= 31; d++) {
      if (d > n) {
        h += '<div class="yc empty"></div>';
        continue;
      }
      const date = noon(year, m, d);
      const moon = Astro.moonAt(date);
      const p = byDay[dayKey(date)];
      const idx = phaseIndexFor(moon, p);
      const cls = ["yc"];
      if (p) cls.push("principal", "p-" + p.type);
      const ecl = p && p.eclipse;
      if (ecl) cls.push("eclipse", "eclipse-" + ecl.type);
      if (sameDay(date, today)) cls.push("today");
      h += `<button class="${cls.join(" ")}" data-m="${m}" data-d="${d}" title="${fmtDate(date)}: ${PHASES[idx].name} (${fmtPct(moon.illumination)})${ecl ? ` · ${LUNAR_ECLIPSES[ecl.type].label}` : ""}">${moonSvg(moon.illumination, moon.waxing, 20, { detail: false })}</button>`;
    }
  }
  h += "</div>";
  $("calendar").innerHTML = `<div class="year-wrap">${h}</div>`;
  $("calendar")
    .querySelectorAll(".yc[data-d]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        openDetail(noon(year, +el.dataset.m, +el.dataset.d)),
      ),
    );
  $("calendar")
    .querySelectorAll(".ym")
    .forEach((el) =>
      el.addEventListener("click", () => go("month", year, +el.dataset.m)),
    );

  const { fulls, news } = yearData(year);
  const row = (p) => {
    const s = SIGNS[p.sign];
    return `<tr data-t="${+p.date}">
      <td>${fmtDate(p.date)}</td><td>${fmtTime(p.date)}</td>
      ${p.type === "full" ? `<td>${p.name}</td>` : ""}
      <td><span class="glyph">${s.glyph}</span> ${s.name}</td>
      <td class="num">${fmtKm(p.distance)}</td>
      <td>${tagsHtml(p.tags)}</td></tr>`;
  };
  $("events").innerHTML = `
    <h2>Full moons of ${year}</h2>
    <div class="table-wrap"><table class="moons">
      <thead><tr><th>Date</th><th>Time</th><th>Name</th><th>Sign</th><th class="num">Distance</th><th></th></tr></thead>
      <tbody>${fulls.map(row).join("")}</tbody></table></div>
    <h2>New moons of ${year}</h2>
    <div class="table-wrap"><table class="moons">
      <thead><tr><th>Date</th><th>Time</th><th>Sign</th><th class="num">Distance</th><th></th></tr></thead>
      <tbody>${news.map(row).join("")}</tbody></table></div>
    <p class="tz muted">Times are in your time zone${timeZone() ? ` (${timeZone()})` : ""}. Full moon names follow the North American almanac tradition.</p>`;
  document.querySelectorAll("table.moons tr[data-t]").forEach((el) =>
    el.addEventListener("click", () => {
      const d = new Date(+el.dataset.t);
      openDetail(noon(d.getFullYear(), d.getMonth(), d.getDate()));
    }),
  );
};

// ---------------------------------------------------------------- detail panel

let lastFocus = null;

const openDetail = (date) => {
  const pane = $("day-detail");
  lastFocus = document.activeElement;
  pane.innerHTML = `<button class="close" id="detail-close" aria-label="Close">&times;</button>${moonPanelHtml(date, false)}`;
  pane.classList.add("open");
  pane.setAttribute("aria-hidden", "false");
  $("detail-overlay").classList.add("open");
  $("detail-close").addEventListener("click", closeDetail);
  $("detail-close").focus();
};

const closeDetail = () => {
  const pane = $("day-detail");
  if (!pane.classList.contains("open")) return;
  pane.classList.remove("open");
  pane.setAttribute("aria-hidden", "true");
  $("detail-overlay").classList.remove("open");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
};

// ---------------------------------------------------------------- about

const renderAbout = () => {
  $("about-phases").innerHTML = PHASES.map(
    (p, i) => `<div class="about-phase">
      ${moonSvg([0, 0.25, 0.5, 0.8, 1, 0.8, 0.5, 0.25][i], i < 4, 54)}
      <div><h4>${p.name}</h4><div class="kw">${p.keywords.join(" · ")}</div><p>${p.text}</p></div>
    </div>`,
  ).join("");
  $("about-signs").innerHTML = SIGNS.map(
    (s) => `<div class="about-sign">
      <h4><span class="glyph">${s.glyph}</span> ${s.name} <span class="muted">${s.element}</span></h4>
      <div class="kw">${s.keywords.join(" · ")}</div><p>${s.text}</p></div>`,
  ).join("");
  $("about-names").innerHTML = [
    ...FULL_MOON_NAMES.map((n, i) => `<li><b>${MONTHS[i]}: ${n.name}</b>. ${n.text}</li>`),
    `<li><b>${HARVEST_MOON.name}</b>. ${HARVEST_MOON.text}</li>`,
  ].join("");
};

// ---------------------------------------------------------------- navigation

const render = () => {
  renderToolbar();
  if (state.view === "month") renderMonth();
  else renderYear();
};

const setHash = () => {
  const h =
    state.view === "month"
      ? `#${state.year}-${pad(state.month + 1)}`
      : `#${state.year}`;
  if (location.hash !== h) history.replaceState(null, "", h);
};

const clampYear = (y) => Math.max(1900, Math.min(2100, y));

const go = (view, year, month) => {
  state.view = view;
  state.year = clampYear(year);
  state.month = month ?? state.month;
  if (year < 1900) state.month = 0;
  if (year > 2100) state.month = 11;
  setHash();
  render();
};

const step = (dir) => {
  if (state.view === "year") return go("year", state.year + dir);
  const d = new Date(state.year, state.month + dir, 1);
  go("month", d.getFullYear(), d.getMonth());
};

const readHash = () => {
  const m = /^#(\d{4})(?:-(\d{1,2}))?$/.exec(location.hash);
  if (!m) return false;
  const y = clampYear(+m[1]);
  if (m[2]) {
    const mo = Math.max(1, Math.min(12, +m[2])) - 1;
    Object.assign(state, { view: "month", year: y, month: mo });
  } else {
    Object.assign(state, { view: "year", year: y });
  }
  return true;
};

const setHemisphere = (h) => {
  state.hemisphere = h;
  store.set("moon-hemisphere", h);
  renderToday();
  render();
  renderAbout();
};

const initMoon = () => {
  const now = new Date();
  state.year = now.getFullYear();
  state.month = now.getMonth();
  const h = store.get("moon-hemisphere");
  if (h === "north" || h === "south") state.hemisphere = h;
  readHash();

  $("prev").addEventListener("click", () => step(-1));
  $("next").addEventListener("click", () => step(1));
  $("go-today").addEventListener("click", () => {
    const d = new Date();
    go(state.view, d.getFullYear(), d.getMonth());
  });
  $("view-month").addEventListener("click", () => go("month", state.year));
  $("view-year").addEventListener("click", () => go("year", state.year));
  $("hemi-north").addEventListener("click", () => setHemisphere("north"));
  $("hemi-south").addEventListener("click", () => setHemisphere("south"));
  $("detail-overlay").addEventListener("click", closeDetail);
  window.addEventListener("hashchange", () => {
    if (readHash()) render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return closeDetail();
    if (e.target.closest("input, textarea, select")) return;
    if ($("day-detail").classList.contains("open")) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  renderToday();
  render();
  renderAbout();
  // keep "now" fresh if the page stays open
  setInterval(renderToday, 10 * 60 * 1000);
};
