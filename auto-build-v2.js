// Código com múltiplos templates, seleção por vila, logs detalhados e fila compacta
window.addEventListener('load', function() {
    setTimeout(function() {
        console.log("[DEBUG] Script AutoBuilder iniciado após delay de 5000ms");

        let templates = JSON.parse(localStorage.getItem('buildingTemplates') || '[]');
        let villageTemplates = JSON.parse(localStorage.getItem('villageTemplates') || '{}');
        let queueLengths = JSON.parse(localStorage.getItem('queueLengths') || '{}');
        let currentTemplate;
        let scriptStatus = false;
        let isBuilding = false;

        function getCurrentLevel(buildingName) {
            let elem = document.querySelector(`#main_buildrow_${buildingName} td.build_options a.btn-build`);
            if (elem) {
                return (parseInt(elem.dataset.levelNext) || 1) - 1;
            }
            return 0;
        }

        let buildingQueue = [];

        function updateQueueDisplay() {
            const table = document.getElementById("autoBuilderTable");
            table.innerHTML = '';
            if(buildingQueue.length) {
                let row = document.createElement("tr");
                let tdBuilding = document.createElement("td");
                tdBuilding.textContent = "Atual: " + buildingQueue[0] + ", próximo: " + buildingQueue[1];
                row.appendChild(tdBuilding);
                table.appendChild(row);
                console.log(`[DEBUG] Próximo edifício a construir: ${buildingQueue[0]} e depois ${buildingQueue[1]}`);
            }
        }

        function loadBuildingsFromTemplate(template) {
            buildingQueue = [];
            console.log(`[DEBUG] Carregando template: ${template.name}`);

            template.buildings.forEach(([name, level]) => {
                const currentLevel = getCurrentLevel(name);
                if (currentLevel < level) {
                    const buildsNeeded = level - currentLevel;
                    for (let i = 0; i < buildsNeeded; i++) {
                        buildingQueue.push(name);
                    }
                } else {
                    console.log(`[DEBUG] Edifício ${name} já no nível desejado (${level}).`);
                }
            });

            updateQueueDisplay();
        }

        function init() {
            const container = document.getElementById("contentContainer");

            container.insertAdjacentHTML('beforebegin', `
                <textarea id="jsonInput" style="width:300px;height:100px;" placeholder='Cole aqui os templates JSON'></textarea>
                <br/>
                <br/>
                <button id="saveTemplatesBtn" class="btn">Salvar Templates</button>
                <select id="templateSelector"></select>
                <br/>
                <br/>
                <button id="applyTemplateBtn" class="btn">Aplicar Template</button>
                <div id="jsonFeedback" style="margin-top:5px;"></div>
                <span>
                    Comprimento da fila: <input id="queueLengthInput" type="number" style="width:40px;" min="1">
                    <button id="queueLengthBtn" class="btn">Salvar</button>
                </span>
                <br/>
                <br/>
                <table id="autoBuilderTable"></table>
                <button id="startBuildingScript" class="btn">Start</button>
                <br/>
                <br/>
            `);

            function updateTemplateSelector() {
                const selector = document.getElementById("templateSelector");
                selector.innerHTML = templates.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
                console.log("[DEBUG] Template selector atualizado.");
            }

            document.getElementById("saveTemplatesBtn").addEventListener("click", () => {
                try {
                    templates = JSON.parse(document.getElementById("jsonInput").value);
                    localStorage.setItem('buildingTemplates', JSON.stringify(templates));
                    updateTemplateSelector();
                    document.getElementById("jsonFeedback").textContent = "Templates salvos com sucesso!";
                    document.getElementById("jsonFeedback").style.color = "blue";
                    console.log("[DEBUG] Templates salvos no localStorage.");
                } catch(e) {
                    document.getElementById("jsonFeedback").textContent = "Erro: " + e.message;
                    document.getElementById("jsonFeedback").style.color = "red";
                }
            });

            document.getElementById("queueLengthBtn").addEventListener("click", () => {
                const length = parseInt(document.getElementById("queueLengthInput").value) || 1;
                queueLengthInput.value = length;
                queueLength = length;
                queueLengthInput.value = queueLength;
                localStorage.setItem('queueLengths', JSON.stringify(queueLength));
                queueLengthInput.value = queueLength;
                queueLengthInput.value = length;
                queueLength = length;
                queueLengthInput.value = queueLength;
                queueLength = length;
                queueLengthInput.value = queueLength;
                queueLength = length;
                queueLengthInput.value = queueLength;
                queueLength = length;
                queueLengthInput.value = queueLength;
                queueLength = length;
                queueLengthInput.value = queueLength;
                queueLengthInput.value = queueLength;
                queueLengths[game_data.village.id] = length;
                localStorage.setItem('queueLengths', JSON.stringify(queueLengths));
                console.log(`[DEBUG] Comprimento da fila salvo: ${length}`);
            });

            document.getElementById("applyTemplateBtn").addEventListener("click", () => {
                const selectedTemplateName = document.getElementById("templateSelector").value;
                const selectedTemplate = templates.find(t => t.name === selectedTemplateName);
                if(selectedTemplate) {
                    villageTemplates[game_data.village.id] = selectedTemplateName;
                    localStorage.setItem('villageTemplates', JSON.stringify(villageTemplates));
                    loadBuildingsFromTemplate(selectedTemplate);
                    console.log(`[DEBUG] Template ${selectedTemplateName} aplicado à vila ${game_data.village.id}`);
                }
            });

            document.getElementById("startBuildingScript").addEventListener("click", function () {
                scriptStatus = !scriptStatus;
                this.innerText = scriptStatus ? "Stop" : "Start";
                console.log(`[DEBUG] Script status alterado: ${scriptStatus ? "Iniciado" : "Parado"}`);
                if (scriptStatus) startScript();
            });

            updateTemplateSelector();

            if(villageTemplates[game_data.village.id]){
                const templateName = villageTemplates[game_data.village.id];
                const savedTemplate = templates.find(t => t.name === templateName);
                if(savedTemplate) {
                    console.log(`[DEBUG] Carregando template salvo (${templateName}) para a vila ${game_data.village.id}`);
                    loadBuildingsFromTemplate(savedTemplate);
                }
            }

            document.getElementById("queueLengthInput").value = queueLengths[game_data.village.id] || 2;
        }

        function startScript() {
            setInterval(function () {
                if (!isBuilding && scriptStatus && buildingQueue.length) {
                    isBuilding = true;
                    buildBuilding(buildingQueue.shift());
                    updateQueueDisplay();
                }
            }, 1000);
        }

        function buildBuilding(building) {
            console.log(`[DEBUG] Iniciando construção: ${building}`);
            setTimeout(() => window.location.reload(), Math.random() * 500 + 500);
        }

        init();
    }, 5000);
});
