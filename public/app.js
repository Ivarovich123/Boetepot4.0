// API Base URL
const API_BASE_URL = '/api';

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
  toast.className = `flex items-center p-4 mb-4 rounded-lg ${isError ? 'bg-red-600' : 'bg-green-600'} text-white shadow-md opacity-0 transition-opacity duration-300`;
  toast.style.opacity = '0';
  toast.innerHTML = `
    <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-3 text-lg"></i>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  // Fade in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // Remove toast after animation
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return 'Onbekend';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ongeldige datum';
  }
}

function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('Invalid amount:', amount);
    return '€0,00';
  }
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Theme handling
function initTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.getElementById('theme-icon').className = theme === 'dark' ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
  
  // Update Select2 theme if initialized
  if ($.fn.select2) {
    updateSelect2Theme(theme === 'dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  
  // Update theme
  document.documentElement.classList.toggle('dark', !isDark);
  localStorage.setItem('theme', newTheme);
  
  // Update icon with animation
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.style.transform = 'scale(0)';
    setTimeout(() => {
      themeIcon.className = isDark ? 'fas fa-moon text-xl' : 'fas fa-sun text-xl';
      themeIcon.style.transform = 'scale(1)';
    }, 150);
  }
  
  // Update Select2 theme if initialized
  if ($.fn.select2) {
    updateSelect2Theme(!isDark);
  }
}

// Update Select2 theme
function updateSelect2Theme(isDark) {
  $('.select2-container--default .select2-selection--single').css({
    'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
    'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)',
    'color': isDark ? 'white' : 'inherit'
  });
  
  $('.select2-container--default .select2-selection--single .select2-selection__rendered').css({
    'color': isDark ? 'white' : 'inherit'
  });
  
  $('.select2-container--default .select2-dropdown').css({
    'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
    'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)'
  });
  
  $('.select2-container--default .select2-results__option').css({
    'color': isDark ? 'white' : 'inherit'
  });
  
  $('.select2-container--default .select2-search__field').css({
    'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
    'color': isDark ? 'white' : 'inherit'
  });
}

// Initialize Select2
function initializeSelect2() {
  if (!$.fn.select2) {
    console.error('Select2 library not loaded');
    return;
  }
  
  try {
    $('#playerSelect').select2({
      theme: 'default',
      placeholder: 'Selecteer een speler',
      allowClear: true,
      width: '100%'
    });
    
    // Force Select2 display
    setTimeout(() => {
      $('.select2-container').css({
        'display': 'block',
        'position': 'relative',
        'z-index': '1050'
      });
      
      // Update theme
      updateSelect2Theme(document.documentElement.classList.contains('dark'));
    }, 100);
  } catch (error) {
    console.error('Error initializing Select2:', error);
  }
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
  try {
    console.log(`[API] Fetching ${endpoint}...`);
    toggleLoading(true);
    
    // Make sure endpoint starts with a slash for consistency
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
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
  } finally {
    toggleLoading(false);
  }
}

// Create a fine card for display
function createFineCard(fine, canDelete = false) {
  if (!fine) {
    console.error('[DEBUG] createFineCard called with null or undefined fine');
    return '';
  }
  
  try {
    const formattedAmount = formatCurrency(fine.amount);
    const playerName = fine.player_name || 'Onbekend';
    const reasonDesc = fine.reason_description || 'Onbekend';
    const formattedDate = formatDate(fine.date);
    
    let deleteButton = '';
    if (canDelete) {
      deleteButton = `
        <button class="delete-fine-btn absolute top-2 right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors" 
                data-id="${fine.id}" aria-label="Verwijder boete">
          <i class="fas fa-times"></i>
        </button>
      `;
    }
    
    return `
      <div class="fine-card bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 relative ${canDelete ? 'pr-12' : ''}">
        ${deleteButton}
        <div class="flex items-center justify-between">
          <div class="font-semibold">${playerName}</div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formattedAmount}</div>
        </div>
        <div class="text-gray-600 dark:text-gray-400">${reasonDesc}</div>
        <div class="text-sm text-gray-500 dark:text-gray-500">${formattedDate}</div>
      </div>
    `;
  } catch (error) {
    console.error('[DEBUG] Error in createFineCard:', error, 'for fine:', fine);
    return `
      <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-red-600 dark:text-red-400">
        Er is een fout opgetreden bij het weergeven van deze boete
      </div>
    `;
  }
}

async function loadTotalFines() {
  try {
    console.log('[Total] Loading total fines...');
    const data = await fetchAPI('/totaal-boetes');
    console.log('[Total] Received total:', data);
    
    const totalElement = document.getElementById('totalAmount').querySelector('div');
    if (!totalElement) {
      console.error('[Total] Total amount element not found');
      return;
    }
    
    const total = parseFloat(data.total || 0);
    totalElement.textContent = formatCurrency(total);
    
    // Update last updated
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = new Date().toLocaleDateString('nl-NL');
    }
  } catch (error) {
    console.error('[Total] Error loading total:', error);
    
    const totalElement = document.getElementById('totalAmount').querySelector('div');
    if (totalElement) {
      totalElement.textContent = '€0,00';
    }
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
      recentFinesElement.innerHTML = '<div class="text-center py-4 text-gray-500">Geen recente boetes gevonden</div>';
      return;
    }
    
    // Regular user doesn't see delete buttons
    const cards = fines.map(fine => createFineCard(fine, false)).join('');
    
    recentFinesElement.innerHTML = cards;
  } catch (error) {
    console.error('[Recent] Error:', error);
    const recentFinesElement = document.getElementById('recentFines');
    if (recentFinesElement) {
      recentFinesElement.innerHTML = '<div class="text-center py-4 text-gray-500">Fout bij laden recente boetes</div>';
    }
  }
}

async function loadLeaderboard() {
  try {
    console.log('[Leaderboard] Loading player totals...');
    const totals = await fetchAPI('/player-totals');
    
    const leaderboardElement = document.getElementById('leaderboard');
    if (!leaderboardElement) {
      console.error('[Leaderboard] Element not found');
      return;
    }
    
    if (!Array.isArray(totals) || totals.length === 0) {
      leaderboardElement.innerHTML = '<div class="text-center py-4 text-gray-500">Geen spelers gevonden</div>';
      return;
    }
    
    // Sort by total amount descending and take top 5
    const topPlayers = totals
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 5);
    
    // Create cards for each player
    const cards = topPlayers.map((player, index) => `
      <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 flex items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-3 font-bold">
            ${index + 1}
          </div>
          <div class="font-semibold">${player.name || 'Onbekend'}</div>
        </div>
        <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(player.total)}</div>
      </div>
    `).join('');
    
    leaderboardElement.innerHTML = cards;
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    const leaderboardElement = document.getElementById('leaderboard');
    if (leaderboardElement) {
      leaderboardElement.innerHTML = '<div class="text-center py-4 text-gray-500">Fout bij laden leaderboard</div>';
    }
  }
}

async function loadPlayerHistory(playerId) {
  if (!playerId) {
    document.getElementById('playerHistoryEmpty').style.display = 'block';
    document.getElementById('playerHistoryContent').style.display = 'none';
    return;
  }
  
  try {
    console.log(`[History] Loading player history for ID ${playerId}...`);
    
    // Get player info
    const players = await fetchAPI('/players');
    const player = players.find(p => p.id == playerId);
    
    if (!player) {
      throw new Error('Speler niet gevonden');
    }
    
    // Get player fines
    const fines = await fetchAPI(`/player-fines/${playerId}`);
    
    document.getElementById('playerHistoryEmpty').style.display = 'none';
    document.getElementById('playerHistoryContent').style.display = 'block';
    
    // Update player name
    document.getElementById('playerHistoryName').textContent = player.name;
    
    // Calculate and display total
    const total = fines.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    document.getElementById('playerHistoryTotal').textContent = formatCurrency(total);
    
    // Display fines
    const finesElement = document.getElementById('playerHistoryFines');
    
    if (!Array.isArray(fines) || fines.length === 0) {
      finesElement.innerHTML = '<div class="text-center py-4 text-gray-500">Geen boetes gevonden voor deze speler</div>';
      return;
    }
    
    const cards = fines.map(fine => createFineCard(fine, false)).join('');
    finesElement.innerHTML = cards;
    
  } catch (error) {
    console.error('[History] Error:', error);
    document.getElementById('playerHistoryEmpty').style.display = 'block';
    document.getElementById('playerHistoryContent').style.display = 'none';
    showToast('Fout bij laden van speler historie', true);
  }
}

async function loadPlayers() {
  try {
    console.log('[Players] Loading players for select...');
    const players = await fetchAPI('/players');
    
    const playerSelect = document.getElementById('playerSelect');
    if (!playerSelect) {
      console.error('[Players] Select element not found');
      return;
    }
    
    // Clear existing options except the placeholder
    playerSelect.innerHTML = '<option value="">Selecteer een speler</option>';
    
    if (!Array.isArray(players) || players.length === 0) {
      return;
    }
    
    // Sort players by name
    const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add player options
    sortedPlayers.forEach(player => {
      const option = document.createElement('option');
      option.value = player.id;
      option.textContent = player.name;
      playerSelect.appendChild(option);
    });
    
    // Reinitialize Select2
    if ($.fn.select2) {
      $(playerSelect).trigger('change');
    }
    
  } catch (error) {
    console.error('[Players] Error loading players:', error);
  }
}

// Document ready
$(document).ready(function() {
  console.log('[App] Document ready, initializing...');
  
  // Initialize theme
  initTheme();
  
  // Set up theme toggle
  $('#theme-toggle').on('click', toggleTheme);
  
  // Initialize Select2
  initializeSelect2();
  
  // Load data
  loadTotalFines();
  loadRecentFines();
  loadLeaderboard();
  loadPlayers();
  
  // Set up player select change event
  $('#playerSelect').on('change', function() {
    const playerId = $(this).val();
    loadPlayerHistory(playerId);
  });
}); 
