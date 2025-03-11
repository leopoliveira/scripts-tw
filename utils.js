//Salva as flags de recrutamento no localStorage.
const saveRecruitFlags = (flags) => localStorage.setItem('recruitFlags', JSON.stringify(flags));

//Carrega as flags de recrutamento do localStorage.
const loadRecruitFlags = () => JSON.parse(localStorage.getItem('recruitFlags')) || {};

//Salva as flags de coleta no localStorage.
const saveScavengeFlags = (flags) => localStorage.setItem('scavengeFlags', JSON.stringify(flags));

//Carrega as flags de coleta do localStorage.
const loadScavengeFlags = () => JSON.parse(localStorage.getItem('scavengeFlags')) || {};

//Salva a configuração de quantidade máxima de unidades no localStorage.
const saveMaxUnitsConfig = (config) => localStorage.setItem('maxUnitsConfig', JSON.stringify(config));

//Carrega a configuração de quantidade máxima de unidades do localStorage.
const loadMaxUnitsConfig = () => JSON.parse(localStorage.getItem('maxUnitsConfig')) || {};

//Salva a configuração de quantidade de unidades reservas para não coletar no localStorage.
const saveScavengeReservedUnitsConfig = (config) => localStorage.setItem('scavengeReserveUnitsConfig', JSON.stringify(config));

//Carrega a configuração de quantidade reservada de unidades para não coletar do localStorage.
const loadScavengeReservedUnitsConfig = () => JSON.parse(localStorage.getItem('scavengeReserveUnitsConfig')) || {};

//Salva a configuração do número mínimo de seletores exigidos no localStorage.
const saveRequiredSelectorsCount = (config) => localStorage.setItem('requiredSelectorsCount', JSON.stringify(config));

//Carrega a configuração do número mínimo de seletores exigidos do localStorage.
const loadRequiredSelectorsCount = () => JSON.parse(localStorage.getItem('requiredSelectorsCount')) || {};

//Obtém a quantidade disponível de uma unidade a partir do seu ID.
const getAvailableUnits = (unitName) => {
    const anchor = document.getElementById(`${unitName}_0_a`);
    if (anchor) {
        const match = anchor.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
};

//Obtém a contagem atual de unidades existentes.
const getCurrentUnitsCount = (unitName) => {
    const anchor = document.querySelector(`#train_form a[data-unit="${unitName}"]`);
    if (anchor) {
        const row = anchor.closest('tr');
        if (row && row.cells.length > 2) {
            const unitCountText = row.cells[2].textContent;
            const match = unitCountText.match(/\/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        }
    }
    return 0;
};

//Helper: Verifica se um texto está no formato válido HH:MM.
const isValidHourMinutesFormat = (text) => {
    const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
    return timePattern.test(text);
};

//Helper: Converte uma string de tempo no formato HH:MM:SS para milissegundos.
const timeStringToMilliseconds = (timeString) => {
    if (!timeString) return 0;
    const parts = timeString.split(':').map(Number);
    if (parts.length !== 3) return 0;
    const [hours, minutes, seconds] = parts;
    return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
};

//Helper: Simula o pressionamento da tecla ESC.
const simulateEscKeyPress = () => {
    const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27, // Legacy, mantido para compatibilidade
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(escEvent);
};

//Helper: Verifica se um elemento captcha está ativo na página.
const isCaptchaActive = (selector = ".captcha") => {
    return document.querySelector(selector) !== null ||
        document.querySelector("#botprotection_quest") !== null ||
        document.querySelector("#popup_box_bot_protection") !== null;
};

//Helper: Formata milissegundos no formato MM:SS.
const formatTimeInMinutesSeconds = (remainingMs) => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

//elper: Cria uma contagem regressiva que atualiza um elemento HTML.
const delayWithCountdown = (ms, elementId = "nextExecutionTime") => {
    return new Promise(resolve => {
        const endTime = Date.now() + ms;
        const interval = setInterval(() => {
            const remaining = Math.max(endTime - Date.now(), 0);
            const countDownElement = document.getElementById(elementId);
            if (countDownElement) {
                countDownElement.textContent = `Próxima execução em: ${formatTimeInMinutesSeconds(remaining)}`;
            }
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);
        setTimeout(() => {
            clearInterval(interval);
            resolve();
        }, ms);
    });
};

//Helper: Função delay baseada em Promise.
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//Geração de intervalo aleatório entre min e max (inclusive).
const randomInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//Geração de elemento de controle para reiniciar a tela, caso o script não seja carregado corretamente.
const insertForceReloadElement = () => {
    const container = document.createElement('div');
    container.id = "script-force-reload";
    document.body.appendChild(container);
}
