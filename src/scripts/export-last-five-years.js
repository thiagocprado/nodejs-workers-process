import { createWriteStream, mkdirSync, existsSync } from "fs";
import User from "../db/user.model.js";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { connectDB, closeDB } from "../db/connection.js";

const dataDir = "./data"; // Define o diretório onde o arquivo exportado será salvo.

// Verifica se o diretório 'data' existe. Se não existir, cria o diretório.
if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

// Função geradora assíncrona que retorna todos os registros da tabela User, em lotes.
async function* selectEntireDB() {
  const defaultLimit = 100; // Define o tamanho do lote de registros a serem buscados por vez.
  let skip = 0; // Controla o deslocamento para paginação dos dados.

  while (true) {
    // Busca um lote de usuários do banco de dados com base no offset atual.
    const data = await User.findAll({
      limit: defaultLimit,
      offset: skip,
      raw: true, // Retorna os dados como objetos simples, sem instanciar modelos Sequelize.
    });

    skip += defaultLimit; // Avança o offset para o próximo lote.

    // Se não houver mais dados, encerra a iteração.
    if (!data.length) break;

    // Para cada usuário retornado, gera (yield) o item para o stream.
    for (const row of data) yield row;
  }
}

let processedItems = 0; // Contador de itens processados.

// Cria um stream legível a partir da função geradora selectEntireDB().
const stream = Readable.from(selectEntireDB())
  // Filtra apenas os usuários criados nos últimos 5 anos.
  .filter(
    ({ createdAt }) =>
      new Date(createdAt) > new Date(new Date().getFullYear() - 5, 0, 1)
  )
  // Para cada item, incrementa o contador e o transforma em uma linha NDJSON (JSON + newline).
  .map((item) => {
    processedItems++;
    return JSON.stringify(item).concat("\n");
  });

// Função autoexecutável assíncrona para rodar o processo completo.
(async () => {
  console.time("export-last-five-years"); // Inicia um timer para medir a duração da exportação.
  await connectDB(); // Conecta ao banco de dados.

  // Usa pipeline para enviar o stream processado para um arquivo NDJSON no diretório 'data'.
  await pipeline(stream, createWriteStream(`${dataDir}/users.ndjson`));

  console.timeEnd("export-last-five-years"); // Finaliza e mostra o tempo da operação.
  console.info(`processed ${processedItems} items`); // Mostra quantos itens foram processados.

  await closeDB(); // Fecha a conexão com o banco de dados.
})();
