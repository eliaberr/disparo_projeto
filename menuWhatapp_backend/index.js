const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// --- CONFIGURAÇÕES DA EVOLUTION API ---
const EVOLUTION_URL = "http://10.10.0.153:8080"; 
const API_KEY = "BQYHJGJHJ";         
const INSTANCE_NAME = "disparo_chatwoot";        

// Rota que o Chatwoot vai chamar na automação
app.post('/webhook/chatwoot', async (req, res) => {
    const payloadChatwoot = req.body;

    // Proteção contra testes vazios no Postman
    if (!payloadChatwoot || Object.keys(payloadChatwoot).length === 0) {
        return res.status(400).json({ error: "Payload vazio. Envie um JSON válido." });
    }

    // 1. TRAVA DE SEGURANÇA: Evitar loop infinito
    if (payloadChatwoot.message_type !== 'incoming') {
        return res.status(200).send('Ignorado: a mensagem não é do cliente.');
    }

    // 2. EXTRAIR O NÚMERO DO CLIENTE DO JSON DO CHATWOOT
    let number = payloadChatwoot.sender?.phone_number;

    if (!number) {
        return res.status(400).json({ error: "Número não encontrado no payload." });
    }

    // Limpar o sinal de '+' que o Chatwoot costuma colocar
    number = number.replace('+', '');

    // 3. SEU SISTEMA DE i18n
    const language = payloadChatwoot.sender?.custom_attributes?.language || 'pt-BR';

    let textSim = "Sim";
    let textNao = "Não";
    let question = "Olá! Este atendimento é para você?";

    if (language === 'en-US') {
        textSim = "Yes";
        textNao = "No";
        question = "Hello! Is this service for you?";
    }

   // 4. MONTAR O PAYLOAD DA EVOLUTION E DISPARAR
    const payloadEvolution = {
        number: number,
        options: { delay: 1200, presence: "composing" },
        text: question,
        footer: "Selecione uma opção abaixo:",
        buttons: [
            {
                type: "reply",
                reply: {
                    id: "btn_sim",
                    title: textSim
                }
            },
            {
                type: "reply",
                reply: {
                    id: "btn_nao",
                    title: textNao
                }
            }
        ]
    };

    try {
        console.log(`\nDisparando menu para ${number}...`);
        await axios.post(
            `${EVOLUTION_URL}/message/sendButtons/${INSTANCE_NAME}`,
            payloadEvolution,
            { headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' } }
        );
        console.log("✅ Menu enviado com sucesso!");
        return res.status(200).json({ success: true });
        
    } catch (error) {
        // AQUI ESTÁ O AJUSTE QUE VAI NOS MOSTRAR O MOTIVO DO ERRO 400
        const detalhesErro = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
        
        console.error("\n❌ Erro detalhado da Evolution:");
        console.error(detalhesErro);
        console.error("----------------------------------\n");

        return res.status(500).json({ error: "Falha na Evolution", detalhes: detalhesErro });
    }
});

app.listen(3001, () => console.log(`🚀 Back-end rodando na porta 3001`));