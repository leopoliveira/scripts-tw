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

// Helper: Safely extracts a number from an element’s text content
const getMaxUnitInputFromElement = (htmlElement) => {
    if (htmlElement) {
        return parseInt(htmlElement
            .text
            .replace(/[()]/g, "")
            .trim()
        );
    }
    
    return 0;
}

// Helper: Safely retrieves the current quantity of a unit from the DOM
const getUnitQuantity = (unit) => {
    const element = document.querySelector(`[data-unit='${unit}']`);
    
    if (!element ||
        !element.parentElement ||
        !element.parentElement.parentElement
    ) {
        return -1;
    }
    
    const qtyElement = element
        .parentElement
        .parentElement
        .getElementsByTagName("td")[2];
    
    if (!qtyElement) {
        return -1;
    }

    const qtyElementText = qtyElement.innerHTML.split("/");
    
    if (!qtyElementText || qtyElementText.length !== 2) {
        return -1;
    } 
    
    return parseInt(qtyElementText[1]);
}

// Helper: Returns the number of units on queue
const qtyUnitOnQueue = (unit) =>
    document.querySelectorAll(`.unit_sprite_smaller.${unit}`).length;

// Determines if the recruitment conditions are met
const shouldRecruitUnit = (
    unitMaxInput,
    unitBatchValue,
    recruitInput,
    unitActualQuantity,
    unitExpectedTotal,
    unit,
    maxUnitOnQueue
) => {
    if (unitActualQuantity === -1 || !recruitInput) {
        return false;
    }
    
    return unitMaxInput >= unitBatchValue &&
        unitExpectedTotal > 0 &&
        (unitActualQuantity + unitBatchValue) <= unitExpectedTotal &&
        qtyUnitOnQueue(unit) < maxUnitOnQueue;
}

// Inserts the custom UI into the page
const addScriptUiToBody = () => {
    const scriptHtml = `
        <style>
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
              width: 30px;
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
        <div class="customScriptClass">
            <!-- Timer -->
            <div id="nextExecutionTime"></div>
            
            <!-- 1) Units Row Table -->
            <table class="units-table">
              <thead>
                <tr>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/spear.png" alt="Spear" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/sword.png" alt="Sword" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/axe.png" alt="Axe" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/archer.png" alt="Archer" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/spy.png" alt="Spy" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/light.png" alt="Light Cavalry" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/marcher.png" alt="Mounted Archer" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/heavy.png" alt="Heavy Cavalry" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/ram.png" alt="Ram" /></th>
                  <th><img src="https://dszz.innogamescdn.com/asset/576611fc/graphic/unit/recruit/catapult.png" alt="Catapult" /></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="number" value="0" id="spearNumber" /></td>
                  <td><input type="number" value="0" id="swordNumber" /></td>
                  <td><input type="number" value="0" id="axeNumber" /></td>
                  <td><input type="number" value="0" id="archerNumber" /></td>
                  <td><input type="number" value="0" id="spyNumber" /></td>
                  <td><input type="number" value="0" id="lightNumber" /></td>
                  <td><input type="number" value="0" id="marcherNumber" /></td>
                  <td><input type="number" value="0" id="heavyNumber" /></td>
                  <td><input type="number" value="0" id="ramNumber" /></td>
                  <td><input type="number" value="0" id="catapultNumber" /></td>
                </tr>
              </tbody>
            </table>
        
            <!-- 2) Configuration Row Table -->
            <table class="config-table">
              <thead>
                <tr>
                  <th>Tempo para próxima aldeia (seg.)</th>
                  <th><img src="https://dsen.innogamescdn.com/asset/9e8005c0/graphic/buildings/mid/barracks3.png" alt="Unidades por vez" /></th>
                  <th><img src="https://dsen.innogamescdn.com/asset/9e8005c0/graphic/buildings/mid/stable3.png" alt="Unidades por vez" /></th>
                  <th><img src="https://dsen.innogamescdn.com/asset/9e8005c0/graphic/buildings/mid/garage3.png" alt="Unidades por vez" /></th>
                  <th>Filas Máximas</th>
                  <th>Pesquisar Unidades Automaticamente</th>
                  <th>Ativar Recrutamento nessa Aldeia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <!-- Tempo para próxima aldeia -->
                  <td>
                    <input
                      type="number"
                      value="120"
                      id="timeNextVillage"
                    />
                  </td>
                  <!-- 3 columns for Unidades por vez -->
                  <td>
                    <input
                      type="number"
                      value="5"
                      id="barracksUnitsPerBatch"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value="2"
                      id="stableUnitsPerBatch"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value="2"
                      id="workshopUnitsPerBatch"
                    />
                  </td>
                  <!-- Filas Máximas -->
                  <td>
                    <input
                      type="number"
                      value="2"
                      id="maxQueues"
                    />
                  </td>
                  <!-- Pesquisar Unidades Automaticamente -->
                  <td>
                    <input
                      type="checkbox"
                      id="autoResearch"
                    />
                  </td>
                  <!-- Ativar Recrutamento nessa Aldeia -->
                  <td>
                    <input
                      type="checkbox"
                      id="activateRecruitment"
                    />
                  </td>
                </tr>
                <tr>
                  <td colspan="7">
                    <button id="saveConfigBtn">
                      Salvar Modelo de Recrutamento
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
        
            <!-- 3) Model Row Table -->
            <table class="model-table">
              <tbody>
                <!-- First row: Nome do Modelo + input + Salvar/Remover buttons -->
                <tr>
                  <td>
                    <label for="modelName">Nome do Modelo:</label>
                  </td>
                  <td>
                    <input
                      type="text"
                      id="modelName"
                      placeholder="Ex: Ataque Padrão (sem Arqueiro)"
                    />
                  </td>
                  <td>
                    <button id="saveModelBtn">
                      Salvar Modelo
                    </button>
                  </td>
                  <td>
                    <button id="removeModelBtn">
                      Remover Modelo
                    </button>
                  </td>
                </tr>
                <!-- Second row: Selecione um modelo + dropdown + Definir Modelo button -->
                <tr>
                  <td>
                    <label for="modelType">Selecione um modelo:</label>
                  </td>
                  <td>
                    <select id="modelType">
                      <option value="0">Ataque Padrão (sem Arqueiro)</option>
                      <option value="1">Defesa Padrão (sem Arqueiro)</option>
                      <option value="2">Ataque Padrão (com Arqueiro)</option>
                      <option value="3">Defesa Padrão (com Arqueiro)</option>
                    </select>
                  </td>
                  <td colspan="2">
                    <button id="defineModelBtn">
                      Definir Modelo nessa Aldeia
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
    `;

    const tableGameContent = document.getElementById("contentContainer");
    
    const scriptHtmlContainer = document.createElement("div");
    scriptHtmlContainer.setAttribute("id", "scriptHtmlContainer");
    scriptHtmlContainer.innerHTML = scriptHtml;
    
    tableGameContent.insertAdjacentElement('beforebegin', scriptHtmlContainer);
}

// Sets up UI interactions and loads/saves configuration
const startUiScripts = (localStorageKey) => {
    const units = {
        spear: document.getElementById("spearNumber"),
        sword: document.getElementById("swordNumber"),
        axe: document.getElementById("axeNumber"),
        archer: document.getElementById("archerNumber"),
        spy: document.getElementById("spyNumber"),
        light: document.getElementById("lightNumber"),
        marcher: document.getElementById("marcherNumber"),
        heavy: document.getElementById("heavyNumber"),
        ram: document.getElementById("ramNumber"),
        catapult: document.getElementById("catapultNumber"),
        timeNextVillage: document.getElementById("timeNextVillage"),
        barracksUnitsPerBatch: document.getElementById("barracksUnitsPerBatch"),
        stableUnitsPerBatch: document.getElementById("stableUnitsPerBatch"),
        workshopUnitsPerBatch: document.getElementById("workshopUnitsPerBatch"),
        maxQueues: document.getElementById("maxQueues"),
        autoResearch: document.getElementById("autoResearch"),
        activateRecruitment: document.getElementById("activateRecruitment"),
        saveConfigBtn: document.getElementById("saveConfigBtn")
    };

    function getAutoRecruitLocalStorageConfigs(localStorageKey) {
        const configFromLocalStorage = JSON.parse(localStorage.getItem(localStorageKey));

        if (configFromLocalStorage) {
            units.spear.value = configFromLocalStorage.spear || 0;
            units.sword.value = configFromLocalStorage.sword || 0;
            units.axe.value = configFromLocalStorage.axe || 0;
            units.archer.value = configFromLocalStorage.archer || 0;
            units.spy.value = configFromLocalStorage.spy || 0;
            units.light.value = configFromLocalStorage.light || 0;
            units.marcher.value = configFromLocalStorage.marcher || 0;
            units.heavy.value = configFromLocalStorage.heavy || 0;
            units.ram.value = configFromLocalStorage.ram || 0;
            units.catapult.value = configFromLocalStorage.catapult || 0;
            units.timeNextVillage.value = configFromLocalStorage.timeNextVillage || 120;
            units.barracksUnitsPerBatch.value = configFromLocalStorage.barracksUnitsPerBatch || 5;
            units.stableUnitsPerBatch.value = configFromLocalStorage.stableUnitsPerBatch || 3;
            units.workshopUnitsPerBatch.value = configFromLocalStorage.workshopUnitsPerBatch || 2;
            units.maxQueues.value = configFromLocalStorage.maxQueues || 3;
            units.autoResearch.checked = !!configFromLocalStorage.autoResearch;
            units.activateRecruitment.checked = !!configFromLocalStorage.activateRecruitment;
        }
    }
    
    if (units.saveConfigBtn) {
        units.saveConfigBtn.addEventListener("click", () => {
            const configModel = {
                spear: Number(units.spear.value) || 0,
                sword: Number(units.sword.value) || 0,
                axe: Number(units.axe.value) || 0,
                archer: Number(units.archer.value) || 0,
                spy: Number(units.spy.value) || 0,
                light: Number(units.light.value) || 0,
                marcher: Number(units.marcher.value) || 0,
                heavy: Number(units.heavy.value) || 0,
                ram: Number(units.ram.value) || 0,
                catapult: Number(units.catapult.value) || 0,
                timeNextVillage: Number(units.timeNextVillage.value) || 120,
                barracksUnitsPerBatch: Number(units.barracksUnitsPerBatch.value) || 5,
                stableUnitsPerBatch: Number(units.stableUnitsPerBatch.value) || 3,
                workshopUnitsPerBatch: Number(units.workshopUnitsPerBatch.value) || 2,
                maxQueues: Number(units.maxQueues.value) || 3,
                autoResearch: units.autoResearch.checked,
                activateRecruitment: units.activateRecruitment.checked
            };

            localStorage.setItem(localStorageKey, JSON.stringify(configModel));
            
            UI.Notification.show(
                "https://th.bing.com/th/id/OIP.5R-ae5VM-10Ijm1Dxd7QdAHaHY?pid=Api&rs=1",
                'Done!',
                'Settings saved successfully!'
            );
            window.location.reload();
        });
    }

    getAutoRecruitLocalStorageConfigs(localStorageKey);
    
    if (units.activateRecruitment) {
        units.activateRecruitment.addEventListener("change", (event) => {
            if (event.target.checked) {
                getAutoRecruitLocalStorageConfigs(localStorageKey);
            }
        });
    }
}

// Main recruitment logic
const runScript = async () => {
    const recruitInputs = {
        spear: document.getElementById("spear_0"),
        sword: document.getElementById("sword_0"),
        axe: document.getElementById("axe_0"),
        archer: document.getElementById("archer_0"),
        spy: document.getElementById("spy_0"),
        light: document.getElementById("light_0"),
        marcher: document.getElementById("marcher_0"),
        heavy: document.getElementById("heavy_0"),
        ram: document.getElementById("ram_0"),
        catapult: document.getElementById("catapult_0")
    };

    const barracksUnitsPerBatch = Number(document.getElementById("barracksUnitsPerBatch")?.value) || 0;
    const stableUnitsPerBatch = Number(document.getElementById("stableUnitsPerBatch")?.value) || 0;
    const workshopUnitsPerBatch = Number(document.getElementById("workshopUnitsPerBatch")?.value) || 0;
    const maxQueues = Number(document.getElementById("maxQueues")?.value) || 0;
    const timeNextVillage = Number(document.getElementById("timeNextVillage")?.value) || 0;

    const recruitButton = document.querySelector(".btn.btn-recruit");
    if (!recruitButton) {
        console.error("Recruit button not found!");
        return;
    }

    const unitConfigs = [
        { name: "spear", userInputId: "spearNumber", actualMaxUnitInputId: "spear_0_a", batchValue: barracksUnitsPerBatch },
        { name: "sword", userInputId: "swordNumber", actualMaxUnitInputId: "sword_0_a", batchValue: barracksUnitsPerBatch },
        { name: "axe", userInputId: "axeNumber", actualMaxUnitInputId: "axe_0_a", batchValue: barracksUnitsPerBatch },
        { name: "archer", userInputId: "archerNumber", actualMaxUnitInputId: "archer_0_a", batchValue: barracksUnitsPerBatch },
        { name: "spy", userInputId: "spyNumber", actualMaxUnitInputId: "spy_0_a", batchValue: stableUnitsPerBatch },
        { name: "light", userInputId: "lightNumber", actualMaxUnitInputId: "light_0_a", batchValue: stableUnitsPerBatch },
        { name: "marcher", userInputId: "marcherNumber", actualMaxUnitInputId: "marcher_0_a", batchValue: stableUnitsPerBatch },
        { name: "heavy", userInputId: "heavyNumber", actualMaxUnitInputId: "heavy_0_a", batchValue: stableUnitsPerBatch },
        { name: "ram", userInputId: "ramNumber", actualMaxUnitInputId: "ram_0_a", batchValue: workshopUnitsPerBatch },
        { name: "catapult", userInputId: "catapultNumber", actualMaxUnitInputId: "catapult_0_a", batchValue: workshopUnitsPerBatch }
    ];

    // Loop through the available recruitment queues
    for (let i = 0; i < maxQueues; i++) {
        let shouldRecruit = false;

        // Process each unit in the configuration
        unitConfigs.forEach(unitConfig => {
            const targetInput = document.getElementById(unitConfig.userInputId);
            
            if (!targetInput) {
                return;
            }

            const targetValue = Number(targetInput.value) || 0;
            const maxUnitAllowed = getMaxUnitInputFromElement(document.getElementById(unitConfig.actualMaxUnitInputId));
            const actualQty = getUnitQuantity(unitConfig.name);
            const recruitInput = recruitInputs[unitConfig.name];

            if (shouldRecruitUnit(
                maxUnitAllowed,
                unitConfig.batchValue,
                recruitInput,
                actualQty,
                targetValue,
                unitConfig.name,
                maxQueues
            )
            ) {
                recruitInput.value = unitConfig.batchValue;
                shouldRecruit = true;
            }
        });

        if (shouldRecruit) {
            recruitButton.click();
        }

        // Wait for a random delay (up to 25 seconds) between queue iterations
        await delay(Math.random() * 25000);
    }

    // Wait the configured time before proceeding to the next village
    //await delayWithCountdown(timeNextVillage * 1000);
}

// Main initializer that ties everything together
const initScript = async () => {
    const localStorageKey = "auto-recruit-config";
    
    addScriptUiToBody();
    startUiScripts(localStorageKey);
    
    const shouldRunScript = document.getElementById("activateRecruitment")?.checked;
    if (shouldRunScript) {
        await runScript();
    }
    
    const timeToReloadPage = (Math.random() + 0.5) * 1200000;
    await delayWithCountdown(timeToReloadPage);
    
    window.location.reload();
}

await initScript();
