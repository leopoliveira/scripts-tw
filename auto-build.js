// Código de automação de construção
window.addEventListener('load', function() {
    setTimeout(function() {
        console.log("Script AutoBuilder iniciado após delay de 5000ms");

        // Variáveis globais
        let buildingObject;
        let selection;
        let scriptStatus = false; // false = script parado, true = script em execução
        let isBuilding = false; // Garante que não sejam enviadas ordens duplicadas

        // Função fábrica que cria o objeto de fila de construção
        function createBQueue(queue, queueLength) {
            return {
                buildingQueue: queue,
                buildingQueueLength: queueLength,
                add: function(building, display) {
                    this.buildingQueue.push(building);
                    if (display) {
                        let row = document.createElement("tr");
                        let tdBuilding = document.createElement("td");
                        tdBuilding.textContent = building;
                        let tdDelete = document.createElement("td");
                        tdDelete.className = "delete-icon-large hint-toggle float_left";
                        tdDelete.style.cursor = "pointer";
                        row.appendChild(tdBuilding);
                        row.appendChild(tdDelete);
                        // Log e evento para remover construção ao clicar na linha
                        row.addEventListener("click", function() {
                            removeBuilding(row);
                        });
                        document.getElementById("autoBuilderTable").appendChild(row);
                    }
                },
                display: function(parent) {
                    this.buildingQueue.forEach(function(building) {
                        let row = document.createElement("tr");
                        let tdBuilding = document.createElement("td");
                        tdBuilding.textContent = building;
                        let tdDelete = document.createElement("td");
                        tdDelete.className = "delete-icon-large hint-toggle float_left";
                        tdDelete.style.cursor = "pointer";
                        row.appendChild(tdBuilding);
                        row.appendChild(tdDelete);
                        row.addEventListener("click", function() {
                            removeBuilding(row);
                        });
                        parent.appendChild(row);
                    });
                },
                removeBuilding: function(row) {
                    // Ajusta o índice subtraindo o número de linhas de cabeçalho (3)
                    this.buildingQueue.splice(row.rowIndex - 3, 1);
                    row.remove();
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

        // Inicializa a interface e os dados do auto-builder
        function init() {
            console.log("Inicializando auto-builder");
            const putEleBefore = document.getElementById("content_value");
            let newDiv = document.createElement("div");
            const selectBuildingHtml = '<td><select id="selectBuildingHtml">' +
                '<option value="main">Headquarters</option>' +
                '<option value="barracks">Barracks</option>' +
                '<option value="stable">Stable</option>' +
                '<option value="garage">Workshop</option>' +
                '<option value="watchtower">Watchtower</option>' +
                '<option value="smith">Smithy</option>' +
                '<option value="market">Market</option>' +
                '<option value="wood">Timber Camp</option>' +
                '<option value="stone">Clay Pit</option>' +
                '<option value="iron">Iron Mine</option>' +
                '<option value="farm">Farm</option>' +
                '<option value="storage">Warehouse</option>' +
                '<option value="hide">Hiding Place</option>' +
                '<option value="wall">Wall</option>' +
                '</select></td>';
            let newTable = '<table id="autoBuilderTable">' +
                '<tr>' +
                '<td><button id="startBuildingScript" class="btn">Start</button></td>' +
                '</tr>' +
                '<tr>' +
                '<td>Queue length:</td>' +
                '<td><input id="queueLengthInput" style="width:30px"></td>' +
                '<td><button id="queueLengthBtn" class="btn">OK</button></td>' +
                '<td><span id="queueText"></span></td>' +
                '</tr>' +
                '<tr>' +
                '<td>Building</td>' +
                selectBuildingHtml +
                '<td><button id="addBuilding" class="btn">Add</button></td>' +
                '</tr>' +
                '</table>';

            newDiv.innerHTML = newTable;
            putEleBefore.parentElement.parentElement.insertBefore(newDiv, putEleBefore.parentElement);

            selection = document.getElementById("selectBuildingHtml");
            let premiumBQueueLength = game_data.features.Premium.active ? 5 : 2;

            if (localStorage.buildingObject) {
                let storageObj = JSON.parse(localStorage.buildingObject);
                if (storageObj[game_data.village.id]) {
                    let newBqueue = storageObj[game_data.village.id];
                    buildingObject = createBQueue(newBqueue.buildingQueue, newBqueue.buildingQueueLength);
                    document.getElementById("queueLengthInput").value = buildingObject.buildingQueueLength;
                    // Adiciona cada construção da fila armazenada
                    buildingObject.buildingQueue.forEach(function(b) {
                        addBuilding(b);
                    });
                    console.log("Fila carregada do localStorage para a vila " + game_data.village.id);
                } else {
                    buildingObject = createBQueue([], premiumBQueueLength);
                    document.getElementById("queueLengthInput").value = premiumBQueueLength;
                    storageObj[game_data.village.id] = buildingObject;
                    localStorage.buildingObject = JSON.stringify(storageObj);
                    console.log("Fila inicializada para nova vila " + game_data.village.id);
                }
            } else {
                buildingObject = createBQueue([], premiumBQueueLength);
                let newStorage = {};
                newStorage[game_data.village.id] = buildingObject;
                localStorage.buildingObject = JSON.stringify(newStorage);
                console.log("Criado novo objeto no localStorage");
            }

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
            console.log("Iniciando automação de construção");
            let currentBuildLength = 0;
            let buildQueueElem = document.getElementById("buildqueue");
            if (buildQueueElem) {
                currentBuildLength = buildQueueElem.rows.length - 2;
            }
            setInterval(function () {
                let btn = document.querySelector(".btn-instant-free");
                if (btn && btn.style.display !== "none") {
                    btn.click();
                    console.log("Botão de ação instantânea clicado");
                }
                if (buildingObject.buildingQueue.length !== 0) {
                    let building = buildingObject.buildingQueue[0];
                    let wood = parseInt(document.getElementById("wood").textContent);
                    let stone = parseInt(document.getElementById("stone").textContent);
                    let iron = parseInt(document.getElementById("iron").textContent);
                    let woodCost = 9999999;
                    let stoneCost = 9999999;
                    let ironCost = 9999999;

                    try {
                        let costWoodElem = document.querySelector("#main_buildrow_" + building + " > .cost_wood");
                        let costStoneElem = document.querySelector("#main_buildrow_" + building + " > .cost_stone");
                        let costIronElem = document.querySelector("#main_buildrow_" + building + " > .cost_iron");
                        woodCost = parseInt(costWoodElem.getAttribute("data-cost"));
                        stoneCost = parseInt(costStoneElem.getAttribute("data-cost"));
                        ironCost = parseInt(costIronElem.getAttribute("data-cost"));
                        console.log("Custos recuperados para " + building);
                    } catch (e) {
                        console.error("Erro ao obter custos para " + building);
                    }

                    buildQueueElem = document.getElementById("buildqueue");
                    if (buildQueueElem) {
                        currentBuildLength = buildQueueElem.rows.length - 2;
                    }
                    if (currentBuildLength < buildingObject.buildingQueueLength &&
                        !isBuilding && scriptStatus &&
                        wood >= woodCost && stone >= stoneCost && iron >= ironCost) {
                        isBuilding = true;
                        console.log("Enviando ordem de construção para " + building);
                        setTimeout(function () {
                            buildBuilding(building);
                        }, Math.floor(Math.random() * 500 + 1000));
                    }
                }
            }, 1000);
        }

        // Adiciona uma linha de construção na tabela
        function addBuilding(building) {
            let row = document.createElement("tr");
            let tdBuilding = document.createElement("td");
            tdBuilding.textContent = building;
            let tdDelete = document.createElement("td");
            tdDelete.className = "delete-icon-large hint-toggle float_left";
            tdDelete.style.cursor = "pointer";
            row.appendChild(tdBuilding);
            row.appendChild(tdDelete);
            // Remove a construção ao clicar no ícone de delete
            let deleteIcon = row.querySelector(".delete-icon-large");
            deleteIcon.addEventListener("click", function (event) {
                event.stopPropagation();
                removeBuilding(row);
            });
            document.getElementById("autoBuilderTable").appendChild(row);
            console.log("Construção " + building + " adicionada à fila");
        }

        // Remove a linha da tabela e atualiza a fila
        function removeBuilding(row) {
            buildingObject.buildingQueue.splice(row.rowIndex - 3, 1);
            updateLocalStorage();
            row.remove();
            console.log("Construção removida da fila");
        }

        // Envia a requisição AJAX para construir o edifício
        function buildBuilding(building) {
            console.log("Iniciando chamada AJAX para construir " + building);
            let data = {
                "id": building,
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
                    buildingObject.buildingQueue.splice(0, 1);
                    updateLocalStorage();
                    let firstRow = document.querySelector("#autoBuilderTable tr");
                    if (firstRow) {
                        firstRow.remove();
                    }
                    setTimeout(function () {
                        window.location.reload();
                    }, Math.floor(Math.random() * 50 + 500));
                }
            }).fail(function () {
                UI.ErrorMessage("Algo deu errado. Contate FunnyPocketBook#9373");
                console.error("AJAX falhou. Contate FunnyPocketBook#9373");
            }).always(function () {
                isBuilding = false;
            });
        }

        // Adiciona os event listeners para interação do usuário
        function addEventListeners() {
            console.log("Adicionando event listeners");
            // Aciona o botão OK ao pressionar Enter no input de comprimento da fila
            document.getElementById("queueLengthInput").addEventListener("keydown", function (event) {
                clickOnKeyPress(event, 13, "#queueLengthBtn");
            });

            // Salva o comprimento da fila
            document.getElementById("queueLengthBtn").addEventListener("click", function () {
                let qLength = parseInt(document.getElementById("queueLengthInput").value);
                if (Number.isNaN(qLength)) {
                    qLength = 2;
                }
                if (!game_data.features.Premium.active && qLength > 2) {
                    buildingObject.buildingQueueLength = 2;
                } else {
                    buildingObject.buildingQueueLength = qLength;
                }
                updateLocalStorage();
                if (!game_data.features.Premium.active && qLength > 2) {
                    document.getElementById("queueText").innerHTML = " Premium account not active, queue length set to 2.";
                } else if (parseInt(buildingObject.buildingQueueLength) > 5) {
                    document.getElementById("queueText").innerHTML = " Queue length set to " + buildingObject.buildingQueueLength + ". There will be additional costs for more than 5 constructions in the queue";
                } else {
                    document.getElementById("queueText").innerHTML = " Queue length set to " + buildingObject.buildingQueueLength;
                }
                document.getElementById("queueLengthInput").value = buildingObject.buildingQueueLength;
                console.log("Comprimento da fila atualizado para " + buildingObject.buildingQueueLength);
            });

            // Adiciona uma construção à fila
            document.getElementById("addBuilding").addEventListener("click", function () {
                let b = selection.options[selection.selectedIndex].value;
                buildingObject.buildingQueue.push(b);
                updateLocalStorage();
                addBuilding(b);
                console.log("Construção " + b + " adicionada via clique no botão");
            });

            // Inicia/para o script de construção
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

        // Aciona um clique se a tecla Enter for pressionada
        function clickOnKeyPress(event, key, selector) {
            if (event.defaultPrevented) {
                return;
            }
            if (event.key === key.toString() || event.keyCode === key) {
                document.querySelector(selector).click();
                event.preventDefault();
                console.log("Enter pressionado; acionado clique para " + selector);
            }
        }

        // Inicia o sistema
        init();

    }, 5000);
});
