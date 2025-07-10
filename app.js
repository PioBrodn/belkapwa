// app.js (updated version with result clearing)
document.getElementById("calculateBtn").addEventListener("click", () => {
  document.getElementById("summary").innerHTML = "";
  const momentCanvas = document.getElementById("momentCanvas");
  const shearCanvas = document.getElementById("shearCanvas");
  const deflectionCanvas = document.getElementById("deflectionCanvas");
  [momentCanvas, shearCanvas, deflectionCanvas].forEach(canvas => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  const L = parseFloat(document.getElementById("span").value);
  const deflectionType = document.getElementById("deflection_type").value;
  let delta_limit;

  if (deflectionType === "absolute") {
    delta_limit = parseFloat(document.getElementById("delta_limit").value);
  } else {
    const ratio = parseFloat(document.getElementById("delta_limit_ratio").value);
    delta_limit = (L * 1000) / ratio;
  }

  const b = parseFloat(document.getElementById("b").value) / 1000;
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
  const includeShear = document.getElementById("check_shear_deflection").checked;
  const material = document.getElementById("material").value;

  let gammaM = 1.3;
  let density = 500;
  let fm_k = 24;
  let fv_k = 4;
  let E0_mean = 11000;

  if (material.startsWith("GL")) {
    gammaM = 1.25;
    switch (material) {
      case "GL24c": density = 385; fm_k = 24; fv_k = 3.5; E0_mean = 11000; break;
      case "GL24h": density = 385; fm_k = 24; fv_k = 3.5; E0_mean = 11500; break;
      case "GL28c": density = 390; fm_k = 28; fv_k = 3.5; E0_mean = 12500; break;
      case "GL28h": density = 425; fm_k = 28; fv_k = 3.5; E0_mean = 12600; break;
      case "GL30c": density = 390; fm_k = 30; fv_k = 3.5; E0_mean = 13000; break;
      case "GL30h": density = 430; fm_k = 30; fv_k = 3.5; E0_mean = 13600; break;
      default: density = 430; fm_k = 24; fv_k = 2.5; E0_mean = 11500; break;
    }
  } else if (material === "LVL") {
    gammaM = 1.2;
    density = 550;
    fm_k = 44;
    fv_k = 4.6;
    E0_mean = 14000;
  } else {
    switch (material) {
      case "C20": density = 330; fm_k = 20; fv_k = 2.6; E0_mean = 9000; break;
      case "C24": density = 350; fm_k = 24; fv_k = 4.0; E0_mean = 11000; break;
      case "C30": density = 380; fm_k = 30; fv_k = 4.0; E0_mean = 12000; break;
      default: density = 500; fm_k = 24; fv_k = 3.5; E0_mean = 11000; break;
    }
  }

  function updateMaterialProperties() {
    document.getElementById("fm_k_display").innerHTML = `f<sub>m,k</sub> = ${fm_k.toFixed(1)} MPa`;
    document.getElementById("fv_k_display").innerHTML = `f<sub>v,k</sub> = ${fv_k.toFixed(1)} MPa`;
    document.getElementById("E0_display").innerHTML = `E<sub>0,mean</sub> = ${E0_mean} MPa`;
    document.getElementById("density_display").innerHTML = `ρ<sub>k</sub> = ${density} kg/m³`;
  }
  updateMaterialProperties();

  const g_self = density * 9.81 * A;
  const q_self = g_self / 1000;

  const q_d = q_self + g * g_gamma + q_live * q_live_gamma + q_snow * q_snow_gamma + q_wind * q_wind_gamma;
  const P_d = Pk * P_gamma;

  let M_Ed = 0;
  let V_Ed = 0;

  switch (support) {
    case "simply_supported":
      const M_q = (q_d * Math.pow(L, 2)) / 8;
      const M_P = P_d * P_dist * (L - P_dist) / L;
      M_Ed = Math.max(M_q, M_P);
      V_Ed = Math.max((q_d * L) / 2, P_d);
      break;
    case "cantilever":
      M_Ed = (q_d * Math.pow(L, 2)) / 2 + P_d * (L - P_dist);
      V_Ed = q_d * L + P_d;
      break;
    case "two_span":
    case "three_span":
      alert("Wybrany schemat statyczny nie jest jeszcze obsługiwany.");
      return;
    default:
      alert("Nieznany schemat statyczny.");
      return;
  }

  const f_md = fm_k * 1e6 * kmod / gammaM;
  const sigma_md = (M_Ed * h / 2) / I / 1e6;
  const isMomentSafe = sigma_md < f_md / 1e6;

  let delta_q = (5 * q_d * Math.pow(L, 4)) / (384 * E0_mean * 1e6 * I);

  if (includeShear) {
    const k = 1.2;
    const G = E0_mean / 16;
    const A_s = b * h * 1e6;
    const delta_shear = (k * q_d * Math.pow(L, 2)) / (G * A_s);
    delta_q += delta_shear;
  }

  const delta_q_mm = delta_q * 1000;
  const isDeflectionOk = delta_q_mm <= delta_limit;

  const summary = `
    <p><strong>Geometria:</strong> A = ${(A * 1e6).toFixed(2)} cm², I = ${(I * 1e12).toFixed(2)} cm⁴</p>
    <p><strong>Obciążenia obliczeniowe:</strong> q = ${q_d.toFixed(2)} kN/m, P = ${P_d.toFixed(2)} kN</p>
    <p><strong>Moment zginający M<sub>Ed</sub></strong> = ${M_Ed.toFixed(2)} kNm</p>
    <p><strong>Naprężenie zginające σ<sub>m,d</sub></strong> = ${sigma_md.toFixed(2)} N/mm² ${isMomentSafe ? '✅' : '❌'}</p>
    <p><strong>Nośność obliczeniowa f<sub>m,d</sub></strong> = ${(f_md / 1e6).toFixed(2)} N/mm²</p>
    <p><strong>Wytrzymałość na ścinanie f<sub>v,k</sub>:</strong> ${fv_k.toFixed(2)} MPa, Moduł spręży...
