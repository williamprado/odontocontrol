# Guia de Deploy - Docker Swarm & Portainer

Este documento orienta os desenvolvedores e engenheiros de DevOps sobre como compilar, empacotar, distribuir e publicar o projeto **OdontoControl** em um cluster **Docker Swarm** gerenciado via **Portainer**.

---

## 1. Variáveis de Ambiente Necessárias

Antes do deploy, prepare os valores das seguintes variáveis no ambiente ou no painel do Portainer (Stack Environment Variables):

| Variável | Descrição | Exemplo / Padrão |
| :--- | :--- | :--- |
| `APP_URL` | URL de acesso público do sistema | `https://odontocontrol.wapainel.com.br` |
| `BETTER_AUTH_SECRET` | Chave secreta de encriptação de sessões. Gere com `openssl rand -base64 48` | *Gere um secret forte* |
| `BETTER_AUTH_URL` | URL base utilizada pelo Better Auth | `https://odontocontrol.wapainel.com.br` |
| `DATABASE_URL` | Conexão PostgreSQL (Ex: `postgresql://user:pass@db_host:5432/db`) | `postgresql://odontocontrol:senha@odontocontrol_db:5432/odontocontrol` |
| `DB_SSL` | Habilita SSL para conexão de banco (`true` / `false`) | `false` |
| `BOOTSTRAP_ADMIN_EMAIL` | E-mail para criação do Super Admin inicial | `admin@admin.com` |
| `BOOTSTRAP_ADMIN_PASSWORD` | Senha temporária do Super Admin inicial | `@Admin.com` |

---

## 2. Compilação e Envio da Imagem Docker

A publicação da imagem Docker no Docker Hub pode ser feita de duas formas:

### 2.1 Build Automatizado via GitHub Actions (CI/CD)
O repositório está integrado a uma esteira de CI/CD em `.github/workflows/build-and-push-docker.yml`.
Toda vez que há um push na branch `main`, a imagem é compilada e publicada automaticamente no Docker Hub:
- **Imagem de destino:** `williamwilmer10/odontocontrol`
- **Tags automáticas:** `v0.1.${{ github.run_number }}` e `latest`

**Segredos necessários no GitHub (Secrets and variables -> Actions):**
- `DOCKER_USERNAME`: `williamwilmer10`
- `DOCKER_PASSWORD`: *Docker Hub Personal Access Token (PAT)*

---

### 2.2 Build Manual
Certifique-se de executar os comandos a partir da raiz do repositório.

#### Método 1: Usando o script de apoio
Você pode usar o script automatizado local para calcular a versão incremental consultando o Docker Hub, compilar e enviar a imagem:
```bash
bash scripts/build_and_push.sh
```

#### Método 2: Comandos manuais clássicos
Substitua `v0.1.0` pela versão correspondente:
```bash
# Build local da imagem
docker build -t williamwilmer10/odontocontrol:v0.1.0 .

# Login no Docker Hub
docker login -u williamwilmer10

# Envio da imagem (Push)
docker push williamwilmer10/odontocontrol:v0.1.0
docker push williamwilmer10/odontocontrol:latest
```

---

## 3. Implantação no Portainer (Docker Swarm)

A stack utiliza o arquivo de configuração localizado em [deploy/portainer-stack.yml](file:///i:/odontocontrol/deploy/portainer-stack.yml).

### Requisitos de Rede Overlay
A stack espera a existência de uma rede externa chamada `wapainelnet`, que é a rede de comunicação com o reverse proxy Traefik.
Se a rede ainda não existir no Swarm, crie-a antes com:
```bash
docker network create --driver=overlay wapainelnet
```

### Passos no Portainer:
1. Acesse o painel do **Portainer** e selecione a seção **Stacks**.
2. Clique em **Add stack**.
3. Defina o nome como `odontocontrol`.
4. Em **Build method**, escolha **Web editor** ou faça upload do arquivo `deploy/portainer-stack.yml`.
5. Preencha as variáveis de ambiente na seção **Environment variables** (conforme a tabela do item 1).
6. Ajuste a URL do domínio nas labels do Traefik no YAML (ex: substitua `odontocontrol.wapainel.com.br` pelo seu domínio real).
7. Clique em **Deploy the stack**.

---

## 4. Arquitetura da Stack e Roteamento

```mermaid
graph TD
    Client[Navegador/Cliente] -->|HTTPS| Traefik[Proxy Reverso Traefik]
    Traefik -->|Rede wapainelnet| App[odontocontrol_app:3000]
    App -->|Internal Network| DB[(odontocontrol_db:5432 - pgvector)]
```

* **Traefik Integration:** O serviço `odontocontrol_app` possui labels que informam ao Traefik para gerar certificados SSL automáticos via Let's Encrypt e direcionar o tráfego da porta `80/443` do host para a porta interna `3000` do container Node.js.
* **Volumes do Banco:** O volume `odontocontrol_db_data` é persistente e mantém os dados do PostgreSQL seguros mesmo em caso de reinicialização ou atualização do serviço do banco de dados.

---

## 5. Checklist Pós-Deploy

* [ ] **Acesso HTTP/HTTPS:** Abra o domínio configurado no navegador e certifique-se de que a aplicação carrega corretamente (sem erros 502/504).
* [ ] **Autenticação Local:** Tente fazer login usando as credenciais do bootstrap administrativo.
* [ ] **Conexão com o Banco Postgres:** Verifique os logs do container do app no Portainer para certificar-se de que ele conectou e executou as migrações automáticas sem falhas.
* [ ] **Políticas de Backup:** Certifique-se de configurar rotinas de backup para o volume persistente do banco Postgres no host do Swarm.

---

## 6. Inicialização e Bootstrap do Super Admin

Para permitir o funcionamento autônomo e imediato do OdontoControl, a aplicação possui scripts de inicialização que rodam na inicialização do container.

### Funcionamento do Startup:
1. **init-db.mjs:** O container executa o script `scripts/init-db.mjs`. Ele lê `DATABASE_URL`, conecta ao PostgreSQL, cria a extensão `vector`, a extensão `pgcrypto` e executa o schema idempotente de criação de tabelas (`init_postgres.sql`), incluindo as tabelas do Better Auth (`"user"`, `"session"`, `"account"`, `"verification"`).
2. **bootstrap-super-admin.mjs:** O container executa o script `scripts/bootstrap-super-admin.mjs`. Ele lê as variáveis `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`, verifica se o Super Admin já existe no banco e, caso não exista, realiza o cadastro programático da conta no Better Auth e insere os registros locais na tabela de membros (`membro_equipe`) e configurações do aplicativo (`app_config`), configurando a flag `must_change_password = true` para exigir a troca de senha imediata.

> [!IMPORTANT]
> **RECOMENDAÇÃO DE SEGURANÇA:**
> Após o primeiro acesso ao sistema e a alteração da senha padrão, remova as variáveis `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` do painel do Portainer para garantir o isolamento da conta.
