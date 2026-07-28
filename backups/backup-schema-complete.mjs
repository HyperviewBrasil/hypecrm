import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega variáveis do .dev.vars
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.dev.vars');
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

async function fetchSupabaseData(url, query, serviceRole) {
  const response = await fetch(`${url}/rest/v1/${query}`, {
    method: 'GET',
    headers: {
      'apikey': serviceRole,
      'Authorization': `Bearer ${serviceRole}`,
      'Accept': 'application/json'
    }
  });
  
  if (response.ok) {
    return await response.json();
  }
  return null;
}

async function backupSupabaseSchema() {
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
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
    const backupFile = path.join(__dirname, `backup-complete-${timestamp}.json`);
    
    console.log('🔗 Conectando ao Supabase...');
    console.log('📊 Coletando schema e dados...\n');
    
    // Estruturas para coletar
    const backup = {
      project_id: projectId,
      backup_date: new Date().toISOString(),
      schema: {
        tables: {},
        functions: [],
        triggers: [],
        policies: []
      },
      data: {}
    };
    
    // 1. Pega informações de TABLES
    console.log('⏳ Coletando tabelas...');
    let tables = await fetchSupabaseData(
      supabaseUrl,
      'information_schema.tables?table_schema=eq.public&select=table_name',
      serviceRole
    );
    
    if (!tables) {
      console.log('⚠️  Não foi possível listar tabelas via REST');
      // Fallback: tenta tabelas conhecidas
      tables = [
        { table_name: 'proposals' },
        { table_name: 'contracts' },
        { table_name: 'site_content' }
      ];
    }
    
    const tableNames = tables.map(t => t.table_name);
    console.log(`   ✅ ${tableNames.length} tabelas encontradas\n`);
    
    // 2. Pega COLUNAS de cada tabela
    console.log('⏳ Coletando schema das tabelas...');
    for (const tableName of tableNames) {
      process.stdout.write(`   • ${tableName}... `);
      
      const columns = await fetchSupabaseData(
        supabaseUrl,
        `information_schema.columns?table_name=eq.${tableName}&table_schema=eq.public&select=column_name,data_type,is_nullable,column_default`,
        serviceRole
      );
      
      if (columns) {
        backup.schema.tables[tableName] = {
          columns: columns,
          row_count: 0
        };
        console.log(`${columns.length} colunas`);
      } else {
        console.log(`⚠️  Erro`);
      }
    }
    console.log();
    
    // 3. Pega DADOS de cada tabela
    console.log('⏳ Exportando dados...');
    for (const tableName of tableNames) {
      process.stdout.write(`   • ${tableName}... `);
      
      const data = await fetchSupabaseData(
        supabaseUrl,
        `${tableName}?limit=100000`,
        serviceRole
      );
      
      if (data && Array.isArray(data)) {
        backup.data[tableName] = data;
        console.log(`${data.length} registros`);
      } else if (data && !Array.isArray(data)) {
        console.log(`1 registro`);
        backup.data[tableName] = [data];
      } else {
        console.log(`vazio ou erro`);
        backup.data[tableName] = [];
      }
    }
    console.log();
    
    // 4. Tenta pegar POLICIES (RLS)
    console.log('⏳ Coletando políticas RLS...');
    const policies = await fetchSupabaseData(
      supabaseUrl,
      'pg_policies?select=tablename,policyname,qual,with_check,permissive,cmd&table_schema=eq.public',
      serviceRole
    );
    
    if (policies && Array.isArray(policies)) {
      backup.schema.policies = policies;
      console.log(`   ✅ ${policies.length} políticas\n`);
    } else {
      console.log(`   ℹ️  RLS não exportável via REST (use Dashboard)\n`);
    }
    
    // 5. Tenta pegar FUNCTIONS
    console.log('⏳ Coletando functions...');
    const functions = await fetchSupabaseData(
      supabaseUrl,
      'information_schema.routines?routine_schema=eq.public&select=routine_name,routine_definition',
      serviceRole
    );
    
    if (functions && Array.isArray(functions)) {
      backup.schema.functions = functions;
      console.log(`   ✅ ${functions.length} functions\n`);
    } else {
      console.log(`   ℹ️  Functions não exportáveis via REST\n`);
    }
    
    // Salva backup
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    const fileSize = fs.statSync(backupFile).size / 1024; // KB
    
    console.log('✅ Backup completo concluído!\n');
    console.log('📊 Resumo:');
    console.log(`   📁 Arquivo: ${path.relative(process.cwd(), backupFile)}`);
    console.log(`   💾 Tamanho: ${fileSize.toFixed(2)} KB`);
    console.log(`   📋 Tabelas: ${tableNames.length}`);
    console.log(`   📊 Registros: ${Object.values(backup.data).reduce((sum, arr) => sum + (arr.length || 0), 0)}`);
    console.log(`   🔐 Políticas RLS: ${backup.schema.policies.length}`);
    console.log(`   ⚙️  Functions: ${backup.schema.functions.length}`);
    console.log(`   🕐 Data: ${backup.backup_date}\n`);
    
    console.log('📌 Para restore em novo deploy:');
    console.log('   1. Use o arquivo JSON para recrear schema e dados');
    console.log('   2. Recrie RLS policies manualmente via Dashboard');
    console.log('   3. Atualize environment variables\n');
    
    console.log('🔒 Backup salvo com sucesso!');
    
    return true;
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

backupSupabaseSchema().then(success => {
  process.exit(success ? 0 : 1);
});
