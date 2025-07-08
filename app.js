document.getElementById("beamForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // Dane wejściowe
    const L = parseFloat(document.getElementById("length").value); // [m]
    const b_mm = parseFloat(document.getElementById("width").value); // [mm]
    const h_mm = parseFloat(document.getElementById("height").value); // [mm]
    const P = parseFloat(document.getElementById("P").value || 0); // [kN]
    const a = parseFloat(document.getElementById("P_pos").value || 0); // [m]
    const q = parseFloat(document.getElementById("q").value || 0); // [kN/m]

    // Przekształcenia jednostek
    const b = b_mm / 1000; // [m]
    const h = h_mm / 1000; // [m]
    const y = h_mm / 2; // [mm]
    const I = (b_mm * Math.pow(h_mm, 3)) / 12; // [mm^4]
    const A = b * h; // [m²]

    // Ciężar własny (zakładamy 500 kg/m³ → 5 kN/m³ → razy przekrój)
    const self_weight = A * 500 * 9.81 / 1000; // [kN/m]

    // Obciążenie całkowite równomierne
    const total_q = q + self_weight;

    // Moment od obciążenia równomiernego (na środku belki)
    const Mq = (total_q * Math.pow(L, 2)) / 8; // [kNm]

    // Moment od siły skupionej
    const Mp = P * a * (L - a) / L; // [kNm]

    const MEd = Mq + Mp; // [kNm]
    const MEd_Nmm = MEd * 1e6; // [Nmm]

    // Naprężenie zginające
    const sigma = (MEd_Nmm * y) / I; // [N/mm² = MPa]

    // Przykładowa dopuszczalna wytrzymałość (do dynamicznego pobierania)
    const sigma_allow = 18; // [MPa]

    // Wyniki
    let result = `<p><strong>Moment zginający M<sub>Ed</sub>:</strong> ${MEd.toFixed(2)} kNm</p>`;
    result += `<p><strong>Naprężenie zginające σ<sub>m,d</sub>:</strong> ${sigma.toFixed(2)} MPa</p>`;
    result += sigma < sigma_allow
        ? "<p style='color:green'>✔ Warunek nośności spełniony</p>"
        : "<p style='color:red'>✘ Warunek nośności niespełniony</p>";

    document.getElementById("results").innerHTML = result;

    // Wykres momentów
    drawMomentDiagram(L, total_q, P, a);
});

function drawMomentDiagram(L, total_q, P, a) {
    const canvas = document.getElementById("momentChart");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 160;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * L;
        const Mq = (total_q * x * (L - x)) / 2;
        let Mp = 0;
        if (P > 0) {
            if (x < a) {
                Mp = P * (L - a) * x / L;
            } else {
                Mp = P * a * (L - x) / L;
            }
        }
        const M = Mq + Mp;
        const px = (x / L) * canvas.width;
        const py = canvas.height - (M / 1.5) * canvas.height / 10;
        ctx.lineTo(px, py);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = "rgba(0,128,0,0.3)";
    ctx.fill();
    ctx.strokeStyle = "green";
    ctx.stroke();
}