import { connectDB, closeDB } from "../db/connection.js";
import User from "../db/user.model.js";
import { faker } from "@faker-js/faker";

function generateUser() {
  return {
    name: faker.internet.username(),
    company: faker.company.name(),
    dateBirth: faker.date.past(),
    password: faker.internet.username() + faker.company.name(),
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
}

// async function seedUser() {
//   try {
//     for (let i = 0; i < 200_000; i++) {
//       const user = generateUser();
//       await User.create(user);
//     }

//     console.info("user seeding completed");
//   } catch (error) {
//     console.error("error while seeding user", error);
//   }
// }

async function seedUser() {
  const batchSize = 1000;

  try {
    // Loop que processa 200.000 usuários em lotes (batches) para otimizar performance
    for (let i = 0; i < 200_000; i += batchSize) {
      // Cria um array com 1000 usuários (batchSize) usando Array.from
      // Para cada posição do array, chama generateUser() que retorna um objeto usuário fake
      const batch = Array.from({ length: batchSize }, () => generateUser());

      // Executa todas as inserções do lote em paralelo usando Promise.all
      // Mapeia cada usuário do lote para User.create() e aguarda todas as promises resolverem
      // Isso é muito mais eficiente que inserir um por vez sequencialmente
      // await Promise.all(batch.map((user) => User.create(user)));

      await User.bulkCreate(batch);

      console.log(`${i + batchSize} of 200.000 users inserted`);
    }

    console.info("user seeding completed");
  } catch (error) {
    console.error("error while seeding user", error);
  }
}

(async () => {
  await connectDB();
  console.time("seed-db");
  await seedUser();
  console.timeEnd("seed-db");
  await closeDB();
})();
