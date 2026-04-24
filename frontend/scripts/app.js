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
    const chave = gerarChave();
    const tbody = document.querySelector("tbody");

    // 🔥 1. Limpa a tabela independente de ter dados ou não
    tbody.innerHTML = "";

    if (!chave) return;

    const dadosBrutos = localStorage.getItem(chave);
    if (!dadosBrutos) {
        atualizarStatus();
        return;
    }

    const dados = JSON.parse(dadosBrutos);

    // Bloqueia o salvamento automático enquanto reconstrói a tabela
    carregando = true;

    dados.forEach(item => {
        adicionarLinha();
        const linha = tbody.lastElementChild;

        linha.querySelector(".viatura").value = item.viatura || "";
        linha.querySelectorAll(".policial")[0].value = item.motorista || "";
        linha.querySelectorAll(".policial")[1].value = item.encarregado || "";
        linha.querySelector(".data-inicio").value = item.dataInicio || "";
        linha.querySelector(".hora-inicio").value = item.horaInicio || "";
        linha.querySelector(".data-fim").value = item.dataFim || "";
        linha.querySelector(".hora-fim").value = item.horaFim || "";
        linha.querySelector(".tpd").value = item.tpd || "";
    });

    carregando = false;
    atualizarStatus();
    console.log("CARREGADO DE:", chave);
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