/ app.js

document.getElementById("calculateBtn").addEventListener("click", calculate);

function calculate() {
  const L = parseFloat(document.getElementById("length").value);
  const b = parseFloat(document.getElementById("width").value) / 1000;
  const h = parseFloat(document.getElementById("height").value) / 1000;
  const fmk = parseFloat(document.getElementById("fmk").value);
  const fvk = parseFloat(document.getElementById("fvk").value);
  const Emk = parseFloat(document.getElementById("Emk").value);
  const kmod = parseFloat(document.getElementById("kmod").value);
  const gammaM = parseFloat(document.getElementById("gammaM").value);
  const kh = h <= 0.15 ? 1.3 : 1.0;

  const P = parseFloat(document.getElementById("loadP").value);
  const aP = parseFloat(document.getElementById("loadPPosition").value);
  const Q = parseFloat(document.getElementById("loadQ").value);

  const g_self = 0.5 * b * h * 500; // [kN/m]
  const q_total = Q + g_self;

  // Reakcje podporowe
  const RA = P * (L - aP) / L + q_total * L / 2;
  const RB = P * aP / L + q_total * L / 2;

  // Moment maksymalny
  const MEd_Q = q_total * Math.pow(L, 2) / 8;
  const MEd_P = P * aP * (L - aP) / L;
  const MEd = MEd_Q + MEd_P;

  // Siła tnąca maksymalna
  const VEd = Math.max(Math.abs(RA), Math.abs(RB));

  // Geometria przekroju
  const A = b * h;
  const W = (b * Math.pow(h, 2)) / 6;
  const I = (b * Math.pow(h, 3)) / 12;
  const i = Math.sqrt(I / A);

  // Nośność obliczeniowa
  const fmd = (fmk * kmod * kh) / gammaM;
  const fvd = (fvk * kmod) / gammaM;

  const sigma_m_d = MEd * 1e6 / W;
  const tau_d = VEd * 1e3 / (b * h * 0.67);

  const Mrd = fmd * W / 1e6;
  const Vrd = fvd * b * h * 0.67 / 1e3;

  const resultM = sigma_m_d < fmd;
  const resultV = tau_d < fvd;

  // Ugięcie
  const delta_max = (5 * q_total * Math.pow(L, 4)) / (384 * Emk * 1e6 * I);
  const delta_limit = L * 1000 / 300; // mm
  const resultD = delta_max * 1000 < delta_limit;

  // Rysowanie wykresów
  drawDiagrams(L, P, aP, q_total, RA, RB);

  // Wyniki
  document.getElementById("result").innerHTML = `
    <h3>Wyniki:</h3>
    <p><strong>Reakcje podporowe:</strong> R<sub>A</sub> = ${RA.toFixed(2)} kN, R<sub>B</sub> = ${RB.toFixed(2)} kN</p>
    <p><strong>Moment zginający:</strong> M<sub>Ed</sub> = ${MEd.toFixed(2)} kNm → f<sub>md</sub> = ${fmd.toFixed(2)} N/mm² → 
    σ<sub>m,d</sub> = ${sigma_m_d.toFixed(2)} N/mm² 
    ${resultM ? '✅' : '❌'}</p>
    <p><strong>Siła tnąca:</strong> V<sub>Ed</sub> = ${VEd.toFixed(2)} kN → f<sub>vd</sub> = ${fvd.toFixed(2)} N/mm² →
    τ<sub>d</sub> = ${tau_d.toFixed(2)} N/mm² 
    ${resultV ? '✅' : '❌'}</p>
    <p><strong>Ugięcie maksymalne:</strong> δ = ${(delta_max * 1000).toFixed(2)} mm (dopuszczalne: ${delta_limit.toFixed(2)} mm) 
    ${resultD ? '✅' : '❌'}</p>
    <p><strong>Charakterystyki przekroju:</strong> A = ${(A * 1e6).toFixed(2)} mm², W = ${(W * 1e9).toFixed(2)} mm³, I = ${(I * 1e12).toFixed(2)} mm⁴, i = ${i.toFixed(2)} mm</p>
    <h3>Ocena:</h3>
    <p class="${(resultM && resultV && resultD) ? 'success' : 'failure'}">
      ${(resultM && resultV && resultD) ? '✅ Belka spełnia warunki nośności i użytkowalności.' : '❌ Belka nie spełnia jednego lub więcej warunków.'}
    </p>
  `;
}

// Diagram
function drawDiagrams(L, P, aP, q, RA, RB) {
  const ctx = document.getElementById("diagramCanvas").getContext("2d");
  ctx.clearRect(0, 0, 1000, 200);
  const w = 1000;
  const h = 200;
  const scaleX = w / L;
  const scaleY = 80;

  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  for (let x = 0; x <= L; x += L / 20) {
    const M = (RA * x) - (q * x * x) / 2 - (P * Math.max(x - aP, 0));
    ctx.lineTo(x * scaleX, h / 2 - M * scaleY / 100);
  }
  ctx.strokeStyle = "blue";
  ctx.stroke();

  // Oś 0
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.strokeStyle = "#aaa";
  ctx.stroke();

  // Opis
  ctx.fillStyle = "#000";
  ctx.font = "14px sans-serif";
  ctx.fillText("Schemat wykresu momentów zginających (symboliczny)", 10, 20);
}