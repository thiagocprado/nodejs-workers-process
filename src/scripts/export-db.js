import { createWriteStream, mkdirSync, existsSync } from "node:fs";
import User from "../db/user.model";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { connectDB, closeDB } from "../db/connection";

// Diretório onde o arquivo será salvo
const dataDir = "./data";

// Verifica se o diretório 'data' existe; se não existir, cria
if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

// Função geradora assíncrona que busca todos os dados da tabela User em lotes
async function* selectEntireDB() {
  const defaultLimit = 100; // Número de registros por requisição ao banco
  let skip = 0; // Quantidade de registros a serem pulados (offset)

  while (true) {
    // Busca dados do banco com limite e offset
    const data = await User.findAll({
      limit: defaultLimit,
      offset: skip,
      raw: true, // Retorna apenas os dados crus, sem instância do modelo
    });

    skip += defaultLimit; // Atualiza o offset para o próximo lote

    if (!data.length) break; // Se não houver mais dados, encerra o loop

    // Para cada linha do resultado, emite o item com yield
    for (const row of data) yield row;
  }
}

let processedItems = 0; // Contador de registros processados

// Cria uma stream de leitura a partir da função geradora
const dataStream = Readable.from(selectEntireDB()).map((item) => {
  processedItems++; // Incrementa o contador a cada item processado
  return JSON.stringify(item) + "\n"; // Converte o item em JSON + quebra de linha
});

// Função assíncrona autoexecutável para controlar o fluxo
(async () => {
  await connectDB(); // Conecta ao banco de dados
  console.time("export-db"); // Inicia o cronômetro da exportação

  // Liga a stream de dados à escrita no arquivo usando pipeline
  await pipeline(
    dataStream,
    createWriteStream(`${dataDir}/legacy_users.ndjson`)
  );

  // Exibe quantos registros foram processados e o tempo gasto
  console.info(`processed ${processedItems} items`);
  console.timeEnd("export-db");

  await closeDB(); // Fecha a conexão com o banco
})();
