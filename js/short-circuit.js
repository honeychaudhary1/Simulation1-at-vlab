const mcbImage = document.getElementById("mcbImage");
const autoKnob = document.getElementById("autoKnob");
const instructionsBtn = document.getElementById("instructionsBtn");
const instructionsTooltip = document.getElementById("instructionsTooltip");
const aiGuideBtn = document.getElementById("aiGuideBtn");
const autoConnectBtn = document.getElementById("autoConnectBtn");
const checkConnectionBtn = document.getElementById("checkConnectionBtn");
const addToTableBtn = document.getElementById("addToTableBtn");
const observationTbody = document.getElementById("observationTbody");
const resetBtn = document.getElementById("resetBtn");
const printBtn = document.getElementById("printBtn");
const reportBtn = document.getElementById("reportBtn");
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
        if (!mcbOn && !connectionsVerified) {
            if (window.aiGuideNotify) {
                window.aiGuideNotify("Make and check the connections before turning on the MCB.", "before_mcb", true);
            } else {
                showStepAlert("Please make and verify correct connections first (Step 1 & 2).");
            }
            return;
        }

        mcbOn = !mcbOn;
        setMcbState(mcbOn);
        if (!mcbOn) {
            knobOn = false;
            knobMoved = false;
            setKnobAngle(KNOB_START_DEG);
            setNeedleAngle(NEEDLE_START_ANGLE);
            if (window.aiGuideNotify) {
                window.aiGuideNotify("You turned off the MCB. Turn it back on to continue the simulation.", "mcb_off_mid", true);
            }
            return;
        }
        setNeedleAngle(NEEDLE_MCB_ON_ANGLE);
        if (window.aiGuideNotify) {
            window.aiGuideNotify("MCB has been turned ON. Now click on the autotransformer knob.", "mcb_on", true);
        }
    });
}

if (autoKnob) {
    setKnobAngle(KNOB_START_DEG);

    autoKnob.addEventListener("click", () => {
        if (!connectionsVerified) {
            if (window.aiGuideNotify) {
                window.aiGuideNotify("Please complete the connections first or turn ON the MCB.", "before_autotransformer", true);
            } else {
                showStepAlert("Please verify connections first using CHECK.");
            }
            return;
        }
        if (!mcbOn) {
            if (window.aiGuideNotify) {
                window.aiGuideNotify("Please complete the connections first or turn ON the MCB.", "before_autotransformer", true);
            } else {
                showStepAlert("Please switch ON the MCB first (Step 4).");
            }
            return;
        }

        knobOn = !knobOn;
        knobMoved = true;
        setKnobAngle(knobOn ? KNOB_RUNNING_DEG : KNOB_START_DEG);
        if (window.aiGuideNotify && knobOn) {
            window.aiGuideNotify(
                "The readings are now displayed on the voltmeter, ammeter, and wattmeter. Now, click on the add to table button to add the reading to the observation table.",
                "readings_displayed",
                false
            );
        }
    });
}

function resetObservationTable() {
    if (observationTbody) {
        observationTbody.innerHTML = "";
    }
    shortCircuitReadingAdded = false;
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
    autotransformer: "An autotransformer is used in the experiment to provide a smoothly variable AC voltage to the transformer under test. In the short-circuit test, it supplies a low voltage sufficient to circulate rated current.",
    transformer: "During the short-circuit test, the secondary winding of the transformer is short-circuited, and a low voltage is applied to the primary winding until the rated current flows.",
    "ac-voltmeter": "The voltmeter connected across the autotransformer measures the applied voltage.",
    "ac-ammeter": "The ammeter connected in series measures the short-circuit current.",
    "ac-wattmeter": "The power recorded by the wattmeter represents only the copper losses in the transformer windings at full-load current."
});

jsPlumb.ready(() => {
    const connectorSpec = [
        "Bezier",
        { curviness: 150, alwaysRespectStubs: false, stub: [10, 14] }
    ];

    const instance = jsPlumb.getInstance({
        Connector: connectorSpec,
        PaintStyle: { stroke: "#4a90e2", strokeWidth: 3.5 },
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
    const guideState = {
        enabled: false,
        currentConnectionPrompt: "",
        audio: null
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
        after_sc_reading: "after-1st-reading-added-sc.mp3",
        duplicate_reading: "duplicate-reading.mp3",
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

    function addAllEndpoints() {
        instance.batch(() => {
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
                    paintStyle: { fill: "transparent", radius: 10 },
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
        if (mcbOn) {
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

    window.addEventListener("resize", () => {
        scheduleRepaint();
    });

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
            if (mcbOn) {
                highlightTarget(autoKnob);
            } else {
                highlightTarget(mcbImage);
            }
        });
    }

    instance.bind("connection", (info) => {
        connectionsVerified = false;
        if (!guideState.enabled) return;

        const key = toConnectionKey(info.sourceId, info.targetId);
        if (!requiredConnectionSet.has(key)) {
            playGuideAudio("wrong_connection");
        }
        updateGuideConnectionPrompt();
    });
    instance.bind("connectionDetached", () => {
        connectionsVerified = false;
        updateGuideConnectionPrompt(true);
    });

    if (autoConnectBtn) {
        autoConnectBtn.addEventListener("click", () => {
            instance.batch(() => {
                instance.deleteEveryConnection();

                requiredConnectionPairs.forEach(([from, to]) => {
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

            scheduleRepaint();
            guideAlert("Autoconnect completed. Click on the check button to verify the connections.", "autoconnect_completed");
            if (guideState.enabled) {
                clearGuideHighlights();
                highlightTarget(checkConnectionBtn);
            }
        });
    }

    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener("click", () => {
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
                guideAlert(
                    "Connections are correct, click on the MCB to turn it ON.",
                    "after_correct_check"
                );
                if (guideState.enabled) {
                    clearGuideHighlights();
                    highlightTarget(mcbImage);
                }
            } else {
                connectionsVerified = false;
                if (guideState.enabled) {
                    playGuideAudio(currentConnectionSet.size > 1 ? "wrong_multiple" : "wrong_connection");
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

    if (addToTableBtn) {
        addToTableBtn.addEventListener("click", () => {
            if (!observationTbody) return;
            if (!connectionsVerified) {
                showStepAlert("Please complete Step 1 and Step 2 first.");
                return;
            }
            if (!mcbOn) {
                showStepAlert("Please switch ON the MCB first (Step 4).");
                return;
            }
            if (!knobMoved || !knobOn) {
                guideAlert("Please rotate the autotransformer first.", "before_add_to_table");
                return;
            }
            if (shortCircuitReadingAdded) {
                guideAlert(
                    "This reading is already added to the table.",
                    "duplicate_reading"
                );
                return;
            }

            const row = document.createElement("tr");
            row.innerHTML = "<td>1</td><td>37.5</td><td>4.5</td><td>11</td>";
            observationTbody.appendChild(row);
            shortCircuitReadingAdded = true;
            showStepAlert("Reading added to observation table.");
            if (guideState.enabled) {
                playGuideAudio("after_sc_reading");
                clearGuideHighlights();
                highlightTarget(submitBtn);
            }
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
            connectionsVerified = false;
            mcbOn = false;
            knobOn = false;
            knobMoved = false;
            setMcbState(false);
            setKnobAngle(KNOB_START_DEG);
            setNeedleAngle(NEEDLE_START_ANGLE);
            resetObservationTable();
            guideAlert("The simulation has been reset. You can start again.", "reset");
            clearGuideHighlights();
            stopGuideAudio();
            guideState.currentConnectionPrompt = "";
            scheduleRepaint();
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            if (!connectionsVerified) {
                guideAlert("Please complete Step 2: check and verify all connections.", "before_check");
                return;
            }
            if (!mcbOn) {
                guideAlert("Please complete Step 4: switch ON the MCB.", "before_mcb");
                return;
            }
            if (!knobMoved) {
                guideAlert("Please complete Step 5: click the autotransformer knob.", "before_autotransformer");
                return;
            }
            if (!shortCircuitReadingAdded) {
                guideAlert("Please complete Step 6: add reading to the observation table.", "before_add_to_table");
                return;
            }
            window.location.href = "equivalent-circuit.html";
        });
    }

    addAllEndpoints();
});

