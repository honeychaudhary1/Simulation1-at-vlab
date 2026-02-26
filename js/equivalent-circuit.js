const equivPrintBtn = document.getElementById("equivPrintBtn");

if (equivPrintBtn) {
    equivPrintBtn.addEventListener("click", () => {
        window.print();
    });
}
