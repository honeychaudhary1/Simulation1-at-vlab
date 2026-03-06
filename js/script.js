const mcbImage = document.getElementById("mcbImage");
const instructionsBtn = document.getElementById("instructionsBtn");
const instructionsTooltip = document.getElementById("instructionsTooltip");
const checkConnectionBtn = document.getElementById("checkConnectionBtn");
const autoConnectBtn = document.getElementById("autoConnectBtn");
const addToTableBtn = document.getElementById("addToTableBtn");
const resetBtn = document.getElementById("resetBtn");
const printBtn = document.getElementById("printBtn");
const shortCircuitBtn = document.getElementById("shortCircuitBtn");
const autoKnob = document.getElementById("autoKnob");
const observationTbody = document.getElementById("observationTbody");

const NEEDLE_START_ANGLE = -65;
const NEEDLE_MCB_ON_ANGLE = 30;
const NEEDLE_RUNNING_ANGLE = 32;
const KNOB_START_DEG = 0;
const KNOB_RUNNING_DEG = 55;

const experiment = { 
    connectionsVerified: false,
    mcbOn: false,
    knobMoved: false,
    readingAdded: false
};

function showStepAlert(message, title = "Instruction") {
    let overlay = document.getElementById("customAlertOverlay");
    let titleEl;
    let messageEl;
    let okBtn;

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "customAlertOverlay";
        overlay.className = "custom-alert-overlay";
        overlay.innerHTML = `
            <div class="custom-alert-box" role="alertdialog" aria-modal="true" aria-labelledby="customAlertTitle" aria-describedby="customAlertMessage">
                <h2 id="customAlertTitle" class="custom-alert-title"></h2>
                <p id="customAlertMessage" class="custom-alert-message"></p>
                <button id="customAlertOkBtn" class="custom-alert-ok-btn" type="button">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    titleEl = document.getElementById("customAlertTitle");
    messageEl = document.getElementById("customAlertMessage");
    okBtn = document.getElementById("customAlertOkBtn");

    if (!titleEl || !messageEl || !okBtn) {
        alert(message);
        return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.classList.remove("closing");
    overlay.classList.add("show");

    const closeAlert = () => {
        if (overlay.classList.contains("closing")) return;
        overlay.classList.add("closing");
        document.removeEventListener("keydown", onKeyDown);

        const onCloseEnd = () => {
            overlay.classList.remove("show", "closing");
            overlay.removeEventListener("animationend", onCloseEnd);
        };

        overlay.addEventListener("animationend", onCloseEnd);
    };

    const onKeyDown = (event) => {
        if (event.key === "Escape" || event.key === "Enter") {
            closeAlert();
        }
    };

    okBtn.onclick = closeAlert;
    document.addEventListener("keydown", onKeyDown);
    okBtn.focus();
}

function setNeedleAngle(angleDeg) {
    document.querySelectorAll(".meter-face").forEach((face) => {
        face.style.setProperty("--needle-angle", `${angleDeg}deg`);
    });
}

function setKnobAngle(angleDeg) {
    if (autoKnob) {
        autoKnob.style.transform = `rotate(${angleDeg}deg)`;
    }
}

function setMcbState(on) {
    experiment.mcbOn = on;
    if (mcbImage) {
        mcbImage.src = on ? "assets/images/mcbon.png" : "assets/images/mcboff.png";
    }
}

function resetObservationTable() {
    if (observationTbody) {
        observationTbody.innerHTML = "";
    }
    experiment.readingAdded = false;
}

function resetStep4AndBeyond() {
    setMcbState(false);
    experiment.knobMoved = false;
    setKnobAngle(KNOB_START_DEG);
    setNeedleAngle(NEEDLE_START_ANGLE);
    resetObservationTable();
}

if (mcbImage) {
    mcbImage.addEventListener("click", () => {
        if (!experiment.mcbOn && !experiment.connectionsVerified) {
            showStepAlert("Please make and verify correct connections first (Step 1 & 2).");
            return;
        }

        const nextState = !experiment.mcbOn;
        setMcbState(nextState);

        if (!nextState) {
            experiment.knobMoved = false;
            setKnobAngle(KNOB_START_DEG);
            setNeedleAngle(NEEDLE_START_ANGLE);
        } else {
            setNeedleAngle(NEEDLE_MCB_ON_ANGLE);
        }
    });
}

if (instructionsBtn && instructionsTooltip) {
    let hideTimer;

    const showTooltip = () => {
        clearTimeout(hideTimer);
        instructionsTooltip.classList.add("show");
        instructionsTooltip.setAttribute("aria-hidden", "false");
    };

    const hideTooltip = () => {
        instructionsTooltip.classList.remove("show");
        instructionsTooltip.setAttribute("aria-hidden", "true");
    };

    const hideWithDelay = () => {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideTooltip, 140);
    };

    instructionsBtn.addEventListener("mouseenter", showTooltip);
    instructionsBtn.addEventListener("mouseleave", hideWithDelay);
    instructionsBtn.addEventListener("focus", showTooltip);
    instructionsBtn.addEventListener("blur", hideWithDelay);

    instructionsTooltip.addEventListener("mouseenter", showTooltip);
    instructionsTooltip.addEventListener("mouseleave", hideWithDelay);

    instructionsBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (instructionsTooltip.classList.contains("show")) {
            hideTooltip();
        } else {
            showTooltip();
        }
    });

    document.addEventListener("click", (event) => {
        if (
            !instructionsTooltip.contains(event.target) &&
            !instructionsBtn.contains(event.target)
        ) {
            hideTooltip();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            hideTooltip();
        }
    });
}

jsPlumb.ready(function () {
    const instance = jsPlumb.getInstance({
        Connector: ["Bezier", { curviness: 180 }],
        PaintStyle: { stroke: "#4a90e2", strokeWidth: 4 },
        HoverPaintStyle: { stroke: "#ff0000" }
    });

    instance.setContainer("labContainer");

    const requiredConnectionPairs = [
        ["A", "D"],
        ["B", "E"],
        ["D", "F"],
        ["E", "G"],
        ["E", "I"],
        ["D", "P2"],
        ["H", "M"],
        ["C", "L"],
        ["L", "P1"],
        ["V", "P2"],
        ["S1", "K"],
        ["S2", "J"]
    ];

    const toConnectionKey = (node1, node2) =>
        [node1, node2].sort().join("--");

    const requiredConnectionSet = new Set(
        requiredConnectionPairs.map(([from, to]) => toConnectionKey(from, to))
    );
    const endpointMap = {};

    function invalidateConnectionVerification() {
        experiment.connectionsVerified = false;
        resetStep4AndBeyond();
    }

    function addAllEndpoints() {
        instance.deleteEveryEndpoint();
        Object.keys(endpointMap).forEach((key) => {
            delete endpointMap[key];
        });

        document.querySelectorAll(".js-port").forEach(function (portEl) {
            const dotEl = portEl.querySelector(".dot");
            if (!dotEl) return;

            const portRect = portEl.getBoundingClientRect();
            const dotRect = dotEl.getBoundingClientRect();

            const anchorX =
                (dotRect.left - portRect.left + dotRect.width / 2) / portRect.width;
            const anchorY =
                (dotRect.top - portRect.top + dotRect.height / 2) / portRect.height;

            const endpoint = instance.addEndpoint(portEl, {
                anchor: [
                    Math.max(0, Math.min(1, anchorX)),
                    Math.max(0, Math.min(1, anchorY)),
                    0,
                    0
                ],
                endpoint: "Dot",
                paintStyle: {
                    fill: "transparent",
                    radius: 10
                },
                isSource: true,
                isTarget: true,
                maxConnections: -1
            });

            if (portEl.id) {
                endpointMap[portEl.id] = endpoint;
            }
        });

        instance.repaintEverything();
    }

    function detachNodeConnections(nodeId) {
        const outgoing = instance.getConnections({ source: nodeId });
        const incoming = instance.getConnections({ target: nodeId });
        const uniqueConnections = new Map();

        [...outgoing, ...incoming].forEach((connection) => {
            uniqueConnections.set(connection.id, connection);
        });

        uniqueConnections.forEach((connection) => {
            instance.deleteConnection(connection);
        });
    }

    document.querySelectorAll(".js-port .port-label").forEach((label) => {
        label.addEventListener("click", (event) => {
            const nodeId = label.parentElement?.id;
            if (!nodeId) return;
            detachNodeConnections(nodeId);
            event.stopPropagation();
        });
    });

    instance.bind("connection", invalidateConnectionVerification);
    instance.bind("connectionDetached", invalidateConnectionVerification);

    window.addEventListener("load", addAllEndpoints);
    window.addEventListener("resize", function () {
        instance.repaintEverything();
    });

    addAllEndpoints();
    setNeedleAngle(NEEDLE_START_ANGLE);
    setKnobAngle(KNOB_START_DEG);
    setMcbState(false);

    if (autoConnectBtn) {
        autoConnectBtn.addEventListener("click", function () {
            instance.deleteEveryConnection();

            requiredConnectionPairs.forEach(function ([from, to]) {
                const sourceEndpoint = endpointMap[from];
                const targetEndpoint = endpointMap[to];
                if (!sourceEndpoint || !targetEndpoint) return;

                instance.connect({
                    source: sourceEndpoint,
                    target: targetEndpoint
                });
            });

            experiment.connectionsVerified = false;
            showStepAlert("Autoconnect completed. Click on the check button to verify the connections.");
            instance.repaintEverything();
        });
    }

    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener("click", function () {
            const currentConnections = instance.getAllConnections();
            const currentConnectionSet = new Set();
            let hasInvalidNodeId = false;

            currentConnections.forEach(function (connection) {
                const sourceId = connection.sourceId;
                const targetId = connection.targetId;

                if (!sourceId || !targetId) {
                    hasInvalidNodeId = true;
                    return;
                }

                currentConnectionSet.add(toConnectionKey(sourceId, targetId));
            });

            const hasExactMatch =
                !hasInvalidNodeId &&
                currentConnections.length === requiredConnectionSet.size &&
                currentConnectionSet.size === requiredConnectionSet.size &&
                [...requiredConnectionSet].every((key) =>
                    currentConnectionSet.has(key)
                );

            if (hasExactMatch) {
                experiment.connectionsVerified = true;
                showStepAlert(
                    "All connections are correct.\nClick OK and proceed to Step 4."
                );
            } else {
                invalidateConnectionVerification();
                showStepAlert(
                    "Connections are incorrect.\nPlease go to Step 3, fix wrong wires, then check again."
                );
            }
        });
    }

    if (autoKnob) {
        autoKnob.addEventListener("click", () => {
            if (!experiment.connectionsVerified) {
                showStepAlert("Please verify connections first using CHECK CONNECTION.");
                return;
            }
            if (!experiment.mcbOn) {
                showStepAlert("Please switch ON the MCB first (Step 4).");
                return;
            }

            experiment.knobMoved = true;
            setKnobAngle(KNOB_RUNNING_DEG);
            setNeedleAngle(NEEDLE_RUNNING_ANGLE);
        });
    }

    if (addToTableBtn) {
        addToTableBtn.addEventListener("click", () => {
            if (!experiment.connectionsVerified) {
                showStepAlert("Please complete Step 1 and Step 2 first.");
                return;
            }
            if (!experiment.mcbOn) {
                showStepAlert("Please switch ON the MCB first (Step 4).");
                return;
            }
            if (!experiment.knobMoved) {
                showStepAlert("Please click the autotransformer knob first (Step 5).");
                return;
            }
            if (experiment.readingAdded) {
                showStepAlert("Only one reading is required for this test.");
                return;
            }
            if (!observationTbody) return;

            const row = document.createElement("tr");
            row.innerHTML = "<td>1</td><td>50</td><td>0.9</td><td>230</td>";
            observationTbody.appendChild(row);
            experiment.readingAdded = true;
            showStepAlert("Reading added to observation table.");
        });
    }

    if (shortCircuitBtn) {
        shortCircuitBtn.addEventListener("click", () => {
            if (!experiment.readingAdded) {
                showStepAlert("Please add the reading to the table first (Step 6).");
                return;
            }
            window.location.href = "short-circuit.html";
        });
    }

    if (printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            instance.deleteEveryConnection();
            experiment.connectionsVerified = false;
            resetStep4AndBeyond();
            showStepAlert("Experiment reset. Start again from Step 1.");
        });
    }
});
