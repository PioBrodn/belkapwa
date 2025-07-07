function calculate() {
  const L = parseFloat(document.getElementById('length').value); // [m]
  const b = parseFloat(document.getElementById('width').value);  // [m]
  const h = parseFloat(document.getElementById('height').value); // [m]
  const P = parseFloat(document.getElementById('forceP').value) * 1000; // [N]
  const Q = parseFloat(document.getElementById('loadQ').value) * 1000;  // [N/m]
  const kmod = parseFloat(document.getElementById('kmod').value);
  const ldivx = parseFloat(document.getElementById('ldivx').value);
  const usageClass = parseInt(document.getElementById('usageClass').value);
  const shearDeflection = document.getElementById('shearDeflection').checked;

  // Właściwości geometryczne
  const A = b * h;
  const Iy = (b * Math.pow(h,3)) / 12;
  const W = Iy / (h/2);

  // Ciężar własny (N/m)
  const gself = A * 500 * 9.81;
  const q_total = Q + gself;

  // Moment max (kNm)
  let MEd = (q_total * Math.pow(L,2) / 8 + P * L / 4) / 1000;

  // Naprężenie zginające (MPa)
  let sigma_mEd = (MEd * 1e6) / W / 1e6;

  // Przyjęta wytrzymałość na zginanie (MPa)
  let fmd = 24 * kmod / 1.3;

  // Siła tnąca max (kN)
  let VEd = (q_total * L / 2 + P / 2) / 1000;

  // Przyjęta wytrzymałość na ścinanie (MPa)
  let fvd = 2.5 * kmod / 1.3;

  // Naprężenie ścinające (MPa)
  let tau_Ed = (VEd * 1000) / (A) / 1e6;

  // Moduły
  let E = 11000e6;
  let G = 650e6;

  // Ugięcie od zginania
  let delta_bend = (5 * q_total * Math.pow(L,4)) / (384 * E * Iy);
  delta_bend += (P * Math.pow(L,3)) / (48 * E * Iy);

  // Ugięcie od ścinania
  let delta_shear = 0;
  if (shearDeflection) {
    delta_shear = (q_total * Math.pow(L,2)) / (2 * G * A);
    delta_shear += (P * L) / (G * A);
  }

  // kdef wg klasy użytkowania
  let kdef = usageClass === 1 ? 0.6 : usageClass === 2 ? 0.8 : 2.0;

  // Ugięcie końcowe (mm)
  let delta_final = (delta_bend + delta_shear) * (1 + kdef) * 1000;

  // Ugięcie dopuszczalne (mm)
  let delta_limit = (L * 1000) / ldivx;

  // Wyniki
  let html = '';
  html += resultBlock(`M<sub>Ed</sub> = ${MEd.toFixed(2)} kNm ≤ M<sub>Rd</sub> = ${(fmd*W/1000000).toFixed(2)} kNm`, MEd <= fmd*W/1000000);
  html += resultBlock(`σ<sub>m,Ed</sub> = ${sigma_mEd.toFixed(2)} MPa ≤ f<sub>m,d</sub> = ${fmd.toFixed(2)} MPa`, sigma_mEd <= fmd);
  html += resultBlock(`V<sub>Ed</sub> = ${VEd.toFixed(2)} kN`, true);
  html += resultBlock(`τ<sub>Ed</sub> = ${tau_Ed.toFixed(2)} MPa ≤ f<sub>v,d</sub> = ${fvd.toFixed(2)} MPa`, tau_Ed <= fvd);
  html += resultBlock(`w = ${delta_final.toFixed(2)} mm ≤ w<sub>dop</sub> = ${delta_limit.toFixed(2)} mm`, delta_final <= delta_limit);

  // Podsumowanie
  if (MEd <= fmd*W/1000000 && sigma_mEd <= fmd && tau_Ed <= fvd && delta_final <= delta_limit) {
    html += `<div class="result-block success"><strong>✔ Belka spełnia warunki nośności i użytkowalności</strong></div>`;
  } else {
    html += `<div class="result-block failure"><strong>❌ Belka nie spełnia warunków — konieczna zmiana przekroju / materiału</strong></div>`;
  }

  document.getElementById('results').innerHTML = html;

  // Wykresy (prosty przykład momentu)
  renderChart('chartMoment', 'Moment [kNm]', [0, L/2, L], [0, MEd, 0]);
  renderChart('chartShear', 'Siła tnąca [kN]', [0, L/2, L], [VEd, 0, -VEd]);
  renderChart('chartDeflection', 'Ugięcie [mm]', [0, L/2, L], [0, delta_final, 0]);
}

function resultBlock(text, ok) {
  return `<div class="result-block ${ok ? 'success' : 'failure'}">
    ${ok ? '✔' : '❌'} ${text}
  </div>`;
}

function renderChart(id, label, xData, yData) {
  const ctx = document.getElementById(id).getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: xData.map(v => v.toFixed(2)),
      datasets: [{
        label: label,
        data: yData,
        fill: false,
        borderColor: '#4CAF50',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'L [m]' } },
        y: { title: { display: true, text: label } }
      }
    }
  });
}