// Verifica se o elemento "#troopPlanner" existe
if (!document.getElementById("troopPlanner")) {
    console.log("[DEBUG] Elemento #troopPlanner não encontrado, iniciando configuração do planner.");

    const worldConfig = worldConfiguration();
    console.log("[DEBUG] Configuração do mundo obtida.");

    // Parâmetros do jogo obtidos via AJAX
    const gameParams = {
        gameSpeed: Number(worldConfig.getElementsByTagName("speed")[0].textContent),
        unitSpeed: Number(worldConfig.getElementsByTagName("unit_speed")[0].textContent),
        archers: Number(worldConfig.getElementsByTagName("archer")[0].textContent),
        knight: Number(worldConfig.getElementsByTagName("knight")[0].textContent),
        troopLink:
            "/game.php?&village=" +
            game_data.village.id +
            "&type=own_home&mode=units&group=0&page=-1&screen=overview_villages",
        villageOverviewLink: "/game.php?",
        orderLink: "/game.php?",
        speeds: [18, 22, 18, 9, 10, 11, 30, 30, 10, 35],
        troopNames: [
            "Pikeman",
            "Swordsman",
            "Axeman",
            "Scout",
            "LC",
            "CC",
            "Ram",
            "Catapult",
            "Knight",
            "Noble"
        ]
    };
    console.log("[DEBUG] Objeto 'gameParams' configurado:", gameParams);

    let isFetching = true;
    let groupsFetched = false;
    const troopImageBase = image_base + "unit/";
    const minTroopCount = [];
    const departureTimes = [];
    const villageIds = [];
    const troops = [];
    const myVillages = [];
    const villageNames = [];
    const showVillage = [];
    const bbTable = [];
    const imageList = "spear,sword,axe,spy,light,heavy,ram,catapult,knight,snob".split(",");
    let activeUnits = ("111" + (gameParams.knight ? "10" : "0")).split("");
    console.log("[DEBUG] Configuração inicial das unidades ativas:", activeUnits);

    if (!gameParams.knight) {
        console.log("[DEBUG] Cavaleiro não disponível, removendo dados do cavaleiro.");
        const knightIndex = imageList.indexOf("knight");
        if (knightIndex > -1) {
            gameParams.speeds.splice(knightIndex, 1);
            gameParams.troopNames.splice(knightIndex, 1);
            imageList.splice(knightIndex, 1);
        }
    }

    const atkCookie = getCookie("atkjed");
    if (atkCookie !== "") {
        activeUnits = parseInt(atkCookie, 36).toString(2).split("");
        while (activeUnits.length < gameParams.speeds.length) {
            activeUnits.unshift("0");
        }
        console.log("[DEBUG] Unidades ativas definidas pelo cookie:", activeUnits);
    }

    const serverTimeEl = document.getElementById("serverTime");
    const serverDateEl = document.getElementById("serverDate");
    const timeMatch = serverTimeEl ? serverTimeEl.textContent.match(/\d+/g) : [];
    const dateMatch = serverDateEl ? serverDateEl.textContent.match(/\d+/g) : [];
    const currentServerTime = new Date(
        dateMatch[2],
        dateMatch[1] - 1,
        dateMatch[0],
        timeMatch[0],
        timeMatch[1],
        timeMatch[2]
    );
    console.log("[DEBUG] Horário atual do servidor:", currentServerTime);

    if (game_data.player.sitter != 0) {
        console.log("[DEBUG] Jogador é sitter, ajustando links.");
        gameParams.troopLink =
            "/game.php?t=" +
            game_data.player.id +
            "&village=" +
            game_data.village.id +
            "&type=own_home&mode=units&group=0&page=-1&screen=overview_villages";
        gameParams.villageOverviewLink +=
            "t=" +
            game_data.player.id +
            "&village=" +
            game_data.village.id +
            "&screen=info_village&id=";
        gameParams.orderLink += "t=" + game_data.player.id + "&village=";
    } else {
        gameParams.villageOverviewLink +=
            "village=" + game_data.village.id + "&screen=info_village&id=";
        gameParams.orderLink += "village=";
    }

    const allTroopsLink = gameParams.troopLink;
    const worldSpeed = Number((gameParams.gameSpeed * gameParams.unitSpeed).toFixed(5));
    console.log("[DEBUG] Velocidade do mundo calculada:", worldSpeed);

    for (let i = 0; i < gameParams.speeds.length; i++) {
        minTroopCount[i] = 0;
        gameParams.speeds[i] /= worldSpeed;
    }
    console.log("[DEBUG] Velocidades ajustadas:", gameParams.speeds);

    drawPlanner();
    fetchData();
} else {
    console.log("[DEBUG] Elemento #troopPlanner já existe. Removendo elemento existente.");
    const existingPlanner = document.getElementById("troopPlanner");
    if (existingPlanner && existingPlanner.parentNode) {
        existingPlanner.parentNode.removeChild(existingPlanner);
    }
}
void 0;

// Função auxiliar para verificar se um elemento está visível
function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

// ========================================================================
// FUNÇÕES DE EXECUÇÃO E ATUALIZAÇÃO DO PLANNER
// ========================================================================

function displayPossibilities() {
    console.log("[DEBUG] Iniciando função 'displayPossibilities'");
    if (isFetching) {
        const loadingEl = document.getElementById("loading");
        if (loadingEl) loadingEl.innerHTML = "Aguarde, buscando dados...";
        setTimeout(displayPossibilities, 500);
        console.log("[DEBUG] Dados ainda estão sendo carregados, rechecando em 500ms.");
        return;
    }
    const troopSelectionEl = document.getElementById("troopSelection");
    if (troopSelectionEl && isVisible(troopSelectionEl)) {
        toggleArrow();
        troopSelectionEl.style.display = "none";
        const troopListEl = document.getElementById("troopList");
        if (troopListEl) troopListEl.style.display = "";
        saveSelection();
    }
    let htmlOutput = [];
    let tempHtml = [];
    let slowestUnit = -1;
    const targetCoords = document.getElementById("targetCoordinates").value.match(/\d+/g);
    const entryTimeArr = document.getElementById("entryTime").value.match(/\d+/g);
    const entryDateArr = document.getElementById("entryDate").value.match(/\d+/g);

    const thElements = document.querySelectorAll("#troopList th");
    thElements.forEach((th, i) => {
        if (i > gameParams.speeds.length) return;
        if (i && th.classList.contains("faded")) activeUnits[i - 1] = "0";
        else if (i) activeUnits[i - 1] = "1";
    });

    setCookie("atkjed", parseInt(activeUnits.join(""), 2).toString(36), 360);

    const serverTimeText = document.getElementById("serverTime").textContent.match(/\d+/g);
    const serverDateText = document.getElementById("serverDate").textContent.match(/\d+/g);
    const currentTime = new Date(
        serverDateText[2],
        serverDateText[1] - 1,
        serverDateText[0],
        serverTimeText[0],
        serverTimeText[1],
        serverTimeText[2]
    );
    const entryTimeDate = new Date(
        entryDateArr[2],
        entryDateArr[1] - 1,
        entryDateArr[0],
        entryTimeArr[0],
        entryTimeArr[1],
        entryTimeArr[2]
    );
    const diffSeconds = (entryTimeDate - currentTime) / 1000;
    console.log("[DEBUG] Diferença em segundos para entrada:", diffSeconds);

    let villageCount = 0;
    for (let i = 0; i < myVillages.length; i++) {
        if (!showVillage[i]) continue;
        tempHtml[i] = `<tr><td><a href='${gameParams.villageOverviewLink + villageIds[i]}'>${villageNames[i].replace(
            /\s+/g,
            "\u00A0"
        )}</a>`;
        let slowestTime = 0;
        let possibleTroops = "&from=simulator";
        for (let j = 0; j < gameParams.speeds.length; j++) {
            if (activeUnits[j] === "0" || troops[i][j] < 1) {
                tempHtml[i] += `<td class='hidden'>${troops[i][j]}`;
                continue;
            }
            const a = Math.abs(Number(targetCoords[0]) - myVillages[i][myVillages[i].length - 3]);
            const b = Math.abs(Number(targetCoords[1]) - myVillages[i][myVillages[i].length - 2]);
            const travelTime = Math.sqrt(a * a + b * b) * gameParams.speeds[j] * 60;
            if (travelTime <= diffSeconds) {
                if (travelTime > slowestTime) {
                    slowestTime = travelTime;
                    slowestUnit = j;
                }
                possibleTroops += `&att_${imageList[j]}=${troops[i][j]}`;
                tempHtml[i] += `<td style='background-color: #C3FFA5;'>${troops[i][j]}`;
            } else {
                tempHtml[i] += `<td>${troops[i][j]}`;
            }
        }
        if (slowestTime !== 0) {
            let tmp = new Date(entryTimeDate);
            tmp.setSeconds(tmp.getSeconds() - slowestTime);
            departureTimes[villageCount] = new Date(tmp);
            const formattedTime =
                tmp.getDate() + "." + (tmp.getMonth() + 1) + "\u00A0" + tmp.getHours() + ":" + tmp.getMinutes() + ":" + tmp.getSeconds();
            htmlOutput[villageCount] =
                tempHtml[i] +
                `<td>${formattedTime}<td>0<td><a href='${gameParams.orderLink + villageIds[i] +
                "&screen=place&x=" +
                targetCoords[0] +
                "&y=" +
                targetCoords[1] +
                possibleTroops}'>Executar</a>`;
            bbTable[villageCount] = `[*]${gameParams.troopNames[slowestUnit]}[|] ${myVillages[i][myVillages[i].length - 3]}|${myVillages[i][myVillages[i].length - 2]} [|] ${targetCoords[0]}|${targetCoords[1]} [|] ${formattedTime} [|] [url=https://${document.URL.split("/")[2] + gameParams.orderLink + villageIds[i] + "&screen=place&x=" + targetCoords[0] + "&y=" + targetCoords[1] + possibleTroops}]Executar\n`;
            villageCount++;
        } else {
            tempHtml[i] = "";
        }
    }
    if (villageCount === 0) {
        UI.InfoMessage("Não é possível gerar nenhum comando no tempo estipulado :(", 1500, "error");
    }
    const possibilityCountEl = document.getElementById("possibilityCount");
    if (possibilityCountEl) {
        possibilityCountEl.innerHTML = `<b>${villageCount}/${myVillages.length}</b>`;
    }
    for (let i = 0; i < htmlOutput.length - 1; i++) {
        let min = i;
        for (let j = i + 1; j < htmlOutput.length; j++) {
            if (departureTimes[min] > departureTimes[j]) min = j;
        }
        let tmp = htmlOutput[min];
        htmlOutput[min] = htmlOutput[i];
        htmlOutput[i] = tmp;
        tmp = departureTimes[min];
        departureTimes[min] = departureTimes[i];
        departureTimes[i] = tmp;
        tmp = bbTable[min];
        bbTable[min] = bbTable[i];
        bbTable[i] = tmp;
    }
    bbTable.splice(villageCount, bbTable.length - villageCount);
    const troopListBody = document.querySelector("#troopList tbody");
    if (troopListBody) {
        troopListBody.innerHTML =
            htmlOutput.join("\n") +
            (villageCount
                ? `<tr><td id='exportSchedule' colspan='${gameParams.speeds.length + 4}'><a href='#' onclick="document.getElementById('exportSchedule').innerHTML='<textarea cols=100 rows=2 onclick=\\'this.select()\\'>[table][**]Unidade[||]Origem[||]Destino[||]Horário de Saída[||]Comando[/**]\\n'+bbTable.join('')+'[/table]</textarea>';"><img src='${image_base}igm/export.png' > Exportar programação</a>`
                : "");
    }
    const rows = document.querySelectorAll("#troopList tbody tr");
    rows.forEach((row, i) => {
        row.className = i % 2 ? "row_a" : "row_b";
    });
    const loadingEl = document.getElementById("loading");
    if (loadingEl) loadingEl.innerHTML = "";
    countdown();
    console.log("[DEBUG] Função 'displayPossibilities' finalizada.");
}

function countdown() {
    const serverTimeText = document.getElementById("serverTime").textContent.match(/\d+/g);
    const serverDateText = document.getElementById("serverDate").textContent.match(/\d+/g);
    const currentTime = new Date(
        serverDateText[2],
        serverDateText[1] - 1,
        serverDateText[0],
        serverTimeText[0],
        serverTimeText[1],
        serverTimeText[2]
    );
    const rows = document.querySelectorAll("#troopList tbody > tr");
    rows.forEach((row, i) => {
        const diffSeconds = (departureTimes[i] - currentTime) / 1000;
        const targetCellIndex = gameParams.speeds.length + 2;
        const targetCell = row.querySelectorAll("td")[targetCellIndex];
        if (targetCell) {
            if (diffSeconds > 60) targetCell.innerHTML = formatTime(diffSeconds);
            else targetCell.innerHTML = `<font color='red'>${diffSeconds}</font>`;
        }
    });
    setTimeout(countdown, 1000);
}

function formatTime(s) {
    let h = Math.floor(s / 3600);
    s = s - h * 3600;
    let m = Math.floor(s / 60);
    s = s - m * 60;
    return h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

function selectVillages() {
    console.log("[DEBUG] Iniciando função 'selectVillages'");
    let row;
    let htmlContent =
        "<tr><th style='cursor:pointer;' onclick=\"setMin(0); (function(){ const rows = document.querySelectorAll('#troopSelection tr'); rows.forEach((row) => { row.style.display=''; }); })();\">Minimum number of troops:";
    for (let i = 0; i < gameParams.speeds.length; i++)
        htmlContent += `<th><input onchange='hideTroops(${i},this.value);' type='text' value='${minTroopCount[i]}' size='1'>`;
    htmlContent +=
        "<th colspan=2><tr><th style='cursor:pointer;' onclick='sortOverview(-1);'><span class='icon header village'></span>";
    for (let i = 0; i < imageList.length; i++)
        htmlContent += `<th style='cursor:pointer;' onclick='sortOverview(${i});'><img src='${troopImageBase}unit_${imageList[i]}.png'>`;
    htmlContent += `<th style='cursor:pointer;' onclick='sortOverview(${imageList.length});'>Distance<th><input type='checkbox' onclick='checkAll(this)' >`;
    for (let i = 0; i < troops.length; i++) {
        let hiddenFlag = false;
        let cells = `<a href='${gameParams.villageOverviewLink + villageIds[i]}'>${villageNames[i].replace(/\s+/g, "\u00A0")}</a>`;
        for (let j = 0; j < imageList.length; j++) {
            cells += `<td>${troops[i][j]}`;
            if (!hiddenFlag && troops[i][j] < minTroopCount[i]) hiddenFlag = true;
        }
        if (!hiddenFlag) row = `<tr class='${i % 2 ? "row_a" : "row_b"}'><td>`;
        else row = `<tr class='${i % 2 ? "row_a" : "row_b"}' style='display: none;'><td>`;
        htmlContent += row + cells;
        htmlContent += "<td><td><input name='select' type='checkbox' " + (showVillage[i] ? "checked" : "disabled") + ">";
    }
    document.getElementById("troopSelection").innerHTML = htmlContent;
    showDistance();
    console.log("[DEBUG] Função 'selectVillages' finalizada.");
}

function showDistance() {
    console.log("[DEBUG] Atualizando distâncias para cada vila.");
    const targetVal = document.getElementById("targetCoordinates").value;
    const match = targetVal.match(/\d+\|\d+/);
    if (match) {
        document.getElementById("targetCoordinates").value = match[0];
    }
    const targetCoords = document.getElementById("targetCoordinates").value.match(/\d+/g);
    const rows = document.querySelectorAll("#troopSelection tr");
    rows.forEach((row, i) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= (gameParams.speeds.length + 2)) {
            const a = Math.abs(Number(targetCoords[0]) - myVillages[i][myVillages[i].length - 3]);
            const b = Math.abs(Number(targetCoords[1]) - myVillages[i][myVillages[i].length - 2]);
            cells[gameParams.speeds.length + 1].innerHTML = Number(Math.sqrt(a * a + b * b).toFixed(1));
        }
    });
}

function saveSelection() {
    console.log("[DEBUG] Salvando seleção de vilas.");
    const checkboxes = document.querySelectorAll("#troopSelection input[type='checkbox']");
    checkboxes.forEach((checkbox, i) => {
        if (i) showVillage[i - 1] = checkbox.checked;
    });
    const troopSelectionEl = document.getElementById("troopSelection");
    if (troopSelectionEl) troopSelectionEl.style.display = "none";
    const troopListEl = document.getElementById("troopList");
    if (troopListEl) troopListEl.style.display = "";
}

function toggleArrow() {
    console.log("[DEBUG] Alternando ícone da seta.");
    const arrow = document.getElementById("arrowIcon");
    if (arrow) {
        if (arrow.classList.contains("arr_down")) {
            arrow.classList.remove("arr_down");
            arrow.classList.add("arr_up");
        } else {
            arrow.classList.remove("arr_up");
            arrow.classList.add("arr_down");
        }
    }
}

function drawPlanner() {
    console.log("[DEBUG] Iniciando função 'drawPlanner' para desenhar o planner.");
    let target = game_data.village.x + "|" + game_data.village.y;
    if (game_data.screen === "info_village") {
        if (!mobile) {
            const contentValue = document.getElementById("content_value");
            const visTable = contentValue.getElementsByClassName("vis")[0];
            const table = visTable.getElementsByTagName("table")[0];
            target = table.rows[2].cells[1].textContent;
        } else {
            const mobileKey = document.getElementsByClassName("mobileKeyValue")[0];
            const div = mobileKey.getElementsByTagName("div")[0];
            target = div.textContent.match(/\d+\|\d+/)[0];
        }
    }
    let timeFetched = false;
    const noIgnoredCommands = document.getElementsByClassName("no_ignored_command");
    if (noIgnoredCommands.length) {
        for (let i = 0; i < noIgnoredCommands.length; i++) {
            if (noIgnoredCommands[i].innerHTML.match("snob.png") && !timeFetched) {
                const entryTimeBig = noIgnoredCommands[i].querySelector("td:nth-child(3)").textContent.match(/\d+/g);
                currentTime.setSeconds(
                    currentTime.getSeconds() +
                    Number(entryTimeBig[2]) +
                    60 * Number(entryTimeBig[1]) +
                    3600 * Number(entryTimeBig[0])
                );
                timeFetched = true;
                break;
            }
        }
    }
    const plannerHTML = `
    <div id="troopPlanner" class="vis vis_item" style="overflow: auto; height: 300px;">
      <table width="100%">
        <tr>
          <td width="300">
            <table style="border-spacing: 3px; border-collapse: separate;">
              <tr>
                <th>Target</th>
                <th>Date</th>
                <th>Time</th>
                <th>Group</th>
                <th></th>
                <th></th>
              </tr>
              <tr>
                <td>
                  <input id="targetCoordinates" size="8" type="text" onchange="showDistance();" value="${target}">
                </td>
                <td>
                  <input id="entryDate" size="8" type="text" value="${currentTime.getDate()}.${currentTime.getMonth() + 1}.${currentTime.getFullYear()}" onchange="fixDate(this, '.');">
                </td>
                <td>
                  <input id="entryTime" size="8" type="text" value="${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}" onchange="fixDate(this, ':');">
                </td>
                <td>
                  <select id="groupList" onchange="changeGroup();">
                    <option value="${allTroopsLink}">Todas</option>
                  </select>
                </td>
                <td onclick="
                  toggleArrow();
                  (function(){
                    const selection = document.getElementById('troopSelection');
                    if (selection && selection.style.display !== 'none') {
                      selection.style.display = 'none';
                      document.getElementById('troopList').style.display = '';
                      saveSelection();
                    } else {
                      document.getElementById('troopList').style.display = 'none';
                      if (selection) selection.style.display = '';
                    }
                  })();
                " style="cursor: pointer">
                  <span id="arrowIcon" class="icon header arr_down"></span>
                </td>
                <td>
                  <input id="calculateButton" type="button" class="btn" value="Calcular" onclick="displayPossibilities();">
              </table>
            <td id="loading">
              <img src="${image_base}throbber.gif">
    `;
    const container = document.querySelector(mobile ? "#mobileContent" : "#contentContainer");
    if (container) {
        container.insertAdjacentHTML("afterbegin", plannerHTML);
    }
    console.log("[DEBUG] Planner desenhado na tela.");
}

function fetchData() {
    console.log("[DEBUG] Iniciando função 'fetchData' para buscar dados das vilas.");
    isFetching = true;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", gameParams.troopLink, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log("[DEBUG] Resposta AJAX recebida com sucesso.");
            const requestedBody = document.createElement("body");
            requestedBody.innerHTML = xhr.responseText;
            const table = requestedBody.querySelector("#units_table");
            const groupsContainer = requestedBody.querySelector(".vis_item");
            const groups = groupsContainer
                ? groupsContainer.getElementsByTagName(mobile ? "option" : "a")
                : [];
            if (!table) {
                const loadingEl = document.getElementById("loading");
                if (loadingEl)
                    loadingEl.innerHTML = "Não há vilas no grupo selecionado. Por favor, escolha outro.";
                isFetching = false;
                console.error("[DEBUG] Tabela de unidades não encontrada na resposta.");
                return;
            }
            for (let i = 1; i < table.rows.length; i++) {
                showVillage[i - 1] = true;
                troops[i - 1] = [];
                let emptyVillage = 0;
                for (let j = 2; j < table.rows[i].cells.length - 1; j++) {
                    troops[i - 1].push(table.rows[i].cells[j].textContent);
                    if (!Number(troops[i - 1][j - 2])) emptyVillage++;
                }
                if (emptyVillage > gameParams.speeds.length) showVillage[i - 1] = false;
                villageIds.push(table.rows[i].cells[0].querySelector("span").getAttribute("data-id"));
                const spans = table.rows[i].cells[0].getElementsByTagName("span");
                myVillages.push(spans[2].textContent.match(/\d+/g));
                villageNames.push(spans[2].textContent);
            }
            selectVillages();
            const troopListEl = document.getElementById("troopList");
            if (groupsFetched && troopListEl && troopListEl.style.display !== "none")
                displayPossibilities();
            if (!groupsFetched) {
                for (let i = 0; i < groups.length; i++) {
                    const name = groups[i].textContent;
                    if (mobile && name === "wszystkie") continue;
                    const option = document.createElement("option");
                    option.value = groups[i].getAttribute(mobile ? "value" : "href") + "&page=-1";
                    option.textContent = mobile ? name : name.slice(1, name.length - 1);
                    document.getElementById("groupList").appendChild(option);
                }
                groupsFetched = true;
            }
            const loadingEl = document.getElementById("loading");
            if (loadingEl) loadingEl.innerHTML = "";
            isFetching = false;
            console.log("[DEBUG] Dados das vilas processados com sucesso.");
        }
    };
    xhr.send(null);
}

function worldConfiguration() {
    console.log("[DEBUG] Buscando configuração do mundo via AJAX.");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/interface.php?func=get_config", false);
    xhr.responseType = "document";
    xhr.send(null);
    console.log("[DEBUG] Configuração do mundo recebida via AJAX.");
    return xhr.responseXML;
}

function getCookie(cname) {
    const name = cname + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(name) !== -1) return c.substring(name.length, c.length);
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = exdays === 0 ? "" : "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}