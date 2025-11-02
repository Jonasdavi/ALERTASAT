import { fastify } from 'fastify';
import fastifyCors from '@fastify/cors';
import { Sensores } from './localDatabase.js';

const server = fastify();
const database = new Sensores(-1); // sem limite
let ultimoTimestamp = Date.now();

server.register(fastifyCors, { origin: '*' });

server.post('/', (req, rep) => {
    database.reiniciar();
    database.add(req.body);
    ultimoTimestamp = Date.now();
    return rep.send();
});

server.put('/', (req, rep) => {
    database.add(req.body);
    ultimoTimestamp = Date.now();
    return rep.send();
});

server.get('/', (req, rep) => {
    return rep.send(database.get());
});

// Loop para verificar inatividade
setInterval(() => {
    const agora = Date.now();
    if (agora - ultimoTimestamp > 3 * 60 * 1000) { // 3 minutos
        console.log('Mais de 3 minutos sem atualização. Reiniciando histórico...');
        database.reiniciar();
    }
}, 30 * 1000); // checa a cada 30 segundos

server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ?? 3333
});
