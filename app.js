
document.getElementById('beamForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const L = parseFloat(document.getElementById('length').value);
  const b = parseFloat(document.getElementById('width').value) / 1000;
  const h = parseFloat(document.getElementById('height').value) / 1000;
  const q = parseFloat(document.getElementById('load').value);
  const P = parseFloat(document.getElementById('pointLoad').value || 0);
  const a = parseFloat(document.getElementById('pointLocation').value || L / 2);

  const I = (b * Math.pow(h, 3)) / 12;
  const y = h / 2;
  const Mq = (q * Math.pow(L, 2)) / 8;
  const Mp = P * a * (L - a) / L;
  const MEd = Mq + Mp;

  const sigma = (MEd * 1e6 * y) / I;
  const fmd = 24e6;

  const resultText = `
    <p><strong>Moment od obciążenia równomiernego:</strong> ${Mq.toFixed(3)} kNm</p>
    <p><strong>Moment od siły skupionej:</strong> ${Mp.toFixed(3)} kNm</p>
    <p><strong>Całkowity moment zginający M<sub>Ed</sub>:</strong> ${MEd.toFixed(3)} kNm</p>
    <p><strong>Naprężenie zginające σ<sub>m,d</sub>:</strong> ${(sigma / 1e6).toFixed(2)} N/mm²</p>
    <p><strong>Nośność na zginanie f<sub>m,d</sub>:</strong> ${(fmd / 1e6).toFixed(2)} N/mm²</p>
    <p><strong>Spełniony warunek:</strong> ${sigma < fmd ? '✅ TAK' : '❌ NIE'}</p>
  `;
  document.getElementById('results').innerHTML = resultText;

  const ctx = document.getElementById('momentChart').getContext('2d');
  ctx.clearRect(0, 0, 800, 160);
  ctx.beginPath();
  ctx.moveTo(0, 80);
  for (let x = 0; x <= 800; x++) {
    const X = (x / 800) * L;
    const m = q * X * (L - X) / 2 + (P > 0 ? P * Math.max(0, (L - Math.abs(X - a))) * Math.min(1, 1 - Math.abs(X - a)) : 0);
    const y = 80 - m * 80 / MEd;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#004d40";
  ctx.stroke();
});
