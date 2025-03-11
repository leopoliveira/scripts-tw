const unitData = [
    { key: 'spear',       label: 'Lança',           img: 'graphic/unit/recruit/spear.png' },
    { key: 'sword',       label: 'Espada',          img: 'graphic/unit/recruit/sword.png' },
    { key: 'axe',         label: 'Bárbaro',         img: 'graphic/unit/recruit/axe.png' },
    { key: 'archer',      label: 'Arqueiro',        img: 'graphic/unit/recruit/archer.png' },
    { key: 'spy',         label: 'Explorador',      img: 'graphic/unit/recruit/spy.png' },
    { key: 'lightCavalry',label: 'Cavalaria Leve',  img: 'graphic/unit/recruit/light.png' },
    { key: 'marcher',     label: 'Cav. Arqueira',   img: 'graphic/unit/recruit/marcher.png' },
    { key: 'heavyCavalry',label: 'Cavalaria Pesada',img: 'graphic/unit/recruit/heavy.png' },
    { key: 'ram',         label: 'Ariete',          img: 'graphic/unit/recruit/ram.png' },
    { key: 'catapult',    label: 'Catapulta',       img: 'graphic/unit/recruit/catapult.png' },
];

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

// Função para injetar estilos no <head> (evita duplicar se já existir)
function injectCustomStyles() {
    const existingStyle = document.getElementById('customScriptStyles');
    if (existingStyle) return; // Já foi injetado antes

    const style = document.createElement('style');
    style.id = 'customScriptStyles';
    style.textContent = `
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
    `;
    document.head.appendChild(style);
}

// Generic function to render a table with header and dynamic rows
function renderUnitsTable(containerId, rowGenerators, options = {}) {
    // Inject custom styles if not already present
    injectCustomStyles();

    // Get container, clear previous content, and add styling class
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.classList.add('customScriptClass');

    // Create table and header row with unit icons
    const unitsTable = document.createElement('table');
    unitsTable.className = 'units-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    unitData.forEach((unit) => {
        // Optionally skip excluded units if provided
        if (options.excludedUnits && options.excludedUnits.includes(unit.key)) {
            return;
        }
        const th = document.createElement('th');
        const img = document.createElement('img');
        img.src = unit.img;
        img.alt = unit.label;
        th.appendChild(img);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    unitsTable.appendChild(thead);

    // Create tbody and fill each row using the provided row generator functions
    const tbody = document.createElement('tbody');
    rowGenerators.forEach((rowGen) => {
        const row = document.createElement('tr');
        unitData.forEach((unit) => {
            if (options.excludedUnits && options.excludedUnits.includes(unit.key)) {
                return;
            }
            const td = document.createElement('td');
            // Each row generator creates its own cell content for a given unit
            td.appendChild(rowGen(unit));
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    // Append tbody to table and table to container
    unitsTable.appendChild(tbody);
    container.appendChild(unitsTable);
}

// Recruitment config UI using the generic renderer
function renderRecruitmentConfigUI(containerId) {
    const recruitFlags = loadRecruitFlags();
    const maxUnitsConfig = loadMaxUnitsConfig();
    const requiredSelectorsCount = loadRequiredSelectorsCount();

    // Define row generators for recruitment:
    const recruitmentRows = [
        // Row 1: Checkbox row
        (unit) => {
            const checkboxElement = createCheckbox("", unit.key, recruitFlags[unit.key] || false);
            checkboxElement.querySelector('input').addEventListener('change', (e) => {
                recruitFlags[unit.key] = e.target.checked;
                saveRecruitFlags(recruitFlags);
            });
            return checkboxElement;
        },
        // Row 2: Maximum units row
        (unit) => {
            const inputElement = createNumberInput("Máx. unidades:", `max_${unit.key}`, maxUnitsConfig[unit.key] || 0);
            inputElement.querySelector('input').addEventListener('change', (e) => {
                maxUnitsConfig[unit.key] = parseInt(e.target.value, 10);
                saveMaxUnitsConfig(maxUnitsConfig);
            });
            return inputElement;
        },
        // Row 3: Queue count row
        (unit) => {
            const inputElement = createNumberInput("Qtd. Fila:", `selectors_${unit.key}`, requiredSelectorsCount[unit.key] || 1);
            inputElement.querySelector('input').addEventListener('change', (e) => {
                requiredSelectorsCount[unit.key] = parseInt(e.target.value, 10);
                saveRequiredSelectorsCount(requiredSelectorsCount);
            });
            return inputElement;
        }
    ];

    // No units are excluded for recruitment; pass an empty options object
    renderUnitsTable(containerId, recruitmentRows);
}

// Scavenge config UI using the generic renderer
function renderScavengeConfigUI(containerId, scavengeFlags, reservedUnitsConfig, excludedUnits) {
    // Define row generators for scavenge:
    const scavengeRows = [
        // Row 1: Checkbox row for scavenge
        (unit) => {
            const checkboxElement = createCheckbox("", unit.key, scavengeFlags[unit.key] || false);
            checkboxElement.querySelector('input').addEventListener('change', (e) => {
                scavengeFlags[unit.key] = e.target.checked;
                saveScavengeFlags(scavengeFlags);
            });
            return checkboxElement;
        },
        // Row 2: Reserved units row
        (unit) => {
            const inputElement = createNumberInput("Unidades Reservadas:", `reserved_${unit.key}`, reservedUnitsConfig[unit.key] || 0);
            inputElement.querySelector('input').addEventListener('change', (e) => {
                reservedUnitsConfig[unit.key] = parseInt(e.target.value, 10);
                saveScavengeReservedUnitsConfig(reservedUnitsConfig);
            });
            return inputElement;
        }
    ];

    // Assume that for scavenge some units might be excluded; pass the array if needed
    renderUnitsTable(containerId, scavengeRows, { excludedUnits });
}