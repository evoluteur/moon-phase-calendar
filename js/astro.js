/*
  Moon Phase Calendar - astronomy
  https://github.com/evoluteur/moon-phase-calendar
  (c) 2026 Olivier Giulieri

  Positions of the Sun and the Moon from the algorithms in Jean Meeus,
  "Astronomical Algorithms" (2nd ed.): chapter 25 (Sun, low precision) and
  chapter 47 (Moon, main periodic terms). The Moon longitude is good to a
  few hundredths of a degree, so phase times come out within a few minutes.
  Phase and sign-change times are found by solving for the exact moment
  (Newton's method on the elongation or on the longitude), not by a table.
*/

const Astro = (() => {
  const RAD = Math.PI / 180;
  const SYNODIC = 29.530588853; // days
  const norm = (a) => ((a % 360) + 360) % 360;
  const sin = (d) => Math.sin(d * RAD);
  const cos = (d) => Math.cos(d * RAD);

  const jdFromDate = (date) => date.getTime() / 86400000 + 2440587.5;

  // Delta T (TT - UT, in days): the positions below use Terrestrial Time,
  // clocks use UT. NASA polynomial for 2005-2050, a simple parabola outside.
  const deltaT = (jd) => {
    const y = 2000 + (jd - 2451545) / 365.25;
    const t = y - 2000;
    const s =
      y >= 2005 && y <= 2050
        ? 62.92 + 0.32217 * t + 0.005589 * t * t
        : -20 + 32 * ((y - 1820) / 100) ** 2;
    return s / 86400;
  };
  const centuries = (jd) => (jd + deltaT(jd) - 2451545) / 36525;
  const dateFromJd = (jd) => new Date(Math.round((jd - 2440587.5) * 86400000));

  // Meeus table 47.A: [D, M, M', F, sum-l (1e-6 deg), sum-r (1e-3 km)]
  const TERMS = [
    [0, 0, 1, 0, 6288774, -20905355],
    [2, 0, -1, 0, 1274027, -3699111],
    [2, 0, 0, 0, 658314, -2955968],
    [0, 0, 2, 0, 213618, -569925],
    [0, 1, 0, 0, -185116, 48888],
    [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158],
    [2, -1, -1, 0, 57066, -152138],
    [2, 0, 1, 0, 53322, -170733],
    [2, -1, 0, 0, 45758, -204586],
    [0, 1, -1, 0, -40923, -129620],
    [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755],
    [2, 0, 0, -2, 15327, 10321],
    [0, 0, 1, 2, -12528, 0],
    [0, 0, 1, -2, 10980, 79661],
    [4, 0, -1, 0, 10675, -34782],
    [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636],
    [2, 1, -1, 0, -7888, 24208],
    [2, 1, 0, 0, -6766, 30824],
    [1, 0, -1, 0, -5163, -8379],
    [1, 1, 0, 0, 4987, -16675],
    [2, -1, 1, 0, 4036, -12831],
    [2, 0, 2, 0, 3994, -10445],
    [4, 0, 0, 0, 3861, -11650],
    [2, 0, -3, 0, 3665, 14403],
    [0, 1, -2, 0, -2689, -7003],
    [2, 0, -1, 2, -2602, 0],
    [2, -1, -2, 0, 2390, 10056],
    [1, 0, 1, 0, -2348, 6322],
    [2, -2, 0, 0, 2236, -9884],
    [0, 1, 2, 0, -2120, 5751],
    [0, 2, 0, 0, -2069, 0],
    [2, -2, -1, 0, 2048, -4950],
    [2, 0, 1, -2, -1773, 4130],
    [2, 0, 0, 2, -1595, 0],
    [4, -1, -1, 0, 1215, -3958],
    [0, 0, 2, 2, -1110, 0],
    [3, 0, -1, 0, -892, 3258],
    [2, 1, 1, 0, -810, 2616],
    [4, -1, -2, 0, 759, -1897],
    [0, 2, -1, 0, -713, -2117],
    [2, 2, -1, 0, -700, 2354],
    [2, 1, -2, 0, 691, 0],
    [2, -1, 0, -2, 596, 0],
    [4, 0, 1, 0, 549, -1423],
    [0, 0, 4, 0, 537, -1117],
    [4, -1, 0, 0, 520, -1571],
    [1, 0, -2, 0, -487, -1739],
  ];

  // nutation in longitude (degrees), the main term only
  const nutation = (T) =>
    (-17.2 * sin(125.04452 - 1934.136261 * T) -
      1.32 * sin(2 * (280.4665 + 36000.7698 * T))) /
    3600;

  // apparent geocentric ecliptic longitude of the Sun (degrees)
  const sunLongitude = (jd) => {
    const T = centuries(jd);
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const C =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
      (0.019993 - 0.000101 * T) * sin(2 * M) +
      0.000289 * sin(3 * M);
    const aberration = -0.00569;
    return norm(L0 + C + aberration + nutation(T));
  };

  // apparent geocentric ecliptic longitude (degrees) and distance (km) of the Moon
  const moonPosition = (jd) => {
    const T = centuries(jd);
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const A1 = 119.75 + 131.849 * T;
    const A2 = 53.09 + 479264.29 * T;
    let sl = 0;
    let sr = 0;
    for (const [d, m, mp, f, l, r] of TERMS) {
      const arg = d * D + m * M + mp * Mp + f * F;
      const e = m === 0 ? 1 : Math.abs(m) === 1 ? E : E * E;
      sl += l * e * sin(arg);
      sr += r * e * cos(arg);
    }
    sl += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
    return {
      longitude: norm(Lp + sl / 1e6 + nutation(T)),
      distance: 385000.56 + sr / 1000,
    };
  };

  const moonLongitude = (jd) => moonPosition(jd).longitude;

  // Moon - Sun, in degrees [0, 360): 0 new, 90 first quarter, 180 full, 270 last quarter
  const elongation = (jd) => norm(moonLongitude(jd) - sunLongitude(jd));

  // signed difference a - b in (-180, 180]
  const diff = (a, b) => {
    let d = norm(a - b);
    return d > 180 ? d - 360 : d;
  };

  // solve f(jd) = target near jd (f in degrees, rate in degrees per day)
  const solve = (f, target, jd, rate) => {
    for (let i = 0; i < 12; i++) {
      const delta = diff(target, f(jd)) / rate;
      jd += delta;
      if (Math.abs(delta) < 1e-6) break;
    }
    return jd;
  };

  const PHASES = ["new", "first", "full", "last"];

  // exact principal phases (new, first quarter, full, last quarter) between two dates
  const phasesBetween = (start, end) => {
    const jd0 = jdFromDate(start);
    const jd1 = jdFromDate(end);
    const out = [];
    // step back to the previous principal phase, then walk forward
    const e0 = elongation(jd0);
    let q = Math.floor(e0 / 90);
    let jd = jd0 - (e0 - q * 90) / 12.19;
    for (let n = 0; n < 200; n++) {
      const target = (q % 4) * 90;
      const t = solve(elongation, target, jd, 12.19);
      if (t > jd1) break;
      if (t >= jd0) {
        const pos = moonPosition(t);
        out.push({
          type: PHASES[q % 4],
          date: dateFromJd(t),
          jd: t,
          longitude: pos.longitude,
          distance: pos.distance,
        });
      }
      q++;
      jd = t + SYNODIC / 4;
    }
    return out;
  };

  // moments the Moon enters a new zodiac sign, between two dates
  const ingressesBetween = (start, end) => {
    const jd0 = jdFromDate(start);
    const jd1 = jdFromDate(end);
    const out = [];
    let s = Math.floor(moonLongitude(jd0) / 30);
    let jd = jd0;
    for (let n = 0; n < 400; n++) {
      const next = (s + 1) % 12;
      const t = solve(moonLongitude, next * 30, jd + 1.5, 13.18);
      if (t > jd1) break;
      if (t >= jd0) out.push({ sign: next, date: dateFromJd(t), jd: t });
      s = next;
      jd = t + 0.5;
    }
    return out;
  };

  // everything about the Moon at one moment
  const moonAt = (date) => {
    const jd = jdFromDate(date);
    const pos = moonPosition(jd);
    const sun = sunLongitude(jd);
    const elong = norm(pos.longitude - sun);
    return {
      date,
      jd,
      elongation: elong,
      illumination: (1 - cos(elong)) / 2, // fraction lit
      waxing: elong < 180,
      longitude: pos.longitude,
      sign: Math.floor(pos.longitude / 30),
      degree: pos.longitude % 30,
      distance: pos.distance,
    };
  };

  return {
    SYNODIC,
    jdFromDate,
    dateFromJd,
    sunLongitude,
    moonPosition,
    elongation,
    phasesBetween,
    ingressesBetween,
    moonAt,
  };
})();

if (typeof module !== "undefined") module.exports = Astro;
