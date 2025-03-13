// Configurações básicas padrão
const BASE_SETTINGS = {
    hideOthers: true,
    hideOnClick: true,
    scanIfNoInformation: false,
    yellowDotWallLevel: 1,
    redDotWallLevel: 1,
    templates: {
        1:  { "axes": 10, "scouts": 1, "lights": 2,  "rams": 2,  "catapults": 0 },
        2:  { "axes": 10, "scouts": 1, "lights": 4,  "rams": 4,  "catapults": 0 },
        3:  { "axes": 10, "scouts": 1, "lights": 8,  "rams": 8,  "catapults": 0 },
        4:  { "axes": 15, "scouts": 1, "lights": 15, "rams": 10, "catapults": 0 },
        5:  { "axes": 25, "scouts": 1, "lights": 20, "rams": 15, "catapults": 0 },
        6:  { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        7:  { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        8:  { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        9:  { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        10: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        11: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        12: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        13: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        14: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        15: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        16: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        17: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        18: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        19: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
        20: { "axes": 0,  "scouts": 0, "lights": 0,  "rams": 0,  "catapults": 0 },
    }
};

let settings = {};
const version = "v1.2.1";
const gameData = window.game_data || { screen: undefined };
let observer = null;
let activeRow = null;
let activeConfirmAttackButton = null;
let confirmationHandler = null;

function initSettings(userSettings = {}) {
    console.log("[DEBUG] Inicializando configurações");
    settings = {};
    for (const prop in BASE_SETTINGS) {
        settings[prop] = userSettings[prop] !== undefined ? userSettings[prop] : BASE_SETTINGS[prop];
    }
    settings.templates = settings.templates || {};
    const baseTemplates = BASE_SETTINGS.templates;
    for (const wallLevel in baseTemplates) {
        if (settings.templates[wallLevel] === undefined) {
            settings.templates[wallLevel] = baseTemplates[wallLevel];
        }
    }
}

function exec() {
    console.log("[DEBUG] Executando demolidor de muralhas - versão:", version);
    if (gameData.screen === "am_farm") {
        if (settings.hideOnClick) {
            console.log("[DEBUG] Ativando observador de mudanças para esconder linhas após clique");
            observer = new MutationObserver(handleDocumentChange);
            observer.observe(document.body, { childList: true, subtree: true });
        }

        const plunderListElement = document.getElementById("plunder_list");
        if (plunderListElement) {
            const plunderRows = plunderListElement.rows;
            console.log("[DEBUG] Número de linhas de pilhagem:", plunderRows.length);
            for (let i = 0; i < plunderRows.length; i++) {
                processPlunderRow(i, plunderRows[i]);
            }
        } else {
            console.error("[DEBUG] Elemento 'plunder_list' não encontrado");
        }
    } else {
        if (window.UI) {
            window.UI.ErrorMessage("Não estás no painel do Assistente de Fazendeiro", 3000, null, null);
        }
    }
}

function handleDocumentChange() {
    console.log("[DEBUG] Alteração detectada no DOM");
    const confirmAttackButton = document.getElementById("troop_confirm_submit");
    if (confirmAttackButton && confirmAttackButton !== activeConfirmAttackButton) {
        if (activeConfirmAttackButton) {
            activeConfirmAttackButton.removeEventListener("click", confirmationHandler);
        }
        confirmationHandler = handleConfirmation;
        confirmAttackButton.addEventListener("click", confirmationHandler, { once: true });
        activeConfirmAttackButton = confirmAttackButton;
        console.log("[DEBUG] Handler de confirmação atualizado");
    }
}

function handleConfirmation() {
    console.log("[DEBUG] Confirmação de ataque recebida");
    if (activeRow instanceof HTMLElement) {
        activeRow.style.display = "none";
        console.log("[DEBUG] Linha ativa escondida após confirmação");
    }
    activeRow = null;
}

function processPlunderRow(index, row) {
    console.log(`[DEBUG] Processando linha ${index}`);
    if (index < 2) {
        return;
    }
    const dotImage = row.cells[1].querySelector("img");
    let wallLevel = 0;
    const rowWallLevel = Number(row.cells[6].innerHTML);
    if (rowWallLevel) {
        wallLevel = Math.max(wallLevel, rowWallLevel);
    }
    const isYellow = /dots\/yellow\.[a-z]+$/.test(dotImage.src);
    if (wallLevel === 0 && isYellow) {
        wallLevel = settings.yellowDotWallLevel;
    }
    const isRed = /dots\/red\.[a-z]+$/.test(dotImage.src);
    if (wallLevel === 0 && isRed) {
        wallLevel = settings.redDotWallLevel;
    }
    const needToScan = settings.scanIfNoInformation && (isYellow || isRed);
    console.log(`[DEBUG] Linha ${index} - Nível da muralha: ${wallLevel}, Precisa escanear: ${needToScan}`);
    if (wallLevel > 0 || needToScan) {
        addHandlerToCommandButton(row, wallLevel, needToScan);
    } else {
        if (settings.hideOthers) {
            row.style.display = "none";
            console.log(`[DEBUG] Linha ${index} escondida por não atender aos critérios`);
        }
    }
}

function addHandlerToCommandButton(row, wallLevel, needToScan) {
    console.log("[DEBUG] Adicionando handler ao botão de comando para a linha");
    const sendCommandCell = row.cells[row.cells.length - 1];
    const commandAnchor = sendCommandCell.getElementsByTagName("a")[0];
    const urlParts = commandAnchor.href.split("target=");
    const target = urlParts[1];
    const commonCommandParameters = { target };
    let unitsCommandParameters = {
        axe: 0,
        spy: 1,
        light: 0,
        ram: 0,
        catapult: 0,
    };
    if (!needToScan) {
        const template = settings.templates[wallLevel];
        unitsCommandParameters = {
            axe: template.axes,
            spy: template.scouts,
            light: template.lights,
            ram: template.rams,
            catapult: template.catapults,
        };
    }
    const commandParameters = { ...commonCommandParameters, ...unitsCommandParameters };
    commandAnchor.removeAttribute("onclick");
    const serializedParams = new URLSearchParams(unitsCommandParameters).toString();
    commandAnchor.href += `&${serializedParams}`;
    commandAnchor.addEventListener("click", function(event) {
        handleCommandClick(commandParameters, row, event);
    });
    console.log("[DEBUG] Handler adicionado ao botão de comando");
}

function handleCommandClick(parameters, row, event) {
    console.log("[DEBUG] Botão de comando clicado");
    if (!event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        if (window.CommandPopup && typeof window.CommandPopup.openRallyPoint === "function") {
            window.CommandPopup.openRallyPoint(parameters);
            console.log("[DEBUG] Popup de comando aberto");
        } else {
            console.error("[DEBUG] CommandPopup não definido ou método openRallyPoint ausente");
        }
    }
    if (settings.hideOnClick) {
        activeRow = row;
        console.log("[DEBUG] Linha marcada para esconder após clique");
    }
}

function startWallDemolisher(userSettings) {
    initSettings(userSettings);
    exec();
}

// Chamada automática quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", function() {
    console.log("[DEBUG] DOM carregado completamente (wall_demolisher)");
    const userSettings = window.settings || window.userSettings || {};
    startWallDemolisher(userSettings);
});
