const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const CryptoJS = require('crypto-js');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'config.db');

const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, router_ip TEXT, username TEXT, password TEXT)");
});

class RouterCLI {
    constructor(config) {
        this.config = config;
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({
            jar: this.jar,
            withCredentials: true,
            baseURL: `http://${config.router_ip}`,
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            }
        }));
    }

    async getNetworkInfo() {
        const services = [
            'https://api.ipify.org?format=json',
            'https://ipapi.co/json/',
            'http://ip-api.com/json'
        ];

        for (const service of services) {
            try {
                const url = `${service}${service.includes('?') ? '&' : '?'}cb=${Date.now()}`;
                const response = await axios.get(url, { timeout: 5000 });
                const data = response.data;

                const ip = data.ip || data.query || data.ip_addr;
                const hostname = data.hostname || `${ip?.replace(/\./g, '-')}.user.vivozap.com.br`;

                if (ip) return { ip, hostname };
            } catch (e) { continue; }
        }
        return null;
    }

    async login() {
        try {
            const loginPage = await this.client.get('/cgi-bin/login.cgi');
            const sidMatch = loginPage.data.match(/var sid = '([^']+)';/);
            if (!sidMatch) throw new Error('SID não encontrado');

            const sid = sidMatch[1];
            const passwordHash = CryptoJS.MD5(`${this.config.password}:${sid}`).toString();

            const loginData = new URLSearchParams();
            loginData.append('Loginuser', this.config.username);
            loginData.append('LoginPasswordValue', passwordHash);
            loginData.append('acceptLoginIndex', '1');

            await this.client.post('/cgi-bin/login.cgi', loginData.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const hasSession = this.jar.toJSON().cookies.some(c => c.key === 'COOKIE_SESSION_KEY');
            if (!hasSession) throw new Error('Falha na autenticação');
            return true;
        } catch (e) {
            throw new Error(`Login: ${e.message}`);
        }
    }

    async reboot() {
        const rebootData = new URLSearchParams();
        rebootData.append('restoreFlag', '1');
        rebootData.append('RestartBtn', 'RESTART');

        try {
            await this.client.post('/cgi-bin/device-management-resets.cgi', rebootData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
        } catch (error) {
            if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) return true;
            throw error;
        }
        return true;
    }

    logIPChange(ip, hostname) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');

        const logEntry = `${dateStr} - ${timeStr} | ${ip.padEnd(15)} | ${hostname}\n`;
        fs.appendFileSync('ip_logs.txt', logEntry);
    }
}

async function getSavedConfig() {
    return new Promise((resolve) => {
        db.get("SELECT * FROM config LIMIT 1", (err, row) => resolve(row));
    });
}

async function runWizard() {
    console.clear();
    console.log(chalk.gray('── CONFIGURAÇÃO DO DISPOSITIVO ──'));
    const answers = await inquirer.prompt([
        { type: 'input', name: 'router_ip', message: 'IP do Roteador:', default: '192.168.15.1' },
        { type: 'input', name: 'username', message: 'Usuário:', default: 'admin' },
        { type: 'password', name: 'password', message: 'Senha:', mask: '*' }
    ]);

    return new Promise((resolve) => {
        db.run("DELETE FROM config", () => {
            db.run("INSERT INTO config (router_ip, username, password) VALUES (?, ?, ?)",
                [answers.router_ip, answers.username, answers.password],
                () => resolve(answers));
        });
    });
}

async function showHeader(ip) {
    console.clear();
    console.log(chalk.white.bold(`
    VIVO ROUTER CONTROL v3.0
    ${chalk.gray('Criado por belawer')}
    `));
    console.log(chalk.gray(`    [ STATUS: ONLINE ]  [ IP: ${chalk.white.bold(ip || 'Buscando...')} ]`));
    console.log(chalk.gray(`    ──────────────────────────────────────────────────`));
}

async function main() {
    let config = await getSavedConfig();
    if (!config) config = await runWizard();

    const router = new RouterCLI(config);
    const info = await router.getNetworkInfo();
    await showHeader(info?.ip);
    await start(router, info?.ip);
}

async function start(router, initialIP) {
    const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'SELECIONE UMA OPERAÇÃO:',
        choices: [
            { name: '→ REINICIAR (UMA VEZ)', value: 'once' },
            { name: '→ TROCAR IP (LOOP)', value: 'loop' },
            { name: '→ VER HISTÓRICO DE IPS', value: 'logs' },
            { name: '→ CONFIGURAÇÕES', value: 'config' },
            { name: '→ SAIR', value: 'exit' }
        ]
    }]);

    if (action === 'exit') process.exit();
    if (action === 'config') return runWizard().then(() => main());

    if (action === 'logs') {
        process.stdout.write('\x1b[2J\x1b[0;0H');
        console.log(chalk.white.bold('\n── HISTÓRICO DE CONEXÕES ──'));
        console.log(chalk.gray('Dia - Hora'.padEnd(20)) + ' | ' + 'seu IP'.padEnd(15) + ' | ' + 'Provedor');
        if (fs.existsSync('ip_logs.txt')) {
            console.log(chalk.white(fs.readFileSync('ip_logs.txt', 'utf8')));
        } else {
            console.log(chalk.red('NENHUM REGISTRO ENCONTRADO.'));
        }
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Pressione Enter...' }]);
        return main();
    }

    const spinner = ora({ text: 'INICIALIZANDO...', color: 'white' }).start();
    try {
        const info = await router.getNetworkInfo();
        const originalIP = info?.ip;

        if (!originalIP) throw new Error('Não foi possível identificar o IP inicial.');
        spinner.info(`IP ATUAL: ${chalk.yellow(originalIP)}`);

        let ipChanged = false;
        let attempt = 1;

        while (true) {
            spinner.start(`[TENTATIVA ${attempt}] AUTENTICANDO NO ROTEADOR...`);
            await router.login();

            spinner.text = `[TENTATIVA ${attempt}] SOLICITANDO REINICIALIZAÇÃO...`;
            await router.reboot();
            spinner.succeed(chalk.gray(`COMANDO ENVIADO. AGUARDANDO RECONEXÃO...`));

            spinner.start('MONITORANDO ALTERAÇÃO DE IP...');

            let networkStatus = false;
            while (!networkStatus) {
                await new Promise(r => setTimeout(r, 10000));
                const newInfo = await router.getNetworkInfo();

                if (newInfo) {
                    spinner.text = `CONECTADO. IP ATUAL: ${chalk.white.bold(newInfo.ip)}`;

                    if (newInfo.ip !== originalIP) {
                        spinner.stop();
                        console.log(chalk.white.bold('\n' + '─'.repeat(50)));
                        console.log(chalk.white.bold('  SUCESSO: O IP FOI ALTERADO!'));
                        console.log(chalk.gray(`  ANTERIOR: ${chalk.red(originalIP)}`));
                        console.log(chalk.white(`  NOVO:     ${chalk.green.bold(newInfo.ip)}`));
                        console.log(chalk.white.bold('─'.repeat(50) + '\n'));

                        router.logIPChange(newInfo.ip, newInfo.hostname);
                        ipChanged = true;
                        networkStatus = true;
                        if (action === 'once' || action === 'loop') return main();
                    } else {
                        if (action === 'once') {
                            spinner.succeed(chalk.gray('REINICIADO, MAS O IP PERMANECEU O MESMO.'));
                            networkStatus = true;
                            return main();
                        }
                        spinner.warn(chalk.gray(`IP PERSISTENTE (${newInfo.ip}). TENTANDO NOVAMENTE...`));
                        await new Promise(r => setTimeout(r, 5000));
                        networkStatus = true;
                        attempt++;
                    }
                }
            }
            if (ipChanged) break;
        }
    } catch (error) {
        spinner.fail(chalk.red(`ERRO CRÍTICO: ${error.message}`));
    }

    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'PRESSIONE ENTER PARA CONTINUAR...' }]);
    main();
}

main();
