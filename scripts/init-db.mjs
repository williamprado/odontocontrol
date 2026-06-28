import fs from "fs";
import path from "path";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[init-db] Erro: DATABASE_URL não configurada.");
  process.exit(1);
}

try {
  const parsed = new URL(dbUrl.replace("postgresql://", "http://"));
  console.log(`[init-db] Conectando ao banco de dados em ${parsed.hostname}:${parsed.port}${parsed.pathname}...`);
} catch {
  console.log("[init-db] Conectando ao banco de dados...");
}

const pool = new pg.Pool({ connectionString: dbUrl });

async function initDb() {
  try {
    const sqlPath = path.resolve("database/init_postgres.sql");
    if (!fs.existsSync(sqlPath)) {
      console.error(`[init-db] Erro: Arquivo de schema não localizado em ${sqlPath}`);
      process.exit(1);
    }

    const rawSql = fs.readFileSync(sqlPath, "utf-8");

    console.log("[init-db] Executando schema de inicialização PostgreSQL...");
    await pool.query(rawSql);
    console.log("[init-db] Banco de dados inicializado com sucesso (tabelas e extensões configuradas).");

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("[init-db] Falha crítica ao inicializar o banco de dados:", err.message);
    await pool.end();
    process.exit(1);
  }
}

initDb();
