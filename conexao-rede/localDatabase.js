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
    this.#arrayDeObjetos.push(obj);
  }

  // Retorna cópia do array
  get() {
    return this.#arrayDeObjetos;
  }
}

