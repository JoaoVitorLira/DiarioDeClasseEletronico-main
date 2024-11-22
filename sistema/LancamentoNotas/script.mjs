import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://pfdjgsjbmhisqjxbzmjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZGpnc2pibWhpc3FqeGJ6bWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNjY3NzEsImV4cCI6MjA0NDc0Mjc3MX0.qYuDBWNU8F6qzcAaksDeXc_CITjHAMAagFgFq-miLfE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para enviar dados ao Supabase
async function enviarDadosSupabase(dadosAlunos) {
  try {
    // Envia os dados para a tabela 'notas'
    const { data, error } = await supabase
      .from('notas') // Nome da sua tabela no Supabase
      .insert(dadosAlunos);

    if (error) {
      console.error('Erro ao enviar dados ao Supabase:', error.message);
      throw new Error('Erro ao enviar os dados.');
    }

    console.log('Dados enviados com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro ao executar a operação:', error.message);
    throw error;
  }
}

// Simulação de uso da função
const dadosAlunos = [
  {
    aluno_id: 1,
    nota1: 8.5,
    nota2: 9.0,
    nota3: 7.5,
    media: 8.33,
  },
];

// Chamando a função
(async () => {
  try {
    const resposta = await enviarDadosSupabase(dadosAlunos);
    console.log('Resposta do Supabase:', resposta);
  } catch (error) {
    console.error('Falha ao enviar dados:', error.message);
  }
})();
