import ValidatedUser from "../db/validated-users.model.js";

// Registra um listener para o evento 'message' do processo.
// Esse evento é disparado quando o processo filho (child process) recebe uma mensagem do processo pai.
process.on("message", async (user) => {
  try {
    // Tenta criar um novo documento na coleção 'validated-users' com os dados do usuário recebidos.
    await ValidatedUser.create(user);

    // Se for possível enviar uma resposta de volta para o processo pai,
    // envia uma mensagem informando que a criação foi bem-sucedida e inclui um contador.
    if (process.send) process.send({ status: "done", count: 1 });
  } catch (error) {
    // Em caso de erro ao criar o usuário, exibe o erro no console.
    console.error("Error creating user:", error);

    // Se for possível enviar uma resposta de volta para o processo pai,
    // envia uma mensagem com o status de erro e a mensagem de erro.
    if (process.send) process.send({ status: "error", error: error.message });
  }
});
