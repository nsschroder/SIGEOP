let recursosDB = { viaturas: [], policiais: [] };

async function carregarRecursosDoServidor() {
    try {
        const resposta = await fetch('http://localhost:3000/api/recursos');
        recursosDB = await resposta.json();

        // Preencher os datalists para o autocomplete
        const dlVtrs = document.getElementById("lista-prefixos");
        const dlPols = document.getElementById("lista-policiais");

        dlVtrs.innerHTML = recursosDB.viaturas.map(v => `<option value="${v}">`).join("");
        dlPols.innerHTML = recursosDB.policiais.map(p => `<option value="${p}">`).join("");

    } catch (erro) {
        console.error("Erro ao carregar recursos para escala:", erro);
    }
}

// Chamar ao carregar a página
document.addEventListener("DOMContentLoaded", carregarRecursosDoServidor);

// Função para criar os campos de texto quando clicar no botão + Vtr
function addViatura(letra) {
    const container = document.getElementById(`lista-vtrs-${letra}`);
    const div = document.createElement("div");
    div.className = "linha-vtr-dinamica";
    div.style = "display: flex; gap: 4px; margin-bottom: 5px; align-items: center;";

    // Criamos o HTML usando listas de sugestões (datalist)
    div.innerHTML = `
        <input type="text" list="lista-prefixos" placeholder="Vtr" style="width: 45px;" class="vtr-prefixo">
        <input type="text" list="lista-policiais" placeholder="Mot" style="flex:1;" class="vtr-p1">
        <input type="text" list="lista-policiais" placeholder="Enc" style="flex:1;" class="vtr-p2">
        <button onclick="this.parentElement.remove()" class="btn-remove">x</button>
    `;
    container.appendChild(div);
}

function gerarEscalaInteligente() {
    const mesInput = document.getElementById("mes-planejamento").value;
    const equipeQueInicia = document.getElementById("equipe-start").value;
    const corpoTabela = document.getElementById("corpo-escala");

    if (!mesInput) return alert("Selecione o mês!");

    // Captura as viaturas de cada card
    const composicao = { A: [], B: [], C: [], D: [] };
    ["A", "B", "C", "D"].forEach(letra => {
        const linhas = document.querySelectorAll(`#lista-vtrs-${letra} .linha-vtr-dinamica`);
        linhas.forEach(linha => {
            const vtr = linha.querySelector(".vtr-prefixo").value;
            const p1 = linha.querySelector(".vtr-p1").value;
            const p2 = linha.querySelector(".vtr-p2").value;
            if (vtr || p1 || p2) {
                composicao[letra].push({ vtr, p1, p2 });
            }
        });
    });

    const [ano, mes] = mesInput.split("-");
    const diasNoMes = new Date(ano, mes, 0).getDate();
    corpoTabela.innerHTML = "";

    // Lógica 12x36
    const offsets = {
        'A': { 'A': 0, 'D': 1, 'C': 2, 'B': 3 },
        'B': { 'B': 0, 'A': 1, 'D': 2, 'C': 3 },
        'C': { 'C': 0, 'B': 1, 'A': 2, 'D': 3 },
        'D': { 'D': 0, 'C': 1, 'B': 2, 'A': 3 }
    }[equipeQueInicia];

    for (let i = 1; i <= diasNoMes; i++) {
        let txtDia = "", txtNoite = "", folgas = [];

        for (const [letra, offset] of Object.entries(offsets)) {
            const status = ["DIA", "NOITE", "FOLGA", "FOLGA"][(i - 1 + offset) % 4];
            const infoVtrs = composicao[letra].map(v => `[${v.vtr}] ${v.p1}/${v.p2}`).join("<br>");

            if (status === "DIA") txtDia = `<b>Eq. ${letra}</b><br>${infoVtrs || '---'}`;
            else if (status === "NOITE") txtNoite = `<b>Eq. ${letra}</b><br>${infoVtrs || '---'}`;
            else folgas.push(letra);
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i}/${mes}</td>
            <td style="font-size: 12px;">${txtDia}</td>
            <td style="font-size: 12px;">${txtNoite}</td>
            <td><small>Eq. ${folgas.join(" e ")}</small></td>
        `;
        corpoTabela.appendChild(tr);
    }
    // Criar o objeto de armazenamento
    const base = document.getElementById("base-unidade").value;
    const mesRef = document.getElementById("mes-planejamento").value; // Ex: 2026-04

    // Este objeto vai guardar a escala do mês para esta base específica
    const dadosParaSalvar = {
        base: base,
        mes: mesRef,
        escala: composicao // Aqui estão as viaturas que você definiu nos cards
    };

    // Salva no LocalStorage com uma chave única, ex: "ESCALA_rio_claro_2026-04"
    localStorage.setItem(`ESCALA_${base}_${mesRef}`, JSON.stringify(dadosParaSalvar));

    alert(`Escala de ${base} processada e salva no sistema!`);
}

function salvarPlanejamento() {
    const base = document.getElementById("base-unidade").value;
    const mes = document.getElementById("mes-planejamento").value;

    if (!mes || !base) {
        return alert("Selecione a Base e o Mês antes de confirmar!");
    }

    // Captura o que está nos cards ALPHA, BRAVO, CHARLIE, DELTA
    const obterDadosEquipe = (letra) => {
        const linhas = document.querySelectorAll(`#lista-vtrs-${letra} .linha-vtr-dinamica`);
        return Array.from(linhas).map(linha => ({
            vtr: linha.querySelector(".vtr-prefixo").value,
            p1: linha.querySelector(".vtr-p1").value,
            p2: linha.querySelector(".vtr-p2").value
        }));
    };

    const composicaoMensal = {
        A: obterDadosEquipe('A'),
        B: obterDadosEquipe('B'),
        C: obterDadosEquipe('C'),
        D: obterDadosEquipe('D')
    };

    // Salva com a chave que o app.js vai procurar
    localStorage.setItem(`ESCALA_${base}_${mes}`, JSON.stringify({
        base: base,
        mes: mes,
        escala: composicaoMensal
    }));

    alert("✅ Planejamento Mensal salvo com sucesso!");
}

function imprimirEscala() {
    const mesInput = document.getElementById("mes-planejamento").value;
    if (!mesInput) return alert("Gere a escala antes de imprimir!");

    const [ano, mesNum] = mesInput.split("-");
    const mesesExtenso = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const nomeMes = mesesExtenso[parseInt(mesNum) - 1];

    const conteudoTabela = document.querySelector(".tabela").outerHTML;

    // Criar uma nova janela para a impressão
    const janelaImpressao = window.open('', '', 'width=900,height=700');

    janelaImpressao.document.write(`
        <html>
        <head>
            <title>SIGEOP - Escala ${nomeMes}/${ano}</title>
            <style>
                body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; }
                .header-print { text-align: center; border-bottom: 2px solid #1e293b; margin-bottom: 20px; padding-bottom: 10px; }
                h1 { margin: 0; font-size: 18pt; }
                h2 { margin: 5px 0; font-size: 12pt; color: #64748b; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: bold; }
                .turno-dia { color: #000; }
                .turno-noite { color: #000; }
                b { color: #1e293b; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header-print">
                <h1>PLANO DE ESCALA OPERACIONAL - 12x36</h1>
                <h2>SIGEOP | 1ª PEL - Rio Claro | Referência: ${nomeMes} de ${ano}</h2>
            </div>
            ${conteudoTabela}
            <div style="margin-top: 30px; text-align: right; font-size: 9pt;">
                Documento gerado eletronicamente pelo SIGEOP em ${new Date().toLocaleDateString()}
            </div>
        </body>
        </html>
    `);

    janelaImpressao.document.close();

    // Pequeno delay para garantir que os estilos carreguem antes de abrir o PDF
    setTimeout(() => {
        janelaImpressao.print();
        janelaImpressao.close();
    }, 500);
}