// Função para calcular a média
function calcularMedia(notas) {
  const soma = notas.reduce((acc, nota) => acc + parseFloat(nota || 0), 0);
  return (soma / notas.length).toFixed(2);
}

// Função para atualizar as médias
function atualizarMedia() {
  const alunos = document.querySelectorAll('[id^="alunoNota"]');
  alunos.forEach((aluno) => {
    const inputsNotas = aluno.querySelectorAll('.notas');
    const mediaDiv = aluno.querySelector('.media p');
    inputsNotas.forEach(input => {
      input.addEventListener('input', () => {
        const notas = Array.from(inputsNotas).map(input => input.value);
        if (notas.every(nota => nota !== '')) {
          const media = calcularMedia(notas);
          mediaDiv.textContent = media;
        }
      });
    });
  });
}


