import nodemailer from 'nodemailer';
import { Resend } from "resend";

const resend = new Resend('re_478fBjc4_EQSkAjRVN8cvVqMXjPtuKFdS');

let alertasAtivos = {};
const REENVIO_INTERVALO = 30 * 60 * 1000; // 30 min

// ==========================
// Níveis de alerta calibrados para Natal - RN / Nordeste
// ==========================
function nivelAlerta(sensor, valor) {
    switch(sensor) {

        // 🌡️ Temperatura (°C)
        // Média anual: 26–32°C. Extremos abaixo de 18°C ou acima de 38°C já são anormais.
        case "temperatura":
            if (valor < 17 || valor > 38) return "CRITICAL";   // frio ou calor extremo
            if (valor < 20 || valor > 35) return "WARNING";    // desconfortável
            return "NORMAL";

        // 💧 Umidade relativa (%)
        // Normalmente entre 60–85% no litoral. Abaixo de 40% é ar seco perigoso.
        case "umidade":
            if (valor < 35 || valor > 95) return "CRITICAL";   // risco à saúde
            if (valor < 45 || valor > 90) return "WARNING";    // desconfortável
            return "NORMAL";

        // 🌬️ Pressão atmosférica (hPa)
        // Média local ~1012 hPa. Abaixo de 1000 hPa indica instabilidade ou tempestade.
        case "pressao":
            if (valor < 995 || valor > 1025) return "CRITICAL"; // tempestade / frente forte
            if (valor < 1005 || valor > 1020) return "WARNING"; // variação relevante
            return "NORMAL";

        // 🫁 Dióxido de carbono (ppm)
        // Ar puro: ~400 ppm. Ambientes fechados com >1000 ppm já causam sonolência.
        case "co2":
            if (valor > 1500) return "CRITICAL"; // ar irrespirável ou mau ventilado
            if (valor > 1000) return "WARNING";  // ventilação insuficiente
            return "NORMAL";

        // ☣️ Compostos orgânicos voláteis totais (tVOC, ppb)
        // Ambientes urbanos costumam ter <200 ppb. >500 já é perigoso.
        case "tvoc":
            if (valor > 800) return "CRITICAL";  // ar contaminado
            if (valor > 400) return "WARNING";   // poluição moderada
            return "NORMAL";

        default:
            return "NORMAL";
    }
}


// ==========================
// Explicação base por sensor — adaptada para Natal (RN) / Nordeste
// ==========================
function mensagemBase(sensor, valor, nivel) {
    switch(sensor) {

        // 🌡️ Temperatura
        case "temperatura":
            if (valor > 38)
                return `🔥 Calor extremo detectado (${valor}°C). Risco de desidratação e superaquecimento. Evite exposição prolongada ao sol.`;
            if (valor > 35)
                return `🌞 Temperatura elevada (${valor}°C). Mantenha-se hidratado e em locais ventilados.`;
            if (valor < 20)
                return `🌤️ Temperatura mais baixa que o habitual (${valor}°C). Pode causar desconforto em ambientes abertos.`;
            if (valor < 17)
                return `🥶 Frio incomum detectado (${valor}°C). Pouco comum para a região litorânea.`;
            break;

        // 💧 Umidade relativa
        case "umidade":
            if (valor > 95)
                return `💦 Umidade extremamente alta (${valor}%). Pode favorecer mofo e desconforto térmico.`;
            if (valor > 90)
                return `🌫️ Umidade elevada (${valor}%). Sensação de abafamento e risco de proliferação de fungos.`;
            if (valor < 35)
                return `🌵 Ar muito seco (${valor}%). Risco de irritações respiratórias e desidratação.`;
            if (valor < 45)
                return `💨 Umidade baixa (${valor}%). Evite longas exposições e mantenha boa hidratação.`;
            break;

        // 🌬️ Pressão atmosférica
        case "pressao":
            if (valor < 995)
                return `🌪️ Pressão muito baixa (${valor} hPa). Indica instabilidade atmosférica ou formação de tempestades.`;
            if (valor < 1005)
                return `🌧️ Pressão levemente baixa (${valor} hPa). Possibilidade de tempo nublado ou chuva.`;
            if (valor > 1025)
                return `🌤️ Pressão muito alta (${valor} hPa). Tempo estável e seco, comum em períodos de estiagem.`;
            if (valor > 1020)
                return `☀️ Pressão acima do normal (${valor} hPa). Indica tempo firme e seco.`;
            break;

        // 🫁 Dióxido de carbono (CO₂)
        case "co2":
            if (valor > 1500)
                return `🚫 Concentração de CO₂ muito alta (${valor} ppm). Risco à saúde em locais fechados. Ventile o ambiente imediatamente.`;
            if (valor > 1000)
                return `⚠️ Nível de CO₂ elevado (${valor} ppm). Pode causar sonolência e desconforto. Recomenda-se ventilação.`;
            break;

        // ☣️ Compostos Orgânicos Voláteis Totais (tVOC)
        case "tvoc":
            if (valor > 800)
                return `☣️ Alta concentração de compostos voláteis (${valor} ppb). Pode indicar poluição do ar ou produtos químicos próximos.`;
            if (valor > 400)
                return `⚠️ Poluição leve do ar (${valor} ppb). Mantenha janelas abertas e evite fontes de fumaça.`;
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
