// Obtém a configuração do usuário do localStorage (default: false)
let SKIP_VILLAGES_WITH_WALL = localStorage.getItem('skipVillagesWithWall') === 'true';

// Cria o container de controle com o input para SKIP_VILLAGES_WITH_WALL e o elemento de contagem regressiva
const container = document.createElement('div');
container.id = 'userControlContainer';

// Cria o label e o input checkbox para controlar a opção
const skipWallLabel = document.createElement('label');
skipWallLabel.htmlFor = 'skipVillagesWithWallInput';
skipWallLabel.textContent = "Pular vilas com muralha:";

const skipWallInput = document.createElement('input');
skipWallInput.type = "checkbox";
skipWallInput.id = 'skipVillagesWithWallInput';
skipWallInput.checked = SKIP_VILLAGES_WITH_WALL;
skipWallInput.addEventListener('change', function() {
    SKIP_VILLAGES_WITH_WALL = skipWallInput.checked;
    localStorage.setItem('skipVillagesWithWall', SKIP_VILLAGES_WITH_WALL);
    console.log("[DEBUG] skipVillagesWithWall alterado para:", SKIP_VILLAGES_WITH_WALL);
});

// Cria o elemento que exibirá a contagem regressiva para o reload
const reloadCountdown = document.createElement('div');
reloadCountdown.id = 'nextReloadTime';

// Adiciona o label, o input e o elemento de contagem ao container
container.appendChild(skipWallLabel);
container.appendChild(skipWallInput);
container.appendChild(reloadCountdown);

// Insere o container acima do elemento da tela de fazenda
const farmScreenTableElement = document.getElementById("contentContainer");
if (farmScreenTableElement) {
    farmScreenTableElement.insertAdjacentElement('beforebegin', container);
}

// SmartFarm - fluxo de ataques
const SmartFarm = new function () {
    const templateTypes = {
        A: 'a',
        B: 'b',
    };

    const getTemplates = () => {
        console.log("[DEBUG] Obtendo templates da fazenda");
        return Accountmanager.farm.templates;
    };

    const getCurrentUnits = () => {
        console.log("[DEBUG] Obtendo unidades atuais disponíveis");
        return Accountmanager.farm.current_units;
    };

    const getNextVillageElement = () => {
        console.log("[DEBUG] Selecionando a próxima vila visível");
        return document.querySelector("tr[id^='village_']:not([style='display: none;'])");
    };

    const hasLootedAll = (villageElement) => {
        const lastLoot = villageElement.querySelector("img[src*='max_loot']");
        const lootedAll = lastLoot && lastLoot.getAttribute("src").endsWith("1.png");
        console.log(`[DEBUG] Verificando se a vila foi saqueada totalmente: ${lootedAll}`);
        return lootedAll;
    };

    const hasEnoughUnitsInTemplate = (template) => {
        console.log("[DEBUG] Verificando se há unidades suficientes para o template");
        const currentUnits = getCurrentUnits();
        for (const unitName in currentUnits) {
            if (Object.hasOwnProperty.call(currentUnits, unitName)) {
                const available = currentUnits[unitName];
                const required = template[unitName];
                if (required && available < required) {
                    console.log(`[DEBUG] Unidade ${unitName} insuficiente: disponível ${available}, necessário ${required}`);
                    return false;
                }
            }
        }
        return true;
    };

    const getWallLevel = (villageElement) => {
        console.log("[DEBUG] Obtendo nível da muralha da vila");
        return villageElement.querySelectorAll("td")[6].innerHTML;
    };

    const checkAndHideVillageWithWall = (villageElement) => {
        const wallLevel = getWallLevel(villageElement);
        if (wallLevel !== '?' && parseInt(wallLevel) > 0) {
            console.log("[DEBUG] Vila possui muralha ativa, ignorando-a");
            villageElement.style.display = 'none';
            return true;
        }
        return false;
    };

    const clickTemplate = (templateType, villageElement) => {
        console.log(`[DEBUG] Clicando no template ${templateType} para enviar ataque`);
        const selector = `a.farm_icon.farm_icon_${templateType}`;
        const templateLink = villageElement.querySelector(selector);
        if (templateLink) {
            templateLink.click();
        } else {
            console.log(`[DEBUG] Template ${templateType} não encontrado na vila`);
        }
    };

    const validateAndSendTemplate = (template, villageElement, templateType) => {
        if (hasEnoughUnitsInTemplate(template)) {
            clickTemplate(templateType, villageElement);
            return true;
        } else {
            console.log(`[DEBUG] Unidades insuficientes para template ${templateType}`);
        }
        return false;
    };

    // Atualização: utiliza delayWithCountdown para informar ao usuário o tempo restante para o reload
    const reloadPage = async () => {
        const reloadTime = randomInterval(240000, 780000);
        if (isCaptchaActive()) {
            throw new Error("Captcha on the screen.");
        }
        
        console.log(`[DEBUG] Página será recarregada em ${reloadTime / 1000} segundos`);
        await delayWithCountdown(reloadTime, 'nextReloadTime');
        setTimeout(() => {
            console.log("[DEBUG] Recarregando a página...");
            window.location.reload();
        }, reloadTime);
    };

    const sendAttack = async () => {
        console.log("[DEBUG] Iniciando envio de ataque");
        if (isCaptchaActive()) {
            throw new Error("Captcha on the screen.");
        }
        
        const templates = getTemplates();
        if (!templates) {
            console.log("[DEBUG] Templates não definidos, abortando envio de ataque");
            return;
        }
        
        const [templateA, templateB] = Object.values(templates);
        const villageElement = getNextVillageElement();
        if (villageElement) {
            if (SKIP_VILLAGES_WITH_WALL) {
                if (checkAndHideVillageWithWall(villageElement)) {
                    console.log("[DEBUG] Vila com muralha detectada, pulando envio de ataque");
                    return;
                }
            }
            if (hasLootedAll(villageElement)) {
                console.log("[DEBUG] Vila já saqueada, utilizando template B se possível");
                if (!validateAndSendTemplate(templateB, villageElement, templateTypes.B)) {
                    console.log("[DEBUG] Tentando template A, pois template B não atendeu aos requisitos");
                    validateAndSendTemplate(templateA, villageElement, templateTypes.A);
                }
            } else {
                console.log("[DEBUG] Vila não saqueada totalmente, utilizando template A");
                validateAndSendTemplate(templateA, villageElement, templateTypes.A);
            }
            const waitTime = randomInterval(250, 5000);
            console.log(`[DEBUG] Aguardando ${waitTime} milissegundos antes do próximo ataque`);
            await delay(waitTime);
        } else {
            console.log("[DEBUG] Nenhuma vila válida encontrada para ataque");
        }
    };

    this.init = async () => {
        console.log("[DEBUG] Inicializando SmartFarm");
        if (isCaptchaActive()) {
            throw new Error("Captcha on the screen.");
        }
        
        await reloadPage();
        setInterval(async () => {
            await sendAttack();
        }, randomInterval(200, 5600));
    };
};

// Evento que aguarda o carregamento total do DOM
window.addEventListener('load', async () => {
    console.log("[DEBUG] DOM totalmente carregado (SmartFarm)");
    if (isCaptchaActive()) {
        throw new Error("Captcha on the screen.");
    }
    
    if (typeof Accountmanager !== 'undefined' && Accountmanager.farm) {
        Accountmanager.farm.init();
        await SmartFarm.init();
        if (!SKIP_VILLAGES_WITH_WALL) {
            if (typeof startWallDemolisher === 'function') {
                console.log("[DEBUG] SKIP_VILLAGES_WITH_WALL é false, iniciando Wall Demolisher");
                startWallDemolisher(window.wallDemolisherSettings || {});
            } else {
                console.error("[DEBUG] Função startWallDemolisher não encontrada");
            }
        }
    } else {
        console.error("[DEBUG] Accountmanager ou farm não definidos");
    }
});
