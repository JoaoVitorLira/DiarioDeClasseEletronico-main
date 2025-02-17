const supabaseUrl = 'https://pfdjgsjbmhisqjxbzmjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZGpnc2pibWhpc3FqeGJ6bWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE2Njc3MSwiZXhwIjoyMDQ0NzQyNzcxfQ.bE3ulLPWv8gnLTbTt1Bjd1pQdZUnXb51e94INyBBNaI';
const express = require('express');
const cors = require('cors'); // Importe o pacote cors
const { createClient } = require('@supabase/supabase-js');



const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 3000;

// Configure o CORS para permitir requisições de qualquer origem
app.use(cors());

// Middleware para parsing de JSON
app.use(express.json());

app.get('/fetch_roteiro', async (req, res) => {
    const { data, turma } = req.query;
    try {
        const { data: roteiro, error } = await supabase
            .from('roteiros')
            .select('*')
            .eq('data', data)
            .eq('turma_materia_id', turma)
            .single();
        if (error) {
            return res.status(404).json({ message: 'Roteiro não encontrado' });
        }
        res.status(200).json(roteiro);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});



app.post('/send_roteiro', async (req, res) => {
    const { roteiro, data, titulo, turma } = req.body;
    try {
        // Tenta inserir ou atualizar
        const { error: DataError } = await supabase
            .from('roteiros')
            .upsert(
                {
                    turma_materia_id: turma,
                    data: data,
                    conteudo: roteiro,
                    titulo: titulo
                },
                { onConflict: ['data', 'turma_materia_id'] } // Define as colunas para conflito
            );

        if (DataError) {
            console.error('Erro ao inserir/atualizar no Supabase:', DataError);
            return res.status(400).json({ error: DataError.message });
        }

        res.status(200).json({ message: 'Roteiro salvo com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});


app.post('/send_recado', async (req, res) => {
    const { recado, alunoRecadado, professorRecadiante, data } = req.body;
    try {
        const { error: materiaTurmaDataError } = await supabase
            .from('observacoes')
            .insert({
                professor_id: professorRecadiante,
                aluno_id: alunoRecadado,
                conteudo: recado,
                data: data
            });

        res.status(200).json({ message: 'observação feita com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/update_user', async (req, res) => {
    const { professorEmailUpd, professorCpfUpd, professorNumeroUpd, professorNomeUpd, professorSobrenomeUpd, professorID } = req.body;
    const { arrayMateriasUpd, arrayTurmasUpd, arrayIds } = req.body;


    try {

        // Insere os dados do professor na tabela 'professores'
        const { data: professorData, error: professorError } = await supabase
            .from('professores')
            .update({
                nome: professorNomeUpd,
                email_pessoal: professorEmailUpd,
                cpf: professorCpfUpd,
                numero_celular: professorNumeroUpd,
                sobrenome: professorSobrenomeUpd
            })
            .eq('id', professorID)
            .select()
            .single();


        if (professorError) {
            console.error('Erro ao atualizar o professor:', professorError);
            return res.status(500).json({ error: 'Erro ao atualizar o professor.' });
        }

        const { error: deleteTurmasMateriasError } = await supabase
            .from('turmas_materias')
            .delete()
            .eq('professor_id', professorID);

        if (deleteTurmasMateriasError) {
            return res.status(500).json({ error: 'Erro ao deletar da tabela turmas_materias' });
        }

        for (let i = 0; i < arrayMateriasUpd.length; i++) {

            const { data: turma, error: turmaError } = await supabase
                .from('turmas')
                .select('id')
                .eq('nome_turma', arrayTurmasUpd[i])
                .single();

            if (turmaError || !turma) {
                throw new Error(`Erro ao encontrar turma: ${turmaError?.message || 'Turma não encontrada'}`);
            }

            const { data: materia, error: materiaError } = await supabase
                .from('materias')
                .select('id')
                .eq('nome_materia', arrayMateriasUpd[i])
                .single();

            if (materiaError || !materia) {
                throw new Error(`Erro ao encontrar matéria: ${materiaError?.message || 'Matéria não encontrada'}`);
            }



            const { error: materiaTurmaDataError } = await supabase
                .from('turmas_materias')
                .insert({
                    turma_id: turma.id,
                    materia_id: materia.id,
                    professor_id: professorID
                });

            if (materiaTurmaDataError) {
                throw new Error(`Erro ao salvar dados em turmas_materias: ${materiaTurmaDataError.message}`);
            }


        }




        res.status(200).json({ message: 'Usuário e dados associados foram criados com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
})

app.post('/sigin_user', async (req, res) => {
    const { professorEmail, professorSenha, professorCpf, professorEmailPessoal, professorNumero, professorNome, professorSobrenome } = req.body;
    const { arrayMaterias, arrayTurmas } = req.body;

    if (!professorEmail || !professorSenha) {
        return res.status(400).json({ error: 'Email e senha são necessários' });
    }

    try {
        // Cria o usuário no sistema de autenticação
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email: professorEmail,
            password: professorSenha,
            email_confirm: true
        });


        if (userError) {
            throw new Error(`Erro ao criar usuário: ${userError.message}`);
        }

        // Insere os dados do professor na tabela 'professores'
        const { data: professorData, error: professorError } = await supabase
            .from('professores')
            .insert({
                nome: professorNome,
                email_educacional: professorEmail,
                email_pessoal: professorEmailPessoal,
                senha: professorSenha,
                cpf: professorCpf,
                numero_celular: professorNumero,
                sobrenome: professorSobrenome
            })
            .select()
            .single();

        if (professorError) {
            throw new Error(`Erro ao salvar dados do professor: ${professorError.message}`);
        }

        const professorId = professorData.id;

        // Cria o perfil do usuário na tabela 'profiles'
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: user.user.id,
                tipo_usuario: 'professor',
                professor_id: professorId
            });

        if (profileError) {
            throw new Error(`Erro ao salvar dados do profile: ${profileError.message}`);
        }

        // Insere as relações de turmas e matérias
        for (let i = 0; i < arrayMaterias.length; i++) {
            const { data: turma, error: turmaError } = await supabase
                .from('turmas')
                .select('id')
                .eq('nome_turma', arrayTurmas[i])
                .single();

            if (turmaError || !turma) {
                throw new Error(`Erro ao encontrar turma: ${turmaError?.message || 'Turma não encontrada'}`);
            }

            const { data: materia, error: materiaError } = await supabase
                .from('materias')
                .select('id')
                .eq('nome_materia', arrayMaterias[i])
                .single();

            if (materiaError || !materia) {
                throw new Error(`Erro ao encontrar matéria: ${materiaError?.message || 'Matéria não encontrada'}`);
            }

            const { error: materiaTurmaDataError } = await supabase
                .from('turmas_materias')
                .insert({
                    turma_id: turma.id,
                    materia_id: materia.id,
                    professor_id: professorId
                });

            if (materiaTurmaDataError) {
                throw new Error(`Erro ao salvar dados em turmas_materias: ${materiaTurmaDataError.message}`);
            }
        }

        res.status(200).json({ message: 'Usuário e dados associados foram criados com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// Endpoint para excluir o usuário
app.post('/delete-user', async (req, res) => {
    const { professorId } = req.body;


    // Verifique se professorId está presente
    if (!professorId) {
        return res.status(400).json({ error: 'Professor ID é necessário' });
    }

    try {

        // Passo 1: Obtenha o UUID do perfil do professor
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id')
            .eq('professor_id', professorId)
            .single();

        console.log(profilesData.id)
        if (profilesError) {
            return res.status(400).json({ error: 'Erro ao buscar perfil do professor' });
        } else if (!profilesData) {
            return res.status(400).json({ error: 'n tem nadinha' });
        }

        const profileUuid = profilesData.id;

        // Passo 2: Excluir o usuário da autenticação Supabase
        const { error: authError } = await supabase.auth.admin.deleteUser(profileUuid);
        if (authError) {
            return res.status(500).json({ error: 'Erro ao excluir usuário da autenticação' });
        }

        // Passo 3: Excluir o registro na tabela profiles
        const { error: deleteProfileError } = await supabase
            .from('profiles')
            .delete()
            .eq('professor_id', professorId);

        if (deleteProfileError) {
            return res.status(500).json({ error: 'Erro ao deletar perfil' });
        }

        const { error: deleteTurmasMateriasError } = await supabase
            .from('turmas_materias')
            .delete()
            .eq('professor_id', professorId);

        if (deleteTurmasMateriasError) {
            return res.status(500).json({ error: 'Erro ao deletar da tabela turmas_materias' });
        }
        // Passo 4: Excluir o registro na tabela professores
        const { error: deleteProfessorError } = await supabase
            .from('professores')
            .delete()
            .eq('id', professorId);

        if (deleteProfessorError) {
            console.log(deleteProfessorError);
            return res.status(500).json({ error: 'Erro ao deletar professor' });
        }

        // Passo 5: Excluir todas as linhas na tabela turmas_materias com o professor_id

        res.status(200).json({ message: 'Usuário e dados associados foram excluídos com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir usuário e dados associados: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});