import fs from "node:fs";
import http from "node:http";
import { Command } from "commander";


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

const options = program.opts();
 
const port = Number(options.port);
 

function toNumber(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }
    return null;
    }


function toText(value) {
    return typeof value === 'string' && value.trim() !== '' ? value : null;
}


function build_response(url, readError, content) {
    if (url === null) {
        return { status: 400, payload: { error: 'Некоректна адреса запиту' } };
    }
    if (url.pathname !== '/') {
        return { status: 404, payload: { error: 'Маршрут не знайдено' } };
    }

    const rawMinPrice = url.searchParams.get('min_price');
    const minPrice = rawMinPrice === null ? null : toNumber(rawMinPrice);

    if (rawMinPrice !== null && minPrice === null) {
        return { status: 400, payload: { error: 'Параметр min_price має бути числом' } };
    }

    if (readError) {
        return { status: 500, payload: { error: 'Не вдалося прочитати файл даних' } };
    }

    let data = null;
    try {
        data = JSON.parse(content.replace(/^\uFEFF/, ''));
    } catch (parseError) {
        data = null;
    }
    if (!Array.isArray(data)) {
        return { status: 500, payload: { error: 'Файл даних пошкоджений' } };
    }

    const showSymbol = url.searchParams.get('symbol') === 'true';
    const result = [];

    for (const item of data) {
        if (item === null || typeof item !== 'object') {
            continue;
        }
        const price = toNumber(item.price);
        if (minPrice !== null && !(price !== null && price > minPrice)) {
            continue;
        }
        const record = { coin: toText(item.coin_name) };
        if (showSymbol) {
            record.symbol = toText(item.symbol);
        }
        record.date = toText(item.date);
        record.price = price;
        result.push(record);
    }

    return { status: 200, payload: result };
}


function send_response(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
}


const server = http.createServer((req, res) => {
    let url = null;
    try {
        url = new URL(req.url, 'http://localhost');
    } catch (urlError) {
        url = null;
    }
    
    fs.readFile(options.input, 'utf8', (readError, content) => {
        const result = build_response(url, readError, content);
        const body = JSON.stringify(result.payload);
    
        if (!options.output) {
        send_response(res, result.status, body);
        return;
        }
    
        fs.writeFile(options.output, body, (writeError) => {
        if (writeError) {
            send_response(res, 500, JSON.stringify({ error: 'Не вдалося записати відповідь у файл' }));
            return;
        }
        send_response(res, result.status, body);
        });
    });
    });

    
server.on('error', (serverError) => {
    console.error('Server error: ' + serverError.message);
    process.exit(1);
});
 

fs.access(options.input, fs.constants.F_OK, (accessError) => {
    if (accessError) {
        console.error('Cannot find input file');
        process.exit(1);
    }
    server.listen(port, options.host, () => {
    console.log('Server is running at http://' + options.host + ':' + port + '/');
    });
});
