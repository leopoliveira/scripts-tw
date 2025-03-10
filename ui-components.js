// Cria elementos checkbox para configuração de unidades
const createCheckbox = (labelText, id, isChecked) => {
    const container = document.createElement('div');
    container.style.margin = '5px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = isChecked;

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginLeft = '5px';

    container.appendChild(checkbox);
    container.appendChild(label);

    return container;
};

// Cria campos numéricos para configuração adicional
const createNumberInput = (labelText, id, defaultValue) => {
    const container = document.createElement('div');
    container.style.margin = '5px';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginRight = '5px';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultValue;
    input.style.width = '50px';

    container.appendChild(label);
    container.appendChild(input);

    return container;
};

// Cria UI completa para seleção e configuração das unidades
const renderRecruitmentConfigUI = (containerId) => {
    const unitLabels = {
        spear: 'Lança',
        sword: 'Espada',
        axe: 'Bárbaro',
        spy: 'Explorador',
        lightCavalry: 'Cavalaria Leve',
        heavyCavalry: 'Cavalaria Pesada',
        ram: 'Ariete',
        catapult: 'Catapulta',
    };

    const recruitFlags = loadRecruitFlags();
    const maxUnitsConfig = loadMaxUnitsConfig();
    const requiredSelectorsCount = loadRequiredSelectorsCount();

    const container = document.getElementById(containerId);
    container.innerHTML = '';

    Object.keys(unitLabels).forEach((key) => {
        const checkboxElement = createCheckbox(unitLabels[key], key, recruitFlags[key] || false);
        checkboxElement.querySelector('input').addEventListener('change', (e) => {
            recruitFlags[key] = e.target.checked;
            saveRecruitFlags(recruitFlags);
        });

        const maxUnitsInput = createNumberInput('Máx. unidades:', `max_${key}`, maxUnitsConfig[key] || 0);
        
        checkboxElement.appendChild(maxUnitsInput);
        
        maxUnitsInput.querySelector('input').addEventListener('change', (e) => {
            maxUnitsConfig[key] = parseInt(e.target.value, 10);
            saveMaxUnitsConfig(maxUnitsConfig);
        });

        const selectorCountInput = createNumberInput('Qtd. Seletores:', `selectors_${key}`, requiredSelectorsCount[key] || 1);
        selectorCountInput.querySelector('input').addEventListener('change', (e) => {
            requiredSelectorsCount[key] = parseInt(e.target.value, 10);
            saveRequiredSelectorsCount(requiredSelectorsCount);
        });

        container.appendChild(checkboxElement);
        container.appendChild(maxUnitsInput);
        container.appendChild(selectorCountInput);
    });
};
