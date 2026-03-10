# 🚀 Vivo Router Control v3.0

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![Author: belawer](https://img.shields.io/badge/Author-belawer-purple?style=for-the-badge)](https://github.com/belawer)

O **Vivo Router Control** é uma ferramenta de terminal (CLI) poderosa e automatizada para gerenciar roteadores Vivo. Ele permite realizar reboots remotos e trocas de IP externo de forma inteligente, sendo ideal para quem precisa de novos endereços IP de forma rápida e segura.

---

## ✨ Funcionalidades

- 🔄 **Troca de IP Inteligente:** O script não apenas reinicia o modem, mas monitora a conexão até que um novo IP seja atribuído.
- 🔁 **Modo Loop:** Automatize a troca de IP infinitamente (útil para ferramentas de automação).
- 📝 **Histórico de Conexões:** Mantém um log detalhado (`ip_logs.txt`) com data, hora, IP obtido e provedor.
- 💾 **Configuração Persistente:** Salva os dados do roteador (IP, Usuário, Senha) em um banco de dados local SQLite.
- 🎨 **Interface Premium:** Visual moderno com cores, spinners de progresso e feedbacks claros no terminal.

---

## 🛠️ Requisitos

Antes de começar, você precisará ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/en/) (Versão 14 ou superior recomendada)
*   Um roteador Vivo compatível (testado em modelos HGU).

---

## 🚀 Como Instalar e Usar

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/baalware/VIVO-ROUTER-CONTROL-v3.0/
    cd VIVO-ROUTER-CONTROL-v3.0
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```
    *Ou utilize o arquivo `instalar.bat` se estiver no Windows.*

3.  **Inicie o programa:**
    ```bash
    npm start
    ```

4.  **Configuração Inicial:**
    Na primeira vez, o programa pedirá:
    *   **IP do Roteador:** (Geralmente `192.168.15.1`)
    *   **Usuário:** (Padrão: `admin`)
    *   **Senha:** (Localizada na etiqueta atrás do roteador)

---

## 📸 Preview

```text
    VIVO ROUTER CONTROL v3.0
    Criado por belawer

    [ STATUS: ONLINE ]  [ IP: 177.158.XX.XX ]
    ──────────────────────────────────────────────────

    SELECIONE UMA OPERAÇÃO:
    ❯ → REINICIAR (UMA VEZ)
      → TROCAR IP (LOOP)
      → VER HISTÓRICO DE IPS
      → CONFIGURAÇÕES
      → SAIR
```

---

## 📂 Estrutura do Projeto

- `reboot-cli.js`: Código principal do programa.
- `config.db`: Banco de dados SQLite onde ficam as configurações (criado automaticamente).
- `ip_logs.txt`: Arquivo de texto com o histórico de trocas de IP.
- `package.json`: Gerenciador de dependências e scripts.

---

## ⚠️ Aviso Legal

Este software foi desenvolvido para fins educacionais e de automação pessoal. O uso indevido para atividades que violem os termos de serviço do seu provedor de internet é de total responsabilidade do usuário.

---

## 👤 Autor

Desenvolvido com ❤️ por **belawer**.

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ownatudo)
