// app.js (draft start)
document.getElementById("calculateBtn").addEventListener("click", () => {
  const L = parseFloat(document.getElementById("span").value);
  const b = parseFloat(document.getElementById("b").value) / 1000; // mm to m
  const h = parseFloat(document.getElementById("h").value) / 1000;
  const A = b * h;
  const I = (b * Math.pow(h, 3)) / 12;

  const support = document.getElementById("support").value;

  const g = parseFloat(document.getElementById("g").value);
  const g_gamma = parseFloat(document.getElementById("g_gamma").value);
  const q_live = parseFloat(document.getElementById("q_live").value);
  const q_live_gamma = parseFloat(document.getElementById("q_live_gamma").value);
  const q_snow = parseFloat(document.getElementById("q_snow").value);
  const q_snow_gamma = parseFloat(document.getElementById("q_snow_gamma").value);
  const q_wind = parseFloat(document.getElementById("q_wind").value);
  const q_wind_gamma = parseFloat(document.getElementById("q_wind_gamma").value);

  const Pk = parseFloat(document.getElementById("P").value);
  const P_dist = parseFloat(document.getElementById("P_dist").value);
  const P_gamma = parseFloat(document.getElementById("P_gamma").value);

  const kmod = parseFloat(document.getElementById("kmod").value);
  const gammaM = 1.3; // Eurocode default for wood

  // self weight
  const density = 500; // kg/m3 for timber (generic), can be extended per material
  const g_self = density * 9.81 * A; // N/m
  const q_self = g_self / 1000; // kN/m

  // total design load
  const q_d = q_self + g * g_gamma + q_live * q_live_gamma + q_snow * q_snow_gamma + q_wind * q_wind_gamma;
  const P_d = Pk * P_gamma;

  let M_Ed = 0;
  let V_Ed = 0;

  if (support === "simply_supported") {
    M_Ed = (q_d * Math.pow(L, 2)) / 8;
    V_Ed = (q_d * L) / 2;
  }

  const f_md = 24 * 1000000 * kmod / gammaM; // N/m2 (for C24 default), to be replaced by lookup
  const sigma_md = (M_Ed * h / 2) / I * 1000000; // N/m2 to N/mm2

  const isMomentSafe = sigma_md < f_md / 1e6;

  const summary = `
    <p><strong>Geometria:</strong> A = ${(A * 1e6).toFixed(2)} cm², I = ${(I * 1e12).toFixed(2)} cm⁴</p>
    <p><strong>Obciążenia obliczeniowe:</strong> q = ${q_d.toFixed(2)} kN/m, P = ${P_d.toFixed(2)} kN</p>
    <p><strong>Moment zginający M<sub>Ed</sub></strong> = ${M_Ed.toFixed(2)} kNm</p>
    <p><strong>Naprężenie zginające σ<sub>m,d</sub></strong> = ${sigma_md.toFixed(2)} N/mm² ${isMomentSafe ? '✅' : '❌'}</p>
    <p><strong>Nośność obliczeniowa f<sub>m,d</sub></strong> = ${(f_md / 1e6).toFixed(2)} N/mm²</p>
  `;

  document.getElementById("summary").innerHTML = summary;
});
