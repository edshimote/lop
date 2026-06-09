const ACCESS_KEYS = {
  'AURA-SEMANAL-2026': { plan: 'Key Semanal', tier: 'basic', days: 7, moduleLimit: 8, permanent: false },
  'AURA-PERMANENTE-2026': { plan: 'Key Permanente', tier: 'basic', days: 0, moduleLimit: 8, permanent: true },
  'AURA-SEMANAL-BASIC': { plan: 'Key Semanal', tier: 'basic', days: 7, moduleLimit: 8, permanent: false },
  'AURA-PERMANENTE-BASIC': { plan: 'Key Permanente', tier: 'basic', days: 0, moduleLimit: 8, permanent: true }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const getAccess = (key) => ACCESS_KEYS[String(key || '').trim().toUpperCase()];
const accounts = () => JSON.parse(localStorage.getItem('aura_accounts') || '[]');
const setAccounts = (value) => localStorage.setItem('aura_accounts', JSON.stringify(value));
const completedLessons = () => JSON.parse(localStorage.getItem('aura_completed_lessons') || '[]');
const setCompletedLessons = (value) => localStorage.setItem('aura_completed_lessons', JSON.stringify(value));
let activeLessonId = null;
let welcomeTimer = null;
let currentQuestionStep = 1;
let pendingProfile = null;

function formatAccessInfo(access) {
  if (!access) return '';
  return access.permanent ? `${access.plan} - acesso vitalício` : `${access.plan} - ${access.days} dias`;
}

function activateAccount({ name, email, password, key }) {
  key = String(key || '').trim().toUpperCase();
  const access = getAccess(key);
  if (!access) return { ok: false, msg: 'Chave inválida ou não autorizada.' };
  if (!email || !password || !name) return { ok: false, msg: 'Preencha nome, email e senha.' };
  if (password.length < 4) return { ok: false, msg: 'Senha muito curta.' };

  const list = accounts();
  const existing = list.find((account) => account.email.toLowerCase() === email.toLowerCase());
  const activatedAt = new Date().toISOString();
  const expiresAt = access.permanent ? null : new Date(Date.now() + access.days * 86400000).toISOString();
  const account = { name, email, password, key, active: true, ...access, activatedAt, expiresAt };
  if (existing) Object.assign(existing, account);
  else list.push(account);
  setAccounts(list);
  localStorage.setItem('aura_user', JSON.stringify(account));
  return { ok: true };
}

function login(email, password) {
  const acc = accounts().find((account) => account.email.toLowerCase() === email.toLowerCase() && account.password === password);
  if (!acc) return { ok: false, msg: 'Email ou senha incorretos.' };
  if (!acc.permanent && acc.expiresAt && new Date(acc.expiresAt) < new Date()) return { ok: false, msg: 'Sua key expirou. Ative uma nova key.' };
  localStorage.setItem('aura_user', JSON.stringify(acc));
  return { ok: true };
}

const loginModal = $('#loginModal');
const paidModal = $('#paidModal');

$$('[data-open-login]').forEach((btn) => btn.addEventListener('click', () => {
  const generatedKey = $('#generatedKey')?.textContent?.trim();
  if (generatedKey && $('#regKey')) $('#regKey').value = generatedKey;
  paidModal?.close();
  loginModal?.showModal();
}));

$$('[data-buy]').forEach((btn) => btn.addEventListener('click', () => {
  const key = btn.dataset.key;
  const access = getAccess(key);
  $('#generatedKey').textContent = key;
  $('#generatedPlan').textContent = formatAccessInfo(access);
  if ($('#regKey')) $('#regKey').value = key;
  paidModal?.showModal();
}));

$('#hamb')?.addEventListener('click', () => $('#navLinks')?.classList.toggle('open'));
$('#dashMenu')?.addEventListener('click', () => $('#sidebar')?.classList.toggle('open'));

$$('.tab').forEach((tab) => tab.addEventListener('click', () => {
  $$('.tab').forEach((item) => item.classList.remove('active'));
  tab.classList.add('active');
  const isRegister = tab.dataset.tab === 'register';
  $('#registerBox')?.classList.toggle('hidden', !isRegister);
  $('#loginBox')?.classList.toggle('hidden', isRegister);
  if ($('#authMsg')) $('#authMsg').textContent = '';
}));

$('#registerBtn')?.addEventListener('click', () => {
  const result = activateAccount({
    name: $('#regName').value.trim(),
    email: $('#regEmail').value.trim(),
    password: $('#regPass').value,
    key: $('#regKey').value
  });
  if (!result.ok) {
    $('#authMsg').textContent = result.msg;
    return;
  }
  location.href = 'dashboard.html';
});

$('#loginBtn')?.addEventListener('click', () => {
  const result = login($('#logEmail').value.trim(), $('#logPass').value);
  if (!result.ok) {
    $('#authMsg').textContent = result.msg;
    return;
  }
  location.href = 'dashboard.html';
});

function guardDashboard() {
  if (!location.pathname.includes('dashboard')) return null;
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');
  if (!user.active || !getAccess(user.key)) {
    location.href = 'index.html';
    return null;
  }
  if (!user.permanent && user.expiresAt && new Date(user.expiresAt) < new Date()) {
    localStorage.removeItem('aura_user');
    location.href = 'index.html';
    return null;
  }
  return user;
}

const routes = {
  massStart: {
    tag: 'Construção de massa',
    short: 'Massa limpa',
    title: 'Etapa 1 - Base de ganho saudável',
    subtitle: 'Foco em técnica, constância, sono e alimentação equilibrada.',
    name: 'Rota Massa Limpa',
    desc: 'Para ganhar presença física aos poucos, com treino seguro e rotina organizada.',
    checklist: ['Treino de corpo inteiro 3x na semana', 'Preparar 2 refeições base', 'Dormir e acordar em horário mais estável'],
    modules: [
      lesson('m1', 'Aula 1', 'Fundação física', 'Ajuste sua base antes de buscar carga alta.', ['Postura e mobilidade', 'Treino de corpo inteiro', 'Organização semanal']),
      lesson('m2', 'Aula 2', 'Progressão segura', 'Evolua sem pular etapas importantes.', ['Aumentar carga com controle', 'Sono e recuperação', 'Medidas de evolução']),
      lesson('m3', 'Aula 3', 'Visual de presença', 'Use roupa, cabelo e pele a favor da evolução.', ['Roupas com caimento', 'Cabelo e pele', 'Presença em fotos']),
      lesson('m4', 'Aula 4', 'Constância', 'Crie um ciclo simples para repetir toda semana.', ['Checklist semanal', 'Rotina fixa', 'Ajustes sem ansiedade'])
    ]
  },
  definition: {
    tag: 'Definição e presença',
    short: 'Definição',
    title: 'Etapa 2 - Definição visual',
    subtitle: 'Foco em aparência, postura, condicionamento e estilo.',
    name: 'Rota Definição Inteligente',
    desc: 'Para quem quer ficar mais alinhado, definido e confiante de forma realista.',
    checklist: ['Treino objetivo 4x na semana', 'Separar 3 looks base', 'Caminhada leve ou mobilidade em dias alternados'],
    modules: [
      lesson('d1', 'Aula 1', 'Diagnóstico visual', 'Descubra o que mais melhora sua aparência agora.', ['Pontos fortes', 'Postura', 'Guarda-roupa base']),
      lesson('d2', 'Aula 2', 'Treino objetivo', 'Combine força e condicionamento com clareza.', ['Força + cardio leve', 'Mobilidade', 'Técnica limpa']),
      lesson('d3', 'Aula 3', 'Aparência diária', 'Organize pele, cabelo, cheiro e detalhes.', ['Pele', 'Cabelo', 'Higiene e perfume']),
      lesson('d4', 'Aula 4', 'Manutenção', 'Continue evoluindo com pouco atrito.', ['Rotina de 30 minutos', 'Fotos de progresso', 'Ajustes semanais'])
    ]
  },
  healthCut: {
    tag: 'Emagrecimento saudável',
    short: 'Saúde',
    title: 'Etapa 1 - Saúde e rotina',
    subtitle: 'Foco em segurança, constância e hábitos sustentáveis.',
    name: 'Rota Shape Saudável',
    desc: 'Para começar com movimento, alimentação organizada e pequenas vitórias diárias.',
    checklist: ['Caminhar 20 minutos', 'Beber água antes das refeições', 'Trocar excesso por uma escolha planejada'],
    modules: [
      lesson('h1', 'Aula 1', 'Começo seguro', 'Crie uma rotina que não te derruba na primeira semana.', ['Caminhadas', 'Mobilidade', 'Água e sono']),
      lesson('h2', 'Aula 2', 'Treino leve', 'Construa força sem transformar tudo em sofrimento.', ['Força básica', 'Cardio moderado', 'Controle de excessos']),
      lesson('h3', 'Aula 3', 'Estilo agora', 'Melhore presença enquanto o físico evolui.', ['Caimento de roupas', 'Cores e equilíbrio', 'Postura em fotos']),
      lesson('h4', 'Aula 4', 'Evolução', 'Meça progresso de forma saudável.', ['Metas realistas', 'Medidas saudáveis', 'Continuidade'])
    ]
  },
  styleFirst: {
    tag: 'Glow up visual',
    short: 'Estilo',
    title: 'Etapa 0 - Aparência primeiro',
    subtitle: 'Foco em estilo, higiene, confiança e organização.',
    name: 'Rota Presença & Estilo',
    desc: 'Para melhorar aparência rápido sem depender só de academia.',
    checklist: ['Escolher corte ou ajuste de cabelo', 'Montar 2 combinações simples', 'Fazer rotina curta de pele por 7 dias'],
    modules: [
      lesson('s1', 'Aula 1', 'Base visual', 'Arrume os detalhes que aparecem antes de qualquer conversa.', ['Cabelo', 'Pele', 'Higiene e perfume']),
      lesson('s2', 'Aula 2', 'Guarda-roupa', 'Monte combinações limpas sem gastar à toa.', ['Peças-chave', 'Caimento', 'Combinações simples']),
      lesson('s3', 'Aula 3', 'Postura', 'Use presença corporal para parecer mais confiante.', ['Andar melhor', 'Fotos', 'Linguagem corporal']),
      lesson('s4', 'Aula 4', 'Físico leve', 'Comece a treinar sem travar na rotina.', ['Mobilidade', 'Treino curto', 'Rotina de manutenção'])
    ]
  }
};

const universalModules = [
  lesson('u1', 'Aula 5', 'Plano semanal', 'Transforme a rota em ações pequenas para repetir durante a semana.', ['Checklist de manhã e noite', 'Revisão de roupa e cuidado pessoal', 'Treino curto sem travar']),
  lesson('u2', 'Aula 6', 'Presença social', 'Ajuste fotos, postura e comunicação para parecer mais alinhado.', ['Fotos melhores', 'Tom de voz e postura', 'Primeira impressão']),
  lesson('u3', 'Aula 7', 'Manutenção', 'Aprenda a continuar evoluindo depois da primeira semana.', ['Medir evolução', 'Refazer diagnóstico', 'Ajustes sem perder constância'])
];

function lesson(id, week, title, desc, items) {
  return { id, week, title, desc, items };
}

function calculateBMI(weight, heightCm) {
  const height = heightCm / 100;
  return weight / (height * height);
}

function bmiLabel(bmi) {
  if (bmi < 18.5) return 'baixo peso';
  if (bmi < 25) return 'faixa comum';
  if (bmi < 30) return 'sobrepeso';
  return 'atenção à saúde';
}

function chooseRoute(data) {
  const bmi = calculateBMI(data.weight, data.height);
  if (data.goal === 'estilo' || data.styleFocus === 'pele' || data.styleFocus === 'roupa' || data.styleFocus === 'postura') return 'styleFirst';
  if (data.biotype === 'ecto' || data.goal === 'massa' || data.bodyType === 'magro' || bmi < 18.5) return 'massStart';
  if (data.biotype === 'endo' || data.goal === 'emagrecer' || data.bodyType === 'acima' || bmi >= 28) return 'healthCut';
  if (data.goal === 'estilo') return 'styleFirst';
  if (data.goal === 'massa' || data.bodyType === 'magro' || bmi < 18.5) return 'massStart';
  if (data.goal === 'emagrecer' || data.bodyType === 'acima' || bmi >= 28) return 'healthCut';
  return 'definition';
}

function biotypeLabel(value) {
  return {
    ecto: 'Ectomorfo',
    meso: 'Mesomorfo',
    endo: 'Endomorfo',
    naosei: 'A definir'
  }[value] || 'A definir';
}

function genderLabel(value) {
  return {
    male: 'Homem',
    female: 'Mulher'
  }[value] || 'Perfil';
}

function styleFocusLabel(value) {
  return {
    pele: 'Aparência e cuidado',
    roupa: 'Estilo e caimento',
    postura: 'Postura e confiança',
    fisico: 'Físico e rotina'
  }[value] || 'Visual geral';
}

function bodyTypeLabel(value) {
  return {
    magro: 'Magro',
    medio: 'Médio',
    acima: 'Acima do peso'
  }[value] || 'Não informado';
}

function experienceLabel(value) {
  return {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado'
  }[value] || 'Não informado';
}

function sleepLabel(value) {
  return {
    baixo: 'Menos de 6h',
    medio: '6h a 7h',
    bom: '8h ou mais'
  }[value] || 'Não informado';
}

function timeLabel(value) {
  return {
    15: '15 min/dia',
    30: '30 min/dia',
    45: '45+ min/dia'
  }[value] || 'Não informado';
}

function goalLabel(value) {
  return {
    massa: 'Ganhar massa',
    definicao: 'Definir',
    emagrecer: 'Emagrecer com saúde',
    estilo: 'Melhorar aparência'
  }[value] || 'Evoluir aparência';
}

function keyLabel(user) {
  if (!user?.key) return '--';
  return user.key;
}

function getBestRecommendation(profile, route) {
  const bmi = Number(profile.bmi || calculateBMI(profile.weight, profile.height));
  const waist = Number(profile.waist || 0);
  const trainingDays = Number(profile.trainingDays || 0);
  const sleepLow = profile.sleep === 'baixo';
  const waistAttention = waist && profile.height ? waist / profile.height > 0.52 : false;

  let choice = route.name;
  let reason = `Pelo seu objetivo de ${goalLabel(profile.goal).toLowerCase()}, biotipo ${biotypeLabel(profile.biotype).toLowerCase()} e IMC ${bmi.toFixed(1)}, esse é o caminho mais coerente para começar sem bagunçar sua rotina.`;

  if (route === routes.massStart) {
    choice = 'Massa limpa primeiro';
    reason = 'O melhor pra você é construir base: treino simples, alimentação organizada e constância. Seu perfil aponta que ganhar presença física vem antes de buscar definição extrema.';
  }
  if (route === routes.healthCut) {
    choice = 'Saúde e redução primeiro';
    reason = 'O melhor pra você é começar por movimento, rotina e escolhas sustentáveis. A prioridade é reduzir excesso com segurança antes de intensificar estética.';
  }
  if (route === routes.styleFirst) {
    choice = 'Aparência primeiro';
    reason = 'O melhor pra você é atacar o visual que aparece rápido: cabelo, pele, roupa, postura e fotos. Isso melhora presença enquanto o físico evolui em paralelo.';
  }
  if (route === routes.definition) {
    choice = 'Definição inteligente';
    reason = 'O melhor pra você é equilibrar treino, postura e estilo. Seu perfil já permite trabalhar definição visual sem começar do zero.';
  }

  const parts = [
    ['Perfil', genderLabel(profile.gender)],
    ['Biotipo', biotypeLabel(profile.biotype)],
    ['Foco visual', styleFocusLabel(profile.styleFocus)],
    ['Treino ideal', trainingDays >= 4 ? 'Manter e ajustar técnica' : 'Começar com 3 dias/semana'],
    ['Atenção', sleepLow ? 'Sono primeiro' : waistAttention ? 'Rotina alimentar' : 'Constância semanal']
  ];

  return { choice, reason, parts };
}

function getDetailedResults(profile, route) {
  const bmi = Number(profile.bmi || calculateBMI(profile.weight, profile.height));
  const waist = Number(profile.waist || 0);
  const height = Number(profile.height || 0);
  const waistRatio = waist && height ? waist / height : 0;
  const trainingDays = Number(profile.trainingDays || 0);
  const time = Number(profile.time || 0);
  const cards = [];

  let bodyTitle = 'Base corporal equilibrada';
  let bodyText = `Seu IMC estimado é ${bmi.toFixed(1)}, dentro de uma leitura inicial de ${bmiLabel(bmi)}. Use isso como referência, não como laudo.`;
  let bodyAction = 'Acompanhe fotos, cintura e energia semanalmente.';
  let bodyTone = '';

  if (bmi < 18.5 || profile.biotype === 'ecto' || profile.bodyType === 'magro') {
    bodyTitle = 'Prioridade: ganhar base e presença';
    bodyText = `Seu perfil aponta tendência mais magra ou dificuldade de ganhar massa. O foco inicial deve ser força, alimentação consistente e sono.`;
    bodyAction = 'Comece com treino de corpo inteiro 3x/semana e aumente comida de forma organizada.';
  } else if (bmi >= 28 || profile.biotype === 'endo' || profile.bodyType === 'acima') {
    bodyTitle = 'Prioridade: reduzir excesso com segurança';
    bodyText = `Seu perfil indica que rotina, cintura e controle de excessos importam mais do que treino pesado no começo.`;
    bodyAction = 'Use caminhada, treino leve de força e refeições simples antes de intensificar.';
    bodyTone = 'attention';
  } else if (profile.biotype === 'meso') {
    bodyTitle = 'Boa resposta para definição';
    bodyText = 'Seu biotipo tende a responder bem quando treino, alimentação e descanso ficam consistentes.';
    bodyAction = 'Ajuste técnica, postura e frequência antes de procurar métodos extremos.';
  }
  cards.push(['Corpo', bodyTitle, bodyText, bodyAction, bodyTone]);

  let trainingTitle = 'Treino inicial realista';
  let trainingText = `Com ${experienceLabel(profile.experience).toLowerCase()} e ${trainingDays || 0} dias por semana, seu plano precisa ser simples para não quebrar a rotina.`;
  let trainingAction = time <= 15 ? 'Use sessões curtas: mobilidade + 3 exercícios principais.' : 'Use blocos de força, mobilidade e cardio leve.';
  let trainingTone = '';
  if (trainingDays === 0) {
    trainingTitle = 'Começar sem se destruir';
    trainingText = 'Como você ainda não treina, o melhor é criar aderência antes de volume.';
    trainingAction = 'Faça 3 dias curtos por semana por 14 dias antes de aumentar.';
  } else if (trainingDays >= 4 && profile.experience !== 'iniciante') {
    trainingTitle = 'Refinar treino, não só aumentar';
    trainingText = 'Você já tem frequência. O ganho agora vem de técnica, descanso e progressão limpa.';
    trainingAction = 'Registre cargas, repetições e sensação de esforço.';
  }
  cards.push(['Treino', trainingTitle, trainingText, trainingAction, trainingTone]);

  let routineTitle = 'Rotina sustentável';
  let routineText = `Seu tempo diário informado foi ${timeLabel(profile.time)} e seu sono está em ${sleepLabel(profile.sleep)}.`;
  let routineAction = 'Monte uma rotina pequena e repetível, com checklist diário.';
  let routineTone = '';
  if (profile.sleep === 'baixo') {
    routineTitle = 'Sono é gargalo principal';
    routineText = 'Com menos de 6h de sono, aparência, treino e constância tendem a cair.';
    routineAction = 'Ajuste horário de dormir antes de aumentar treino ou dieta.';
    routineTone = 'warning';
  } else if (time <= 15) {
    routineTitle = 'Rotina mínima, mas bem feita';
    routineText = 'Com pouco tempo por dia, o resultado vem de escolhas pequenas e repetidas.';
    routineAction = 'Use rotina de 15 min: pele, postura e treino curto alternados.';
    routineTone = 'attention';
  }
  cards.push(['Rotina', routineTitle, routineText, routineAction, routineTone]);

  let styleTitle = 'Visual de presença';
  let styleText = `Seu foco visual principal foi ${styleFocusLabel(profile.styleFocus).toLowerCase()}. Isso deve entrar junto com o físico, não depois.`;
  let styleAction = 'Escolha 2 mudanças visuais para aplicar nesta semana.';
  if (profile.styleFocus === 'pele') {
    styleTitle = 'Aparência rápida: pele e cabelo';
    styleAction = 'Monte rotina simples: limpar, hidratar, cabelo alinhado e perfume leve.';
  } else if (profile.styleFocus === 'roupa') {
    styleTitle = 'Aparência rápida: caimento';
    styleAction = 'Separe 2 looks base com camiseta/calça/tênis que vistam melhor.';
  } else if (profile.styleFocus === 'postura') {
    styleTitle = 'Aparência rápida: postura e fotos';
    styleAction = 'Treine ombros abertos, pescoço neutro e fotos com luz frontal.';
  } else if (profile.styleFocus === 'fisico') {
    styleTitle = 'Visual físico com constância';
    styleAction = 'Priorize treino de força, cintura e postura antes de métodos avançados.';
  }
  cards.push(['Aparência', styleTitle, styleText, styleAction, '']);

  let attentionTitle = 'Ponto de atenção';
  let attentionText = 'Nada indica uma trava única. Seu resultado deve vir de consistência semanal.';
  let attentionAction = 'Refaça o diagnóstico quando sua rotina mudar.';
  let attentionTone = '';
  if (waistRatio > 0.52) {
    attentionTitle = 'Cintura pede atenção';
    attentionText = 'A relação cintura/altura ficou alta para uma leitura inicial. Isso não é diagnóstico, mas sugere cuidar de rotina alimentar e movimento.';
    attentionAction = 'Comece por caminhada, água, sono e refeições previsíveis.';
    attentionTone = 'warning';
  } else if (profile.difficulty) {
    attentionTitle = 'Sua dificuldade declarada';
    attentionText = `Você citou "${profile.difficulty}". A rota deve reduzir atrito nesse ponto primeiro.`;
    attentionAction = 'Transforme essa dificuldade em uma ação pequena para hoje.';
  }
  cards.push(['Atenção', attentionTitle, attentionText, attentionAction, attentionTone]);

  return cards;
}

function saveProfile(data) {
  const routeKey = chooseRoute(data);
  const bmi = calculateBMI(data.weight, data.height);
  localStorage.setItem('aura_profile', JSON.stringify({
    ...data,
    routeKey,
    bmi: bmi.toFixed(1),
    bmiLabel: bmiLabel(bmi),
    generatedAt: new Date().toISOString()
  }));
}

function getModules(route) {
  return [...route.modules, ...universalModules];
}

function daysSince(dateString) {
  const start = new Date(dateString || Date.now()).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 86400000));
}

function getUnlockedCount(profile, route) {
  const total = getModules(route).length;
  return Math.min(total, daysSince(profile.generatedAt) + 1);
}

function showWelcomeSequence() {
  const welcome = $('#welcomeFlow');
  const onboarding = $('#onboarding');
  const plan = $('#studentPlan');
  if (!welcome || !onboarding) return;

  document.body.classList.add('diagnosis-mode');
  plan?.classList.add('hidden');
  $('#calculationFlow')?.classList.add('hidden');
  onboarding.classList.add('hidden');
  welcome.classList.remove('hidden');
  welcome.classList.add('show');
}

function showQuestions() {
  clearTimeout(welcomeTimer);
  document.body.classList.add('diagnosis-mode');
  $('#welcomeFlow')?.classList.add('hidden');
  $('#calculationFlow')?.classList.add('hidden');
  $('#onboarding')?.classList.remove('hidden');
  $('#onboarding')?.classList.add('show');
  setQuestionStep(1);
}

function showCalculationThenResult(data) {
  pendingProfile = data;
  document.body.classList.add('diagnosis-mode');
  $('#onboarding')?.classList.add('hidden');
  $('#welcomeFlow')?.classList.add('hidden');
  $('#studentPlan')?.classList.add('hidden');
  $('#calculationFlow')?.classList.remove('hidden');
  $('#calculationFlow')?.classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  clearTimeout(welcomeTimer);
  welcomeTimer = setTimeout(() => {
    saveProfile(pendingProfile);
    pendingProfile = null;
    $('#calculationFlow')?.classList.add('hidden');
    renderDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1900);
}

function renderDashboard() {
  const user = guardDashboard();
  if (!user) return;

  $('#studentName').textContent = user.name || 'Aluno';
  $('#accountPlan').textContent = formatAccessInfo(user);
  $('#accountStatus').textContent = user.permanent ? 'Vitalício' : 'Ativo';
  $('#accountExpire').textContent = user.permanent ? 'Não expira' : `Expira em: ${new Date(user.expiresAt).toLocaleDateString('pt-BR')}`;

  const profile = JSON.parse(localStorage.getItem('aura_profile') || '{}');
  renderProfilePanel(user, profile);
  if (!profile.routeKey) {
    showWelcomeSequence();
    updateProgress(null);
    return;
  }

  const route = routes[profile.routeKey];
  document.body.classList.remove('diagnosis-mode');
  document.body.dataset.gender = profile.gender || 'male';
  $('#welcomeFlow')?.classList.add('hidden');
  $('#calculationFlow')?.classList.add('hidden');
  $('#onboarding')?.classList.add('hidden');
  $('#studentPlan')?.classList.remove('hidden');
  $('#planTitle').textContent = route.title;
  $('#planSubtitle').textContent = route.subtitle;
  $('#profileTag').textContent = route.tag;
  $('#routeName').textContent = route.name;
  $('#routeDescription').textContent = route.desc;
  $('#accessName').textContent = formatAccessInfo(user);
  $('#accessExpiry').textContent = user.permanent ? 'Vitalício' : new Date(user.expiresAt).toLocaleDateString('pt-BR');
  $('#bmiValue').textContent = profile.bmi;
  $('#bmiLabel').textContent = profile.bmiLabel;
  $('#routeShort').textContent = route.short;
  renderBestRecommendation(profile, route);
  renderDetailedResults(profile, route);

  renderChecklist(route);
  renderModules(route, profile);
  updateProgress(route, profile);
}

function renderProfilePanel(user, profile = {}) {
  if (!$('#profilePanel')) return;
  $('#profileName').textContent = user.name || '--';
  $('#profileEmail').textContent = user.email || '--';
  $('#profilePlan').textContent = user.plan || '--';
  $('#profileStatus').textContent = user.permanent ? 'Vitalício' : 'Ativo';
  $('#profileKey').textContent = keyLabel(user);
  $('#profileValidity').textContent = user.permanent ? 'Vitalícia' : (user.expiresAt ? new Date(user.expiresAt).toLocaleDateString('pt-BR') : '--');
  $('#profileActivated').textContent = user.activatedAt ? new Date(user.activatedAt).toLocaleDateString('pt-BR') : '--';
  $('#profileGender').textContent = genderLabel(profile.gender);
  $('#profileBiotype').textContent = biotypeLabel(profile.biotype);
  $('#profileMeasures').textContent = profile.weight && profile.height ? `${profile.weight}kg / ${profile.height}cm` : 'Diagnóstico pendente';
  $('#profileGoal').textContent = profile.goal ? goalLabel(profile.goal) : 'Diagnóstico pendente';
}

function renderBestRecommendation(profile, route) {
  const result = getBestRecommendation(profile, route);
  $('#bestChoice').textContent = result.choice;
  $('#bestReason').textContent = result.reason;
  $('#resultParts').innerHTML = result.parts.map(([label, value]) => `<article><span>${label}</span><b>${value}</b></article>`).join('');
}

function renderDetailedResults(profile, route) {
  const results = getDetailedResults(profile, route);
  $('#deepResults').innerHTML = results.map(([label, title, text, action, tone]) => `
    <article class="${tone || ''}">
      <span>${label}</span>
      <h3>${title}</h3>
      <p>${text}</p>
      <b>${action}</b>
    </article>
  `).join('');
}

function renderChecklist(route) {
  const saved = JSON.parse(localStorage.getItem('aura_weekly_checks') || '{}');
  $('#weeklyChecklist').innerHTML = route.checklist.map((item, index) => {
    const id = `check-${route.short}-${index}`.replace(/\s/g, '-');
    return `<label class="check-item"><input type="checkbox" data-check-id="${id}" ${saved[id] ? 'checked' : ''}>${item}</label>`;
  }).join('');
  $$('[data-check-id]').forEach((input) => input.addEventListener('change', () => {
    const next = JSON.parse(localStorage.getItem('aura_weekly_checks') || '{}');
    next[input.dataset.checkId] = input.checked;
    localStorage.setItem('aura_weekly_checks', JSON.stringify(next));
  }));
}

function renderModules(route, profile) {
  const done = completedLessons();
  const modules = getModules(route);
  const unlockedCount = getUnlockedCount(profile, route);
  const nextUnlock = unlockedCount < modules.length ? `Próximo módulo libera em ${24 - new Date().getHours()}h.` : 'Todos os módulos já estão liberados.';
  if ($('#unlockNote')) $('#unlockNote').textContent = `Hoje você tem ${unlockedCount} de ${modules.length} módulo(s) liberado(s). ${nextUnlock}`;

  $('#routeModules').innerHTML = modules.map((item, index) => {
    const unlocked = index < unlockedCount;
    const unlockDay = index + 1;
    return `
    <article class="module-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="spoiler-content">
        <span>${unlocked ? item.week : `Dia ${unlockDay}`}</span>
        <h3>${unlocked ? item.title : 'Módulo bloqueado'}</h3>
        <p>${unlocked ? item.desc : 'Conteúdo em spoiler até o dia de liberação.'}</p>
        <ul class="module-list">${item.items.map((bullet) => `<li>${unlocked ? bullet : 'spoiler bloqueado'}</li>`).join('')}</ul>
        ${done.includes(item.id) ? '<small class="completed-badge">Concluída</small>' : ''}
      </div>
      ${unlocked ? '' : `<div class="module-lock"><div><b>Spoiler bloqueado</b><span>Libera no dia ${unlockDay} da sua rota.</span></div></div>`}
      <button class="lesson-btn" data-lesson-id="${item.id}" ${unlocked ? '' : 'disabled'}>${unlocked ? 'Abrir módulo' : `Libera no dia ${unlockDay}`}</button>
    </article>
  `;
  }).join('');
  $$('[data-lesson-id]').forEach((button) => button.addEventListener('click', () => openLesson(route, button.dataset.lessonId)));
}

function updateProgress(route, profile) {
  if (!$('#progressPercent')) return;
  if (!route) {
    $('#progressPercent').textContent = '0%';
    $('#lessonCount').textContent = '0/0';
    $('#routeShort').textContent = 'Pendente';
    return;
  }
  const modules = getModules(route);
  const unlockedCount = profile ? getUnlockedCount(profile, route) : modules.length;
  const unlockedModules = modules.slice(0, unlockedCount);
  const done = completedLessons().filter((id) => modules.some((item) => item.id === id));
  const total = modules.length;
  const percent = total ? Math.round((done.length / total) * 100) : 0;
  $('#progressPercent').textContent = `${percent}%`;
  $('#lessonCount').textContent = `${done.length}/${unlockedModules.length} liberadas`;
}

function openLesson(route, lessonId) {
  const profile = JSON.parse(localStorage.getItem('aura_profile') || '{}');
  const modules = getModules(route);
  const itemIndex = modules.findIndex((module) => module.id === lessonId);
  if (itemIndex >= getUnlockedCount(profile, route)) return;
  const item = modules[itemIndex];
  if (!item) return;
  activeLessonId = item.id;
  $('#lessonKicker').textContent = item.week;
  $('#lessonTitle').textContent = item.title;
  $('#lessonDescription').textContent = item.desc;
  $('#lessonBullets').innerHTML = item.items.map((bullet) => `<p>${bullet}</p>`).join('');
  $('#completeLesson').textContent = completedLessons().includes(item.id) ? 'Aula já concluída' : 'Marcar como concluída';
  $('#lessonModal')?.showModal();
}

$('#completeLesson')?.addEventListener('click', () => {
  if (!activeLessonId) return;
  const done = completedLessons();
  if (!done.includes(activeLessonId)) done.push(activeLessonId);
  setCompletedLessons(done);
  $('#lessonModal')?.close();
  renderDashboard();
});

$('#profileForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateQuestionStep(currentQuestionStep)) return;
  showCalculationThenResult({
    gender: $('#gender').value || localStorage.getItem('aura_gender') || 'male',
    weight: +$('#weight').value,
    height: +$('#height').value,
    age: +$('#age').value,
    waist: +$('#waist').value,
    biotype: $('#biotype').value,
    bodyType: $('#bodyType').value,
    experience: $('#experience').value,
    trainingDays: $('#trainingDays').value,
    sleep: $('#sleep').value,
    goal: $('#goal').value,
    time: $('#time').value,
    styleFocus: $('#styleFocus').value,
    difficulty: $('#difficulty').value.trim()
  });
});

$('#skipWelcome')?.addEventListener('click', showQuestions);

$$('[data-gender]').forEach((button) => button.addEventListener('click', () => {
  const gender = button.dataset.gender;
  $('#gender').value = gender;
  localStorage.setItem('aura_gender', gender);
  document.body.dataset.gender = gender;
  $$('[data-gender]').forEach((item) => item.classList.toggle('selected', item === button));
  showQuestions();
}));

$$('[data-biotype]').forEach((button) => button.addEventListener('click', () => {
  $('#biotype').value = button.dataset.biotype;
  $('#bodyTypeCards')?.classList.remove('needs-choice');
  $$('[data-biotype]').forEach((item) => item.classList.toggle('selected', item === button));
}));

$$('[data-choice-target]').forEach((button) => button.addEventListener('click', () => {
  const target = button.dataset.choiceTarget;
  const value = button.dataset.choiceValue;
  const input = $(`#${target}`);
  if (!input) return;
  input.value = value;
  const grid = button.closest('.choice-grid');
  grid?.classList.remove('needs-choice');
  $$(`[data-choice-target="${target}"]`).forEach((item) => item.classList.toggle('selected', item === button));
  window.setTimeout(() => setQuestionStep(currentQuestionStep + 1), 260);
}));

function setQuestionStep(step) {
  const total = $$('.question-step').length || 1;
  step = Math.max(1, Math.min(step, total));
  currentQuestionStep = step;
  $$('.question-step').forEach((section) => section.classList.toggle('active', Number(section.dataset.step) === step));
  $$('[data-dot]').forEach((dot) => dot.classList.toggle('active', Number(dot.dataset.dot) <= step));
  if ($('#currentQuestion')) $('#currentQuestion').textContent = step;
  if ($('#totalQuestions')) $('#totalQuestions').textContent = total;
  if ($('#quizBar')) $('#quizBar').style.width = `${Math.round((step / total) * 100)}%`;
  const active = $(`.question-step[data-step="${step}"]`);
  if ($('#questionHint')) $('#questionHint').textContent = active?.dataset.hint || 'Continue respondendo.';
  $('#onboarding')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateQuestionStep(step) {
  const section = $(`.question-step[data-step="${step}"]`);
  const fields = section ? [...section.querySelectorAll('input[required], select[required], textarea[required]')] : [];
  const invalid = fields.find((field) => !field.value);
  if (invalid) {
    if (invalid.type === 'hidden') {
      const grid = $(`.choice-grid[data-target="${invalid.id}"]`);
      grid?.classList.add('needs-choice');
      grid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    invalid.reportValidity();
    invalid.focus();
    return false;
  }
  return true;
}

$$('[data-next-step]').forEach((button) => button.addEventListener('click', () => {
  if (!validateQuestionStep(currentQuestionStep)) return;
  setQuestionStep(Number(button.dataset.nextStep));
}));

$$('[data-prev-step]').forEach((button) => button.addEventListener('click', () => {
  setQuestionStep(Number(button.dataset.prevStep));
}));

$('#redoProfile')?.addEventListener('click', () => {
  localStorage.removeItem('aura_profile');
  localStorage.removeItem('aura_completed_lessons');
  $('#studentPlan')?.classList.add('hidden');
  showWelcomeSequence();
  updateProgress(null);
});

$('#profileRedo')?.addEventListener('click', () => {
  localStorage.removeItem('aura_profile');
  localStorage.removeItem('aura_completed_lessons');
  $('#studentPlan')?.classList.add('hidden');
  showWelcomeSequence();
  updateProgress(null);
});

$('#logout')?.addEventListener('click', () => {
  localStorage.removeItem('aura_user');
  location.href = 'index.html';
});

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) entry.target.classList.add('show');
}), { threshold: .12 });
$$('.reveal').forEach((element) => observer.observe(element));
renderDashboard();
