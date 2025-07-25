import User from "../db/user.model.js";
import { connectDB, closeDB } from "../db/connection.js";
import { faker } from "@faker-js/faker";
import { Readable } from "stream";

// Função que gera uma stream de usuários falsos
function generateUserStream(totalUsers) {
  let count = 0; // contador de quantos usuários já foram gerados

  return new Readable({
    objectMode: true, // permite enviar objetos (em vez de apenas strings ou buffers)

    // Método chamado automaticamente pela stream sempre que ela precisar de mais dados
    read() {
      // Se já atingiu o total desejado, finaliza a stream
      if (count >= totalUsers) {
        this.push(null); // sinaliza o fim da stream
        return;
      }

      // Cria um usuário fake com o pacote faker
      const user = {
        name: faker.internet.username(),
        company: faker.company.name(),
        dateBirth: faker.date.past(), // data de nascimento fictícia
        password: faker.internet.username() + faker.company.name(), // senha fictícia
        createdAt: faker.date.past({
          years: 10,
          refDate: new Date(),
        }),
        updatedAt: faker.date.past({
          years: 9,
          refDate: new Date(),
        }),
        lastPasswordUpdatedAt: faker.date.past({
          years: 9,
          refDate: new Date(),
        }),
      };

      count++; // incrementa o contador
      this.push(user); // envia o usuário para quem estiver consumindo a stream
    },
  });
}

// Função assíncrona que consome a stream e insere os usuários no banco em lotes
async function insertUserStream(totalUsers) {
  const userStream = generateUserStream(totalUsers); // cria a stream com usuários
  const batchSize = 1000; // define o tamanho de cada lote (batch) de inserção
  let batch = []; // armazena temporariamente os usuários antes de inserir

  // Esse for aguarda cada usuário que a stream for emitindo
  for await (const user of userStream) {
    batch.push(user); // adiciona o usuário ao lote atual

    // Quando atinge o tamanho do lote, insere os dados no banco
    if (batch.length >= batchSize) {
      try {
        await User.bulkCreate(batch); // insere todos os usuários do lote de uma vez
        batch = []; // limpa o lote para começar o próximo
      } catch (error) {
        console.error("error inserting batch", error); // trata erros de inserção
      }
    }
  }

  // Após o loop, pode ter sobrado um lote incompleto (ex: os últimos 500 usuários)
  if (batch.length > 0) {
    try {
      await User.bulkCreate(batch); // insere o último lote
    } catch (error) {
      console.error("error inserting final batch", error);
    }
  }
}

(async () => {
  await connectDB();
  console.time("seed-stream");
  await insertUserStream(200_246);
  console.timeEnd("seed-stream");
  await closeDB();
})();
