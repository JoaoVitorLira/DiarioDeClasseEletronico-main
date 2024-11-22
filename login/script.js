const supabaseUrl = 'https://pfdjgsjbmhisqjxbzmjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZGpnc2pibWhpc3FqeGJ6bWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNjY3NzEsImV4cCI6MjA0NDc0Mjc3MX0.qYuDBWNU8F6qzcAaksDeXc_CITjHAMAagFgFq-miLfE';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Faz o login
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        return;
    }

    // Verifique se a sessão foi criada
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !sessionData?.session) {
        return;
    }

    const userId = sessionData.session.user.id;

    if (!userId) {
        return;
    }

    // Busca o perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId);

    if (profileError) {
        return;
    }

    if (!profile || profile.length === 0) {
        return;
    }

    const userProfile = profile[0];

    // Checa o tipo de usuário e redireciona conforme necessário
    if (userProfile.tipo_usuario === 'coordenador') {
        window.location.href = './GestaoSESI/index.html';
    } else if (userProfile.tipo_usuario === 'professor') {
        window.location.href = './sistema/index.html';
    } else {
        // Se necessário, você pode adicionar um tratamento adicional aqui
    }

    localStorage.setItem('authUuid', userId)

});
