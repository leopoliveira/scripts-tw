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

const reloadInterval = randomInterval(10000, 100000);

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
    if (unit.recruit) {
        const selectorsOnScreen = document.querySelectorAll(unit.cssSelector).length;
        if (selectorsOnScreen < (requiredSelectorsCount[unit.unitName] || 1)) {
            const availableUnits = getAvailableUnits(unit.unitName);
            const currentUnits = getCurrentUnitsCount(unit.unitName);
            const maxUnits = maxUnitsConfig[unit.unitName] || availableUnits;

            if (availableUnits > 0 && currentUnits < maxUnits) {
                const inputField = document.querySelector(`input[name="${unit.unitName}"]`);

                if (inputField && !inputField.parentElement.hidden) {
                    inputField.value = Math.min(1, availableUnits, maxUnits - currentUnits);
                    return true;
                }
            }
        }
    }
    return false;
}

document.addEventListener("DOMContentLoaded", async () => {
    const scriptContainerId = 'recruitment-config-container';

    const container = document.createElement('div');
    container.id = scriptContainerId;
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.background = '#fff';
    container.style.border = '1px solid #ccc';
    container.style.padding = '10px';
    container.style.zIndex = '9999';

    const barracksScreenTableElement = document.getElementById("contentContainer");
    barracksScreenTableElement.insertAdjacentElement('beforebegin', container);

    renderRecruitmentConfigUI(scriptContainerId);

    setupTroopsConfig();

    const shouldRecruit = troopsConfig.some(unit => validateAndFillUnit(unit));

    if (shouldRecruit) {
        document.querySelector(".btn-recruit").click();
    }

    const reloadCountdown = document.createElement('div');
    reloadCountdown.id = 'nextReloadTime';
    container.appendChild(reloadCountdown);

    console.log(`Próximo reload em ${reloadInterval / 1000}s`);

    await delayWithCountdown(reloadInterval, 'nextReloadTime');

    console.log("Recarregando página...");
    location.reload(true);
});
