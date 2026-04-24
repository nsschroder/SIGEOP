// Função para criar os campos de texto quando clicar no botão + Vtr
function addViatura(letra) {
    const container = document.getElementById(`lista-vtrs-${letra}`);
    const div = document.createElement("div");
    div.className = "linha-vtr-dinamica";
    div.style = "display: flex; gap: 4px; margin-bottom: 5px; align-items: center;";

    div.innerHTML = `
    <input type="text" placeholder="Vtr" style="width: 45px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px;" class="vtr-prefixo">
    <input type="text" placeholder="Mot" style="flex:1; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px;" class="vtr-p1">
    <input type="text" placeholder="Enc" style="flex:1; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px;" class="vtr-p2">
    <button onclick="this.parentElement.remove()" 
            style="border:none; background:#fee2e2; color:#ef4444; width: 24px; height: 24px; border-radius: 4px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">
            ×
    </button>
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