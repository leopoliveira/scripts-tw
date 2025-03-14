// Flags para coleta.
const scavengeFlags = loadScavengeFlags();

// Unidades reservadas para não coletar.
const reservedUnitsConfig = loadScavengeReservedUnitsConfig();

const waitReturnAndReload = async () => {
    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }

    const currentScavengeRemainingTime = timeStringToMilliseconds(document.querySelector(".return-countdown")?.textContent || "10:00");
    const remainingTime = currentScavengeRemainingTime + 90000;
    console.log(`[DEBUG] Esperando por: ${remainingTime}ms`);

    await delayWithCountdown(remainingTime, 'nextReloadTime');

    window.location.reload();
}

// Pesos predefinidos para cada opção de scavenge.
const scavengeWeights = [15, 6, 3, 2];

// Unidades excluídas da coleta.
const excludedUnits = ["knight", "light", "spy", "ram", "catapult"];

// Retorna a quantidade de scavenge bloqueados.
function getBlockedScavengeCount() {
    const count = document.getElementsByClassName("unlock-button").length;
    const unlocking = document.getElementsByClassName("unlock-countdown").length || 0;
    console.log(`[DEBUG] Scavenge bloqueados: ${count}`);
    return count + unlocking;
}

// Retorna os botões disponíveis para enviar scavenge.
function getAvailableScavengeButtons() {
    const buttons = document.getElementsByClassName("free_send_button");
    console.log(`[DEBUG] Botões disponíveis para scavenge: ${buttons.length}`);
    return buttons;
}

// Calcula o peso total disponível para scavenge, descontando as opções bloqueadas.
function getTotalAvailableScavengeWeight() {
    const blockedCount = getBlockedScavengeCount();
    let availableWeights = scavengeWeights;
    if (blockedCount > 0) {
        availableWeights = availableWeights.slice(0, -blockedCount);
        console.log(`[DEBUG] Pesos disponíveis após considerar bloqueios: ${availableWeights}`);
    } else {
        console.log(`[DEBUG] Todos os pesos disponíveis: ${availableWeights}`);
    }
    const totalWeight = availableWeights.reduce((sum, weight) => sum + weight, 0);
    console.log(`[DEBUG] Peso total disponível: ${totalWeight}`);
    return totalWeight;
}

// Obtém as tropas disponíveis, excluindo as unidades que não devem ser enviadas.
function getAvailableTroops() {
    const availableTroops = [];
    const troopElements = document.getElementsByClassName("units-entry-all");

    console.log(`[DEBUG] Encontradas ${troopElements.length} entradas de tropas.`);
    for (const element of troopElements) {
        const unitType = element.getAttribute("data-unit");
        const shouldUseUnit = scavengeFlags[unitType] || false;
        
        if (!excludedUnits.includes(unitType) && shouldUseUnit) {
            const quantity = parseInt(
                element.textContent.replace("(", "").replace(")", ""),
                10
            );
            const unitsReserved = reservedUnitsConfig[unitType] || 0;
            const unitsToSend = quantity - unitsReserved;
            
            if (unitsToSend <= 0) {
                console.log(`[DEBUG] Unidade: ${unitType} não enviada pois o número de tropas reservas é maior do que o número de unidades disponíveis`);
                continue;
            }
            
            console.log(`[DEBUG] Unidade encontrada: ${unitType} com quantidade: ${quantity}, com ${unitsReserved} unidades reservadas`);
            availableTroops.push({
                unit: unitType,
                quantity: unitsToSend,
            });
        } else {
            console.log(`[DEBUG] Unidade ${unitType} excluída do envio.`);
        }
    }
    return availableTroops;
}

// Calcula quantas tropas enviar para uma opção de scavenge com base no peso da opção.
function calculateTroopsForScavenge(scavengeOptionWeight, troops, isLastCalc) {
    const totalWeight = getTotalAvailableScavengeWeight();
    const troopsAllocation = [];
    console.log(`[DEBUG] Calculando alocação de tropas para opção com peso ${scavengeOptionWeight} e totalWeight ${totalWeight}`);

    for (const troop of troops) {
        let quantityToSend = Math.floor((troop.quantity * scavengeOptionWeight) / totalWeight);
        
        if (isLastCalc) {
            quantityToSend++;
        } 
        
        console.log(`[DEBUG] Unidade ${troop.unit}: (${troop.quantity} * ${scavengeOptionWeight}) / ${totalWeight} = ${quantityToSend}`);
        troopsAllocation.push({
            unit: troop.unit,
            quantityToSend: quantityToSend,
        });
    }
    return troopsAllocation;
}

// Preenche os campos de envio de tropas e dispara o envio do scavenge.
function sendScavenge(scavengeOptionWeight, troops, buttonElement, isLastCalc) {
    const troopsAllocation = calculateTroopsForScavenge(scavengeOptionWeight, troops, isLastCalc);
    console.log(`[DEBUG] Enviando scavenge para opção com peso ${scavengeOptionWeight}. Alocação:`, troopsAllocation);

    for (const allocation of troopsAllocation) {
        if (allocation.quantityToSend > 0) {
            const inputElement = document.querySelector(`[name="${allocation.unit}"]`);
            if (inputElement) {
                inputElement.value = allocation.quantityToSend.toString();
                inputElement.dispatchEvent(new Event("change", { bubbles: true }));
                console.log(`[DEBUG] Unidade ${allocation.unit}: input preenchido com ${allocation.quantityToSend}.`);
            } else {
                console.error(`[DEBUG] Input para a unidade ${allocation.unit} não foi encontrado.`);
            }
        } else {
            console.log(`[DEBUG] Unidade ${allocation.unit}: quantidade a enviar é 0, sem preenchimento.`);
        }
    }
    console.log(`[DEBUG] Clicando no botão de envio do scavenge.`);
    buttonElement.click();
}

// Função de inicialização do scavengeManager.
async function initScavengeManager() {
    // Verifica se há captcha ativo (supondo que isCaptchaActive esteja definida)
    if (isCaptchaActive()) {
        console.warn("[DEBUG] Captcha ativo, aguardando resolução.");
        return;
    }

    const availableTroops = getAvailableTroops();
    console.log(`[DEBUG] Tropas disponíveis para scavenge:`, availableTroops);
    
    if (!availableTroops.length) {
        console.log(`[DEBUG] Não há tropas disponíveis para coletar no momento`);

        await waitReturnAndReload();
    }

    const availableButtons = getAvailableScavengeButtons();
    const blockedCount = getBlockedScavengeCount();
    console.log(`[DEBUG] Número de scavenge bloqueados: ${blockedCount}`);

    const unlockedOptions = scavengeWeights.length - blockedCount;
    console.log(`[DEBUG] Número de opções desbloqueadas: ${unlockedOptions}`);

    if (availableButtons.length >= unlockedOptions) {
        for (let index = 0; index < availableButtons.length; index++) {
            const optionWeight = scavengeWeights[index];
            const buttonElement = availableButtons[index];
            const delayTime = randomInterval(1000, 6000 * availableButtons.length);
            const lastCalc = (index + 1) === availableButtons.length;
            
            console.log(`[DEBUG] Agendando envio para opção com peso ${optionWeight} em ${delayTime}ms.`);
            setTimeout(() => {
                sendScavenge(optionWeight, availableTroops, buttonElement, lastCalc);
            }, delayTime);
        }
    } else {
        console.warn("[DEBUG] Não há botões suficientes para as opções desbloqueadas de scavenge.");
    }

    await waitReturnAndReload();
}

window.addEventListener('load', async () => {
    setTimeout(async () => {
        if (isCaptchaActive()) {
            console.warn("[DEBUG] Captcha ativo, aguardando resolução.");
            return;
        }

        insertForceReloadElement();

        console.log("[DEBUG] Inicializando o scavengeManager...");
        const scriptContainerId = 'scavenge-config-container';

        const container = document.createElement('div');
        container.id = scriptContainerId;

        const scavengeScreenTableElement = document.getElementById("contentContainer");
        scavengeScreenTableElement.insertAdjacentElement('beforebegin', container);

        renderScavengeConfigUI(scriptContainerId, scavengeFlags, reservedUnitsConfig, excludedUnits);

        const reloadCountdown = document.createElement('div');
        reloadCountdown.id = 'nextReloadTime';
        container.appendChild(reloadCountdown);

        await initScavengeManager();
    }, 5000);
});