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
  const savedTheme = localStorage.getItem('theme');
  const themeIcon = document.getElementById('theme-icon');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    if (themeIcon) themeIcon.className = 'fas fa-sun';
  } else {
    if (themeIcon) themeIcon.className = 'fas fa-moon';
  }
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
  return `€${parseFloat(amount).toFixed(2)}`;
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
  try {
    console.log(`[API] Fetching ${endpoint}...`, options);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    
    console.log(`[API] Response from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`[API] Error fetching ${endpoint}:`, error);
    showToast(error.message || 'Er is een fout opgetreden', true);
    throw error;
  }
}

// Data Loading Functions
async function loadPlayers() {
  try {
    console.log('[Players] Loading players...');
    const players = await fetchAPI('/players');
    
    const playerSelect = document.getElementById('finePlayer');
    if (!playerSelect) {
      console.error('[Players] Player select not found');
      return;
    }
    
    // Initialize select2
    $(playerSelect).select2({
      placeholder: 'Zoek een speler...',
      allowClear: true,
      data: players.map(player => ({
        id: player.id,
        text: player.name
      }))
    });
  } catch (error) {
    console.error('[Players] Error:', error);
    showToast('Fout bij laden spelers', true);
  }
}

async function loadReasons() {
  try {
    console.log('[Reasons] Loading reasons...');
    const reasons = await fetchAPI('/reasons');
    
    const reasonSelect = document.getElementById('fineReason');
    if (!reasonSelect) {
      console.error('[Reasons] Reason select not found');
      return;
    }
    
    // Initialize select2
    $(reasonSelect).select2({
      placeholder: 'Zoek een reden...',
      allowClear: true,
      data: reasons.map(reason => ({
        id: reason.id,
        text: reason.description
      }))
    });
  } catch (error) {
    console.error('[Reasons] Error:', error);
    showToast('Fout bij laden redenen', true);
  }
}

async function loadRecentFines() {
  try {
    console.log('[Recent] Loading recent fines...');
    const fines = await fetchAPI('/recent-fines');
    
    const recentFinesElement = document.getElementById('recentFines');
    if (!recentFinesElement) {
      console.error('[Recent] Element not found');
      return;
    }
    
    if (!Array.isArray(fines) || fines.length === 0) {
      recentFinesElement.innerHTML = '<tr><td colspan="4">Geen recente boetes gevonden</td></tr>';
      return;
    }
    
    const rows = fines.map(fine => `
      <tr>
        <td>${fine.player_name || 'Onbekend'}</td>
        <td>${fine.reason_description || 'Onbekend'}</td>
        <td>${formatCurrency(fine.amount || 0)}</td>
        <td>${formatDate(fine.date)}</td>
      </tr>
    `).join('');
    
    recentFinesElement.innerHTML = rows;
  } catch (error) {
    console.error('[Recent] Error:', error);
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
    const response = await fetchAPI('/players', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
    showToast('Speler toegevoegd');
    nameInput.value = '';
    await loadPlayers();
  } catch (error) {
    console.error('[Add Player] Error:', error);
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
    const response = await fetchAPI('/reasons', {
      method: 'POST',
      body: JSON.stringify({ description })
    });
    
    showToast('Reden toegevoegd');
    descriptionInput.value = '';
    await loadReasons();
  } catch (error) {
    console.error('[Add Reason] Error:', error);
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
  
  const player_id = playerSelect.value;
  const reason_id = reasonSelect.value;
  const amount = parseFloat(amountInput.value);
  
  if (!player_id || !reason_id || isNaN(amount)) {
    showToast('Vul alle velden in', true);
    return;
  }
  
  try {
    toggleLoading(true);
    const response = await fetchAPI('/fines', {
      method: 'POST',
      body: JSON.stringify({ 
        player_id: parseInt(player_id), 
        reason_id: parseInt(reason_id), 
        amount: parseFloat(amount.toFixed(2))
      })
    });
    
    showToast('Boete toegevoegd');
    playerSelect.value = '';
    reasonSelect.value = '';
    amountInput.value = '';
    $(playerSelect).trigger('change');
    $(reasonSelect).trigger('change');
    
    await loadRecentFines();
  } catch (error) {
    console.error('[Add Fine] Error:', error);
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
    
    if (addPlayerForm) {
      addPlayerForm.addEventListener('submit', handleAddPlayer);
    }
    
    if (addReasonForm) {
      addReasonForm.addEventListener('submit', handleAddReason);
    }
    
    if (addFineForm) {
      addFineForm.addEventListener('submit', handleAddFine);
    }
    
    // Initialize Select2
    $('.form-select').select2({
      theme: 'classic',
      placeholder: 'Selecteer...',
      allowClear: true,
      width: '100%'
    });
    
    console.log('Admin initialized');
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}); 