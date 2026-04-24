// O padrão do ciclo: 0=Dia, 1=Noite, 2=Folga, 3=Folga
const cicloPadrao = ["DIA", "NOITE", "FOLGA", "FOLGA"];

function gerarEscalaInteligente() {
    const mesInput = document.getElementById("mes-planejamento").value;
    const equipeQueInicia = document.getElementById("equipe-start").value;
    const corpoTabela = document.getElementById("corpo-escala");

    if (!mesInput) {
        alert("⚠️ Selecione o mês!");
        return;
    }

    // Coletando os nomes dos policiais
    const equipes = {
        A: `${document.getElementById("alpha-p1").value} / ${document.getElementById("alpha-p2").value}`,
        B: `${document.getElementById("bravo-p1").value} / ${document.getElementById("bravo-p2").value}`,
        C: `${document.getElementById("charlie-p1").value} / ${document.getElementById("charlie-p2").value}`,
        D: `${document.getElementById("delta-p1").value} / ${document.getElementById("delta-p2").value}`
    };

    // Define em qual dia do ciclo cada equipe começa com base na escolha do usuário
    // Se a Equipe A começa de DIA (índice 0):
    // A equipe que trabalhou Noite no dia anterior entra em Folga 1
    // A matemática organiza o descompasso das 4 equipes.
    let offsets = {};
    if (equipeQueInicia === "A") { offsets = { A: 0, D: 1, C: 2, B: 3 }; }
    if (equipeQueInicia === "B") { offsets = { B: 0, A: 1, D: 2, C: 3 }; }
    if (equipeQueInicia === "C") { offsets = { C: 0, B: 1, A: 2, D: 3 }; }
    if (equipeQueInicia === "D") { offsets = { D: 0, C: 1, B: 2, A: 3 }; }

    const [ano, mes] = mesInput.split("-");
    const diasNoMes = new Date(ano, mes, 0).getDate();

    corpoTabela.innerHTML = "";
    const planejamentoMensal = {};

    for (let i = 1; i <= diasNoMes; i++) {
        // Para calcular onde a equipe está no ciclo, usamos o módulo (%) de 4
        const diaDoCiclo = i - 1;

        let eqDia = "", eqNoite = "", eqFolgas = [];

        // Verifica o status de cada equipe naquele dia específico
        for (const [nomeEquipe, offset] of Object.entries(offsets)) {
            const statusHoje = cicloPadrao[(diaDoCiclo + offset) % 4];

            if (statusHoje === "DIA") eqDia = `Equipe ${nomeEquipe}: ${equipes[nomeEquipe]}`;
            if (statusHoje === "NOITE") eqNoite = `Equipe ${nomeEquipe}: ${equipes[nomeEquipe]}`;
            if (statusHoje === "FOLGA") eqFolgas.push(`Equipe ${nomeEquipe}`);
        }

        const dataAtual = `${String(i).padStart(2, '0')}/${mes}/${ano}`;
        const diaSemana = new Date(`${ano}-${mes}-${String(i).padStart(2, '0')}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${dataAtual}</strong><br><small>${diaSemana}</small></td>
            <td style="color: var(--secondary-blue); font-weight: bold;">☀️ ${eqDia}</td>
            <td style="color: var(--accent-red); font-weight: bold;">🌙 ${eqNoite}</td>
            <td style="color: var(--text-muted);">💤 ${eqFolgas.join(" e ")}</td>
        `;
        corpoTabela.appendChild(tr);

        // Guarda os dados brutos para exportar pro Sinc depois
        planejamentoMensal[`${ano}-${mes}-${String(i).padStart(2, '0')}`] = {
            dia: eqDia,
            noite: eqNoite
        };
    }

    // Salva o planejamento no navegador de forma invisível
    localStorage.setItem(`SIGEOP_PLANO_${ano}_${mes}`, JSON.stringify(planejamentoMensal));
}