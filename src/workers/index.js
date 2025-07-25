// Importa funções de leitura e escrita de arquivos do módulo 'fs'.
import { createReadStream, createWriteStream } from "fs";

// Importa o construtor 'Worker' da API de worker threads.
import { Worker } from "worker_threads";

// Importa a lib 'readline', usada para ler arquivos linha por linha.
import readline from "readline";

// Define os caminhos dos arquivos de entrada e saída.
const inputFilePath = "./data/legacy_users.ndjson";
const outputFilePath = "./data/users_encrypted.ndjson";

// Define o número de workers que serão usados para processar os dados em paralelo.
const numWorkers = 4;

// Cria um array com 4 instâncias de workers, apontando para o script que fará a criptografia.
const workers = Array.from(
  { length: numWorkers },
  () => new Worker("./src/workers/encrypt-worker.js")
);

// Função que usa um worker para criptografar um item.
function encryptWithWorker(item) {
  return new Promise((resolve, reject) => {
    // Busca um worker disponível (a verificação aqui é simplificada).
    const worker = workers.find((w) => w.threadId !== null);

    // Se nenhum worker estiver disponível, rejeita a Promise.
    if (!worker) {
      return reject(new Error("No available worker threads"));
    }

    // Função para remover os listeners de evento após uso (boa prática).
    const cleanup = () => {
      worker.off("message", onMessage);
      worker.off("error", onError);
    };

    // Listener que será chamado quando o worker retornar o item criptografado.
    const onMessage = (encryptedItem) => {
      resolve(JSON.stringify(encryptedItem).concat("\n")); // Formata para NDJSON.
      cleanup(); // Remove os listeners.
    };

    // Listener para erros que possam ocorrer no worker.
    const onError = (error) => {
      console.error("Worker error:", error);
      reject(error);
      cleanup();
    };

    // Registra os listeners de mensagem e erro — uma única vez.
    worker.once("message", onMessage);
    worker.once("error", onError);

    // Envia o item para o worker processar.
    worker.postMessage(item);
  });
}

// Função principal que processa o arquivo linha por linha.
async function processFile() {
  // Cria um stream de leitura do arquivo de entrada.
  const readStream = createReadStream(inputFilePath);

  // Cria um stream de escrita para o arquivo de saída.
  const writeStream = createWriteStream(outputFilePath);

  // Cria uma interface para ler o arquivo linha por linha.
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity, // Garante compatibilidade com diferentes sistemas.
  });

  // Itera sobre cada linha do arquivo.
  for await (const line of rl) {
    const item = JSON.parse(line); // Converte JSON em objeto.
    const encryptedLine = await encryptWithWorker(item); // Processa com worker.
    writeStream.write(encryptedLine); // Escreve resultado no novo arquivo.
  }

  // Finaliza o stream de escrita.
  writeStream.end();
}

// Função autoexecutável que inicia o processo completo.
(async () => {
  console.time("password-encrypt"); // Inicia medição de tempo.

  await processFile(); // Processa o arquivo de entrada.

  // Finaliza todos os workers após o uso.
  workers.forEach((worker) => worker.terminate());

  console.timeEnd("password-encrypt"); // Finaliza a medição de tempo.
  console.info("Encryption completed successfully."); // Log de sucesso.
})();
