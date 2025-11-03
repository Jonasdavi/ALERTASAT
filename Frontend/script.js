

const graficos = {};
let chaves = [];
let intervalo = parseInt(document.getElementById('intervalo').value);

const unidades = {
    1: 'Minutos atrás',
    5: 'Minutos atrás',
    10: 'Minutos atrás',
    15: 'Minutos atrás',
    30: 'Minutos atrás',
    60: 'Horas atrás'
};

document.getElementById('intervalo').addEventListener('change', e => {
    intervalo = parseInt(e.target.value);
    atualizarGraficos();
});

function criarGraficos(chaves) {
    const container = document.getElementById("graficos");
    container.innerHTML = "";
    chaves.forEach(chave => {
    const div = document.createElement("div");
    div.className = "grafico-container";
    div.innerHTML = `<h2>${chave}</h2><canvas id="grafico_${chave}"></canvas>`;
    container.appendChild(div);

    const ctx = document.getElementById(`grafico_${chave}`).getContext("2d");

    graficos[chave] = new Chart(ctx, {
        type: "line",
        data: { 
        labels: [], 
        datasets: [{
            label: chave,
            data: [],
            borderColor: gerarCorAleatoria(),
            backgroundColor: gerarCorAleatoria(0.2),
            fill: false,
            tension: 0.1
        }]
        },
        options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
            legend: { labels: { color: '#fff' } }
        },
        scales: {
            x: { 
            title: { display: true, text: unidades[intervalo], color: '#fff' },
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: { 
            title: { display: true, text: "Valor", color: '#fff' },
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255,255,255,0.1)' }
            }
        }
        }
    });
    });
}

function gerarCorAleatoria(alpha = 1) {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    return `rgba(${r},${g},${b},${alpha})`;
}

function filtrarDadosPorIntervalo(dados, intervalo) {
    if(intervalo === 1) return dados;
    const resultado = [];
    for(let i = 0; i < dados.length; i += intervalo) {
    resultado.push(dados[i]);
    }
    return resultado;
}

async function atualizarGraficos() {
    try {
    const resposta = await fetch("https://alertasat.onrender.com");
    const json = await resposta.json();

    if (!Array.isArray(json) || json.length === 0) return;

    if (chaves.length === 0) {
        chaves = Object.keys(json[0]);
        criarGraficos(chaves);
    }

    const dadosFiltrados = filtrarDadosPorIntervalo(json, intervalo);

    const labels = dadosFiltrados.map((_, i) => {
        const valor = (dadosFiltrados.length - 1 - i) * intervalo;
        return intervalo >= 60 ? (valor / 60) + 'h' : valor + 'min';
    });

    chaves.forEach(chave => {
        const grafico = graficos[chave];
        if (grafico) {
        grafico.data.labels = labels;
        grafico.data.datasets[0].data = dadosFiltrados.map(item => item[chave]);
        grafico.options.scales.x.title.text = unidades[intervalo];
        grafico.update();
        }
    });
    } catch (erro) {
    console.error("Erro ao buscar dados:", erro);
    }
}

atualizarGraficos();
setInterval(atualizarGraficos, 60000); // atualizar a cada minuto
