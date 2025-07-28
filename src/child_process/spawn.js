import { spawn } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import readline from "readline";

const inputFilePath = "./data/users.ndjson"; // Caminho do arquivo de entrada com os dados dos usuários em formato NDJSON.
const outputFilePath = "./data/validated_users.ndjson"; // Caminho do arquivo de saída que armazenará os usuários validados.

async function processWithPython() {
  // Cria um processo filho que executa o script Python responsável por validar senhas.
  const pythonProcess = spawn("python3", [
    "./src/scripts/validate_passwords.py",
  ]);

  // Cria um stream de leitura a partir do arquivo de entrada.
  const inputStream = createReadStream(inputFilePath);

  // Cria um stream de escrita para salvar os dados de saída do processo Python.
  const outputStream = createWriteStream(outputFilePath);

  // Cria uma interface para ler o arquivo linha por linha (útil no caso de NDJSON).
  const rl = readline.createInterface({
    input: inputStream,
  });

  // Para cada linha lida do arquivo, envia a linha como entrada para o script Python.
  rl.on("line", (line) => {
    pythonProcess.stdin.write(line + "\n");
  });

  // Quando a leitura do arquivo termina, fecha a entrada padrão (stdin) do processo Python.
  rl.on("close", () => {
    pythonProcess.stdin.end();
  });

  // Quando o script Python envia dados pela saída padrão (stdout), escreve esses dados no arquivo de saída.
  pythonProcess.stdout.on("data", (data) => {
    outputStream.write(data.toString());
  });

  // Quando o processo Python finaliza, encerra o stream de escrita e exibe o status.
  pythonProcess.on("close", (code) => {
    outputStream.end();

    // Se o processo Python finalizou com sucesso (código 0), exibe mensagem de sucesso.
    if (code === 0) {
      console.info("Python process completed successfully");
    } else {
      // Caso contrário, exibe mensagem de erro com o código de saída.
      console.error(`Python process exited with code ${code}`);
    }
  });
}

// Executa a função para iniciar o processamento.
processWithPython();
