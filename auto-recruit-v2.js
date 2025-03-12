const UnitCssSelectors = Object.freeze({
    SPEAR: ".unit_sprite_smaller.spear",
    SWORD: ".unit_sprite_smaller.sword",
    AXE: ".unit_sprite_smaller.axe",
    SPY: ".unit_sprite_smaller.spy",
    LIGHT_CAVALRY: ".unit_sprite_smaller.light",
    HEAVY_CAVALRY: ".unit_sprite_smaller.heavy",
    RAM: ".unit_sprite_smaller.ram",
    CATAPULT: ".unit_sprite_smaller.catapult",
});

const recruitFlags = loadRecruitFlags();
const maxUnitsConfig = loadMaxUnitsConfig();
const requiredSelectorsCount = loadRequiredSelectorsCount();

let troopsConfig = [];

const reloadInterval = randomInterval(180000, 520000);

function setupTroopsConfig() {
    troopsConfig = [
        { unitName: "spear", recruit: recruitFlags.spear, cssSelector: UnitCssSelectors.SPEAR },
        { unitName: "sword", recruit: recruitFlags.sword, cssSelector: UnitCssSelectors.SWORD },
        { unitName: "axe", recruit: recruitFlags.axe, cssSelector: UnitCssSelectors.AXE },
        { unitName: "spy", recruit: recruitFlags.spy, cssSelector: UnitCssSelectors.SPY },
        { unitName: "light", recruit: recruitFlags.lightCavalry, cssSelector: UnitCssSelectors.LIGHT_CAVALRY },
        { unitName: "heavy", recruit: recruitFlags.heavyCavalry, cssSelector: UnitCssSelectors.HEAVY_CAVALRY },
        { unitName: "ram", recruit: recruitFlags.ram, cssSelector: UnitCssSelectors.RAM },
        { unitName: "catapult", recruit: recruitFlags.catapult, cssSelector: UnitCssSelectors.CATAPULT },
    ];
}

function validateAndFillUnit(unit) {
    if (isCaptchaActive()) {
        console.warn("[DEBUG] Captcha ativo, aguardando resolução.");
        return;
    }
    
    if (!unit.recruit) {
        console.log(`[DEBUG] ${unit.unitName} - Recrutamento desabilitado.`);
        return false;
    }

    const selectorsOnScreen = document.querySelectorAll(unit.cssSelector).length;
    console.log(`[DEBUG] ${unit.unitName} - Seletores na tela: ${selectorsOnScreen}`);

    const requiredCount = requiredSelectorsCount[unit.unitName] || 1;
    if (selectorsOnScreen >= requiredCount) {
        console.log(
            `[DEBUG] ${unit.unitName} - Número de seletores (${selectorsOnScreen}) atende ou excede o requerido (${requiredCount}).`
        );
        return false;
    }

    const availableUnits = getAvailableUnits(unit.unitName);
    const currentUnits = getCurrentUnitsCount(unit.unitName);
    const maxUnits = maxUnitsConfig[unit.unitName] || availableUnits;

    console.log(
        `[DEBUG] ${unit.unitName} - available: ${availableUnits}, current: ${currentUnits}, max: ${maxUnits}`
    );

    if (availableUnits > 0 && currentUnits < maxUnits) {
        const inputField = document.querySelector(`input[name="${unit.unitName}"]`);

        if (!inputField) {
            console.log(`[DEBUG] ${unit.unitName} - Campo de input não encontrado.`);
            return false;
        }

        if (inputField.parentElement.hidden) {
            console.log(`[DEBUG] ${unit.unitName} - Campo de input encontrado, mas está oculto.`);
            return false;
        }

        // A lógica original utiliza Math.min(1, availableUnits, maxUnits - currentUnits),
        // o que sempre retornará 1 se availableUnits e (maxUnits - currentUnits) forem maiores ou iguais a 1.
        // Mantemos essa lógica conforme o código original.
        const quantityToRecruit = Math.min(1, availableUnits, maxUnits - currentUnits);
        inputField.value = quantityToRecruit;
        console.log(`[DEBUG] ${unit.unitName} - Campo de input preenchido com: ${quantityToRecruit}`);
        return true;
    } else {
        console.log(
            `[DEBUG] ${unit.unitName} - Condições não atendidas: availableUnits (${availableUnits}) ou currentUnits (${currentUnits}) >= maxUnits (${maxUnits}).`
        );
        return false;
    }
}

window.addEventListener('load', async () => {
    setTimeout(async () => {
        if (isCaptchaActive()) {
            console.warn("[DEBUG] Captcha ativo, aguardando resolução.");
            return;
        }

        insertForceReloadElement();

        const scriptContainerId = 'recruitment-config-container';

        const container = document.createElement('div');
        container.id = scriptContainerId;

        const barracksScreenTableElement = document.getElementById("contentContainer");
        barracksScreenTableElement.insertAdjacentElement('beforebegin', container);

        renderRecruitmentConfigUI(scriptContainerId);

        setupTroopsConfig();

        const numberOfRepeats = 4;
        let counter = 0;

        while (counter < numberOfRepeats) {
            // Processa cada unidade e guarda o resultado da validação
            const recruitmentResults = troopsConfig.map(unit => {
                const result = validateAndFillUnit(unit);
                return { unit: unit.unitName, recruited: result };
            });
            console.log("[DEBUG] Resultados da validação:", recruitmentResults);

            if (isCaptchaActive()) {
                console.warn("[DEBUG] Captcha ativo, aguardando resolução.");
                return;
            }

            const shouldRecruit = recruitmentResults.some(result => result.recruited);

            if (shouldRecruit) {
                const delayTime = randomInterval(1500, 5000);
                console.log(`[DEBUG] Esperando ${delayTime} ms antes de recrutar...`);
                await delay(delayTime);

                const recruitButton = document.querySelector(".btn-recruit");
                if (recruitButton) {
                    console.log("[DEBUG] Botão de recrutamento encontrado, clicando...");
                    recruitButton.click();
                } else {
                    console.log("[DEBUG] Botão de recrutamento não encontrado.");
                }
            }

            await delay(randomInterval(3000, 8000));

            counter++;
        }

        const reloadCountdown = document.createElement('div');
        reloadCountdown.id = 'nextReloadTime';
        container.appendChild(reloadCountdown);

        console.log(`Próximo reload em ${reloadInterval / 1000}s`);

        await delayWithCountdown(reloadInterval, 'nextReloadTime');

        console.log("Recarregando página...");
        location.reload(true);
    }, 5000);
});