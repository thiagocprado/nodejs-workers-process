import { createReadStream } from "fs";
import readline from "readline";
import { initialize } from "./clusters.js";
import { sequelize, validateOrCreateTable } from "../db/connection.js";
import ValidatedUser from "../db/validated-users.model.js";
import cliProgress from "cli-progress";

const inputFilePath = "./data/validated_users.ndjson"; // Caminho do arquivo de entrada NDJSON.
const CLUSTER_SIZE = 8; // Número de processos filhos (clusters) a serem criados.
const INIT_TIMEOUT = 8000; // Tempo (em milissegundos) para aguardar a inicialização dos clusters.

async function main() {
  try {
    // Garante que a tabela correspondente ao modelo ValidatedUser existe no banco.
    await validateOrCreateTable(sequelize, ValidatedUser);

    let totalLines = 0; // Contador total de linhas lidas do arquivo.
    let processedLines = 0; // Contador de linhas já processadas pelos processos filhos.

    const progressBar = new cliProgress.SingleBar( // Cria uma barra de progresso para acompanhar o processamento.
      {
        format:
          "Progress [{bar}] {percentage}% | {value}/{total} records | {duration_formatted}",
        clearOnComplete: true,
      },
      cliProgress.Presets.shades_classic
    );

    // Inicializa os processos filhos com o arquivo de tarefa e a função callback.
    const cp = initialize({
      backgroundTaskFile: "./src/child_process/background-task.js",
      clusterSize: CLUSTER_SIZE,
      onMessage: () => {
        // Incrementa o contador quando um processo filho sinaliza que terminou.
        processedLines++;
        progressBar.update(processedLines);

        // Se todas as linhas foram processadas, encerra todos os processos filhos.
        if (processedLines >= totalLines) {
          progressBar.stop(); // Para a barra de progresso.
          cp.killAll();
          console.info(`All ${totalLines} lines processed successfully.`);
        }
      },
    });

    // Mensagem de espera para dar tempo aos processos filhos de se estabilizarem.
    console.info(
      `Waiting ${INIT_TIMEOUT / 1000} seconds for clusters to initialize...`
    );

    // Aguarda o tempo definido antes de começar a leitura do arquivo.
    await new Promise((resolve) => setTimeout(resolve, INIT_TIMEOUT));

    console.log("Reading file NDJSON...");

    // Cria um stream de leitura do arquivo de entrada.
    const readStream = createReadStream(inputFilePath);

    // Cria uma interface de leitura linha a linha com o readline.
    const rl = readline.createInterface({ input: readStream });

    // Para cada linha lida do arquivo:
    rl.on("line", (line) => {
      totalLines++; // Incrementa o total de linhas.
      const user = JSON.parse(line); // Converte a linha JSON para objeto.
      cp.sendToChild(user); // Envia o objeto para um processo filho processá-lo.
    });

    // Quando o arquivo for completamente lido, exibe o total de linhas lidas.
    rl.on("close", () => {
      console.info(`Total lines read: ${totalLines}`);
      progressBar.start(totalLines, processedLines); // Inicia a barra de progresso com o total de linhas.
    });

    // Se ocorrer algum erro durante a leitura do arquivo:
    rl.on("error", (error) => {
      console.error("Error reading file NDJSON:", error);
      cp.killAll(); // Encerra todos os processos filhos em caso de erro.
      process.exit(1); // Encerra o processo principal com erro.
    });
  } catch (error) {
    // Captura qualquer erro inesperado no processo principal.
    console.error("Error during processing:", error);
    process.exit(1);
  }
}

main(); // Executa a função principal.
