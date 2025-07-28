import { fork } from "child_process"; // Importa a função `fork` para criar processos filhos.

// Função utilitária que implementa o algoritmo Round Robin sobre um array.
// Ela retorna uma função que, a cada chamada, retorna o próximo item do array, ciclicamente.
function roundRobin(array, index = 0) {
  return function () {
    if (index >= array.length) index = 0;
    return array[index++];
  };
}

// Função que inicializa um "cluster" de processos filhos com base no arquivo fornecido.
function initializeCluster({ backgroundTaskFile, clusterSize, onMessage }) {
  const processes = new Map(); // Armazena os processos filhos usando o PID como chave.
  const getNextProcess = roundRobin([]); // Inicializa o round robin com array vazio.

  // Cria os processos filhos conforme o tamanho do cluster.
  for (let i = 0; i < clusterSize; i++) {
    const child = fork(backgroundTaskFile); // Cria um novo processo filho executando o arquivo.
    processes.set(child.pid, child); // Armazena o processo no mapa usando o PID.

    // Remove o processo do mapa quando ele for finalizado.
    child.on("exit", () => {
      processes.delete(child.pid);
    });

    // Em caso de erro, mostra o erro e encerra o processo principal.
    child.on("error", (error) => {
      console.error(`Error in child process ${child.pid}:`, error);
      process.exit(1);
    });

    // Ao receber uma mensagem do processo filho, repassa para o callback `onMessage`.
    child.on("message", (message) => {
      onMessage(message, child);
    });

    // Atualiza o array usado pelo round robin com os processos atuais.
    getNextProcess.array = [...processes.values()];
  }

  // Define uma nova função round robin com os processos ativos.
  const getProcess = roundRobin([...processes.values()]);

  // Retorna a função para obter o próximo processo e uma função para matar todos os filhos.
  return {
    getProcess,
    killAll: () => {
      processes.forEach((child) => child.kill());
    },
  };
}

// Função principal que expõe uma interface para enviar dados aos processos filhos.
export function initialize({ backgroundTaskFile, clusterSize, onMessage }) {
  // Inicializa o cluster e obtém os métodos úteis.
  const { getProcess, killAll } = initializeCluster({
    backgroundTaskFile,
    clusterSize,
    onMessage,
  });

  // Função para enviar uma mensagem (por exemplo, um objeto `person`) ao próximo processo disponível.
  function sendToChild(person) {
    const child = getProcess(); // Pega o próximo processo pelo round robin.

    // Garante que o processo ainda está ativo antes de enviar a mensagem.
    if (child && !child.killed) {
      child.send(person);
    }
  }

  // Retorna as funções públicas para enviar dados e encerrar todos os processos.
  return {
    sendToChild,
    killAll,
  };
}
