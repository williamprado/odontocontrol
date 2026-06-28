import pg from "pg";

const { Client } = pg;

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Erro: DATABASE_URL não está configurado no ambiente!");
    process.exit(1);
  }

  // Prevenção de segurança para evitar rodar contra bancos de produção
  if (
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.in") ||
    connectionString.includes("production") ||
    connectionString.includes("prod-")
  ) {
    console.error("Bloqueio de Segurança: Não execute testes de conexão contra bancos remotos de produção!");
    process.exit(1);
  }

  console.log("Conectando ao banco de dados local...");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Conexão estabelecida com sucesso!");

    // Teste 1: SELECT 1
    const res1 = await client.query("SELECT 1 AS test");
    console.log("Query 'SELECT 1' executada com sucesso:", res1.rows[0]);

    // Teste 2: Verificar extensão pgvector
    const res2 = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    if (res2.rows.length > 0) {
      console.log("Extensão 'vector' (pgvector) está ATIVA no banco de dados.");
    } else {
      console.log("Aviso: Extensão 'vector' (pgvector) não está ativa neste banco de dados.");
    }
  } catch (err) {
    console.error("Erro ao testar conexão com o banco de dados:", err);
  } finally {
    await client.end();
  }
}

run();
