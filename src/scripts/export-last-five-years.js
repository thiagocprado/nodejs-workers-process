import { createWriteStream, mkdirSync, existsSync } from "fs";
import User from "../db/user.model.js";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { connectDB, closeDB } from "../db/connection.js";

const dataDir = "./data";

if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

async function* selectEntireDB() {
  const defaultLimit = 100;
  let skip = 0;

  while (true) {
    const data = await User.findAll({
      limit: defaultLimit,
      offset: skip,
      raw: true,
    });

    skip += defaultLimit;

    if (!data.length) break;
    for (const row of data) yield row;
  }
}

let processedItems = 0;

const stream = Readable.from(selectEntireDB())
  .filter(
    ({ createdAt }) =>
      new Date(createdAt) > new Date(new Date().getFullYear() - 5, 0, 1)
  )
  .map((item) => {
    processedItems++;
    return JSON.stringify(item).concat("\n");
  });

(async () => {
  console.time("export-last-five-years");
  await connectDB();
  await pipeline(stream, createWriteStream(`${dataDir}/users.ndjson`));
  console.timeEnd("export-last-five-years");
  console.info(`processed ${processedItems} items`);
  await closeDB();
})();
