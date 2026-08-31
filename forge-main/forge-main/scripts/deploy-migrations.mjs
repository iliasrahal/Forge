import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import pg from "pg";

const { Client } = pg;

// Les migrations (DDL + verrou d'avis) exigent une connexion « session » ou
// directe. Le pooler transaction (port 6543) utilisé par l'app au runtime
// casse `prisma migrate deploy`. On privilégie donc DIRECT_URL.
function cleanConnectionString(value) {
  if (typeof value !== "string") return "";

  // Tolère un collage depuis un extrait .env : guillemets, espaces, préfixe.
  return value
    .trim()
    .replace(/^(?:DIRECT_URL|DATABASE_URL)\s*=\s*/i, "")
    .replace(/^(['"])(.*)\1$/s, "$2")
    .trim();
}

const runtimeDatabaseUrl = cleanConnectionString(process.env.DATABASE_URL);
const databaseUrl =
  cleanConnectionString(process.env.DIRECT_URL) ||
  runtimeDatabaseUrl;
const migrationsDirectory = resolve(process.cwd(), "prisma/migrations");
const pendingWorkspaceMigrations = new Set([
  "20260831120001_workspace_roles",
  "20260831120002_workspace_foundation",
]);

if (!databaseUrl) {
  throw new Error(
    "DIRECT_URL ou DATABASE_URL est requis pour déployer les migrations Prisma.",
  );
}

let migrationUrl = databaseUrl;
try {
  const parsed = new URL(databaseUrl);
  if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
    throw new Error(`protocole inattendu : ${parsed.protocol}`);
  }

  // Filet de sécurité : si la migration part sur un pooler transaction
  // (port 6543 / pgbouncer), `migrate deploy` reste bloqué sur le verrou
  // d'avis. On borne l'attente pour échouer en quelques secondes plutôt
  // que de consommer tout le budget de build.
  if (!parsed.searchParams.has("connect_timeout")) {
    parsed.searchParams.set("connect_timeout", "15");
  }
  migrationUrl = parsed.toString();

  if (parsed.port === "6543" || parsed.searchParams.get("pgbouncer") === "true") {
    console.warn(
      "[deploy-migrations] Attention : l'URL de migration ressemble à un pooler " +
        "transaction (6543). Les migrations exigent DIRECT_URL en mode session (5432).",
    );
  }
} catch (error) {
  throw new Error(
    "URL de migration invalide (DIRECT_URL / DATABASE_URL). Elle doit commencer " +
      "par postgresql:// , sans guillemets, sans retour à la ligne et sans " +
      `[YOUR-PASSWORD] non remplacé. Détail : ${error.message}`,
  );
}

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error(
    "DATABASE_URL est invalide dans Vercel : renseignez uniquement l’URL PostgreSQL, commençant par postgresql:// ou postgres://.",
  );
}

try {
  new URL(databaseUrl);
} catch {
  throw new Error(
    "DATABASE_URL n’est pas une URL PostgreSQL valide. Vérifiez notamment les guillemets et les caractères spéciaux du mot de passe dans Vercel.",
  );
}

// Next utilise l'URL runtime normalisée. Si seule DIRECT_URL est configurée,
// elle constitue aussi une URL runtime PostgreSQL valide.
process.env.DATABASE_URL = runtimeDatabaseUrl || databaseUrl;

function runPrisma(...args) {
  execFileSync("npx", ["--no-install", "prisma", ...args], {
    env: {
      ...process.env,
      DATABASE_URL: migrationUrl,
      // Ne pas rester bloqué indéfiniment sur un verrou Postgres.
      PGOPTIONS: "-c lock_timeout=15000 -c statement_timeout=120000",
    },
    stdio: "inherit",
  });
}

async function getMigrationDirectories() {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function inspectDatabase(client) {
  const migrationTableResult = await client.query(
    "SELECT to_regclass('public._prisma_migrations') AS table_name",
  );
  const migrationTableExists = Boolean(
    migrationTableResult.rows[0]?.table_name,
  );

  if (migrationTableExists) {
    const appliedResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL',
    );

    if (appliedResult.rows[0]?.count > 0) {
      return { needsBaseline: false };
    }
  }

  const applicationTablesResult = await client.query(
    `SELECT COUNT(*)::int AS count
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name <> '_prisma_migrations'`,
  );

  if (applicationTablesResult.rows[0]?.count === 0) {
    return { needsBaseline: false };
  }

  const requiredTables = [
    "User",
    "Client",
    "Intervention",
    "Session",
    "Organization",
    "OrganizationMember",
  ];
  const tablesResult = await client.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [requiredTables],
  );
  const existingTables = new Set(
    tablesResult.rows.map(({ table_name: tableName }) => tableName),
  );
  const missingTables = requiredTables.filter(
    (tableName) => !existingTables.has(tableName),
  );

  const requiredColumns = [
    ["Client", "organizationId"],
    ["Organization", "subscriptionStatus"],
    ["Organization", "trialStartedAt"],
    ["Organization", "trialEndsAt"],
    ["User", "trialStartedAt"],
  ];
  const columnsResult = await client.query(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (table_name, column_name) IN (
          ('Client', 'organizationId'),
          ('Organization', 'subscriptionStatus'),
          ('Organization', 'trialStartedAt'),
          ('Organization', 'trialEndsAt'),
          ('User', 'trialStartedAt')
        )`,
  );
  const existingColumns = new Set(
    columnsResult.rows.map(
      ({ table_name: tableName, column_name: columnName }) =>
        `${tableName}.${columnName}`,
    ),
  );
  const missingColumns = requiredColumns
    .map(([tableName, columnName]) => `${tableName}.${columnName}`)
    .filter((columnName) => !existingColumns.has(columnName));

  if (missingTables.length > 0 || missingColumns.length > 0) {
    const details = [
      missingTables.length > 0
        ? `tables absentes : ${missingTables.join(", ")}`
        : null,
      missingColumns.length > 0
        ? `colonnes absentes : ${missingColumns.join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join(" ; ");

    throw new Error(
      `Baseline Prisma refusé : la base ne correspond pas au schéma Forge historique (${details}).`,
    );
  }

  return { needsBaseline: true };
}

async function deploy() {
  const migrationDirectories = await getMigrationDirectories();
  const unknownPendingMigrations = [
    ...pendingWorkspaceMigrations,
  ].filter((migrationName) => !migrationDirectories.includes(migrationName));

  if (unknownPendingMigrations.length > 0) {
    throw new Error(
      `Migration Forge attendue introuvable : ${unknownPendingMigrations.join(", ")}`,
    );
  }

  const client = new Client({
    connectionString: migrationUrl,
    connectionTimeoutMillis: 15000,
    statement_timeout: 30000,
  });
  await client.connect();

  let needsBaseline;
  try {
    ({ needsBaseline } = await inspectDatabase(client));
  } finally {
    await client.end();
  }

  if (needsBaseline) {
    const historicalMigrations = migrationDirectories.filter(
      (migrationName) => !pendingWorkspaceMigrations.has(migrationName),
    );

    console.log(
      `Base Forge existante détectée : baseline de ${historicalMigrations.length} migrations historiques.`,
    );

    for (const migrationName of historicalMigrations) {
      runPrisma("migrate", "resolve", "--applied", migrationName);
    }
  }

  runPrisma("migrate", "deploy");
}

await deploy();

runPrisma("generate");
execFileSync("npx", ["--no-install", "next", "build"], {
  env: process.env,
  stdio: "inherit",
});
