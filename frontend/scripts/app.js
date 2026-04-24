function descobrirEquipeDeServico(dataSelecionada) {
    // Data de referência (um dia que você sabe que a Equipe ALPHA começou cedo)
    // Se no seu planejamento o Dia 1 do mês X é ALPHA, usamos o primeiro dia do mês como base.
    const dataRef = new Date(dataSelecionada);
    dataRef.setDate(1); // Ajusta para o dia 1 do mês da escala

    const dataAlvo = new Date(dataSelecionada);

    // Diferença em dias
    const diffTempo = Math.abs(dataAlvo - dataRef);
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    // O ciclo 12x36 tem 4 posições: Equipe 1, Equipe 2, Equipe 3, Equipe 4
    // A lógica deve bater com o "Giro" que você definiu no escala.js
    const ciclo = ["A", "D", "C", "B"];
    return ciclo[diffDias % 4];
}

// Variável global para armazenar o que vier do servidor
let recursosDB = { viaturas: [], policiais: [], tpds: [] };
let carregando = false;

async function buscarRecursosDoServidor() {
    try {
        const resposta = await fetch('http://localhost:3000/api/recursos');
        recursosDB = await resposta.json();
        console.log("📡 Dados recebidos do backend!");
    } catch (erro) {
        console.error("❌ Erro ao conectar no servidor:", erro);
        // Fallback para não quebrar o site se o servidor estiver desligado
        recursosDB = { viaturas: ["Sem Conexão"], policiais: ["Sem Conexão"], tpds: ["--"] };
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", function () {

    buscarRecursosDoServidor().then(() => {
        carregarDados();
    });

    // 🔥 AGORA SIM os elementos existem
    document.getElementById("data-servico").addEventListener("change", carregarDados);
    document.getElementById("base-servico").addEventListener("change", carregarDados);

});

function adicionarLinha() {
    const tbody = document.querySelector("tbody");
    const novaLinha = document.createElement("tr");

    // Criamos as opções usando os dados que vieram do servidor
    const optionsViaturas = recursosDB.viaturas.map(v => `<option>${v}</option>`).join("");
    const optionsPoliciais = recursosDB.policiais.map(p => `<option>${p}</option>`).join("");
    const optionsTpds = recursosDB.tpds.map(t => `<option>${t}</option>`).join("");

    novaLinha.innerHTML = `
        <td class="status">⚠️</td>
        <td>
            <select class="viatura">
                <option value="">--Selecione--</option>
                ${optionsViaturas}
            </select>
        </td>
        <td>
            <select class="policial">
                <option value="">--Selecione--</option>
                ${optionsPoliciais}
            </select>
        </td>
        <td>
            <select class="policial">
                <option value="">--Selecione--</option>
                ${optionsPoliciais}
            </select>
        </td>
        <td><input type="date" class="data-inicio"></td>
        <td><input type="time" class="hora-inicio"></td>
        <td><input type="date" class="data-fim"></td>
        <td><input type="time" class="hora-fim"></td>
        <td>
            <select class="tpd">
                <option value="">--</option>
                ${optionsTpds}
            </select>
        </td>
        <td><button onclick="removerLinha(this)">❌</button></td>
    `;

    tbody.appendChild(novaLinha);
    atualizarStatus();
}

// ... mantenha suas outras funções (salvarDados, carregarDados, etc) abaixo ...
function removerLinha(botao) {
    botao.closest("tr").remove();
    atualizarStatus();
    salvarDados(); // Salva após remover
}

function validarDuplicidade(classe, mensagem, elemento) {
    if (!elemento.classList.contains(classe.replace(".", ""))) return;
    let valor = elemento.value;
    if (valor === "") return;

    let duplicado = false;
    document.querySelectorAll(classe).forEach(outro => {
        if (outro !== elemento && outro.value === valor) duplicado = true;
    });

    if (duplicado) {
        alert(mensagem);
        elemento.value = "";
    }
}

function salvarDados() {
    // Se estiver no processo de carregamento, não salva para não sobrescrever com dados incompletos
    if (carregando) return;

    const chave = gerarChave();
    if (!chave) return;

    const linhas = document.querySelectorAll("tbody tr");
    let dados = [];

    linhas.forEach(linha => {
        dados.push({
            viatura: linha.querySelector(".viatura")?.value,
            motorista: linha.querySelectorAll(".policial")[0]?.value,
            encarregado: linha.querySelectorAll(".policial")[1]?.value,
            dataInicio: linha.querySelector(".data-inicio")?.value,
            horaInicio: linha.querySelector(".hora-inicio")?.value,
            dataFim: linha.querySelector(".data-fim")?.value,
            horaFim: linha.querySelector(".hora-fim")?.value,
            tpd: linha.querySelector(".tpd")?.value
        });
    });

    localStorage.setItem(chave, JSON.stringify(dados));
    console.log("SALVO EM:", chave);
}

function carregarDados() {
    const chaveManual = gerarChave(); // Chave: sigeop_2026-04-24_rio_claro
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    if (!chaveManual) return;

    const dadosBrutos = localStorage.getItem(chaveManual);

    if (dadosBrutos) {
        // --- CASO 1: Já existem dados editados manualmente para hoje ---
        const dados = JSON.parse(dadosBrutos);
        carregando = true;
        dados.forEach(item => preencherLinhaComDados(item));
        carregando = false;
    } else {
        // --- CASO 2: Não há dados manuais, vamos buscar o PLANEJAMENTO MENSAL ---
        const dataInput = document.getElementById("data-servico").value; // 2026-04-24
        const baseInput = document.getElementById("base-servico").value; // rio_claro
        const mesRef = dataInput.substring(0, 7); // 2026-04

        const chaveMensal = `ESCALA_${baseInput}_${mesRef}`;
        const planejamentoMensal = localStorage.getItem(chaveMensal);

        if (planejamentoMensal) {
            const plano = JSON.parse(planejamentoMensal);
            const equipeHoje = descobrirEquipeDeServico(dataInput); // Ex: "B"
            const viaturasPlanejadas = plano.escala[equipeHoje]; // Puxa as vtrs da Equipe B

            if (viaturasPlanejadas && viaturasPlanejadas.length > 0) {
                console.log(`💡 Carregando planejamento mensal para Equipe ${equipeHoje}`);
                carregando = true;
                viaturasPlanejadas.forEach(vtrPlan => {
                    preencherLinhaComDados({
                        viatura: vtrPlan.vtr,
                        motorista: vtrPlan.p1,
                        encarregado: vtrPlan.p2,
                        dataInicio: dataInput,
                        horaInicio: "06:45", // Horário padrão manhã
                        dataFim: dataInput,
                        horaFim: "19:00",
                        tpd: "NÃO"
                    });
                });
                carregando = false;
            }
        }
    }
    atualizarStatus();
}

// Função auxiliar para evitar repetição de código
function preencherLinhaComDados(item) {
    adicionarLinha();
    const tbody = document.querySelector("tbody");
    const linha = tbody.lastElementChild;

    // Tenta selecionar os valores nos selects (se existirem no banco)
    if (item.viatura) linha.querySelector(".viatura").value = item.viatura;

    const policiais = linha.querySelectorAll(".policial");
    if (item.motorista) policiais[0].value = item.motorista;
    if (item.encarregado) policiais[1].value = item.encarregado;

    linha.querySelector(".data-inicio").value = item.dataInicio || "";
    linha.querySelector(".hora-inicio").value = item.horaInicio || "";
    linha.querySelector(".data-fim").value = item.dataFim || "";
    linha.querySelector(".hora-fim").value = item.horaFim || "";
    if (item.tpd) linha.querySelector(".tpd").value = item.tpd;
}

function atualizarStatus() {
    const linhas = document.querySelectorAll("tbody tr");
    linhas.forEach(linha => {
        const status = linha.querySelector(".status");
        const campos = {
            mot: linha.querySelectorAll(".policial")[0]?.value,
            enc: linha.querySelectorAll(".policial")[1]?.value,
            tpd: linha.querySelector(".tpd")?.value,
            di: linha.querySelector(".data-inicio")?.value,
            hi: linha.querySelector(".hora-inicio")?.value,
            df: linha.querySelector(".data-fim")?.value,
            hf: linha.querySelector(".hora-fim")?.value
        };

        if (!campos.mot || !campos.enc) {
            status.textContent = "❌";
            linha.style.background = "#fee2e2";
        } else if (Object.values(campos).some(v => !v)) {
            status.textContent = "⚠️";
            linha.style.background = "#fef9c3";
        } else {
            status.textContent = "✅";
            linha.style.background = "#dcfce7";
        }
    });
}

function gerarChave() {
    const data = document.getElementById("data-servico").value;
    const base = document.getElementById("base-servico").value;
    if (!data || !base) return null;
    return `sigeop_${data}_${base}`;
}

// Eventos de troca de base/data
document.getElementById("data-servico").addEventListener("change", carregarDados);
document.getElementById("base-servico").addEventListener("change", carregarDados);