const PRICE_PER_PERSON = 1000;
const API_URL = window.BACKEND_URL || '';
const _registeredEmails = new Set();
let _submitting = false;
let teammateCount = 1;
let totalPersons = 1;

function formatXOF(amount) {
  return amount.toLocaleString('fr-FR') + ' XOF';
}

function updatePayment() {
  const mode = document.getElementById('mode').value;
  let count = 1;

  if (mode === 'groupe') {
    if (!document.getElementById('teammate-1').classList.contains('hidden')) count++;
    if (!document.getElementById('teammate-2').classList.contains('hidden')) count++;
  }

  totalPersons = count;
  const total = count * PRICE_PER_PERSON;

  const labels = { 1: 'Participation solo', 2: 'Participation en duo', 3: 'Participation en trio' };
  document.getElementById('payment-label').textContent = labels[count] || `${count} participants`;
  document.getElementById('payment-amount').textContent = `${count} × ${formatXOF(PRICE_PER_PERSON)}`;
  document.getElementById('payment-total').textContent = formatXOF(total);
}

function setMode(mode) {
  document.getElementById('mode').value = mode;

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const teamBlock = document.getElementById('team-block');
  if (mode === 'groupe') {
    teamBlock.classList.remove('hidden');
    document.getElementById('teammate-1').classList.remove('hidden');
    teammateCount = 1;
    document.getElementById('teammate-2').classList.add('hidden');
    updateAddBtn();
  } else {
    teamBlock.classList.add('hidden');
  }

  updatePayment();
}

function updateAddBtn() {
  const btn = document.getElementById('add-teammate');
  btn.disabled = teammateCount >= 2;
  btn.textContent = teammateCount >= 2 ? 'Nombre maximum atteint' : '+ Ajouter un coéquipier';
}

document.getElementById('btn-solo').addEventListener('click', () => setMode('solo'));
document.getElementById('btn-groupe').addEventListener('click', () => setMode('groupe'));

document.getElementById('add-teammate').addEventListener('click', () => {
  if (teammateCount < 2) {
    teammateCount++;
    document.getElementById(`teammate-${teammateCount}`).classList.remove('hidden');
    updateAddBtn();
    updatePayment();
  }
});

document.querySelectorAll('.remove-teammate').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    document.getElementById(`teammate-${id}`).classList.add('hidden');
    if (parseInt(id) < 2 && !document.getElementById('teammate-2').classList.contains('hidden')) {
      document.getElementById('teammate-1').classList.remove('hidden');
    }
    teammateCount = Math.max(0, [...document.querySelectorAll('.teammate-entry:not(.hidden)')].length);
    if (teammateCount === 0) {
      teammateCount = 1;
      document.getElementById('teammate-1').classList.remove('hidden');
    }
    updateAddBtn();
    updatePayment();
  });
});

document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const mobileFields = document.getElementById('mobile-money-fields');
    mobileFields.classList.toggle('hidden', radio.value !== 'mobile_money');
  });
});

function validateForm() {
  let valid = true;
  const fields = [
    { id: 'nom', errId: 'err-nom', msg: 'Le nom est requis.' },
    { id: 'prenom', errId: 'err-prenom', msg: 'Le prénom est requis.' },
    { id: 'email', errId: 'err-email', msg: 'Un email valide est requis.' },
  ];

  fields.forEach(({ id, errId, msg }) => {
    const el = document.getElementById(id);
    const err = document.getElementById(errId);
    const val = el.value.trim();

    if (!val || (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
      el.classList.add('error');
      err.textContent = msg;
      valid = false;
    } else {
      el.classList.remove('error');
      err.textContent = '';
    }
  });

  return valid;
}

function openModal(ref, name) {
  document.getElementById('modal-ref').textContent = ref;
  document.getElementById('modal-message').textContent =
    `Bienvenue ${name} ! Votre inscription a été enregistrée avec succès. Présentez cette référence le jour de l'événement.`;
  document.getElementById('confirmation-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('confirmation-modal').classList.add('hidden');
  document.getElementById('registrationForm').reset();
  setMode('solo');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  if (_submitting) return;

  const emailVal = document.getElementById('email').value.trim().toLowerCase();

  if (_registeredEmails.has(emailVal)) {
    const emailEl = document.getElementById('email');
    const errEl = document.getElementById('err-email');
    emailEl.classList.add('error');
    errEl.textContent = 'Cette adresse email est déjà inscrite.';
    emailEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  const submitText = submitBtn.querySelector('.submit-text');
  const loader = submitBtn.querySelector('.submit-loader');

  _submitting = true;
  submitBtn.disabled = true;
  submitText.classList.add('hidden');
  loader.classList.remove('hidden');

  const mode = document.getElementById('mode').value;
  const teammates = [];

  if (mode === 'groupe') {
    for (let i = 1; i <= 2; i++) {
      const entry = document.getElementById(`teammate-${i}`);
      if (!entry.classList.contains('hidden')) {
        const nom = entry.querySelector(`[name="teammate_nom_${i}"]`).value.trim();
        const prenom = entry.querySelector(`[name="teammate_prenom_${i}"]`).value.trim();
        if (nom || prenom) teammates.push({ nom, prenom });
      }
    }
  }

  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

  const payload = {
    nom: document.getElementById('nom').value.trim(),
    prenom: document.getElementById('prenom').value.trim(),
    email: emailVal,
    tel: document.getElementById('tel').value.trim(),
    mode,
    teammates,
    payment_method: paymentMethod,
    phone_payment: document.getElementById('phone_payment').value.trim(),
    transaction_id: document.getElementById('transaction_id').value.trim(),
    total: totalPersons * PRICE_PER_PERSON,
  };

  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      _registeredEmails.add(emailVal);
      openModal(data.reference, payload.prenom);
    } else if (res.status === 409) {
      _registeredEmails.add(emailVal);
      const emailEl = document.getElementById('email');
      const errEl = document.getElementById('err-email');
      emailEl.classList.add('error');
      errEl.textContent = 'Cette adresse email est déjà inscrite.';
      emailEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(data.error || 'Une erreur est survenue. Veuillez réessayer.');
    }
  } catch {
    alert('Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.');
  } finally {
    _submitting = false;
    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    loader.classList.add('hidden');
  }
});

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.about-card, .form-block').forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${i * 0.08}s`;
  revealObserver.observe(el);
});

document.querySelectorAll('.form-group input').forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('error');
    const errId = `err-${input.id}`;
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = '';
  });
});

updatePayment();
