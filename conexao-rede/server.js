import {fastify} from 'fastify';
import fastifyCors from '@fastify/cors';
import { Sensores } from './localDatabase.js';

const server = fastify();

const database= new Sensores(-1); //tamanho maximo = sem limite

server.register(fastifyCors, {
    origin : '*' //permite qq outro endereço fazer a requisição
});

server.post('/', (req, rep)=>{ //criar
    database.reiniciar()
    database.add(req.body)
    
    return rep.send();
})

server.put('/', (req, rep)=>{
    
    
     database.add(req.body)

    return rep.send();
})

server.get('/', (req, rep)=>{
    const historico = database.get();

    return rep.send(historico);
})

server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ?? 3333
});