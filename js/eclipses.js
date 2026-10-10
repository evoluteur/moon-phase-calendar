/*
  Moon Phase Calendar - lunar eclipses
  https://github.com/evoluteur/moon-phase-calendar
  (c) 2026 Olivier Giulieri

  From the Eclipse Calendar (https://github.com/evoluteur/eclipse-calendar):
  Jean Meeus, "Astronomical Algorithms" (2nd ed.), chapter 54. For a full moon
  near a node of the Moon's orbit it gives the time of maximum eclipse, gamma
  (how far the Moon passes from the axis of the Earth's shadow, in Earth radii)
  and u (the size of the umbra), from which the type, magnitude and durations
  follow.
*/

const Eclipses = (() => {
  const RAD = Math.PI / 180;
  const sind = (d) => Math.sin(d * RAD);
  const cosd = (d) => Math.cos(d * RAD);
  const norm360 = (d) => ((d % 360) + 360) % 360;
  const dateFromJd = (jd) => new Date(Math.round((jd - 2440587.5) * 86400000));

  // Delta T (TT - UT, seconds): Espenak & Meeus polynomials, 1900 to 2150
  const deltaT = (year) => {
    let t;
    if (year < 1920) {
      t = year - 1900;
      return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
    }
    if (year < 1941) {
      t = year - 1920;
      return 21.2 + 0.84493 * t - 0.0761 * t * t + 0.0020936 * t ** 3;
    }
    if (year < 1961) {
      t = year - 1950;
      return 29.07 + 0.407 * t - (t * t) / 233 + t ** 3 / 2547;
    }
    if (year < 1986) {
      t = year - 1975;
      return 45.45 + 1.067 * t - (t * t) / 260 - t ** 3 / 718;
    }
    if (year < 2005) {
      t = year - 2000;
      return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
    }
    if (year < 2050) {
      t = year - 2000;
      return 62.92 + 0.32217 * t + 0.005589 * t * t;
    }
    const u = (year - 1820) / 100;
    return -20 + 32 * u * u - 0.5628 * (2150 - year);
  };

  // the lunar eclipse at lunation k (k + 0.5 is a full moon), if any
  const eclipseAt = (k) => {
    const T = k / 1236.85;
    const F = norm360(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4);
    if (Math.abs(sind(F)) > 0.36) return null; // too far from a node
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const M = norm360(2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3);
    const Mp = norm360(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4);
    const Om = norm360(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3);
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const F1 = F - 0.02665 * sind(Om);
    const A1 = 299.77 + 0.107408 * k - 0.009173 * T * T;
    jde +=
      -0.4065 * sind(Mp) +
      0.1727 * E * sind(M) +
      0.0161 * sind(2 * Mp) -
      0.0097 * sind(2 * F1) +
      0.0073 * E * sind(Mp - M) -
      0.005 * E * sind(Mp + M) -
      0.0023 * sind(Mp - 2 * F1) +
      0.0021 * E * sind(2 * M) +
      0.0012 * sind(Mp + 2 * F1) +
      0.0006 * E * sind(2 * Mp + M) -
      0.0004 * sind(3 * Mp) -
      0.0003 * E * sind(M + 2 * F1) +
      0.0003 * sind(A1) -
      0.0002 * E * sind(M - 2 * F1) -
      0.0002 * E * sind(2 * Mp - M) -
      0.0002 * sind(Om);
    const P = 0.207 * E * sind(M) + 0.0024 * E * sind(2 * M) - 0.0392 * sind(Mp) + 0.0116 * sind(2 * Mp) - 0.0073 * E * sind(Mp + M) + 0.0067 * E * sind(Mp - M) + 0.0118 * sind(2 * F1);
    const Q = 5.2207 - 0.0048 * E * cosd(M) + 0.002 * E * cosd(2 * M) - 0.3299 * cosd(Mp) - 0.006 * E * cosd(Mp + M) + 0.0041 * E * cosd(Mp - M);
    const W = Math.abs(cosd(F1));
    const gamma = (P * cosd(F1) + Q * sind(F1)) * (1 - 0.0048 * W);
    const u = 0.0059 + 0.0046 * E * cosd(M) - 0.0182 * cosd(Mp) + 0.0004 * cosd(2 * Mp) - 0.0005 * cosd(M + Mp);
    const ag = Math.abs(gamma);
    const pen = (1.5573 + u - ag) / 0.545;
    const umb = (1.0128 - u - ag) / 0.545;
    if (pen <= 0) return null;
    const jdUT = jde - deltaT(2000 + k / 12.3685) / 86400;
    const n = 0.5458 + 0.04 * cosd(Mp); // the Moon's speed (Earth radii an hour)
    const semi = (r) => (r > ag ? (60 / n) * Math.sqrt(r * r - gamma * gamma) : 0); // minutes
    return {
      k,
      jdUT,
      date: dateFromJd(jdUT),
      type: umb >= 1 ? "total" : umb > 0 ? "partial" : "penumbral",
      penMag: pen,
      umbMag: umb,
      magnitude: umb > 0 ? umb : pen,
      // half durations, in minutes: penumbral, partial (umbral) and total phases
      semi: { pen: semi(1.5573 + u), par: semi(1.0128 - u), tot: semi(0.4678 - u) },
    };
  };

  // the lunar eclipse at the full moon of Julian day jd (UT), if any
  const atFullMoon = (jd) => {
    const k = Math.round((jd - 2451550.09766) / 29.530588861 - 0.5) + 0.5;
    const e = eclipseAt(k);
    return e && Math.abs(e.jdUT - jd) < 1 ? e : null;
  };

  return { eclipseAt, atFullMoon };
})();

if (typeof module !== "undefined") module.exports = Eclipses;
