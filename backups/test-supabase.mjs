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

async function testSupabaseConnection() {
  try {
    console.log('📋 Carregando variáveis de ambiente...');
    const env = loadEnv();
    
    const supabaseUrl = env.SUPABASE_URL;
    const serviceRole = env.SUPABASE_SERVICE_ROLE;
    const projectId = env.SUPABASE_PROJECT_ID;
    
    if (!supabaseUrl || !serviceRole) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE não definidos');
    }
    
    console.log(`✅ URL: ${supabaseUrl}`);
    console.log(`✅ Project ID: ${projectId}`);
    console.log(`✅ Service Role carregada (${serviceRole.substring(0, 20)}...)\n`);
    
    // Testa conexão com REST API usando apikey header
    console.log('🔗 Testando conexão REST API...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status HTTP: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Conexão bem-sucedida!\n');
      console.log('📊 Resumo:');
      console.log(`   ✓ Supabase Project conectado`);
      console.log(`   ✓ Service Role autenticado`);
      console.log(`   ✓ REST API respondendo\n`);
      console.log('💾 Configuração salva:');
      console.log(`   .dev.vars em: ${path.join(__dirname, '.dev.vars')}`);
      console.log(`\n🚀 Para usar em seu código:`);
      console.log(`   import { createClient } from '@supabase/supabase-js';`);
      console.log(`   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);`);
      return true;
    } else {
      const text = await response.text();
      console.error(`❌ Erro HTTP ${response.status}: ${text}`);
      return false;
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

testSupabaseConnection().then(success => {
  process.exit(success ? 0 : 1);
});
