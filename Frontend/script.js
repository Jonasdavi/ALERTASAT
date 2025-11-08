const graficos = {};
let chaves = [];
let intervalo = parseInt(document.getElementById('intervalo').value);
let ultimoJson = null;

document.getElementById('intervalo').addEventListener('change', e => {
  intervalo = parseInt(e.target.value);
  atualizarGraficos();
});

function gerarCorAleatoria(alpha = 1) {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgba(${r},${g},${b},${alpha})`;
}

function agruparVariaveis(chaves) {
  const grupos = {};
  chaves.forEach(chave => {
    const match = chave.match(/^(.*?)([XYZxyz])\s*\(([^)]+)\)$/);
    if (match) {
      const base = match[1].trim();
      const eixo = match[2].toUpperCase();
      const unidade = match[3].trim();
      const baseComUnidade = `${base} (${unidade})`;
      if (!grupos[baseComUnidade]) grupos[baseComUnidade] = {};
      grupos[baseComUnidade][eixo] = chave;
    } else {
      grupos[chave] = chave;
    }
  });
  return grupos;
}

function filtrarDadosPorIntervalo(dados, intervalo) {
  if (intervalo === 1) return dados;
  const resultado = [];
  for (let i = 0; i < dados.length; i += intervalo) {
    resultado.push(dados[i]);
  }
  return resultado;
}

function criarGraficos(chaves) {
  const container = document.getElementById("graficos");
  container.innerHTML = "";

  const grupos = agruparVariaveis(chaves);

  Object.entries(grupos).forEach(([base, valor]) => {
    const div = document.createElement("div");
    div.className = "grafico-container";
    div.innerHTML = `<h2>${base}</h2><canvas id="grafico_${base.replace(/\s+/g, "_")}"></canvas>`;
    container.appendChild(div);

    const ctx = document.getElementById(`grafico_${base.replace(/\s+/g, "_")}`).getContext("2d");

    let datasets;
    if (typeof valor === "object") {
      datasets = Object.entries(valor).map(([eixo, nomeVar]) => ({
        label: eixo,
        chave: nomeVar,
        data: [],
        borderColor: gerarCorAleatoria(),
        backgroundColor: gerarCorAleatoria(0.2),
        fill: false,
        tension: 0.1
      }));
    } else {
      datasets = [{
        label: base,
        chave: valor,
        data: [],
        borderColor: gerarCorAleatoria(),
        backgroundColor: gerarCorAleatoria(0.2),
        fill: false,
        tension: 0.1
      }];
    }

    graficos[base] = new Chart(ctx, {
      type: "line",
      data: { labels: [], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
          legend: { labels: { color: '#fff' } }
        },
        scales: {
          x: {
            title: { display: true, text: "Horário (HH:MM)", color: '#fff' },
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


function atualizarInfoData(data) {
  const infoDiv = document.getElementById("info-data");
  infoDiv.textContent = `Data inicial: ${data}`;
}


async function atualizarGraficos() {
  try {
    const resposta = await fetch("https://alertasat.onrender.com");
    const json = await resposta.json();

    if (!Array.isArray(json) || json.length === 0) return;

    const jsonStr = JSON.stringify(json);
    if (jsonStr === ultimoJson) return;
    ultimoJson = jsonStr;

    const dadosFiltrados = filtrarDadosPorIntervalo(json, intervalo);

    // Atualiza a info de data usando o primeiro ponto
    const primeiroItem = dadosFiltrados[0];
    if (primeiroItem.data) {
      atualizarInfoData(primeiroItem.data);
    }

    // define chaves se for o primeiro carregamento
    if (chaves.length === 0) {
      chaves = Object.keys(json[0]).filter(
        c => c.toLowerCase() !== "data" && c.toLowerCase() !== "hora"
      );
      criarGraficos(chaves);
    }

    // cria labels com base em data + hora
    const labels = dadosFiltrados.map(item => `${item.hora}`);

    // atualiza gráficos
    Object.entries(graficos).forEach(([base, chart]) => {
      chart.data.labels = labels;
      chart.data.datasets.forEach(ds => {
        ds.data = dadosFiltrados.map(item => item[ds.chave]);
      });
      chart.update();
    });

  } catch (erro) {
    console.error("Erro ao buscar dados:", erro);
  }
}

atualizarGraficos();
setInterval(atualizarGraficos, 60000);
