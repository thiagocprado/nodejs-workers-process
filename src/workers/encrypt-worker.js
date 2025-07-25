// Importa a 'parentPort' do módulo 'worker_threads'.
// 'parentPort' é o canal de comunicação entre o worker e o processo principal.
import { parentPort } from "worker_threads";

// Importa o módulo 'crypto' do Node.js, usado para operações criptográficas (como hashing).
import crypto from "crypto";

// Define um listener para o evento 'message'.
// Esse evento é disparado quando o processo principal envia uma mensagem para esse worker.
parentPort.on("message", (user) => {
  // Armazena a senha do usuário recebida na mensagem em uma variável.
  let encryptedPassword = user.password;

  // Cria um hash SHA-256 da senha.
  // Isso é uma forma de criptografar a senha de forma irreversível.
  encryptedPassword = crypto
    .createHash("sha256") // Escolhe o algoritmo de hash (SHA-256).
    .update(encryptedPassword) // Informa qual dado será criptografado.
    .digest("hex"); // Define o formato de saída como hexadecimal.

  // Envia de volta ao processo principal o objeto do usuário,
  // substituindo o campo de senha pela versão criptografada.
  parentPort?.postMessage({ ...user, password: encryptedPassword });
});
