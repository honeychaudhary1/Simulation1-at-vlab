const equivPrintBtn = document.getElementById("equivPrintBtn");
const EQUIV_GUIDE_AUDIO = "assets/audios/After the circuit opens in a new tab.wav";

if (sessionStorage.getItem("playEquivalentCircuitAudio") === "1") {
    sessionStorage.removeItem("playEquivalentCircuitAudio");
    const audio = new Audio(encodeURI(EQUIV_GUIDE_AUDIO));
    audio.play().catch(() => {});
}

function printResultPdf() {
    const pdfPath = "assets/Result.pdf";
    const iframe = document.createElement("iframe");

    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = pdfPath;

    iframe.onload = () => {
        setTimeout(() => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (error) {
                window.open(pdfPath, "_blank", "noopener,noreferrer");
            }

            setTimeout(() => {
                iframe.remove();
            }, 1000);
        }, 250);
    };

    iframe.onerror = () => {
        window.open(pdfPath, "_blank", "noopener,noreferrer");
        iframe.remove();
    };

    document.body.appendChild(iframe);
}

if (equivPrintBtn) {
    equivPrintBtn.addEventListener("click", () => {
        printResultPdf();
    });
}
