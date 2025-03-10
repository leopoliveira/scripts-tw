// Carregar e salvar flags de recrutamento
const saveRecruitFlags = (flags) => localStorage.setItem('recruitFlags', JSON.stringify(flags));

const loadRecruitFlags = () => JSON.parse(localStorage.getItem('recruitFlags')) || {};

// Carregar e salvar quantidade máxima de unidades
const saveMaxUnitsConfig = (config) => localStorage.setItem('maxUnitsConfig', JSON.stringify(config));

const loadMaxUnitsConfig = () => JSON.parse(localStorage.getItem('maxUnitsConfig')) || {};

// Carregar e salvar número mínimo de seletores exigidos
const saveRequiredSelectorsCount = (config) => localStorage.setItem('requiredSelectorsCount', JSON.stringify(config));

const loadRequiredSelectorsCount = () => JSON.parse(localStorage.getItem('requiredSelectorsCount')) || {};

// Obtém unidades disponíveis
const getAvailableUnits = (unitName) => {
    const anchor = document.getElementById(`${unitName}_0_a`);
    if (anchor) {
        const match = anchor.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
};

// Obtém a contagem atual de unidades existentes
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

// Helper: Check if text is a valid HH:MM format
const isValidHourMinutesFormat = (text) => {
    const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
    return timePattern.test(text);
};

// Helper: Convert time string HH:MM:SS to milliseconds
const timeStringToMilliseconds = (timeString) => {
    if (!timeString) return 0;

    const parts = timeString.split(':').map(Number);
    if (parts.length !== 3) return 0;

    const [hours, minutes, seconds] = parts;

    return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
};

// Helper: Simulate ESC key pressed event
const simulateEscKeyPress = () => {
    const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,     // Legacy, mantido por compatibilidade
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(escEvent);
};

// Helper: Check if captcha element is active on the screen
const isCaptchaActive = (selector = ".captcha") => {
    return document.querySelector(selector) !== null;
};

// Helper: Format milliseconds into MM:SS format
const formatTimeInMinutesSeconds = (remainingMs) => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${minutes}:${seconds}`;
};

// Helper: Countdown delay (promise-based) updating HTML element by ID
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

// Helper: Simple delay promise-based function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Geração de intervalo aleatório
function randomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
