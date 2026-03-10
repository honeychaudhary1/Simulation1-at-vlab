const mcbImage = document.getElementById("mcbImage");
const instructionsBtn = document.getElementById("instructionsBtn");
const instructionsTooltip = document.getElementById("instructionsTooltip");
const aiGuideBtn = document.getElementById("aiGuideBtn");
const checkConnectionBtn = document.getElementById("checkConnectionBtn");
const autoConnectBtn = document.getElementById("autoConnectBtn");
const addToTableBtn = document.getElementById("addToTableBtn");
const resetBtn = document.getElementById("resetBtn");
const printBtn = document.getElementById("printBtn");
const reportBtn = document.getElementById("reportBtn");
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

function setupComponentInfoTooltip(contentByKey) {
    const triggers = Array.from(document.querySelectorAll(".info-trigger[data-info-key]"));
    if (!triggers.length) return;

    const tooltip = document.createElement("div");
    tooltip.className = "component-info-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.innerHTML = "<p></p>";
    document.body.appendChild(tooltip);

    const textEl = tooltip.querySelector("p");
    let activeTrigger = null;

    const placeTooltip = (triggerEl) => {
        const triggerRect = triggerEl.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const gap = 14;

        let left = triggerRect.right + gap;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = triggerRect.left - tooltipRect.width - gap;
        }
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));

        let top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));

        tooltip.style.left = `${Math.round(left)}px`;
        tooltip.style.top = `${Math.round(top)}px`;
    };

    const hideTooltip = () => {
        tooltip.classList.remove("show");
        tooltip.setAttribute("aria-hidden", "true");
        activeTrigger = null;
    };

    const showTooltip = (triggerEl, message) => {
        if (!textEl) return;
        textEl.textContent = `Purpose: ${message}`;
        activeTrigger = triggerEl;
        tooltip.classList.add("show");
        tooltip.setAttribute("aria-hidden", "false");
        placeTooltip(triggerEl);
    };

    triggers.forEach((triggerEl) => {
        triggerEl.addEventListener("click", (event) => {
            event.stopPropagation();
            const key = triggerEl.dataset.infoKey;
            const message = key ? contentByKey[key] : "";
            if (!message) return;

            if (activeTrigger === triggerEl && tooltip.classList.contains("show")) {
                hideTooltip();
                return;
            }
            showTooltip(triggerEl, message);
        });
    });

    document.addEventListener("click", (event) => {
        if (!tooltip.contains(event.target)) {
            hideTooltip();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            hideTooltip();
        }
    });

    window.addEventListener("resize", () => {
        if (activeTrigger && tooltip.classList.contains("show")) {
            placeTooltip(activeTrigger);
        }
    });
}

if (mcbImage) {
    mcbImage.addEventListener("click", () => {
        if (!experiment.mcbOn && !experiment.connectionsVerified) {
            if (window.aiGuideNotify) {
                window.aiGuideNotify("Make and check the connections before turning on the MCB.", "before_mcb", true);
            } else {
                showStepAlert("Please make and verify correct connections first (Step 1 & 2).");
            }
            return;
        }

        const nextState = !experiment.mcbOn;
        setMcbState(nextState);

        if (!nextState) {
            experiment.knobMoved = false;
            setKnobAngle(KNOB_START_DEG);
            setNeedleAngle(NEEDLE_START_ANGLE);
            if (window.aiGuideNotify) {
                window.aiGuideNotify("You turned off the MCB. Turn it back on to continue the simulation.", "mcb_off_mid", true);
            }
        } else {
            setNeedleAngle(NEEDLE_MCB_ON_ANGLE);
            if (window.aiGuideNotify) {
                window.aiGuideNotify("MCB has been turned ON. Now click on the autotransformer knob.", "mcb_on", true);
            }
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

setupComponentInfoTooltip({
    mcb: "The function of the MCB is to protect the autotransformer, measuring instruments, and the transformer under test from excessive current and short-circuit conditions, ensuring stable operation during the experiment.",
    autotransformer: "An autotransformer is used in the experiment to provide a smoothly variable AC voltage to the transformer under test. In the open-circuit test, the autotransformer is used to apply rated voltage to the low-voltage side of the transformer.",
    transformer: "The transformer under test is connected to the measuring instruments as per the test requirement. In the open-circuit test, the secondary winding is kept open, and the primary winding is energized.",
    "ac-voltmeter": "The voltmeter connected across the autotransformer measures the applied voltage.",
    "ac-ammeter": "The ammeter connected in series measures the no-load current.",
    "ac-wattmeter": "The wattmeter measures the input power, which represents the core losses of the transformer since copper losses are negligible under no-load conditions."
});

jsPlumb.ready(function () {
    const connectorSpec = [
        "Bezier",
        { curviness: 150, alwaysRespectStubs: false, stub: [10, 14] }
    ];

    const instance = jsPlumb.getInstance({
        Connector: connectorSpec,
        PaintStyle: { stroke: "#4a90e2", strokeWidth: 3.5 },
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
    const guideState = {
        enabled: false,
        currentConnectionPrompt: "",
        audio: null,
        hasReading: false
    };

    const guideAudioFiles = {
        autoconnect_completed: "autoconnect-completed.mp3",
        mcb_on: "mcb-on.mp3",
        mcb_off_mid: "between-exp-mcb-off.mp3",
        before_autotransformer: "before-connection-check-autotransformer.mp3",
        readings_displayed: "after-autotransformer-on.mp3",
        before_add_to_table: "before-adding-reading-add-to-table.mp3",
        before_check: "before-connection-check-button.mp3",
        before_mcb: "before-connection-mcb-click.mp3",
        after_correct_check: "after-correct-check.mp3",
        connections_intro: "connections-intro.mp3",
        wrong_connection: "wrong-connection.mp3",
        wrong_multiple: "multiple-wrong-connections.mp3",
        all_connections_done: "guide-all-complete-conn.mp3",
        mcb_off_before_remove: "turn-off-mcb-before-removing-conn.mp3",
        reset: "reset.mp3",
        print: "print.mp3",
        first_reading_next: "after-1st-reading-added-oc.mp3",
        duplicate_reading: "duplicate-reading.mp3",
        sc_test_first: "sc-test-first.mp3",
        report: "report.mp3"
    };

    const getGuideAudioSrc = (key) => {
        const file = guideAudioFiles[key];
        return file ? `assets/audio/guide/${file}` : "";
    };

    const stopGuideAudio = () => {
        if (guideState.audio) {
            guideState.audio.pause();
            guideState.audio.currentTime = 0;
            guideState.audio = null;
        }
    };

    const playGuideAudio = (key) => {
        if (!guideState.enabled || !key) return;
        const src = getGuideAudioSrc(key);
        if (!src) return;
        stopGuideAudio();
        const audio = new Audio(src);
        guideState.audio = audio;
        audio.play().catch(() => {});
    };

    const guideAlert = (message, audioKey = "") => {
        if (guideState.enabled) {
            if (audioKey) playGuideAudio(audioKey);
            showStepAlert(message, "AI Guide");
            return;
        }
        showStepAlert(message);
    };

    window.aiGuideNotify = (message, audioKey = "", useAlert = true) => {
        if (!guideState.enabled) return false;
        if (audioKey) playGuideAudio(audioKey);
        if (useAlert) {
            showStepAlert(message, "AI Guide");
        }
        return true;
    };

    const clearGuideHighlights = () => {
        document.querySelectorAll(".ai-highlight-target").forEach((el) => {
            el.classList.remove("ai-highlight-target");
        });
        document.querySelectorAll(".ai-highlight-port").forEach((el) => {
            el.classList.remove("ai-highlight-port");
        });
    };

    const highlightTarget = (el) => {
        if (!guideState.enabled || !el) return;
        el.classList.add("ai-highlight-target");
    };

    const highlightConnectionPair = (fromId, toId) => {
        if (!guideState.enabled) return;
        const fromEl = document.getElementById(fromId);
        const toEl = document.getElementById(toId);
        if (fromEl) fromEl.classList.add("ai-highlight-port");
        if (toEl) toEl.classList.add("ai-highlight-port");
    };

    const getCurrentConnectionSet = () => {
        const set = new Set();
        instance.getAllConnections().forEach((connection) => {
            if (connection.sourceId && connection.targetId) {
                set.add(toConnectionKey(connection.sourceId, connection.targetId));
            }
        });
        return set;
    };

    const updateGuideConnectionPrompt = (force = false) => {
        if (!guideState.enabled) return;
        const currentSet = getCurrentConnectionSet();
        const nextPair = requiredConnectionPairs.find(([from, to]) => {
            return !currentSet.has(toConnectionKey(from, to));
        });

        clearGuideHighlights();
        if (!nextPair) {
            highlightTarget(checkConnectionBtn);
            if (guideState.currentConnectionPrompt !== "all-done" || force) {
                guideState.currentConnectionPrompt = "all-done";
                playGuideAudio("all_connections_done");
            }
            return;
        }

        const [from, to] = nextPair;
        const promptKey = `${from}-${to}`;
        highlightConnectionPair(from, to);
        if (guideState.currentConnectionPrompt !== promptKey || force) {
            guideState.currentConnectionPrompt = promptKey;
            playGuideAudio("connections_intro");
            showStepAlert(`Connect point ${from} to point ${to}`, "AI Guide");
        }
    };

    function invalidateConnectionVerification() {
        experiment.connectionsVerified = false;
        resetStep4AndBeyond();
    }

    function addAllEndpoints() {
        instance.batch(() => {
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
                const isLeftSide = anchorX < 0.35;
                const isRightSide = anchorX > 0.65;
                const directionX = isLeftSide ? -1 : isRightSide ? 1 : 0;
                const directionY = directionX === 0 ? -1 : 0;

                const endpoint = instance.addEndpoint(portEl, {
                    anchor: [
                        Math.max(0, Math.min(1, anchorX)),
                        Math.max(0, Math.min(1, anchorY)),
                        directionX,
                        directionY
                    ],
                    endpoint: "Dot",
                    paintStyle: {
                        fill: "transparent",
                        radius: 10
                    },
                    connector: connectorSpec,
                    isSource: true,
                    isTarget: true,
                    maxConnections: -1
                });

                if (portEl.id) {
                    endpointMap[portEl.id] = endpoint;
                }
            });
        });
    }

    function detachNodeConnections(nodeId) {
        if (experiment.mcbOn) {
            guideAlert("Turn off the MCB before removing the connections.", "mcb_off_before_remove");
            return;
        }

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

    instance.bind("connection", (info) => {
        invalidateConnectionVerification();
        if (!guideState.enabled) return;

        const key = toConnectionKey(info.sourceId, info.targetId);
        if (!requiredConnectionSet.has(key)) {
            playGuideAudio("wrong_connection");
        }
        updateGuideConnectionPrompt();
    });
    instance.bind("connectionDetached", () => {
        invalidateConnectionVerification();
        updateGuideConnectionPrompt(true);
    });

    window.addEventListener("load", addAllEndpoints);
    let repaintQueued = false;
    const scheduleRepaint = () => {
        if (repaintQueued) return;
        repaintQueued = true;
        window.requestAnimationFrame(() => {
            repaintQueued = false;
            instance.repaintEverything();
        });
    };

    window.addEventListener("resize", function () {
        scheduleRepaint();
    });

    addAllEndpoints();
    setNeedleAngle(NEEDLE_START_ANGLE);
    setKnobAngle(KNOB_START_DEG);
    setMcbState(false);

    if (aiGuideBtn) {
        aiGuideBtn.addEventListener("click", () => {
            guideState.enabled = true;
            guideState.currentConnectionPrompt = "";
            guideAlert("Let’s connect the components.", "connections_intro");
            updateGuideConnectionPrompt(true);
        });
    }

    if (mcbImage) {
        mcbImage.addEventListener("click", () => {
            if (!guideState.enabled) return;
            clearGuideHighlights();
            if (experiment.mcbOn) {
                highlightTarget(autoKnob);
            } else {
                highlightTarget(mcbImage);
            }
        });
    }

    if (autoConnectBtn) {
        autoConnectBtn.addEventListener("click", function () {
            instance.batch(() => {
                instance.deleteEveryConnection();

                requiredConnectionPairs.forEach(function ([from, to]) {
                    const sourceEndpoint = endpointMap[from];
                    const targetEndpoint = endpointMap[to];
                    if (!sourceEndpoint || !targetEndpoint) return;

                    instance.connect({
                        source: sourceEndpoint,
                        target: targetEndpoint,
                        connector: connectorSpec
                    });
                });
            });

            experiment.connectionsVerified = false;
            guideAlert("Autoconnect completed. Click on the check button to verify the connections.", "autoconnect_completed");
            if (guideState.enabled) {
                clearGuideHighlights();
                highlightTarget(checkConnectionBtn);
            }
            scheduleRepaint();
        });
    }

    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener("click", function () {
            const currentConnections = instance.getAllConnections();
            if (currentConnections.length === 0) {
                guideAlert("Please make all the connections first.", "before_check");
                if (guideState.enabled) {
                    updateGuideConnectionPrompt(true);
                }
                return;
            }

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
                guideAlert(
                    "Connections are correct, click on the MCB to turn it ON.",
                    "after_correct_check"
                );
                if (guideState.enabled) {
                    clearGuideHighlights();
                    highlightTarget(mcbImage);
                }
            } else {
                invalidateConnectionVerification();
                const invalidCount = currentConnectionSet.size;
                if (guideState.enabled) {
                    playGuideAudio(invalidCount > 1 ? "wrong_multiple" : "wrong_connection");
                }
                showStepAlert(
                    "Connections are incorrect.\nPlease go to Step 3, fix wrong wires, then check again."
                );
                if (guideState.enabled) {
                    updateGuideConnectionPrompt(true);
                }
            }
        });
    }

    if (autoKnob) {
        autoKnob.addEventListener("click", () => {
            if (!experiment.connectionsVerified) {
                guideAlert("Please complete the connections first or turn ON the MCB.", "before_autotransformer");
                return;
            }
            if (!experiment.mcbOn) {
                guideAlert("Please complete the connections first or turn ON the MCB.", "before_autotransformer");
                return;
            }

            experiment.knobMoved = true;
            setKnobAngle(KNOB_RUNNING_DEG);
            setNeedleAngle(NEEDLE_RUNNING_ANGLE);
            if (guideState.enabled) {
                playGuideAudio("readings_displayed");
                clearGuideHighlights();
                highlightTarget(addToTableBtn);
            }
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
                guideAlert("Please rotate the autotransformer first.", "before_add_to_table");
                return;
            }
            if (experiment.readingAdded) {
                guideAlert(
                    "This reading is already added to the table. Click on the short circuit test button to perform the SC test.",
                    "duplicate_reading"
                );
                return;
            }
            if (!observationTbody) return;

            const row = document.createElement("tr");
            row.innerHTML = "<td>1</td><td>50</td><td>0.9</td><td>230</td>";
            observationTbody.appendChild(row);
            experiment.readingAdded = true;
            showStepAlert("Reading added to observation table.");
            if (guideState.enabled) {
                guideState.hasReading = true;
                playGuideAudio("first_reading_next");
                clearGuideHighlights();
                highlightTarget(reportBtn);
                highlightTarget(shortCircuitBtn);
            }
        });
    }

    if (shortCircuitBtn) {
        shortCircuitBtn.addEventListener("click", () => {
            if (!experiment.readingAdded) {
                guideAlert("First, perform the open circuit test.", "sc_test_first");
                return;
            }
            window.location.href = "short-circuit.html";
        });
    }

    if (printBtn) {
        printBtn.addEventListener("click", () => {
            if (guideState.enabled) {
                playGuideAudio("print");
            }
            window.print();
        });
    }

    if (reportBtn) {
        reportBtn.addEventListener("click", () => {
            guideAlert("Your report has been generated successfully. Click OK to view your report.", "report");
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            instance.deleteEveryConnection();
            experiment.connectionsVerified = false;
            resetStep4AndBeyond();
            guideAlert("The simulation has been reset. You can start again.", "reset");
            clearGuideHighlights();
            stopGuideAudio();
            guideState.currentConnectionPrompt = "";
            guideState.hasReading = false;
            scheduleRepaint();
        });
    }
});
