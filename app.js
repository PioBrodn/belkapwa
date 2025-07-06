
// app.js
const klasyDrewna = {
  EN338: {
    C14: { fmk: 14, ft0k: 1.3, fvdk: 1.5 },
    C18: { fmk: 18, ft0k: 1.6, fvdk: 1.8 },
    C24: { fmk: 24, ft0k: 2.1, fvdk: 2.5 },
    C30: { fmk: 30, ft0k: 2.5, fvdk: 3.0 }
  },
  EN14080: {
    GL24h: { fmk: 24, ft0k: 17, fvdk: 3.0 },
    GL28h: { fmk: 28, ft0k: 19, fvdk: 3.5 },
    GL32h: { fmk: 32, ft0k: 21, fvdk: 4.0 }
  }
};

const typDrewnaSelect = document.getElementById('typDrewna');
const klasaDrewnaSelect = document.getElementById('klasaDrewna');
const manualParamsDiv = document.getElementById('manualParams');

function wypelnijKlasy() {
  const typ = typDrewnaSelect.value;
  klasaDrewnaSelect.innerHTML = '';

  if (typ === 'manual') {
    manualParamsDiv.style.display = 'block';
    klasaDrewnaSelect.style.display = 'none';
  } else {
    manualParamsDiv.style.display = 'none';
    klasaDrewnaSelect.style.display = 'inline-block';
    for (const klasa in klasyDrewna[typ]) {
      const opt = document.createElement('option');
      opt.value = klasa;
      opt.textContent = klasa;
      klasaDrewnaSelect.appendChild(opt);
    }
  }
}
typDrewnaSelect.addEventListener('change', wypelnijKlasy);
wypelnijKlasy();

document.getElementById('beamForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const b = parseFloat(document.getElementById('szerokosc').value);
  const h = parseFloat(document.getElementById('wysokosc').value);
  const L = parseFloat(document.getElementById('dlugosc').value);
  const F = parseFloat(document.getElementById('sila').value);
  const alphaKh = parseFloat(document.getElementById('alphaKh').value);
  const uwzglednijScinanie = document.getElementById('uwzglednijScinanie').checked;

  let fmk, ft0k, fvdk, kmod, gammaM;
  if (typDrewnaSelect.value === 'manual') {
    fmk = parseFloat(document.getElementById('fmKManual').value);
    ft0k = parseFloat(document.getElementById('ft0KManual').value);
    fvdk = parseFloat(document.getElementById('fvdkManual').value);
    kmod = parseFloat(document.getElementById('kmodManual').value);
    gammaM = parseFloat(document.getElementById('gammaMManual').value);
  } else {
    const klasa = klasaDrewnaSelect.value;
    const material = klasyDrewna[typDrewnaSelect.value][klasa];
    fmk = material.fmk;
    ft0k = material.ft0k;
    fvdk = material.fvdk;
    kmod = 0.9;
    gammaM = 1.3;
  }

  function kh(h, h0 = 150, alpha = 0.8) {
    h *= 1000;
    if (h <= h0) return 1.0;
    return 1 + alpha * (h - h0) / (20 * h0);
  }
  const khVal = kh(h, 150, alphaKh);
  const A = b * h;
  const I = (b * h ** 3) / 12;
  const nu = 0.3;
  const E = 11000e6;
  const G = E / (2 * (1 + nu));
  const Mrd = (fmk * 1e6 * kmod * I) / (gammaM * (h / 2) * khVal);
  const delta_b = (F * L ** 3) / (48 * E * I);
  let delta_v = 0;
  if (uwzglednijScinanie) delta_v = (1.5 * F * L) / (A * G);
  const delta = delta_b + delta_v;

  const wynik = `
Współczynnik kh: ${khVal.toFixed(3)}
Nośność momentowa Mrd: ${(Mrd / 1e3).toFixed(2)} kNm
Ugięcie zginające: ${delta_b.toExponential(6)} m
Ugięcie od ścinania: ${delta_v.toExponential(6)} m
Ugięcie całkowite: ${delta.toExponential(6)} m
  `;
  document.getElementById('wyniki').textContent = wynik;
});
