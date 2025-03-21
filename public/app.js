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
  toast.className = `flex items-center p-4 mb-4 rounded-lg ${isError ? 'bg-red-600' : 'bg-green-600'} text-white`;
  toast.innerHTML = `
    <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-3"></i>
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
    
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
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

// API Functions
async function fetchAPI(endpoint, options = {}) {
  try {
    console.log(`[API] Fetching ${endpoint}...`);
    toggleLoading(true);
    
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
  } finally {
    toggleLoading(false);
  }
}

async function loadTotalFines() {
  try {
    console.log('[Total] Loading total fines...');
    const data = await fetchAPI('/totaal-boetes');
    console.log('[Total] Received total:', data);
    
    const totalElement = document.getElementById('totalAmount');
    if (!totalElement) {
      console.error('[Total] Total amount element not found');
      return;
    }
    
    const total = parseFloat(data.total || 0);
    totalElement.textContent = formatCurrency(total);
  } catch (error) {
    console.error('[Total] Error loading total:', error);
    
    const totalElement = document.getElementById('totalAmount');
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
    
    const cards = fines.map(fine => `
      <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="font-semibold">${fine.player_name || 'Onbekend'}</div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(fine.amount)}</div>
        </div>
        <div class="text-gray-600 dark:text-gray-400">${fine.reason_description || 'Onbekend'}</div>
        <div class="text-sm text-gray-500 dark:text-gray-500">${formatDate(fine.date)}</div>
      </div>
    `).join('');
    
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
    
    const cards = topPlayers.map((player, index) => `
      <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
              ${index + 1}
            </div>
            <div class="font-semibold">${player.name || 'Onbekend'}</div>
          </div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(player.total || 0)}</div>
        </div>
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
  try {
    if (!playerId) {
      const playerHistoryElement = document.getElementById('playerHistory');
      if (playerHistoryElement) {
        playerHistoryElement.innerHTML = '<div class="text-center py-4 text-gray-500">Selecteer een speler...</div>';
      }
      return;
    }
    
    console.log(`[History] Loading player ${playerId} history...`);
    const history = await fetchAPI(`/player-history/${playerId}`);
    
    const playerHistoryElement = document.getElementById('playerHistory');
    if (!playerHistoryElement) {
      console.error('[History] Element not found');
      return;
    }
    
    if (!Array.isArray(history) || history.length === 0) {
      playerHistoryElement.innerHTML = '<div class="text-center py-4 text-gray-500">Geen boetes gevonden voor deze speler</div>';
      return;
    }
    
    const cards = history.map(fine => `
      <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-gray-600 dark:text-gray-400">${fine.reason_description || 'Onbekend'}</div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(fine.amount)}</div>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-500">${formatDate(fine.date)}</div>
      </div>
    `).join('');
    
    playerHistoryElement.innerHTML = cards;
  } catch (error) {
    console.error('[History] Error:', error);
    const playerHistoryElement = document.getElementById('playerHistory');
    if (playerHistoryElement) {
      playerHistoryElement.innerHTML = '<div class="text-center py-4 text-gray-500">Fout bij laden spelergeschiedenis</div>';
    }
  }
}

async function initializePlayerSelect() {
  try {
    console.log('[Players] Loading players for select...');
    const players = await fetchAPI('/players');
    
    const playerSelectElement = document.getElementById('playerSelect');
    if (!playerSelectElement) {
      console.error('[Players] Element not found');
      return;
    }
    
    if (!Array.isArray(players) || players.length === 0) {
      playerSelectElement.innerHTML = '<option value="">Geen spelers gevonden</option>';
      return;
    }
    
    // Add the empty option
    let options = '<option value="">Selecteer een speler...</option>';
    
    // Add player options
    options += players.map(player => 
      `<option value="${player.id}">${player.name}</option>`
    ).join('');
    
    // Update the select element
    playerSelectElement.innerHTML = options;
    
    // Initialize Select2
    $(playerSelectElement).select2({
      placeholder: 'Selecteer een speler',
      allowClear: true,
      theme: 'default'
    });

    // Update Select2 theme
    updateSelect2Theme(document.documentElement.classList.contains('dark'));
    
    // Setup event handler for player selection
    $(playerSelectElement).on('change', function() {
      const playerId = this.value;
      loadPlayerHistory(playerId);
      
      // Update history title
      const historyTitle = document.getElementById('playerHistoryTitle');
      if (historyTitle) {
        const playerName = playerId ? 
          playerSelectElement.options[playerSelectElement.selectedIndex].text : 
          'Speler';
        historyTitle.innerHTML = `
          <i class="fas fa-user-clock text-blue-600 mr-3"></i>
          ${playerId ? playerName : 'Speler Historie'}
        `;
      }
    });
  } catch (error) {
    console.error('[Players] Error initializing select:', error);
    const playerSelectElement = document.getElementById('playerSelect');
    if (playerSelectElement) {
      playerSelectElement.innerHTML = '<option value="">Fout bij laden spelers</option>';
    }
  }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', async () => {
  // Set up theme toggle
  initTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  try {
    // Load data in parallel
    await Promise.all([
      loadTotalFines(),
      loadRecentFines(),
      loadLeaderboard(),
      initializePlayerSelect()
    ]);
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Er zijn fouten opgetreden bij het laden van gegevens. Probeer de pagina te verversen.', true);
  }
}); 
