const waitReturnAndReload = async () => {
    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }
    
    const currentScavengeRemainingTime = timeStringToMilliseconds(document.querySelector(".return-countdown")?.textContent || "");
    await delay(currentScavengeRemainingTime + 30000);

    window.location.reload();
}

const getUnitInputElement = (unit) => {
    return document.querySelector(`input[name="${unit}"]`);
}

const getTotalUnitAvailable = (unit) => {
    let text = document.querySelector(`a.units-entry-all[data-unit='${unit}']`);
    
    if (!text) {
        return 0;
    }
    
    text = text.replace("(", "").replace(")", "");
    
    const textInInt = parseInt(text);
    
    if (isNaN(textInInt)) {
        return 0;
    }
    
    return textInInt;
}

const initScript = async () => {
    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }
    
    const localStorageKey = "auto-single-scavenge-config";
    let sendTroopsButtons = document.querySelectorAll("a.free_send_button:not(.btn-disabled)");

    if (sendTroopsButtons.length === 0) {
        await waitReturnAndReload();
    }
    sendTroopsButtons = Array.from(sendTroopsButtons).reverse();
    
    const configs = [
        { name: "spear", shouldUse: true, input: getUnitInputElement("spear"), totalAvailable: getTotalUnitAvailable("spear") },
        { name: "sword", shouldUse: true, input: getUnitInputElement("sword"), totalAvailable: getTotalUnitAvailable("sword") },
        { name: "axe", shouldUse: true, input: getUnitInputElement("axe"), totalAvailable: getTotalUnitAvailable("axe") },
        { name: "archer", shouldUse: false, input: getUnitInputElement("archer"), totalAvailable: getTotalUnitAvailable("archer") },
        { name: "light", shouldUse: false, input: getUnitInputElement("light"), totalAvailable: getTotalUnitAvailable("light") },
        { name: "marcher", shouldUse: false, input: getUnitInputElement("marcher"), totalAvailable: getTotalUnitAvailable("marcher") },
        { name: "heavy", shouldUse: false, input: getUnitInputElement("heavy"), totalAvailable: getTotalUnitAvailable("heavy") },
    ];
    
    const totalScavengeUnlocked = sendTroopsButtons.length;
    const fourScavengeDivisor = 13;
    const threeScavengeDivisor = 8;
    const twoScavengeDivisor = 3.5;
    
    for (const button of sendTroopsButtons) {
        
    }
};

window.addEventListener('load', async function() {
    await initScript();
}, false);