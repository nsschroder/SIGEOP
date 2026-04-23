# SIGEOP – Sistema de Gestão Operacional

## Descrição

O SIGEOP é um sistema em desenvolvimento com a finalidade de estruturar, padronizar e otimizar o processo de elaboração de escalas operacionais e montagem do MAPA FORÇA.

O projeto surge a partir da necessidade de reduzir inconsistências operacionais, retrabalho manual e ausência de controle nas alterações realizadas durante a composição das equipes de serviço.

---

## Contexto Operacional

Atualmente, o fluxo de trabalho ocorre da seguinte forma:

1. Geração da escala em formato PDF
2. Transcrição manual para planilha (MAPA FORÇA)
3. Ajustes diários realizados manualmente
4. Inserção manual das informações em sistema operacional

Esse processo apresenta limitações como:

* Redundância de etapas
* Alto risco de erro humano
* Falta de rastreabilidade das alterações
* Dependência de intervenção manual contínua

---

## Proposta do Sistema

O SIGEOP propõe a centralização das informações operacionais em um único ambiente, com separação clara entre:

### Planejamento (Escala)

* Definição prévia de policiais, viaturas e horários
* Organização antecipada do serviço

### Execução (Sincronização)

* Ajustes operacionais no dia do serviço
* Vinculação de equipes reais (policial + viatura + TPD + status)
* Preparação final dos dados para uso no sistema operacional

---

## Funcionalidades previstas

* Autenticação de usuários
* Controle de acesso por CIA/GP/PEL
* Cadastro de policiais, viaturas e TPD
* Geração de escala operacional
* Tela de sincronização de equipes
* Validação de inconsistências (duplicidade, ausência de dados, etc.)
* Registro de alterações (log de auditoria)
---

## Fluxo Operacional Proposto

```
Escala (planejamento prévio)
        ↓
Armazenamento no sistema
        ↓
Sincronização no dia do serviço
        ↓
Geração do MAPA FORÇA consolidado
        ↓
Utilização no sistema operacional
```

---

## Tecnologias (fase inicial)

* Frontend: HTML, CSS, JavaScript
* Backend: em definição
* Banco de dados: SQLite (ambiente de testes)

---

## Status

Projeto em fase inicial de desenvolvimento.

---

## Observações

O sistema está sendo desenvolvido com foco na simplicidade de uso em ambiente operacional, priorizando clareza das informações, redução de erros e rastreabilidade das ações realizadas pelos usuários.

---

NICHOLAS SCHRODER.
