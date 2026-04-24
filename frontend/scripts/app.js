// --- LÓGICA DE GIRO E CARGA ---

function descobrirEquipesDoDia(dataAlvoStr) {
    const dataAlvo = new Date(dataAlvoStr + "T00:00:00");
    const diaAlvo = dataAlvo.getDate();
    const ciclo = ["A", "D", "C", "B"];

    let idxDia = (diaAlvo - 1) % 4;
    let idxNoite = (diaAlvo - 2) % 4;
    if (idxNoite < 0) idxNoite = 3;

    return { equipeDia: ciclo[idxDia], equipeNoite: ciclo[idxNoite] };
}

function carregarDados() {
    const dataInput = document.getElementById("data-servico").value;
    const baseInput = document.getElementById("base-servico").value;
    const tbody = document.querySelector("tbody");

    if (!tbody) return;
    tbody.innerHTML = "";

    if (!dataInput || !baseInput) return;

    const chaveManual = `sigeop_${dataInput}_${baseInput}`;
    const dadosManuais = localStorage.getItem(chaveManual);

    if (dadosManuais && dadosManuais !== "[]") {
        JSON.parse(dadosManuais).forEach(item => preencherLinhaComDados(item));
        atualizarStatus();
        return;
    }

    const mesRef = dataInput.substring(0, 7);
    const chaveEscala = `ESCALA_${baseInput}_${mesRef}`;
    const planejamentoRaw = localStorage.getItem(chaveEscala);

    if (planejamentoRaw) {
        const plano = JSON.parse(planejamentoRaw);
        const { equipeDia, equipeNoite } = descobrirEquipesDoDia(dataInput);
        carregando = true;

        if (plano.escala[equipeDia]) {
            plano.escala[equipeDia].forEach(v => {
                preencherLinhaComDados({
                    viatura: v.vtr, motorista: v.p1, encarregado: v.p2,
                    dataInicio: dataInput, horaInicio: "06:45",
                    dataFim: dataInput, horaFim: "19:00", tpd: ""
                });
            });
        }

        if (plano.escala[equipeNoite]) {
            const dtFim = new Date(dataInput + "T00:00:00");
            dtFim.setDate(dtFim.getDate() + 1);
            const dataFimStr = dtFim.toISOString().split('T')[0];
            plano.escala[equipeNoite].forEach(v => {
                preencherLinhaComDados({
                    viatura: v.vtr, motorista: v.p1, encarregado: v.p2,
                    dataInicio: dataInput, horaInicio: "18:45",
                    dataFim: dataFimStr, horaFim: "07:00", tpd: ""
                });
            });
        }
        carregando = false;
    }
    atualizarStatus();
}

// --- FUNÇÕES DE INTERAÇÃO COM A TABELA ---

function preencherLinhaComDados(item) {
    adicionarLinha();
    const tbody = document.querySelector("tbody");
    const linha = tbody.lastElementChild;
    const selVtr = linha.querySelector(".viatura");
    const selPols = linha.querySelectorAll(".policial");

    const setSelectValue = (select, value) => {
        const existe = Array.from(select.options).some(opt => opt.value === value);
        if (existe) { select.value = value; }
        else if (value) {
            const opt = document.createElement("option");
            opt.value = value; opt.textContent = `⚠️ ${value}`;
            select.appendChild(opt); select.value = value;
            select.style.border = "2px solid orange";
        }
    };

    setSelectValue(selVtr, item.viatura);
    setSelectValue(selPols[0], item.motorista);
    setSelectValue(selPols[1], item.encarregado);
    linha.querySelector(".data-inicio").value = item.dataInicio || "";
    linha.querySelector(".hora-inicio").value = item.horaInicio || "";
    linha.querySelector(".data-fim").value = item.dataFim || "";
    linha.querySelector(".hora-fim").value = item.horaFim || "";
    if (item.tpd) linha.querySelector(".tpd").value = item.tpd;
}

function adicionarLinha() {
    const tbody = document.querySelector("tbody");
    const novaLinha = document.createElement("tr");

    const optionsViaturas = recursosDB.viaturas.map(v => `<option>${v}</option>`).join("");
    const optionsPoliciais = recursosDB.policiais.map(p => `<option>${p}</option>`).join("");
    const optionsTpds = recursosDB.tpds.map(t => `<option>${t}</option>`).join("");

    novaLinha.innerHTML = `
        <td class="status">⚠️</td>
        <td><select class="viatura"><option value="">--Vtr--</option>${optionsViaturas}</select></td>
        <td><select class="policial"><option value="">--Mot--</option>${optionsPoliciais}</select></td>
        <td><select class="policial"><option value="">--Enc--</option>${optionsPoliciais}</select></td>
        <td><input type="date" class="data-inicio"></td>
        <td><input type="time" class="hora-inicio"></td>
        <td><input type="date" class="data-fim"></td>
        <td><input type="time" class="hora-fim"></td>
        <td><select class="tpd"><option value="">--</option>${optionsTpds}</select></td>
        <td><button onclick="removerLinha(this)">❌</button></td>
    `;
    tbody.appendChild(novaLinha);
}

function removerLinha(botao) {
    botao.closest("tr").remove();
    atualizarStatus();
    salvarDados();
}

// --- STATUS E PERSISTÊNCIA ---

function atualizarStatus() {
    const linhas = document.querySelectorAll("tbody tr");
    linhas.forEach(linha => {
        const icon = linha.querySelector(".status");
        const vals = {
            v: linha.querySelector(".viatura")?.value,
            m: linha.querySelectorAll(".policial")[0]?.value,
            e: linha.querySelectorAll(".policial")[1]?.value,
            t: linha.querySelector(".tpd")?.value,
            di: linha.querySelector(".data-inicio")?.value,
            hi: linha.querySelector(".hora-inicio")?.value,
            df: linha.querySelector(".data-fim")?.value,
            hf: linha.querySelector(".hora-fim")?.value
        };

        if (!vals.v || !vals.m || !vals.e) {
            icon.textContent = "❌"; linha.style.backgroundColor = "#fee2e2";
        } else if (Object.values(vals).some(v => !v)) {
            icon.textContent = "⚠️"; linha.style.backgroundColor = "#fef9c3";
        } else {
            icon.textContent = "✅"; linha.style.backgroundColor = "#dcfce7";
        }
    });
}

function salvarDados() {
    if (carregando) return;
    const chave = gerarChave();
    if (!chave) return;
    const dados = Array.from(document.querySelectorAll("tbody tr")).map(linha => ({
        viatura: linha.querySelector(".viatura")?.value,
        motorista: linha.querySelectorAll(".policial")[0]?.value,
        encarregado: linha.querySelectorAll(".policial")[1]?.value,
        dataInicio: linha.querySelector(".data-inicio")?.value,
        horaInicio: linha.querySelector(".hora-inicio")?.value,
        dataFim: linha.querySelector(".data-fim")?.value,
        horaFim: linha.querySelector(".hora-fim")?.value,
        tpd: linha.querySelector(".tpd")?.value
    }));
    localStorage.setItem(chave, JSON.stringify(dados));
}

function gerarChave() {
    const d = document.getElementById("data-servico").value;
    const b = document.getElementById("base-servico").value;
    return (d && b) ? `sigeop_${d}_${b}` : null;
}

// --- INICIALIZAÇÃO ---

let recursosDB = { viaturas: [], policiais: [], tpds: [] };
let carregando = false;

async function buscarRecursosDoServidor() {
    try {
        const r = await fetch('http://localhost:3000/api/recursos');
        recursosDB = await r.json();
    } catch (e) {
        recursosDB = { viaturas: ["Erro Server"], policiais: ["Erro Server"], tpds: ["--"] };
    }
}

document.addEventListener("DOMContentLoaded", function () {
    buscarRecursosDoServidor().then(() => carregarDados());

    document.getElementById("data-servico").addEventListener("change", carregarDados);
    document.getElementById("base-servico").addEventListener("change", carregarDados);

    // DELEGAÇÃO: Ouve qualquer mudança (input) dentro do corpo da tabela em tempo real
    document.querySelector("tbody").addEventListener("input", function () {
        atualizarStatus();
        salvarDados();
    });
});