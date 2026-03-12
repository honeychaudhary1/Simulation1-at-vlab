const OPEN_CIRCUIT_REPORT_STORAGE_KEY = "openCircuitReportData";

const fieldIds = {
    labName: document.getElementById("labName"),
    experimentTitle: document.getElementById("experimentTitle"),
    reportDate: document.getElementById("reportDate"),
    startTime: document.getElementById("startTime"),
    endTime: document.getElementById("endTime"),
    totalTimeSpent: document.getElementById("totalTimeSpent"),
    aimText: document.getElementById("aimText"),
    summaryText: document.getElementById("summaryText"),
    componentList: document.getElementById("componentList"),
    observationBody: document.getElementById("reportObservationBody"),
    conclusionText: document.getElementById("conclusionText"),
    printBtn: document.getElementById("reportPrintBtn"),
    downloadBtn: document.getElementById("reportDownloadBtn"),
    backBtn: document.getElementById("reportBackBtn")
};

function readReportData() {
    const rawData = localStorage.getItem(OPEN_CIRCUIT_REPORT_STORAGE_KEY);
    if (!rawData) return null;

    try {
        return JSON.parse(rawData);
    } catch (error) {
        return null;
    }
}

function renderEmptyState() {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="4">No observation data was available for this report.</td>';
    fieldIds.observationBody?.appendChild(emptyRow);

    if (fieldIds.conclusionText) {
        fieldIds.conclusionText.textContent = "Generate the report from the open circuit experiment page after adding the observation reading.";
    }

    if (fieldIds.summaryText) {
        fieldIds.summaryText.textContent = "This report page was opened without a saved open circuit report payload.";
    }
}

function populateReport(reportData) {
    if (fieldIds.labName) fieldIds.labName.textContent = reportData.labName || "";
    if (fieldIds.experimentTitle) fieldIds.experimentTitle.textContent = reportData.experimentTitle || "";
    if (fieldIds.reportDate) fieldIds.reportDate.textContent = reportData.date || "";
    if (fieldIds.startTime) fieldIds.startTime.textContent = reportData.startTime || "";
    if (fieldIds.endTime) fieldIds.endTime.textContent = reportData.endTime || "";
    if (fieldIds.totalTimeSpent) fieldIds.totalTimeSpent.textContent = reportData.totalTimeSpent || "";
    if (fieldIds.aimText) fieldIds.aimText.textContent = reportData.aim || "";
    if (fieldIds.summaryText) fieldIds.summaryText.textContent = reportData.simulationSummary || "";
    if (fieldIds.conclusionText) fieldIds.conclusionText.textContent = reportData.conclusion || "";

    if (fieldIds.componentList) {
        fieldIds.componentList.innerHTML = "";
        (reportData.components || []).forEach((component) => {
            const listItem = document.createElement("li");
            listItem.textContent = component;
            fieldIds.componentList.appendChild(listItem);
        });
    }

    if (fieldIds.observationBody) {
        fieldIds.observationBody.innerHTML = "";
        const rows = reportData.observations || [];

        if (!rows.length) {
            renderEmptyState();
            return;
        }

        rows.forEach((row) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.serialNo || ""}</td>
                <td>${row.poc || ""}</td>
                <td>${row.ioc || ""}</td>
                <td>${row.voc || ""}</td>
            `;
            fieldIds.observationBody.appendChild(tr);
        });
    }
}

function downloadReportHtml() {
    const blob = new Blob([document.documentElement.outerHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "open-circuit-report.html";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

const reportData = readReportData();
if (reportData) {
    populateReport(reportData);
} else {
    renderEmptyState();
}

if (fieldIds.printBtn) {
    fieldIds.printBtn.addEventListener("click", () => {
        window.print();
    });
}

if (fieldIds.downloadBtn) {
    fieldIds.downloadBtn.addEventListener("click", () => {
        downloadReportHtml();
    });
}

if (fieldIds.backBtn) {
    fieldIds.backBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}
