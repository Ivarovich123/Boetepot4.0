// API Base URL
const API_BASE_URL = '/api';

// Theme Toggle
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById('theme-icon');
  
  if (body.classList.contains('dark')) {
    body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    if (themeIcon) themeIcon.className = 'fas fa-moon';
  } else {
    body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    if (themeIcon) themeIcon.className = 'fas fa-sun';
  }
}

// Init theme from local storage
function initTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', theme === 'dark');
  document.getElementById('theme-icon').className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Utility Functions
function toggleLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.style.backgroundColor = isError ? 'var(--error-color)' : 'var(--success-color)';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Onbekend';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ongeldige datum';
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    console.log(`[API] Fetching ${url}...`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error(`[API] Non-JSON response: ${text}`);
      throw new Error('Unexpected response format from server');
    }
    
    if (!response.ok) {
      console.error(`[API] Error response:`, data);
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    console.log(`[API] Response from ${url}:`, data);
    return data;
  } catch (error) {
    console.error(`[API] Error:`, error);
    showToast(error.message, true);
    throw error;
  }
}

// Data Loading Functions
async function loadPlayers() {
  try {
    const players = await fetchAPI('/api/players');
    const select = $('#finePlayer');
    select.empty().append('<option value="">Selecteer speler</option>');
    
    if (Array.isArray(players)) {
      players.forEach(player => {
        select.append(new Option(player.name, player.id));
      });
    }
    
    // Initialize or refresh Select2
    select.select2({
      theme: 'classic',
      placeholder: 'Selecteer speler',
      allowClear: true,
      width: '100%'
    });
  } catch (error) {
    console.error('Error loading players:', error);
    showToast('Fout bij laden spelers', true);
  }
}

async function loadReasons() {
  try {
    const reasons = await fetchAPI('/api/reasons');
    const select = $('#fineReason');
    select.empty().append('<option value="">Selecteer reden</option>');
    
    if (Array.isArray(reasons)) {
      reasons.forEach(reason => {
        select.append(new Option(reason.description, reason.id));
      });
    }
    
    // Initialize or refresh Select2
    select.select2({
      theme: 'classic',
      placeholder: 'Selecteer reden',
      allowClear: true,
      width: '100%'
    });
  } catch (error) {
    console.error('Error loading reasons:', error);
    showToast('Fout bij laden redenen', true);
  }
}

async function loadRecentFines() {
  try {
    const fines = await fetchAPI('/api/recent-fines');
    const tbody = document.getElementById('recentFines');
    
    if (!tbody) return;
    
    if (!Array.isArray(fines) || fines.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Geen recente boetes gevonden</td></tr>';
      return;
    }
    
    tbody.innerHTML = fines.map(fine => `
      <tr>
        <td>${fine.player_name || 'Onbekend'}</td>
        <td>${fine.reason_description || 'Onbekend'}</td>
        <td>${formatCurrency(fine.amount || 0)}</td>
        <td>${formatDate(fine.date)}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading recent fines:', error);
    showToast('Fout bij laden recente boetes', true);
  }
}

// Form Handlers
async function handleAddPlayer(event) {
  event.preventDefault();
  
  const nameInput = document.getElementById('playerName');
  if (!nameInput) return;
  
  const name = nameInput.value.trim();
  if (!name) {
    showToast('Vul een naam in', true);
    return;
  }
  
  try {
    toggleLoading(true);
    await fetchAPI('/api/players', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
    showToast('Speler toegevoegd');
    nameInput.value = '';
    await loadPlayers();
  } catch (error) {
    console.error('Error adding player:', error);
    showToast('Fout bij toevoegen speler', true);
  } finally {
    toggleLoading(false);
  }
}

async function handleAddReason(event) {
  event.preventDefault();
  
  const descriptionInput = document.getElementById('reasonDescription');
  if (!descriptionInput) return;
  
  const description = descriptionInput.value.trim();
  if (!description) {
    showToast('Vul een omschrijving in', true);
    return;
  }
  
  try {
    toggleLoading(true);
    await fetchAPI('/api/reasons', {
      method: 'POST',
      body: JSON.stringify({ description })
    });
    
    showToast('Reden toegevoegd');
    descriptionInput.value = '';
    await loadReasons();
  } catch (error) {
    console.error('Error adding reason:', error);
    showToast('Fout bij toevoegen reden', true);
  } finally {
    toggleLoading(false);
  }
}

async function handleAddFine(event) {
  event.preventDefault();
  
  const playerSelect = document.getElementById('finePlayer');
  const reasonSelect = document.getElementById('fineReason');
  const amountInput = document.getElementById('fineAmount');
  
  if (!playerSelect || !reasonSelect || !amountInput) return;
  
  const player_id = parseInt(playerSelect.value);
  const reason_id = parseInt(reasonSelect.value);
  const amount = parseFloat(amountInput.value);
  
  if (!player_id || !reason_id || isNaN(amount) || amount <= 0) {
    showToast('Vul alle velden correct in', true);
    return;
  }
  
  try {
    toggleLoading(true);
    await fetchAPI('/api/fines', {
      method: 'POST',
      body: JSON.stringify({
        player_id,
        reason_id,
        amount: parseFloat(amount.toFixed(2))
      })
    });
    
    showToast('Boete toegevoegd');
    amountInput.value = '';
    $(playerSelect).val(null).trigger('change');
    $(reasonSelect).val(null).trigger('change');
    
    await loadRecentFines();
  } catch (error) {
    console.error('Error adding fine:', error);
    showToast('Fout bij toevoegen boete', true);
  } finally {
    toggleLoading(false);
  }
}

async function handleReset() {
  if (!confirm('Weet je zeker dat je alle gegevens wilt resetten? Dit kan niet ongedaan worden gemaakt!')) {
    return;
  }
  
  try {
    toggleLoading(true);
    await fetchAPI('/api/reset', { method: 'POST' });
    showToast('Alle gegevens zijn gereset');
    
    // Reload all data
    await Promise.all([
      loadPlayers(),
      loadReasons(),
      loadRecentFines()
    ]);
  } catch (error) {
    console.error('Error resetting data:', error);
    showToast('Fout bij resetten gegevens', true);
  } finally {
    toggleLoading(false);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize theme
    initTheme();
    
    // Load data
    loadPlayers();
    loadReasons();
    loadRecentFines();
    
    // Set up form handlers
    const addPlayerForm = document.getElementById('addPlayerForm');
    const addReasonForm = document.getElementById('addReasonForm');
    const addFineForm = document.getElementById('addFineForm');
    const resetButton = document.getElementById('resetButton');
    
    if (addPlayerForm) {
      addPlayerForm.addEventListener('submit', handleAddPlayer);
    }
    
    if (addReasonForm) {
      addReasonForm.addEventListener('submit', handleAddReason);
    }
    
    if (addFineForm) {
      addFineForm.addEventListener('submit', handleAddFine);
    }
    
    if (resetButton) {
      resetButton.addEventListener('click', handleReset);
    }
    
    console.log('Admin initialized');
  } catch (error) {
    console.error('Error initializing admin:', error);
    showToast('Fout bij initialiseren', true);
  }
}); 