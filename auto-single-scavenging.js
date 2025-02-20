const isValidHourMinutesFormat = (text) => {
    // This pattern matches:
    // - Hours: Either one digit (0-9) or two digits (00-23)
    // - A colon (:)
    // - Minutes: Exactly two digits from 00 to 59
    const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
    
    return timePattern.test(text);
};

function timeStringToMilliseconds(timeString) {
    // Split the time string by colon and convert each part to a number
    
    if (!timeString) {
        return 0;
    }
    
    const parts = timeString.split(':').map(Number);

    // Check if the input has exactly three parts (hours, minutes, seconds)
    if (parts.length !== 3) {
       return 0;
    }

    const [hours, minutes, seconds] = parts;

    return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
}

const simulateEscKeyPress = () => {
    const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",    // The key value
        code: "Escape",   // The code value
        keyCode: 27,      // Legacy property (not recommended but sometimes needed)
        which: 27,        // Legacy property (not recommended but sometimes needed)
        bubbles: true,    // Ensure the event bubbles up through the DOM
        cancelable: true  // Allow the event to be cancelable if needed
    });
    document.dispatchEvent(escEvent);
}

const isCaptchaActive = () => {
    return document.querySelector(".captcha");
}

// Helper function to format milliseconds as mm:ss
const formatTimeInMinutesSeconds = (remainingMs) => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Helper: Returns a Promise that resolves after ms milliseconds and shows the countdown
const delayWithCountdown = (ms) => {
    return new Promise(resolve => {
        const startTime = Date.now();
        const endTime = ms + startTime;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(endTime - now, 0);

            const countDownElement = document.getElementById("nextExecutionTime");

            if (countDownElement) {
                countDownElement.innerHTML = `Próxima execução em: ${formatTimeInMinutesSeconds(remaining)}`;
            }

            if (remaining < 0) {
                clearInterval(interval);
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(interval);

            resolve();
        }, ms);
    });
}

// Helper: Returns a Promise that resolves after ms milliseconds
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const shouldUseUnit = (elementId) => {
    return document.getElementById(elementId)?.checked || false;
};

const reservedUnitQty = (elementId) => {
    return document.getElementById(elementId)?.value || 0;
};

const scavenge = async (startScavengingButtons) => {
    const configs = [
        { name: "spear", use: shouldUseUnit("spear_use"), reserved: reservedUnitQty("spear_reserved") },
        { name: "sword", use: shouldUseUnit("sword_use"), reserved: reservedUnitQty("sword_reserved") },
        { name: "axe", use: shouldUseUnit("axe_use"), reserved: reservedUnitQty("axe_reserved") },
        { name: "archer", use: shouldUseUnit("archer_use"), reserved: reservedUnitQty("archer_reserved") },
        { name: "light", use: shouldUseUnit("light_use"), reserved: reservedUnitQty("light_reserved") },
        { name: "marcher", use: shouldUseUnit("marcher_use"), reserved: reservedUnitQty("marcher_reserved") },
        { name: "heavy", use: shouldUseUnit("heavy_use"), reserved: reservedUnitQty("heavy_reserved") },
        { name: "knight", use: shouldUseUnit("knight_use"), reserved: 0 },
    ];

    let scavengeMaxTime = document.getElementById("maxScavengeTime")?.value || "2:00";

    if (!isValidHourMinutesFormat(scavengeMaxTime)) {
        scavengeMaxTime = "2:00";
    }

    const scriptPreferencesBtn = document.querySelector("#content_value h3 a");

    if (!scriptPreferencesBtn) {
        return;
    }

    scriptPreferencesBtn.click();

    await delay(1000);

    let tryNumber = 3;
    while (tryNumber > 0) {
        const scavengingOption = document.querySelector("input[value='addict']");

        if (!scavengingOption) {
            tryNumber--;
            await delay(2000);
        } else {
            scavengingOption.click();
            break;
        }
    }

    const scriptTargetTime = document.querySelector("input.target-duration");

    if (scriptTargetTime) {
        scriptTargetTime.value = scavengeMaxTime;
    }

    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }

    configs.forEach((config) => {
        const scriptUseUnitCheckbox = document.querySelector(`input[type='checkbox'][value='${config.name}']`);

        if (!scriptUseUnitCheckbox) {
            return;
        }

        scriptUseUnitCheckbox.checked = config.use;

        const scriptReservedUnit = document.querySelector(`input[type='number'][data-troop-type='${config.name}']`);

        if (!scriptReservedUnit) {
            return;
        }

        scriptReservedUnit.value = config.reserved;
    });

    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }

    const scriptClosePreferencesModal = document.querySelector("a.popup_box_close.tooltip-delayed");

    if (!scriptClosePreferencesModal) {
        simulateEscKeyPress();
    } else {
        scriptClosePreferencesModal.click();
    }

    startScavengingButtons = document.querySelectorAll("a.btn.btn-default.free_send_button");

    if (startScavengingButtons.length === 0) {
        return;
    }

    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }

    startScavengingButtons = Array.from(startScavengingButtons).reverse();

    for (const btn of startScavengingButtons) {
        btn.click();

        await delay((Math.random() + 1) * 3000);
    }

    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }
}

const startScavenging = async () => {

    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }
    
    let startScavengingButtons = document.querySelectorAll("a.btn.btn-default.free_send_button");
    
    if (startScavengingButtons.length === 0) {
        return;
    }
    
    $.getScript('https://cheesasaurus.github.io/twcheese/launch/ASS.js');
    
    await delay(2500);

    await scavenge(startScavengingButtons);

    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }
    
    await delay(15000);
};

const addScriptUiToBody = (localStorageKey, shouldStartScript) => {
    const scriptHtml = `
        <style>
            .timesConfigs {
                width: 100%;
            }
            .customScriptClass {
            width: 100%;
            }
            .customScriptClass table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1rem;
              background-color: #f8e4c2; /* Light/golden background */
            }
            .customScriptClass th,
            .customScriptClass td {
              border: 1px solid #d1ab6e; /* Slightly darker golden border */
              text-align: center;
              padding: 0.5rem;
              vertical-align: middle;
            }
            /* Icon sizing */
            .customScriptClass img {
              width: 20px;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            /* Numeric inputs: center text, consistent width */
            .customScriptClass input[type="number"] {
              width: 70px;
              text-align: center;
              margin: 0 auto;
              display: block;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 0.25rem;
            }
            /* Checkboxes: center them in the cell */
            .customScriptClass input[type="checkbox"] {
              transform: scale(1.2);
              cursor: pointer;
            }
            /* Text input and select (for model name and type) */
            .customScriptClass input[type="text"],
            .customScriptClass select {
              width: 200px;
              margin: 0 auto;
              display: block;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 0.25rem;
              text-align: left;
            }
            /* Button styling */
            .customScriptClass button {
              background-color: #0d6efd; /* Bootstrap-like primary color */
              color: #fff;
              border: 1px solid #0d6efd;
              padding: 0.4rem 0.8rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.9rem;
              margin: 0.25rem;
            }
            .customScriptClass button:hover {
              opacity: 0.9;
            }
        </style>
        
        <!-- Timer -->
        <div id="nextExecutionTime"></div>
        
        <!-- 1) Times -->
        <table>
          <thead>
            <tr>
                <th>Tempo para atualizar página (minutos)</th>
                <th>Tempo máximo de coleta (horas:minutos)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="number" value="0" id="timeForReloadPage" class="timesConfigs"/></td>
              <td><input type="text" value="2:00" placeholder="2:00" id="maxScavengeTime" class="timesConfigs"/></td>
            </tr>
          </tbody>
        </table>
        
        <!-- 2) Troops configs -->
        <table class="customScriptClass">
            <thead>
                <tr>
                  <th></th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_spear.png" alt="spear">
                  </th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_sword.png" alt="sword">
                  </th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_axe.png" alt="axe">
                  </th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_archer.png" alt="archer">
                  </th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_light.png" alt="light">
                  </th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_marcher.png" alt="marcher">
                  </th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_heavy.png" alt="heavy">
                  </th>
                  <th>
                    <img src="https://dszz.innogamescdn.com/asset/e20ae24f/graphic/unit/unit_knight.png" alt="knight">
                  </th>
                </tr>
            </thead>
            <tbody>
            <tr>
              <th>Usar</th>
              <td>
                <input class="troop-allowed" type="checkbox" id="spear_use" checked>
              </td>
              <td>
                <input class="troop-allowed" type="checkbox" id="sword_use" checked>
              </td>
              <td>
                <input class="troop-allowed" type="checkbox" id="axe_use" checked>
              </td>
              <td>
                <input class="troop-allowed" type="checkbox" id="archer_use" checked>
              </td>
              <td>
                <input class="troop-allowed" type="checkbox" id="light_use" checked>
              </td>
              <td>
                <input class="troop-allowed" type="checkbox" id="marcher_use" checked>
              </td>
              <td>
                <input class="troop-allowed" type="checkbox" id="heavy_use" checked>
              </td>
              <td>
                <input class="troop-allowed" type="checkbox" id="knight_use">
              </td>
            </tr>
            <tr>
              <th>Qtde. reservada para não usar</th>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="spear_reserved">
              </td>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="sword_reserved">
              </td>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="axe_reserved">
              </td>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="archer_reserved">
              </td>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="light_reserved">
              </td>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="marcher_reserved">
              </td>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="heavy_reserved">
              </td>
              <td>
                <input class="troop-reserved" type="number" min="0" value="0" id="knight_reserved">
              </td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-bottom: 30px;">
            Iniciar Coleta? 
            <input type="checkbox" id="startScript" ${shouldStartScript ? 'checked' : ''}/>
        </div>
    `

    const gameContentContainer = document.getElementById("scavenge_screen");

    if (!gameContentContainer) {
        return;
    }

    const scriptHtmlContainer = document.createElement("div");
    scriptHtmlContainer.setAttribute("id", "scriptHtmlContainer");
    scriptHtmlContainer.innerHTML = scriptHtml;

    gameContentContainer.insertAdjacentElement('beforebegin', scriptHtmlContainer);

    const startScript = document.getElementById("startScript");
    
    if (startScript) {
        startScript.addEventListener('click', function () {
            localStorage.setItem(localStorageKey, startScript.checked);
            
            window.location.reload();
        })
    }
};

const initScript = async () => {
    const localStorageKey = "auto-single-scavenge-config";
    const shouldStartScript = localStorage.getItem(localStorageKey) === "true";

    addScriptUiToBody(localStorageKey, shouldStartScript);
    
    if (shouldStartScript) {
        await startScavenging();
    } else {
        const startScript = document.getElementById("startScript")?.checked || false;

        if (startScript) {
            await startScavenging();
        }
    }

    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }
    
    const timeForReloading = document.getElementById("timeForReloadPage")?.value || 0;
    
    if (timeForReloading > 0) {
        await delayWithCountdown(Math.random() * timeForReloading * 1000);
    } else {
        const currentScavengeRemainingTime = timeStringToMilliseconds(document.querySelector(".return-countdown")?.textContent || "");
        
        await delayWithCountdown(currentScavengeRemainingTime + 120000);
    }
    
    window.location.reload();
};

window.addEventListener('load', async function() {
    await initScript();
}, false);