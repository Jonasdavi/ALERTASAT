// ==========================
// Configuração inicial
// ==========================
let sensores = {
    temperatura: 25,  // °C
    umidade: 50,      // %
    pressao: 1013,    // hPa
    co2: 400,         // ppm
    tvoc: 100,        // ppb
};

let alertasAtivos = {};
const REENVIO_INTERVALO = 30 * 60 * 1000; // 30 minutos

// ==========================
// Função que define nível de alerta
// ==========================
function nivelAlerta(sensor, valor) {
    switch(sensor) {
        case "temperatura":
            if (valor < 0 || valor > 40) return "CRITICAL";
            if (valor < 5 || valor > 35) return "WARNING";
            return "NORMAL";
        case "umidade":
            if (valor < 20 || valor > 90) return "CRITICAL";
            if (valor < 30 || valor > 80) return "WARNING";
            return "NORMAL";
        case "pressao":
            if (valor < 980) return "CRITICAL"; // tempestade
            if (valor < 1000) return "WARNING";
            return "NORMAL";
        case "co2":
            if (valor > 1000) return "CRITICAL";
            if (valor > 800) return "WARNING";
            return "NORMAL";
        case "tvoc":
            if (valor > 500) return "CRITICAL";
            if (valor > 300) return "WARNING";
            return "NORMAL";
        default:
            return "NORMAL";
    }
}

// ==========================
// Mensagem explicativa por sensor
// ==========================
function mensagemExplicativa(sensor, valor, nivel) {
    if (nivel === "NORMAL") return null;
    switch(sensor) {
        case "temperatura":
            if (valor > 40) return `❌ Calor extremo detectado: ${valor}°C. População vulnerável deve se hidratar, evitar exposição solar e buscar locais frescos.`;
            if (valor < 0) return `❌ Frio intenso detectado: ${valor}°C. Risco de hipotermia. População deve se agasalhar e limitar atividades externas.`;
            break;
        case "umidade":
            if (valor > 90) return `❌ Alta umidade: ${valor}%. Possível risco de doenças respiratórias e proliferação de fungos. Evite locais úmidos e mal ventilados.`;
            if (valor < 20) return `❌ Umidade muito baixa: ${valor}%. Risco de ressecamento e incêndio. Mantenha hidratação e precaução.`;
            break;
        case "pressao":
            if (valor < 980) return `❌ Baixa pressão detectada: ${valor} hPa. Possível tempestade intensa. População deve buscar abrigo seguro.`;
            if (valor < 1000) return `⚠️ Pressão baixa: ${valor} hPa. Fique atento a mudanças climáticas.`;
            break;
        case "co2":
            if (valor > 1000) return `❌ Qualidade do ar ruim detectada (CO2: ${valor} ppm). Ventile locais internos imediatamente.`;
            break;
        case "tvoc":
            if (valor > 500) return `❌ Poluição do ar detectada (tVOC: ${valor} ppb). População vulnerável deve evitar atividades ao ar livre.`;
            break;
    }
    return null;
}

// ==========================
// Atualização de alertas
// ==========================
export function atualizarAlertas(sensores) {
    let novosAlertas = [];
    let agora = Date.now();

    for (let sensor in sensores) {
        let valor = sensores[sensor];
        let nivel = nivelAlerta(sensor, valor);
        let alertaAnterior = alertasAtivos[sensor];

        // Atualiza o status mesmo que NORMAL (para histórico)
        if (!alertaAnterior) {
            alertasAtivos[sensor] = { nivel, ultimoEnvio: 0 };
            alertaAnterior = alertasAtivos[sensor];
        }

        // Só criar alerta se nivel não for NORMAL
        if (nivel !== "NORMAL") {
            if (alertaAnterior.nivel !== nivel || (agora - alertaAnterior.ultimoEnvio > REENVIO_INTERVALO)) {
                alertasAtivos[sensor].nivel = nivel;
                alertasAtivos[sensor].ultimoEnvio = agora;
                novosAlertas.push({ sensor, nivel, valor });
            }
        } else {
            // Se voltou ao NORMAL, atualiza o nível, mas não envia alerta
            alertasAtivos[sensor].nivel = nivel;
        }
    }

    // Filtra apenas alertas com mensagem explicativa real
    const alertasComMensagem = novosAlertas
        .map(a => {
            const mensagem = mensagemExplicativa(a.sensor, a.valor, a.nivel);
            return mensagem ? { ...a, mensagem } : null;
        })
        .filter(a => a !== null);

    if (alertasComMensagem.length > 0) exibirAlertas(alertasComMensagem);
}


// ==========================
// Exibir e enviar alertas agrupados
// ==========================
function exibirAlertas(alertas) {
    if (alertas.length === 0) return;

    let msgExplicativa = "⚠️ ALERTAS PARA POPULAÇÃO:\n\n";

    alertas.forEach(a => {
        const explicacao = mensagemExplicativa(a.sensor, a.valor, a.nivel);
        if (explicacao) msgExplicativa += explicacao + "\n\n";
    });

    // Envia email e exibe alert() de feedback
    enviarEmail("jonas.davi@escolar.ifrn.edu.br", msgExplicativa);
}

// ==========================
// Função de envio de email (EmailJS) com alert() de retorno
// ==========================
function enviarEmail(destinatario, mensagem){
    var templateParams = {
        from_name: 'Alertasat',
        to_email: destinatario,
        message: mensagem
    };

    emailjs.send('service_0yevh1u', 'template_z0ppads', templateParams).then(
        (response) => {
            alert(`✅ Email enviado com sucesso!\nStatus: ${response.status}`);
        },
        (error) => {
            alert(`❌ Falha ao enviar email!\nErro: ${JSON.stringify(error)}`);
        }
    );
}

// ==========================
// Inicialização do EmailJS
// ==========================
emailjs.init({
    publicKey: 'X1NVc78SANfj0q-as',
    blockHeadless: true,
    limitRate: { id: 'app', throttle: 10000 }
});
