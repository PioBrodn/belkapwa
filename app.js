
document.getElementById("beamForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const L = parseFloat(document.getElementById("length").value);
    const b = parseFloat(document.getElementById("width").value) / 1000;
    const h = parseFloat(document.getElementById("height").value) / 1000;
    const P = parseFloat(document.getElementById("P").value || 0);
    const a = parseFloat(document.getElementById("P_pos").value || 0);
    const q = parseFloat(document.getElementById("q").value || 0);

    const I = (b * Math.pow(h, 3)) / 12;
    const A = b * h;
    const E = 11000 * 1e6;  // MPa -> Pa
    const self_weight = A * 500 * 9.81 / 1000;  // kN/m

    const total_q = q + self_weight;
    const Mq = (total_q * Math.pow(L, 2)) / 8;
    const Mp = P * a * (L - a) / L;
    const MEd = Mq + Mp;

    const y = h / 2;
    const sigma = (MEd * 1e6 * y) / I / 1e6; // MPa
    const sigma_allow = 18;

    let result = `<p><strong>Moment zginający M<sub>Ed</sub>:</strong> ${MEd.toFixed(2)} kNm</p>`;
    result += `<p><strong>Naprężenie zginające σ<sub>m,d</sub>:</strong> ${sigma.toFixed(2)} MPa</p>`;
    result += sigma < sigma_allow ? "<p style='color:green'>✔ Warunek nośności spełniony</p>" : "<p style='color:red'>✘ Warunek nośności niespełniony</p>";

    document.getElementById("results").innerHTML = result;

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
