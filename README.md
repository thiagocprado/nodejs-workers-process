# Node.js - Fundamentos Avançados

Este documento resume os principais conceitos sobre o funcionamento interno do Node.js, incluindo ciclo de eventos, concorrência, paralelismo, uso de streams, workers e child processes.

---

## 🧠 Node.js, V8 e libuv

- **Node.js** é um runtime JavaScript assíncrono orientado a eventos, construído sobre o mecanismo V8 (usado no Chrome).
- **V8** é o motor que compila JavaScript para código de máquina.
- **libuv** é a biblioteca que fornece a camada de abstração para operações de I/O assíncronas e o **event loop**.

---

## 🔁 Event Loop (Ciclo de Eventos)

O **event loop** é o “coração” do Node.js. Ele permite que uma única thread trate múltiplas operações assíncronas, como requisições a banco de dados, sistema de arquivos ou APIs externas, sem bloquear a execução.

### Como funciona:

1. O Node inicia a execução da stack (parte síncrona).
2. Tarefas assíncronas (como `fs.readFile`) são delegadas para libuv.
3. Quando terminam, são colocadas na **event queue**.
4. O loop verifica a queue e executa os **callbacks** registrados.

---

## ⚔️ Concorrência vs Paralelismo

| Conceito      | Explicação                                                                 |
|---------------|-----------------------------------------------------------------------------|
| Concorrência  | Alternância entre tarefas (não ao mesmo tempo).                           |
| Paralelismo   | Execução real simultânea (em múltiplos núcleos ou threads).               |
| Node.js       | É **concorrente** por padrão (event loop + callbacks).                    |
| Paralelismo   | Pode ser alcançado com **worker_threads** ou **child_process**.           |

---

## 🧵 Threads vs Processos

| Característica        | Thread                          | Processo                        |
|-----------------------|----------------------------------|----------------------------------|
| Definição             | Unidade leve de execução         | Instância isolada de um programa |
| Compartilhamento      | Compartilham memória             | Não compartilham memória         |
| Comunicação           | Através de memória compartilhada | Através de IPC (pipes, sockets)  |
| Custo de criação      | Baixo                            | Alto                             |
| Isolamento            | Baixo                            | Alto                             |
| Uso no Node.js        | `worker_threads`                 | `child_process`                  |

---

## 🧵 Worker Threads

- Usados para **paralelismo real**.
- Criam múltiplos threads dentro do mesmo processo.
- Compartilham memória entre threads (`SharedArrayBuffer`, `MessageChannel`).
- Ideal para cálculos pesados que travariam o event loop.

📘 [Worker Threads - Documentação Oficial](https://nodejs.org/api/worker_threads.html)

---

## 👶 Child Process

- Executa **processos separados** do processo principal.
- Utilizados para rodar scripts externos, comandos shell, etc.
- Comunicação por `stdin`, `stdout`, `stderr`.

📘 [Child Process - Documentação Oficial](https://nodejs.org/api/child_process.html)

---

## 🚿 Streams

- Permitem **processar dados aos poucos**, em vez de carregar tudo em memória.
- Excelente para tratar **grandes volumes de dados** (ex: arquivos, banco, API).
- Tipos:
  - `Readable`: leitura
  - `Writable`: escrita
  - `Transform`: transformação de dados
  - `Duplex`: leitura + escrita

### Benefícios:
- Menor uso de memória.
- Processamento mais rápido (começa antes de tudo estar carregado).
- Evita travar a thread principal.

---

## 🧪 Exemplo: Inserção de dados com Stream vs Promises

### Com `Promise.all`:
- Pode criar milhares de promessas de uma vez.
- Alto consumo de memória.
- Risco de travar ou sobrecarregar banco de dados.

### Com `Streams`:
- Lê ou gera dados **aos poucos**.
- Trabalha em **lotes** (ex: 1000 por vez).
- Controla melhor o uso de recursos.

---

## 📌 Considerações Finais

- Node.js é **single-thread**, mas altamente eficiente graças ao **event loop**.
- Usa o SO e libuv para gerenciar operações I/O de forma não bloqueante.
- Pode lidar com **paralelismo real** com `worker_threads` ou `child_process`.
- Para grandes volumes de dados, **prefira streams** ao invés de carregar tudo na memória.
- Conhecer o funcionamento interno ajuda a construir aplicações mais **performáticas** e **resilientes**.

---
