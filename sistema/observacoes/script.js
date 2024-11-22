const supabaseUrl = 'https://pfdjgsjbmhisqjxbzmjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZGpnc2pibWhpc3FqeGJ6bWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNjY3NzEsImV4cCI6MjA0NDc0Mjc3MX0.qYuDBWNU8F6qzcAaksDeXc_CITjHAMAagFgFq-miLfE';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let alunoEscolhido

function abreviarNome(nomeCompleto) {
    // Divide o nome completo em partes
    const partes = nomeCompleto.split(" ");

    // Se o nome tiver apenas duas partes, retorna o nome completo sem alterações
    if (partes.length <= 2) return nomeCompleto;

    // Mantém o primeiro e o último nome completos
    const primeiroNome = partes[0];
    const ultimoNome = partes[partes.length - 1];

    // Abrevia os nomes intermediários, ignorando os que começam com letra minúscula
    const intermediarios = partes.slice(1, -1).filter(nome => nome[0] === nome[0].toUpperCase())
        .map(nome => nome[0] + ".");

    // Junta tudo: primeiro nome + intermediários abreviados + último nome
    return [primeiroNome, ...intermediarios, ultimoNome].join(" ");
}

async function fetchAlunosData() {
    const turmaID = localStorage.getItem('professorTurmaEscolhida')

    const { data: alunos, error: turmaError } = await supabaseClient
        .from('alunos')
        .select('id, nome')
        .eq('turma_id', turmaID)

    const alunosOrdenados = alunos.sort((a, b) => a.nome.localeCompare(b.nome));
    // console.log(alunosOrdenados) 

    const ulAlunos = document.getElementById('ulAlunos')
    const h1Aluno = document.getElementById('h1Aluno')
    alunosOrdenados.forEach(aluno => {
        const liAluno = document.createElement('li')
        // console.log(abreviarNome(aluno.nome))
        liAluno.textContent = abreviarNome(aluno.nome)
        ulAlunos.appendChild(liAluno)

        liAluno.addEventListener('click', () => {
            h1Aluno.textContent = abreviarNome(aluno.nome)
            alunoEscolhido = aluno.id
        })
    });
}


async function verificarAutenticacao() {
    const { data: sessionData, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error('Erro ao obter a sessão:', error.message);
    } else if (!sessionData?.session) {
        window.location.href = './../index.html';
    }
}



const btnSalvar = document.getElementById('salvar')
const textArea = document.getElementById('textareaObservacoes')
btnSalvar.addEventListener('click', async () => {


    if (textArea.value == '') {
        alert('é necessario uma observação')
        return
    }
    if (!alunoEscolhido) {
        alert('é necessaria a seleção de um aluno')
        return
    }

    const userId = localStorage.getItem('authUuid');

    // Busca o ID do professor relacionado ao perfil do usuário
    const { data: profileID, error: profileError } = await supabaseClient
        .from('profiles')
        .select('professor_id')
        .eq('id', userId);

    if (profileError || !profileID?.length) {
        console.error('Erro ao buscar perfil:', profileError || 'Nenhum perfil encontrado');
        return;
    }

    const professorId = profileID[0].professor_id;


    const dataAtual = new Date().toISOString().split('T')[0];
    const professorReca = professorId
    const alunoReca = alunoEscolhido
    const recado = textArea.value

    console.log(dataAtual, professorReca, alunoReca, recado)

    try {
        const response = await fetch('http://localhost:3000/send_recado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recado: recado,
                alunoRecadado: alunoReca,
                professorRecadiante: professorReca,
                data: dataAtual
            }),
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error('Erro ao enviar recado', errorResponse.error);
            alert('Erro ao enviar observacao: ' + errorResponse.error);
            return;
        }

        const successMessage = await response.json();
        console.log(successMessage.message);
        alert('sua observação foi enviada!');
    } catch (error) {
        console.error('Erro ao realizar update:', error.message);
        alert('Erro ao realizar update: ' + error.message);
    }

    location.reload();

})


document.addEventListener('DOMContentLoaded', verificarAutenticacao);
fetchAlunosData()