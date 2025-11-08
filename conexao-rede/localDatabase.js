import { atualizarAlertas } from "./alertas.js";

export class Sensores {
  #arrayDeObjetos;
  #tamanhoMaximo;

  constructor(tamanhoMaximo) {
    this.#arrayDeObjetos = [];
    this.#tamanhoMaximo = tamanhoMaximo;
  }

  reiniciar(){
    this.#arrayDeObjetos = [];
  }

  // Adiciona um objeto e remove o mais antigo se ultrapassar o limite
  add(obj) {
    if (this.#arrayDeObjetos.length >= this.#tamanhoMaximo && this.#tamanhoMaximo > 0) {
      // Remove o primeiro (mais antigo)
      this.#arrayDeObjetos.shift();
    }
    const novosDados ={
        temperatura: obj["Temperatura (C)"],  // °C
        umidade: obj["Umidade (UR)"],      // %
        pressao: obj["Pressao (hPa)"],    // hPa
        co2: obj["CO2 (ppm)"],         // ppm
        tvoc: obj["TVOC (ppb)"],        // ppb

    }
    atualizarAlertas(novosDados)
    this.#arrayDeObjetos.push(obj);
  }

  // Retorna cópia do array
  get() {
    return this.#arrayDeObjetos;
  }


  // Função que adiciona data e hora atuais ao JSON
  dicionarDataHora(dados) {
  const agora = new Date();

  const data = agora.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const hora = agora.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });

  // Cria uma cópia com os novos campos
  return {
    ...dados, // mantém os dados originais
    data,
    hora
  };
}
}

