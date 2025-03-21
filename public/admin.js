// API Base URL
const API_BASE_URL = '/api';

// Theme Toggle
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  
  // Update theme
  body.classList.toggle('dark', !isDark);
  localStorage.setItem('theme', newTheme);
  
  // Update icon with animation
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.style.transform = 'scale(0)';
    setTimeout(() => {
      themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
      themeIcon.style.transform = 'scale(1)';
    }, 150);
  }
  
  // Update Select2 for dark mode
  updateSelect2Theme(newTheme);
}

// Init theme from local storage
function initTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', theme === 'dark');
  
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  // Update Select2 for dark mode if present
  updateSelect2Theme(theme);
}

function updateSelect2Theme(theme) {
  // Reinitialize Select2 dropdowns with appropriate theme
  $('.select2-container').remove();
  
  $('.player-select, .reason-select').each(function() {
    const currentVal = $(this).val();
    $(this).select2({
      theme: 'classic',
      placeholder: $(this).attr('placeholder') || 'Selecteer een optie',
      allowClear: true,
      width: '100%'
    });
    $(this).val(currentVal).trigger('change');
  });
}

// Utility Functions
function toggleLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, isError = false) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    console.error('Toast container not found');
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Trigger reflow to enable animation
  toast.offsetHeight;
  
  // Show toast
  toast.classList.add('show');
  
  // Remove toast after animation
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

async function loadAllFines() {
  try {
    const fines = await fetchAPI('/api/fines');
    const tbody = document.getElementById('allFines');
    
    if (!tbody) return;
    
    if (!Array.isArray(fines) || fines.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Geen boetes gevonden</td></tr>';
      return;
    }
    
    tbody.innerHTML = fines.map(fine => `
      <tr data-fine-id="${fine.id}">
        <td>${fine.player_name || 'Onbekend'}</td>
        <td>${fine.reason_description || 'Onbekend'}</td>
        <td>${formatCurrency(fine.amount || 0)}</td>
        <td>${formatDate(fine.date)}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-primary edit-fine" title="Bewerk">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-fine" title="Verwijder">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners for edit and delete buttons
    tbody.querySelectorAll('.edit-fine').forEach(button => {
      button.addEventListener('click', handleEditFine);
    });
    
    tbody.querySelectorAll('.delete-fine').forEach(button => {
      button.addEventListener('click', handleDeleteFine);
    });
  } catch (error) {
    console.error('Error loading all fines:', error);
    showToast('Fout bij laden boetes', true);
  }
}

async function loadPlayerHistory(playerId) {
  try {
    console.log('[History] Loading player history...');
    const response = await fetchAPI(`/api/player-history/${playerId}`);
    
    const historyElement = document.getElementById('playerHistory');
    const historyTitle = document.getElementById('playerHistoryTitle');
    
    if (!historyElement) {
      console.error('[History] Element not found');
      return;
    }
    
    if (!response || !response.fines || response.fines.length === 0) {
      historyElement.innerHTML = '<tr><td colspan="3">Geen boetes gevonden</td></tr>';
      if (historyTitle) {
        historyTitle.textContent = 'Speler Historie';
      }
      return;
    }
    
    const total = response.fines.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    
    if (historyTitle) {
      historyTitle.textContent = `Historie van ${response.player_name}`;
    }
    
    const rows = response.fines.map(fine => `
      <tr>
        <td>${formatDate(fine.date)}</td>
        <td>${fine.reason_description || 'Onbekend'}</td>
        <td>${formatCurrency(fine.amount || 0)}</td>
      </tr>
    `).join('');
    
    historyElement.innerHTML = rows + `
      <tr class="table-info">
        <td colspan="2"><strong>Totaal</strong></td>
        <td><strong>${formatCurrency(total)}</strong></td>
      </tr>
    `;
  } catch (error) {
    console.error('[History] Error:', error);
    showToast('Fout bij laden speler historie', true);
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
  
  const form = event.target;
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
    
    const isEditMode = form.dataset.editMode === 'true';
    const fineId = form.dataset.editId;
    
    const endpoint = isEditMode ? `/api/fines/${fineId}` : '/api/fines';
    const method = isEditMode ? 'PUT' : 'POST';
    
    await fetchAPI(endpoint, {
      method,
      body: JSON.stringify({
        player_id,
        reason_id,
        amount: parseFloat(amount.toFixed(2))
      })
    });
    
    showToast(isEditMode ? 'Boete bijgewerkt' : 'Boete toegevoegd');
    
    // Reset form
    form.dataset.editMode = 'false';
    form.dataset.editId = '';
    amountInput.value = '';
    $(playerSelect).val(null).trigger('change');
    $(reasonSelect).val(null).trigger('change');
    
    // Update button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-plus"></i><span>Toevoegen</span>';
    
    // Reload data
    await Promise.all([loadAllFines(), loadRecentFines()]);
  } catch (error) {
    console.error('Error saving fine:', error);
    showToast('Fout bij opslaan boete', true);
  } finally {
    toggleLoading(false);
  }
}

async function handleEditFine(event) {
  const row = event.target.closest('tr');
  const fineId = row.dataset.fineId;
  
  try {
    const fine = await fetchAPI(`/api/fines/${fineId}`);
    
    // Populate form with fine data
    $('#finePlayer').val(fine.player_id).trigger('change');
    $('#fineReason').val(fine.reason_id).trigger('change');
    $('#fineAmount').val(fine.amount);
    
    // Update form for edit mode
    const form = document.getElementById('addFineForm');
    form.dataset.editMode = 'true';
    form.dataset.editId = fineId;
    
    // Update button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-save"></i><span>Opslaan</span>';
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error loading fine details:', error);
    showToast('Fout bij laden boete details', true);
  }
}

async function handleDeleteFine(event) {
  const row = event.target.closest('tr');
  const fineId = row.dataset.fineId;
  
  if (!confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
    return;
  }
  
  try {
    await fetchAPI(`/api/fines/${fineId}`, { method: 'DELETE' });
    showToast('Boete verwijderd');
    await Promise.all([loadAllFines(), loadRecentFines()]);
  } catch (error) {
    console.error('Error deleting fine:', error);
    showToast('Fout bij verwijderen boete', true);
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
      loadRecentFines(),
      loadAllFines()
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
    loadAllFines();
    
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