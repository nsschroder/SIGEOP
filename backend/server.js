const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Seus dados que no futuro virão de um Banco de Dados real
const bancoDeDados = {
    viaturas: ["I-37201", "17-445", "I-27202", "I-37208", "I-37206"],
    policiais: ["Henrique", "Nascimento", "Schroder", "Ferreira", "Almeida", "Roger", "Emerson", "Christofer", "Alencar"],
    tpds: ["TPD-01", "TPD-02", "TPD-03", "TPD-04"]
};

app.get('/api/recursos', (req, res) => {
    res.json(bancoDeDados);
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});