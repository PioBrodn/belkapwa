document.addEventListener('DOMContentLoaded', () => {
  const E = 11000 * 1e3; // MPa → kN/m², przykładowe E dla C24
  const form = document.createElement('form');
  form.innerHTML = `
    <label>Typ belki:
      <select id="supportType">
        <option value="simply">Swobodnie podparta</option>
      </select>
    </label>
    <label>Długość belki L [m]: <input id="length" type="number" step="0.01" value="4"></label>
    <label>Rozstaw podpór a [m] (dla siły skupionej): <input id="a" type="number" step="0.01" value="2"></label>
    <label>Obciążenie równomierne q [kN/m]: <input id="q" type="number" step="0.01" value="5"></label>
    <label>Siła skupiona F [kN]: <input id="F" type="number" step="0.01" value="0"></label>
    <label>Moment bezpieczny M<sub>Rd</sub> [kNm]: <input id="Mrd" type="number" step="0.01" value="25"></label>
    <button type="button" id="calc">Oblicz</button>
    <div id="results"></div>
    <canvas id="momentChart"></canvas>
    <canvas id="shearChart"></canvas>
    <canvas id="deflectionChart"></canvas>
  `;
  document.querySelector('main').appendChild(form);

  document.getElementById('calc').addEventListener('click', () => {
    const L = parseFloat(document.getElementById('length').value);
    const q = parseFloat(document.getElementById('q').value);
    const F = parseFloat(document.getElementById('F').value);
    const a = parseFloat(document.getElementById('a').value);
    const Mrd = parseFloat(document.getElementById('Mrd').value);

    const step = 0.1;
    const x = Array.from({ length: Math.ceil(L / step) + 1 }, (_, i) => i * step);
    const M = [];
    const V = [];
    const w = [];

    x.forEach(xi => {
      let Mi = 0, Vi = 0, wi = 0;
      if (F > 0) {
        const R1 = F * (L - a) / L;
        const R2 = F * a / L;
        Mi = (xi < a) ? R1 * xi : R1 * xi - F * (xi - a);
        Vi = (xi < a) ? R1 : R1 - F;
      } else {
        Mi = (q * L * xi / 2) - (q * xi * xi / 2);
        Vi = q * (L / 2 - xi);
      }
      const wiVal = (F === 0) ? (5 * q * Math.pow(xi, 4) - 8 * q * L * Math.pow(xi, 3) + 3 * q * Math.pow(L, 4)) / (120 * E) : 0;
      M.push(Mi);
      V.push(Vi);
      w.push(wiVal);
    });

    document.getElementById('results').innerHTML = `
      <p><strong>M<sub>max</sub> = ${Math.max(...M.map(Math.abs)).toFixed(2)} kNm</strong></p>
      <p><strong>Warunek zginania: ${Math.max(...M.map(Math.abs)) <= Mrd ? 'OK' : 'NIE OK'}</strong></p>
    `;

    plotChart('momentChart', 'Moment zginający [kNm]', x, M);
    plotChart('shearChart', 'Siła tnąca [kN]', x, V);
    plotChart('deflectionChart', 'Ugięcie [mm]', x, w.map(val => val * 1000)); // m → mm
  });

  function plotChart(canvasId, label, x, y) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (window[canvasId]) window[canvasId].destroy();
    window[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: x,
        datasets: [{
          label,
          data: y,
          borderColor: 'steelblue',
          fill: false,
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'x [m]' } },
          y: { title: { display: true, text: label } }
        }
      }
    });
  }
});
