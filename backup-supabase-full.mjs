import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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

async function backupTable(supabaseUrl, serviceRole, tableName) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=10000`, {
      method: 'GET',
      headers: {
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data, count: Array.isArray(data) ? data.length : 0 };
    } else {
      return { success: false, status: response.status };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function backupSupabaseDatabase() {
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
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    console.log('🔗 Conectando ao Supabase...');
    console.log('📊 Tentando fazer backup das tabelas conhecidas...\n');
    
    // Lista de tabelas comuns em CRM
    const tablesToTry = [
      'clients',
      'proposals',
      'contracts',
      'financial',
      'users',
      'settings',
      'site_content',
      'public_requests'
    ];
    
    const backup = {
      project_id: projectId,
      backup_date: new Date().toISOString(),
      tables: {}
    };
    
    for (const tableName of tablesToTry) {
      process.stdout.write(`⏳ Tentando "${tableName}"... `);
      
      const result = await backupTable(supabaseUrl, serviceRole, tableName);
      
      if (result.success) {
        backup.tables[tableName] = result.data;
        console.log(`✅ ${result.count} registros`);
      } else if (result.status === 404) {
        console.log(`⏭️  Não existe`);
      } else {
        console.log(`⚠️  Status ${result.status || result.error}`);
      }
    }
    
    // Salva backup
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    const fileSize = fs.statSync(backupFile).size / 1024; // KB
    const tablesWithData = Object.keys(backup.tables).filter(t => backup.tables[t].length > 0);
    
    console.log('\n✅ Backup concluído!\n');
    console.log('📊 Resumo:');
    console.log(`   📁 Arquivo: ${path.relative(process.cwd(), backupFile)}`);
    console.log(`   💾 Tamanho: ${fileSize.toFixed(2)} KB`);
    console.log(`   📈 Tabelas com dados: ${tablesWithData.length}`);
    if (tablesWithData.length > 0) {
      tablesWithData.forEach(t => {
        console.log(`      • ${t}: ${backup.tables[t].length} registros`);
      });
    }
    console.log(`   🕐 Data: ${backup.backup_date}\n`);
    
    console.log('🔒 Backup salvo com sucesso!');
    
    return true;
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

backupSupabaseDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
