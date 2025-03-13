// Código de automação de construção com template JSON, textarea para importação e seleção de template
window.addEventListener('load', function() {
    setTimeout(function() {
        console.log("Script AutoBuilder iniciado após delay de 5000ms");

        // Variáveis globais
        let buildingObject;
        let scriptStatus = false; // false = script parado, true = script em execução
        let isBuilding = false; // Garante que não sejam enviadas ordens duplicadas
        let selectedTemplate = null;

        // Função fábrica que cria o objeto de fila de construção
        function createBQueue(queue, queueLength) {
            return {
                buildingQueue: queue, // cada item é um objeto { construction, level }
                buildingQueueLength: queueLength,
                displayNext: function(parent) {
                    // Mostra somente o primeiro da fila, se existir
                    if (this.buildingQueue.length > 0) {
                        let buildingObj = this.buildingQueue[0];
                        let row = document.createElement("tr");
                        let tdInfo = document.createElement("td");
                        tdInfo.textContent = `${buildingObj.construction} (Level ${buildingObj.level})`;
                        row.appendChild(tdInfo);
                        parent.innerHTML = ""; // limpa UI
                        parent.appendChild(row);
                    } else {
                        parent.innerHTML = "<tr><td>Fila vazia</td></tr>";
                    }
                },
                removeFirst: function() {
                    this.buildingQueue.shift();
                    updateLocalStorage();
                }
            };
        }

        // Atualiza o localStorage com o objeto de construção para a vila atual
        function updateLocalStorage() {
            let storageObj = localStorage.buildingObject ? JSON.parse(localStorage.buildingObject) : {};
            storageObj[game_data.village.id] = buildingObject;
            localStorage.buildingObject = JSON.stringify(storageObj);
            console.log("localStorage atualizado para a vila " + game_data.village.id);
        }

        // Função para importar template JSON a partir do textarea
        function importTemplate(jsonText) {
            try {
                let templates = JSON.parse(jsonText);
                localStorage.buildingTemplates = JSON.stringify(templates);
                console.log("Templates importados com sucesso.");
                // Define o template selecionado para a vila atual (nesse exemplo, usamos o primeiro)
                localStorage['templateSelected_' + game_data.village.id] = templates[0].name;
            } catch (e) {
                console.error("Erro ao importar template: ", e);
            }
        }

        // Função para carregar o template selecionado para a vila atual
        function loadTemplateForVillage() {
            let templates = localStorage.buildingTemplates ? JSON.parse(localStorage.buildingTemplates) : [];
            let templateName = localStorage['templateSelected_' + game_data.village.id];
            if (templates.length > 0 && templateName) {
                let found = templates.find(t => t.name === templateName);
                if (found) {
                    selectedTemplate = found;
                    return found.buildings; // cada item: { construction, level }
                }
            }
            return [];
        }

        // Função para popular o select de templates com os templates salvos
        function updateTemplateSelect() {
            let templateSelect = document.getElementById("templateSelect");
            templateSelect.innerHTML = ""; // limpa opções atuais
            let templates = localStorage.buildingTemplates ? JSON.parse(localStorage.buildingTemplates) : [];
            if (templates.length > 0) {
                templates.forEach(t => {
                    let option = document.createElement("option");
                    option.value = t.name;
                    option.textContent = t.name;
                    templateSelect.appendChild(option);
                });
                // Define o template selecionado para a vila atual se existir
                let storedTemplate = localStorage['templateSelected_' + game_data.village.id];
                if (storedTemplate) {
                    templateSelect.value = storedTemplate;
                } else {
                    // Se não houver, usa o primeiro template
                    templateSelect.value = templates[0].name;
                    localStorage['templateSelected_' + game_data.village.id] = templates[0].name;
                }
            } else {
                let option = document.createElement("option");
                option.value = "";
                option.textContent = "Nenhum template importado";
                templateSelect.appendChild(option);
            }
        }

        // Função para extrair o nível atual do edifício, independentemente do idioma
        function getCurrentLevel(buildingName) {
            let row = document.querySelector(`#main_buildrow_${buildingName}`);
            if (!row) return 0;
            let firstTd = row.querySelector("td:first-child");
            if (!firstTd) return 0;
            let text = firstTd.textContent;
            let match = text.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }

        // Verifica se o edifício já está totalmente construído
        function isBuildingCompleted(buildingName) {
            let row = document.querySelector(`#main_buildrow_${buildingName}`);
            if (!row) return false;
            let secondTd = row.querySelector("td:nth-child(2)");
            return secondTd && secondTd.classList.contains("inactive") && secondTd.classList.contains("center");
        }

        // Inicializa a interface e os dados do auto-builder
        function init() {
            console.log("Inicializando auto-builder com template");
            const screenTableElement = document.getElementById("contentContainer");
            let newDiv = document.createElement("div");

            // Monta a UI com textarea para importação do template e select para escolher o template
            let newTable = '<table id="autoBuilderTable">' +
                '<tr>' +
                '<td><button id="toggleTemplateTextarea" class="btn">Importar Template</button></td>' +
                '<td><button id="startBuildingScript" class="btn">Start</button></td>' +
                '</tr>' +
                '<tr>' +
                '<td colspan="2">' +
                '<div id="templateArea" style="display: none;">' +
                '<textarea id="templateTextarea" rows="10" cols="50" placeholder="Cole o JSON do template aqui"></textarea><br>' +
                '<button id="saveTemplateBtn" class="btn">Salvar Template</button>' +
                '</div>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td colspan="2">' +
                '<label for="templateSelect">Selecionar Template: </label>' +
                '<select id="templateSelect"></select>' +
                '</td>' +
                '</tr>' +
                '<tr id="templateDisplay"><td>Próxima construção: --</td></tr>' +
                '</table>';

            newDiv.innerHTML = newTable;
            // Insere a nova UI antes do elemento contentContainer
            screenTableElement.insertAdjacentElement('beforebegin', newDiv);

            // Atualiza o select de templates
            updateTemplateSelect();

            let premiumBQueueLength = game_data.features.Premium.active ? 5 : 2;
            let storedQueue = loadTemplateForVillage();
            if (localStorage.buildingObject) {
                let storageObj = JSON.parse(localStorage.buildingObject);
                if (storageObj[game_data.village.id]) {
                    buildingObject = createBQueue(storageObj[game_data.village.id].buildingQueue, premiumBQueueLength);
                    console.log("Fila carregada do localStorage para a vila " + game_data.village.id);
                } else {
                    buildingObject = createBQueue(storedQueue, premiumBQueueLength);
                    storageObj[game_data.village.id] = buildingObject;
                    localStorage.buildingObject = JSON.stringify(storageObj);
                    console.log("Fila inicializada para nova vila " + game_data.village.id);
                }
            } else {
                buildingObject = createBQueue(storedQueue, premiumBQueueLength);
                let newStorage = {};
                newStorage[game_data.village.id] = buildingObject;
                localStorage.buildingObject = JSON.stringify(newStorage);
                console.log("Criado novo objeto no localStorage");
            }

            // Atualiza a UI para mostrar a próxima construção
            let templateDisplay = document.getElementById("templateDisplay");
            buildingObject.displayNext(templateDisplay);

            addEventListeners();

            if (localStorage.scriptStatus) {
                scriptStatus = JSON.parse(localStorage.scriptStatus);
                if (scriptStatus) {
                    document.getElementById("startBuildingScript").innerText = "Stop";
                    startScript();
                }
            }
        }

        // Inicia o script de automação das construções
        function startScript() {
            console.log("Iniciando automação de construção com template");
            setInterval(function () {
                let btn = document.querySelector(".btn-instant-free");
                if (btn && btn.style.display !== "none") {
                    btn.click();
                    console.log("Botão de ação instantânea clicado");
                }
                if (buildingObject.buildingQueue.length > 0) {
                    let nextBuild = buildingObject.buildingQueue[0]; // Objeto { construction, level }
                    if (isBuildingCompleted(nextBuild.construction)) {
                        console.log(nextBuild.construction + " já está totalmente construído. Removendo da fila.");
                        buildingObject.removeFirst();
                        document.getElementById("templateDisplay").innerHTML = "";
                        buildingObject.displayNext(document.getElementById("templateDisplay"));
                        return;
                    }
                    let currentLevel = getCurrentLevel(nextBuild.construction);
                    if (currentLevel >= nextBuild.level) {
                        console.log("Nível atual (" + currentLevel + ") maior ou igual ao requerido (" + nextBuild.level + ") para " + nextBuild.construction + ". Removendo da fila.");
                        buildingObject.removeFirst();
                        document.getElementById("templateDisplay").innerHTML = "";
                        buildingObject.displayNext(document.getElementById("templateDisplay"));
                        return;
                    }

                    let wood = parseInt(document.getElementById("wood").textContent);
                    let stone = parseInt(document.getElementById("stone").textContent);
                    let iron = parseInt(document.getElementById("iron").textContent);
                    let woodCost = 9999999, stoneCost = 9999999, ironCost = 9999999;
                    try {
                        let costWoodElem = document.querySelector("#main_buildrow_" + nextBuild.construction + " > .cost_wood");
                        let costStoneElem = document.querySelector("#main_buildrow_" + nextBuild.construction + " > .cost_stone");
                        let costIronElem = document.querySelector("#main_buildrow_" + nextBuild.construction + " > .cost_iron");
                        woodCost = parseInt(costWoodElem.getAttribute("data-cost"));
                        stoneCost = parseInt(costStoneElem.getAttribute("data-cost"));
                        ironCost = parseInt(costIronElem.getAttribute("data-cost"));
                        console.log("Custos recuperados para " + nextBuild.construction);
                    } catch (e) {
                        console.error("Erro ao obter custos para " + nextBuild.construction);
                    }
                    let buildQueueElem = document.getElementById("buildqueue");
                    let currentBuildLength = buildQueueElem ? buildQueueElem.rows.length - 2 : 0;
                    if (currentBuildLength < buildingObject.buildingQueueLength &&
                        !isBuilding && scriptStatus &&
                        wood >= woodCost && stone >= stoneCost && iron >= ironCost) {
                        isBuilding = true;
                        console.log("Enviando ordem de construção para " + nextBuild.construction);
                        setTimeout(function () {
                            buildBuilding(nextBuild.construction);
                        }, Math.floor(Math.random() * 500 + 1000));
                    }
                }
            }, 1000);
        }

        // Envia a requisição AJAX para construir o edifício
        function buildBuilding(buildingName) {
            console.log("Iniciando chamada AJAX para construir " + buildingName);
            let data = {
                "id": buildingName,
                "force": 1,
                "destroy": 0,
                "source": game_data.village.id,
                "h": game_data.csrf
            };
            let url = "/game.php?village=" + game_data.village.id + "&screen=main&ajaxaction=upgrade_building&type=main&";
            $.ajax({
                url: url,
                type: "post",
                data: data,
                headers: {
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "TribalWars-Ajax": 1
                }
            }).done(function (r) {
                let response = JSON.parse(r);
                if (response.error) {
                    UI.ErrorMessage(response.error[0]);
                    console.error("Erro: " + response.error[0]);
                } else if (response.response.success) {
                    UI.SuccessMessage(response.response.success);
                    console.log("Sucesso: " + response.response.success);
                    buildingObject.removeFirst();
                    updateLocalStorage();
                    document.getElementById("templateDisplay").innerHTML = "";
                    buildingObject.displayNext(document.getElementById("templateDisplay"));
                    setTimeout(function () {
                        window.location.reload();
                    }, Math.floor(Math.random() * 50 + 10500));
                }
            }).fail(function () {
                UI.ErrorMessage("Algo deu errado. Contate o suporte.");
                console.error("AJAX falhou. Contate o suporte.");
            }).always(function () {
                isBuilding = false;
            });
        }

        // Adiciona os event listeners para interação do usuário
        function addEventListeners() {
            console.log("Adicionando event listeners");

            // Botão para mostrar/ocultar o textarea de template
            document.getElementById("toggleTemplateTextarea").addEventListener("click", function () {
                let area = document.getElementById("templateArea");
                area.style.display = (area.style.display === "none") ? "block" : "none";
            });

            // Botão para salvar o template a partir do textarea
            document.getElementById("saveTemplateBtn").addEventListener("click", function () {
                let jsonText = document.getElementById("templateTextarea").value;
                if (jsonText) {
                    importTemplate(jsonText);
                    updateTemplateSelect();
                    let newQueue = loadTemplateForVillage();
                    buildingObject.buildingQueue = newQueue;
                    updateLocalStorage();
                    document.getElementById("templateDisplay").innerHTML = "";
                    buildingObject.displayNext(document.getElementById("templateDisplay"));
                    // Opcional: esconde o textarea após salvar
                    document.getElementById("templateArea").style.display = "none";
                }
            });

            // Event listener para alteração no select de templates
            document.getElementById("templateSelect").addEventListener("change", function () {
                let selected = this.value;
                localStorage['templateSelected_' + game_data.village.id] = selected;
                let newQueue = loadTemplateForVillage();
                buildingObject.buildingQueue = newQueue;
                updateLocalStorage();
                document.getElementById("templateDisplay").innerHTML = "";
                buildingObject.displayNext(document.getElementById("templateDisplay"));
                console.log("Template alterado para: " + selected);
            });

            // Botão para iniciar/parar o script de construção
            document.getElementById("startBuildingScript").addEventListener("click", function () {
                if (document.getElementById("startBuildingScript").innerText === "Start") {
                    document.getElementById("startBuildingScript").innerText = "Stop";
                    scriptStatus = true;
                    localStorage.scriptStatus = JSON.stringify(scriptStatus);
                    startScript();
                    console.log("Script de construção iniciado");
                } else {
                    document.getElementById("startBuildingScript").innerText = "Start";
                    scriptStatus = false;
                    localStorage.scriptStatus = JSON.stringify(scriptStatus);
                    console.log("Script de construção parado");
                }
            });
        }

        // Inicia o sistema
        init();

    }, 5000);
});