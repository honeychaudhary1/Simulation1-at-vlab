const mcbImage = document.getElementById("mcbImage");
const autoKnob = document.getElementById("autoKnob");
const instructionsBtn = document.getElementById("instructionsBtn");
const instructionsTooltip = document.getElementById("instructionsTooltip");
const autoConnectBtn = document.getElementById("autoConnectBtn");
const checkConnectionBtn = document.getElementById("checkConnectionBtn");
const addToTableBtn = document.getElementById("addToTableBtn");
const observationTbody = document.getElementById("observationTbody");
const resetBtn = document.getElementById("resetBtn");
const printBtn = document.getElementById("printBtn");
const submitBtn = document.getElementById("submitBtn");

const KNOB_START_DEG = 0;
const KNOB_RUNNING_DEG = 35;
const NEEDLE_START_ANGLE = -65;
const NEEDLE_MCB_ON_ANGLE = -42;
let shortCircuitReadingAdded = false;
let mcbOn = false;
let knobOn = false;
let knobMoved = false;
let connectionsVerified = false;

function setMcbState(on) {
    if (!mcbImage) return;
    mcbImage.src = on ? "assets/images/mcbon.png" : "assets/images/mcboff.png";
}

function setKnobAngle(angleDeg) {
    if (!autoKnob) return;
    autoKnob.style.transform = `rotate(${angleDeg}deg)`;
}

function setNeedleAngle(angleDeg) {
    document.querySelectorAll(".meter-face").forEach((face) => {
        face.style.setProperty("--needle-angle", `${angleDeg}deg`);
    });
}

if (mcbImage) {
    setMcbState(false);
    setNeedleAngle(NEEDLE_START_ANGLE);

    mcbImage.addEventListener("click", () => {
        mcbOn = !mcbOn;
        setMcbState(mcbOn);
        if (!mcbOn) {
            knobOn = false;
            knobMoved = false;
            setKnobAngle(KNOB_START_DEG);
            setNeedleAngle(NEEDLE_START_ANGLE);
            return;
        }
        setNeedleAngle(NEEDLE_MCB_ON_ANGLE);
    });
}

if (autoKnob) {
    setKnobAngle(KNOB_START_DEG);

    autoKnob.addEventListener("click", () => {
        knobOn = !knobOn;
        knobMoved = true;
        setKnobAngle(knobOn ? KNOB_RUNNING_DEG : KNOB_START_DEG);
    });
}

function resetObservationTable() {
    if (observationTbody) {
        observationTbody.innerHTML = "";
    }
    shortCircuitReadingAdded = false;
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

jsPlumb.ready(() => {
    const instance = jsPlumb.getInstance({
        Connector: ["Bezier", { curviness: 80 }],
        PaintStyle: { stroke: "#4a90e2", strokeWidth: 3 },
        HoverPaintStyle: { stroke: "#ff0000" }
    });

    instance.setContainer("shortLabContainer");
    const endpointMap = {};
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
        ["S1", "S2"]
    ];
    const toConnectionKey = (node1, node2) =>
        [node1, node2].sort().join("--");
    const requiredConnectionSet = new Set(
        requiredConnectionPairs.map(([from, to]) => toConnectionKey(from, to))
    );

    function addAllEndpoints() {
        instance.deleteEveryEndpoint();
        Object.keys(endpointMap).forEach((key) => {
            delete endpointMap[key];
        });

        document.querySelectorAll(".js-port").forEach((portEl) => {
            const dotEl = portEl.querySelector(".dot");
            if (!dotEl) return;

            const portRect = portEl.getBoundingClientRect();
            const dotRect = dotEl.getBoundingClientRect();

            const anchorX =
                (dotRect.left - portRect.left + dotRect.width / 2) / portRect.width;
            const anchorY =
                (dotRect.top - portRect.top + dotRect.height / 2) / portRect.height;

            const endpoint = instance.addEndpoint(portEl, {
                anchor: [anchorX, anchorY, 0, 0],
                endpoint: "Dot",
                paintStyle: { fill: "#000", radius: 8 },
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

    document.querySelectorAll(".js-port span").forEach((label) => {
        label.addEventListener("click", (event) => {
            const nodeId = label.parentElement?.id;
            if (!nodeId) return;
            detachNodeConnections(nodeId);
            event.stopPropagation();
        });
    });

    window.addEventListener("load", addAllEndpoints);
    window.addEventListener("resize", () => {
        instance.repaintEverything();
    });

    instance.bind("connection", () => {
        connectionsVerified = false;
    });
    instance.bind("connectionDetached", () => {
        connectionsVerified = false;
    });

    if (autoConnectBtn) {
        autoConnectBtn.addEventListener("click", () => {
            instance.deleteEveryConnection();

            requiredConnectionPairs.forEach(([from, to]) => {
                const sourceEndpoint = endpointMap[from];
                const targetEndpoint = endpointMap[to];
                if (!sourceEndpoint || !targetEndpoint) return;

                instance.connect({
                    source: sourceEndpoint,
                    target: targetEndpoint
                });
            });

            instance.repaintEverything();
            alert("Auto-connection done.");
        });
    }

    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener("click", () => {
            const currentConnections = instance.getAllConnections();
            const currentConnectionSet = new Set();
            let hasInvalidNodeId = false;

            currentConnections.forEach((connection) => {
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
                connectionsVerified = true;
                alert(
                    "All connections are correct.\nClick OK and proceed to Step 4."
                );
            } else {
                connectionsVerified = false;
                alert(
                    "Connections are incorrect.\nPlease go to Step 3, fix wrong wires, then check again."
                );
            }
        });
    }

    if (addToTableBtn) {
        addToTableBtn.addEventListener("click", () => {
            if (!observationTbody) return;
            if (shortCircuitReadingAdded) {
                alert("Reading already added to the observation table.");
                return;
            }

            const row = document.createElement("tr");
            row.innerHTML = "<td>1</td><td>37.5</td><td>4.5</td><td>11</td>";
            observationTbody.appendChild(row);
            shortCircuitReadingAdded = true;
            alert("Reading added to observation table.");
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
            connectionsVerified = false;
            mcbOn = false;
            knobOn = false;
            knobMoved = false;
            setMcbState(false);
            setKnobAngle(KNOB_START_DEG);
            setNeedleAngle(NEEDLE_START_ANGLE);
            resetObservationTable();
            alert("Experiment reset. Start again from Step 1.");
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            if (!connectionsVerified) {
                alert("Please complete Step 2: check and verify all connections.");
                return;
            }
            if (!mcbOn) {
                alert("Please complete Step 4: switch ON the MCB.");
                return;
            }
            if (!knobMoved) {
                alert("Please complete Step 5: click the autotransformer knob.");
                return;
            }
            if (!shortCircuitReadingAdded) {
                alert("Please complete Step 6: add reading to the observation table.");
                return;
            }
            window.location.href = "equivalent-circuit.html";
        });
    }

    addAllEndpoints();
});
