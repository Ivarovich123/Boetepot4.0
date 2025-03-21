// API Base URL
const API_BASE_URL = '/api';

// Theme Toggle
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('theme-icon').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Init theme from local storage
function initTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', theme);
  document.getElementById('theme-icon').className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Utility Functions
function showLoading() {
  document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast-message show ${type}`;
  setTimeout(() => toast.className = 'toast-message', 3000);
}

function formatDate(date) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(date).toLocaleDateString('nl-NL', options);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message, 'error');
    throw error;
  }
}

// Data Loading Functions
async function loadPlayers() {
  try {
    const players = await fetchAPI('/players');
    const select = $('#finePlayer');
    select.empty().append('<option value="">Selecteer speler</option>');
    players.forEach(player => {
      select.append(new Option(player.name, player.id));
    });
  } catch (error) {
    console.error('Error loading players:', error);
    showToast('Fout bij laden spelers', 'error');
  }
}

async function loadReasons() {
  try {
    const reasons = await fetchAPI('/reasons');
    const select = $('#fineReason');
    select.empty().append('<option value="">Selecteer reden</option>');
    reasons.forEach(reason => {
      select.append(new Option(reason.description, reason.id));
    });
  } catch (error) {
    console.error('Error loading reasons:', error);
    showToast('Fout bij laden redenen', 'error');
  }
}

async function loadRecentFines() {
  try {
    const fines = await fetchAPI('/recent-fines');
    const tbody = document.getElementById('recentFines');
    tbody.innerHTML = fines.length ? fines.map(fine => `
      <tr>
        <td>${fine.player_name}</td>
        <td>${fine.reason_description}</td>
        <td>${formatCurrency(fine.amount)}</td>
        <td>${formatDate(fine.created_at)}</td>
      </tr>
    `).join('') : '<tr><td colspan="4" class="text-center">Geen recente boetes</td></tr>';
  } catch (error) {
    console.error('Error loading recent fines:', error);
    showToast('Fout bij laden recente boetes', 'error');
  }
}

// Form Handlers
async function handleAddPlayer(event) {
  event.preventDefault();
  showLoading();
  try {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
      showToast('Vul een naam in', 'error');
      return;
    }
    await fetchAPI('/players', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    showToast('Speler succesvol toegevoegd');
    event.target.reset();
    await loadPlayers();
  } catch (error) {
    showToast('Fout bij toevoegen speler', 'error');
  } finally {
    hideLoading();
  }
}

async function handleAddReason(event) {
  event.preventDefault();
  showLoading();
  try {
    const description = document.getElementById('reasonDescription').value.trim();
    if (!description) {
      showToast('Vul een omschrijving in', 'error');
      return;
    }
    await fetchAPI('/reasons', {
      method: 'POST',
      body: JSON.stringify({ description })
    });
    showToast('Reden succesvol toegevoegd');
    event.target.reset();
    await loadReasons();
  } catch (error) {
    showToast('Fout bij toevoegen reden', 'error');
  } finally {
    hideLoading();
  }
}

async function handleAddFine(event) {
  event.preventDefault();
  showLoading();
  try {
    const player_id = parseInt(document.getElementById('finePlayer').value);
    const reason_id = parseInt(document.getElementById('fineReason').value);
    const amount = parseFloat(document.getElementById('fineAmount').value);

    if (!player_id || !reason_id || isNaN(amount) || amount <= 0) {
      showToast('Vul alle velden correct in', 'error');
      return;
    }

    await fetchAPI('/fines', {
      method: 'POST',
      body: JSON.stringify({
        player_id,
        reason_id,
        amount: parseFloat(amount.toFixed(2))
      })
    });
    showToast('Boete succesvol toegevoegd');
    event.target.reset();
    $('#finePlayer').val(null).trigger('change');
    $('#fineReason').val(null).trigger('change');
    await loadRecentFines();
  } catch (error) {
    showToast('Fout bij toevoegen boete', 'error');
  } finally {
    hideLoading();
  }
}

async function handleReset() {
  if (!confirm('Weet je zeker dat je alle gegevens wilt resetten? Dit kan niet ongedaan worden gemaakt!')) {
    return;
  }
  showLoading();
  try {
    await fetchAPI('/reset', { method: 'POST' });
    showToast('Alle gegevens zijn gereset');
    await Promise.all([loadPlayers(), loadReasons(), loadRecentFines()]);
  } catch (error) {
    showToast('Fout bij resetten gegevens', 'error');
  } finally {
    hideLoading();
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize theme
    initTheme();
    
    // Initialize Select2 with custom styling
    $('#finePlayer, #fineReason').select2({
      theme: 'default',
      placeholder: 'Selecteer...',
      allowClear: true,
      width: '100%',
      dropdownParent: $('body'),
      templateResult: (data) => {
        if (!data.id) return data.text;
        return $(`<span><i class="fas ${data.element.closest('select').id === 'finePlayer' ? 'fa-user' : 'fa-tag'} me-2"></i>${data.text}</span>`);
      }
    });

    // Load initial data
    await Promise.all([
      loadPlayers(),
      loadReasons(),
      loadRecentFines()
    ]);

    // Add event listeners
    document.getElementById('addPlayerForm').addEventListener('submit', handleAddPlayer);
    document.getElementById('addReasonForm').addEventListener('submit', handleAddReason);
    document.getElementById('addFineForm').addEventListener('submit', handleAddFine);
    document.getElementById('resetButton').addEventListener('click', handleReset);

    hideLoading();
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Fout bij initialiseren', 'error');
  }
}); 