import { Command } from "commander";
import fs from "node:fs";
import http from "node:http";


const program = new Command();

program
    .name("My Own Http-Server")
    .description("Програма створення найпростішого http-сервера за допомогою Node.js \
         на зчитування json-файлу історії крипто монет та формування відповіді на її основі для запитів користувача.")
    .helpOption('--help', 'показати довідку')
    .requiredOption('-i, --input <path>', 'шлях до файлу даних')
    .requiredOption('-h, --host <address>', 'адреса сервера')
    .requiredOption('-p, --port <number>', 'порт сервера')
    .option('-o, --output <path>', 'файл, у який записується остання відповідь');

program.parse();