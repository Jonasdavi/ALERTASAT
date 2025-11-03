import nodemailer from 'nodemailer';
import { Resend } from "resend";

const resend = new Resend('re_478fBjc4_EQSkAjRVN8cvVqMXjPtuKFdS');

let alertasAtivos = {};
const REENVIO_INTERVALO = 30 * 60 * 1000; // 30 min

// ==========================
// Níveis de alerta
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
            if (valor < 980) return "CRITICAL";
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
// Explicação base por sensor
// ==========================
function mensagemBase(sensor, valor, nivel) {
    switch(sensor) {
        case "temperatura":
            if (valor > 40) return `Calor extremo detectado (${valor}°C).`;
            if (valor < 0) return `Frio intenso detectado (${valor}°C).`;
            if (valor > 35) return `Temperatura elevada (${valor}°C).`;
            if (valor < 5) return `Temperatura muito baixa (${valor}°C).`;
            break;
        case "umidade":
            if (valor > 90) return `Umidade extremamente alta (${valor}%).`;
            if (valor < 20) return `Umidade extremamente baixa (${valor}%).`;
            if (valor > 80) return `Umidade acima do normal (${valor}%).`;
            if (valor < 30) return `Umidade abaixo do normal (${valor}%).`;
            break;
        case "pressao":
            if (valor < 980) return `Baixa pressão atmosférica (${valor} hPa).`;
            if (valor < 1000) return `Pressão atmosférica reduzida (${valor} hPa).`;
            break;
        case "co2":
            if (valor > 1000) return `Concentração de CO₂ perigosa (${valor} ppm).`;
            if (valor > 800) return `Níveis de CO₂ elevados (${valor} ppm).`;
            break;
        case "tvoc":
            if (valor > 500) return `Alta concentração de compostos voláteis (${valor} ppb).`;
            if (valor > 300) return `Poluição leve do ar (${valor} ppb).`;
            break;
    }
    return null;
}

// ==========================
// Envio de e-mail
// ==========================

const REMETENTE = "onboarding@resend.dev";

export async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    const result = await resend.emails.send({
      from: REMETENTE,
      to: destinatario,
      subject: assunto, // agora usa o parâmetro passado
      text: mensagem,
    });

    console.log("✅ Email enviado com sucesso!", result);
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
  }
}


// ==========================
// Envia alerta agrupado com explicações
// ==========================
async function exibirAlertas(alertas) {
    if (alertas.length === 0) return;

    let mensagem = "⚠️ ALERTAS ATIVOS NOS SENSORES ⚠️\n\n";

    alertas.forEach(a => {
        mensagem += `📍 *Sensor:* ${a.sensor.toUpperCase()}\n`;
        mensagem += `🔹 *Nível:* ${a.nivel}\n`;
        mensagem += `🔹 *Valor:* ${a.valor}\n`;
        mensagem += `💬 *Situação:* ${a.explicacao}\n\n`;
    });

    mensagem += "🔁 Este email foi gerado automaticamente pelo sistema de monitoramento Alertasat.";

    await enviarEmail("jonas.davi@escolar.ifrn.edu.br", "⚠ Alerta de Sensores — Atualização", mensagem);
}

// ==========================
// Atualiza estado e decide envio
// ==========================
export function atualizarAlertas(sensores) {
    let agora = Date.now();
    let alertasParaEnviar = [];

    for (let sensor in sensores) {
        const valor = sensores[sensor];
        const nivel = nivelAlerta(sensor, valor);
        const alertaAnterior = alertasAtivos[sensor];

        // Caso novo
        if (!alertaAnterior && nivel !== "NORMAL") {
            alertasAtivos[sensor] = { nivel, valor, ultimoEnvio: agora };
            alertasParaEnviar.push({
                sensor,
                nivel,
                valor,
                explicacao: `🚨 Novo alerta detectado: ${mensagemBase(sensor, valor, nivel)}`
            });
            console.log(`🆕 Novo alerta (${sensor}): ${nivel}`);
        }

        // Caso já ativo
        else if (alertaAnterior) {
            // Mudança de nível
            if (alertaAnterior.nivel !== nivel && nivel !== "NORMAL") {
                alertasAtivos[sensor] = { nivel, valor, ultimoEnvio: agora };
                alertasParaEnviar.push({
                    sensor,
                    nivel,
                    valor,
                    explicacao: `⚠ Mudança de nível de alerta: agora ${nivel}. ${mensagemBase(sensor, valor, nivel)}`
                });
                console.log(`🔁 Alerta alterado (${sensor}): ${nivel}`);
            }
            // Mesmo nível, reenvio após intervalo
            else if (nivel !== "NORMAL" && agora - alertaAnterior.ultimoEnvio > REENVIO_INTERVALO) {
                alertasAtivos[sensor].ultimoEnvio = agora;
                alertasParaEnviar.push({
                    sensor,
                    nivel,
                    valor,
                    explicacao: `🔁 Reenvio automático: alerta persiste há mais de 30 minutos. ${mensagemBase(sensor, valor, nivel)}`
                });
                console.log(`⏰ Reenvio (${sensor})`);
            }
            // Normalizou
            else if (nivel === "NORMAL" && alertaAnterior.nivel !== "NORMAL") {
                delete alertasAtivos[sensor];
                alertasParaEnviar.push({
                    sensor,
                    nivel,
                    valor,
                    explicacao: `✅ Sensor normalizado (${valor}). Alerta encerrado.`
                });
                console.log(`✅ Sensor ${sensor} voltou ao normal`);
            }
        }
    }

    if (alertasParaEnviar.length > 0) {
        exibirAlertas(alertasParaEnviar);
    }
}
