console.log('incio');

setTimeout(() => {
    console.log("Timer 1 executado");
}, 1000);

setImmediate(() => {
    console.log("Executando imediatamente após a Poll phase");
});

console.log("Fim");