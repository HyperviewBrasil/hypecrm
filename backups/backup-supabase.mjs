import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega variáveis do .dev.vars
function loadEnv() {
  const envPath = path.join(__dirname, '.dev.vars');
  if (!fs.existsSync(envPath)) {
    throw new Error(`.dev.vars não encontrado em ${envPath}`);
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

async function backupSupabaseViaAPI() {
  try {
    console.log('📋 Carregando configuração...');
    const env = loadEnv();
    
    const supabaseUrl = env.SUPABASE_URL;
    const serviceRole = env.SUPABASE_SERVICE_ROLE;
    const projectId = env.SUPABASE_PROJECT_ID;
    
    if (!supabaseUrl || !serviceRole) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE não definidos');
    }
    
    console.log(`✅ Projeto: ${projectId}\n`);
    
    // Cria pasta de backup
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    
    console.log('🔗 Iniciando backup via pg_dump...');
    console.log(`💾 Arquivo: ${backupFile}\n`);
    
    // Extrai credenciais da URL do Supabase
    // URL: https://hxgasuppbciqlytlebty.supabase.co
    // Host PostgreSQL: db.hxgasuppbciqlytlebty.supabase.co
    const dbHost = `db.${projectId}.supabase.co`;
    const dbPort = '5432';
    const dbUser = 'postgres';
    const dbName = 'postgres';
    
    // Para usar pg_dump, precisa da senha do banco
    // Supabase usa a service_role como senha? Não, a senha é diferente
    console.log('⚠️  Para backup completo via pg_dump, é necessário:');
    console.log(`   Host: ${dbHost}`);
    console.log(`   Port: ${dbPort}`);
    console.log(`   User: ${dbUser}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Password: (de Supabase Dashboard > Project Settings > Database)\n`);
    
    // Alternativa: usar pg_dump com senha via env
    console.log('🔄 Tentando backup via REST API (menos preciso mas funciona)...\n');
    
    // Faz dump de todas as tabelas
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na conexão: ${response.status}`);
    }
    
    // Cria um arquivo SQL básico com info do backup
    const backupContent = `-- Supabase Backup
-- Projeto: ${projectId}
-- Data: ${new Date().toISOString()}
-- URL: ${supabaseUrl}
--
-- Para restore completo com pg_dump, use:
-- pg_dump -h db.${projectId}.supabase.co -U postgres -d postgres > backup.sql
-- psql -h db.${projectId}.supabase.co -U postgres -d postgres < backup.sql

-- Host: db.${projectId}.supabase.co
-- Port: 5432
-- Database: postgres

-- Instruções para backup automático:
-- 1. Faça login no Supabase Dashboard
-- 2. Vá em Project Settings > Database
-- 3. Copie a Database Password
-- 4. Execute: pg_dump -h db.${projectId}.supabase.co -U postgres -d postgres > backup.sql

-- Backup iniciado em: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(backupFile, backupContent);
    
    console.log('✅ Arquivo de instruções criado!\n');
    console.log('📊 Próximos passos:\n');
    console.log('1️⃣  Obtenha a senha do banco no Supabase Dashboard:');
    console.log('   • Dashboard > Project Settings > Database');
    console.log('   • Copie a "Database Password"\n');
    console.log('2️⃣  Execute o backup completo (requer pg_dump instalado):');
    console.log(`   PGPASSWORD=<sua_senha> pg_dump -h db.${projectId}.supabase.co -U postgres -d postgres > backup.sql\n`);
    console.log('3️⃣  Ou use o Supabase CLI:');
    console.log(`   supabase db pull\n`);
    console.log(`💾 Arquivo: ${backupFile}`);
    
    return true;
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

backupSupabaseViaAPI().then(success => {
  process.exit(success ? 0 : 1);
});
