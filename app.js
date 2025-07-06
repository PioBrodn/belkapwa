// app.js

// --- Dane wejściowe i konfiguracja ---
const klasyDrewnaLitego = {
  C24: {fmk: 24, fvk: 2.5, kmod: 0.8, gammaM: 1.3},
  C30: {fmk: 30, fvk: 2.7, kmod: 0.8, gammaM: 1.3},
  // Dodaj inne klasy wg EN 338
};

const klasyDrewnaKlejonego = {
  GL24h: {fmk: 24, fvk: 2.5, kmod: 0.9, gammaM: 1.3},
  GL28h: {fmk: 28, fvk: 2.7, kmod: 0.9, gammaM: 1.3},
  // Dodaj inne klasy wg EN 14080
};

// --- UI: pobieranie wartości ---
function pobierzDane() {
  return {
    L: parseFloat(document.getElementById('dlugosc').value),
    q: parseFloat(document.getElementById('obciazenieQ').value),
    F: parseFloat(document.getElementById('silaF').value),
    a: parseFloat(document.getElementById('odlegloscA').value),
    typBelki: document.getElementById('typBelki').value,
    klasaDrewna: document.getElementById('klasaDrewna').value,
    drewnoKlejone: document.getElementById('drewnoKlejone').checked
  };
}

// --- Obliczenia statyczne ---

function reakcjeBelki(dane) {
  const {L, q, F, a, typBelki} = dane;
  let RA = 0, RB = 0, RC = 0; // trzy reakcje na wypadek wieloprzęsłowej

  switch (typBelki) {
    case 'swobodnie_podparta':
      RA = q * L / 2 + (F ? F * (L - a) / L : 0);
      RB = q * L / 2 + (F ? F * a / L : 0);
      break;

    case 'dwuprzeslowa':
      // uproszczone równania dla dwóch przęseł równej długości
      // dodatkowe reakcje: RA, RB, RC
      // Wymaga szczegółowego statycznego rozwiązania, uproszczę tutaj:
      // Obciążenie q na każdym przęśle (L/2)
      // Siła skupiona w pierwszym przęśle (a < L/2)
      const Lp = L / 2;
      RA = q * Lp / 2 + (F && a <= Lp ? F * (Lp - a) / Lp : 0);
      RB = q * L + (F ? (a <= Lp ? F * a / Lp : 0) : 0);
      RC = q * Lp / 2 + (F && a > Lp ? F * (L - a) / Lp : 0);
      break;

    case 'trojprzeslowa':
      // Załóżmy 3 przęsła po L/3, uproszczenie
      const Lp3 = L / 3;
      RA = q * Lp3 / 2 + (F && a <= Lp3 ? F * (Lp3 - a) / Lp3 : 0);
      RB = q * Lp3 + (F && a > Lp3 && a <= 2*Lp3 ? F * (a - Lp3) / Lp3 : 0);
      RC = q * Lp3 / 2 + (F && a > 2*Lp3 ? F * (L - a) / Lp3 : 0);
      break;

    case 'wspornikowa':
      // Reakcja w podporze (punkt podparcia)
      RA = q * L + (F ? F : 0);
      RB = 0; RC = 0;
      break;
  }
  return {RA, RB, RC};
}

function obliczWykresy(dane, numPoints = 100) {
  const {L, q, F, a, typBelki} = dane;
  const x = [];
  const M = [];
  const V = [];
  const w = []; // ugięcie - proste zero (do rozbudowy)

  for (let i = 0; i <= numPoints; i++) {
    const xi = (L / numPoints) * i;
    x.push(xi);

    let Mi = 0;
    let Vi = 0;

    switch (typBelki) {
      case 'swobodnie_podparta':
        // Reakcje
        const R1 = F * (L - a) / L;
        const R2 = F * a / L;

        // Moment siła skupiona
        let Mi_F = (xi < a) ? R1 * xi : R1 * xi - F * (xi - a);
        let Vi_F = (xi < a) ? R1 : R1 - F;

        // Moment obciążenie równomierne
        let Mi_q = (q * xi * (L - xi)) / 2;
        let Vi_q = q * (L / 2 - xi);

        Mi = Mi_F + Mi_q;
        Vi = Vi_F + Vi_q;
        break;

      case 'dwuprzeslowa':
        // Tu uproszczony przykład - pełne rozwiązanie wymaga statyki przestrzennej
        // Załóżmy sumę momentów i sił dla dwóch przęseł po L/2
        // Zakładamy, że siła F działa w pierwszym przęśle, obciążenie q na całej belce
        // Analogicznie do powyższego, ale trzeba dokładniej rozwiązać statykę - tu uproszczenie

        // Pręsełka długości:
        const Lp = L / 2;
        if (xi <= Lp) {
          const R1_ = F && a <= Lp ? F * (Lp - a) / Lp : 0;
          const R2_ = F && a <= Lp ? F * a / Lp : 0;
          const Mi_F_ = (xi < a) ? R1_ * xi : R1_ * xi - (F && a <= Lp ? F * (xi - a) : 0);
          const Vi_F_ = (xi < a) ? R1_ : R1_ - (F && a <= Lp ? F : 0);
          const Mi_q_ = (q * xi * (Lp - xi)) / 2;
          const Vi_q_ = q * (Lp / 2 - xi);
          Mi = Mi_F_ + Mi_q_;
          Vi = Vi_F_ + Vi_q_;
        } else {
          // Drugie przęsło z reakcjami uproszczonymi (należy rozwinąć w razie potrzeby)
          Mi = 0; Vi = 0;
        }
        break;

      case 'trojprzeslowa':
        // Podobne uproszczenie do dwuprzęsłowej
        Mi = 0; Vi = 0;
        break;

      case 'wspornikowa':
        // Obliczenia dla belki wspornikowej z q i F na końcu wspornika (przy x)
        // Reakcja w podporze RA = q*L + F
        const RA = q * L + (F ? F : 0);
        Mi = RA * xi - q * xi * xi / 2 - (F && xi >= a ? F * (xi - a) : 0);
        Vi = RA - q * xi - (F && xi >= a ? F : 0);
        break;
    }

    M.push(Mi);
    V.push(Vi);
    w.push(0); // ugięcie do rozbudowy
  }

  return {x, M, V, w};
}

// --- Obliczenia nośności wg EN 1995-1-1 (EC5) ---

function nośność(dane, MEd, VEd) {
  // Wybór klasy drewna
  let klasa;
  if (dane.drewnoKlejone) {
    klasa = klasyDrewnaKlejonego[dane.klasaDrewna];
  } else {
    klasa = klasyDrewnaLitego[dane.klasaDrewna];
  }
  if (!klasa) {
    alert('Nie wybrano poprawnej klasy drewna!');
    return null;
  }

  // Charakterystyczne wytrzymałości [MPa]
  const fmk = klasa.fmk;
  const fvk = klasa.fvk;
  const kmod = klasa.kmod;
  const gammaM = klasa.gammaM;

  // Obliczone wytrzymałości obliczeniowe
  const fmd = fmk * kmod / gammaM;
  const fvd = fvk * kmod / gammaM;

  // Obliczenia nośności:
  // Mrd = fmd * W (W - moduł przekroju, przyjmujemy na razie stały prostokątny przekrój)
  // Vrd = 0.6 * fvd * A (przyjmujemy przekrój prostokątny)

  // Dla uproszczenia: zakładamy przekrój belki o wymiarach:
  const b = 0.1; // szerokość [m]
  const h = 0.2; // wysokość [m]
  const W = (b * h * h) / 6; // moduł przekroju [m3]
  const A = b * h; // pole przekroju [m2]

  const MRd = fmd * W * 1e6; // [Nmm], zamiana na Nmm dla momentu (załóżmy jednostki)
  const VRd = 0.6 * fvd * A * 1e6; // [N]

  // Porównanie z obciążeniem
  const nośnośćMoment = MEd <= MRd;
  const nośnośćŚcinanie = VEd <= VRd;

  return {nośnośćMoment, nośnośćŚcinanie, MRd, VRd, MEd, VEd};
}

// --- Aktualizacja wykresów Chart.js ---

let chartMoment, chartSila, chartUgiecie;

function initCharts() {
  const ctxM = document.getElementById('momentChart').getContext('2d');
  const ctxV = document.getElementById('silaChart').getContext('2d');
  const ctxW = document.getElementById('ugiecieChart').getContext('2d');

  chartMoment = new Chart(ctxM, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{label: 'Moment zginający [Nm]', data: [], borderColor: 'blue', fill: false}]
    },
    options: {responsive: true, animation: false}
  });

  chartSila = new Chart(ctxV, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{label: 'Siła tnąca [N]', data: [], borderColor: 'red', fill: false}]
    },
    options: {responsive: true, animation: false}
  });

  chartUgiecie = new Chart(ctxW, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{label: 'Ugięcie [mm]', data: [], borderColor: 'green', fill: false}]
    },
    options: {responsive: true, animation: false}
  });
}

function updateCharts(x, M, V, w) {
  chartMoment.data.labels = x.map(v => v.toFixed(2));
  chartMoment.data.datasets[0].data = M;
  chartMoment.update();

  chartSila.data.labels = x.map(v => v.toFixed(2));
  chartSila.data.datasets[0].data = V;
  chartSila.update();

  chartUgiecie.data.labels = x.map(v => v.toFixed(2));
  chartUgiecie.data.datasets[0].data = w;
  chartUgiecie.update();
}

// --- Obsługa przycisku obliczania ---

document.getElementById('obliczButton').addEventListener('click', () => {
  const dane = pobierzDane();

  // Oblicz wykresy
  const {x, M, V, w} = obliczWykresy(dane);

  // Oblicz nośności dla maksymalnych momentów i sił
  const MEd = Math.max(...M.map(m => Math.abs(m)));
  const VEd = Math.max(...V.map(v => Math.abs(v)));
  const noś = nośność(dane, MEd, VEd);

  // Wyświetl status nośności
  const statusEl = document.getElementById('statusNosnosci');
  if (noś) {
    statusEl.textContent =
      `Nośność momentu: ${noś.nośnośćMoment ? 'OK' : 'PRZEKROCZONA'} (M_Ed=${MEd.toFixed(1)} Nm, M_Rd=${(noś.MRd / 1000).toFixed(1)} kNm)
       Nośność ścinania: ${noś.nośnośćŚcinanie ? 'OK' : 'PRZEKROCZONA'} (V_Ed=${VEd.toFixed(1)} N, V_Rd=${(noś.VRd).toFixed(1)} N)`;
    statusEl.style.color = (noś.nośnośćMoment && noś.nośnośćŚcinanie) ? 'green' : 'red';
  }

  // Aktualizuj wykresy
  updateCharts(x, M, V, w);
});

// --- Inicjalizacja ---

window.onload = () => {
  initCharts();
  // Można też wstępnie załadować domyślne wartości i uruchomić obliczenia
};
