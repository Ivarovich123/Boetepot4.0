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
  if (isNaN(amount)) {
    return '€0,00';
  }
  return `€${parseFloat(amount).toFixed(2).replace('.', ',')}`;
}

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

// API Functions
async function fetchAPI(endpoint, options = {}) {
  try {
    console.log(`[API] Fetching ${endpoint}...`);
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

// UI Functions
function animateCounter(element, start, end, duration) {
  if (!element) return;
  
  const startTimestamp = performance.now();
  const updateCounter = (currentTimestamp) => {
    const elapsed = currentTimestamp - startTimestamp;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = Math.floor(start + (end - start) * progress);
    element.textContent = formatCurrency(current);
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  };
  requestAnimationFrame(updateCounter);
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
    
    // Simple animation for the counter
    const duration = 2000;
    const steps = 50;
    const stepTime = duration / steps;
    const increment = total / steps;
    let current = 0;
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        clearInterval(interval);
        current = total; // Ensure we end at the exact total
      } else {
        // Use easing function for smoother animation
        const progress = step / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        current = total * easedProgress;
      }
      
      totalElement.textContent = formatCurrency(current);
    }, stepTime);
  } catch (error) {
    console.error('[Total] Error loading total:', error);
    showToast('Fout bij laden van totaal bedrag', true);
    
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
      leaderboardElement.innerHTML = '<tr><td colspan="2">Geen spelers gevonden</td></tr>';
      return;
    }
    
    // Sort by total amount and take top 5
    const topPlayers = totals
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);
    
    const rows = topPlayers.map(player => `
      <tr>
        <td>${player.player_name || 'Onbekend'}</td>
        <td>${formatCurrency(player.total_amount || 0)}</td>
      </tr>
    `).join('');
    
    leaderboardElement.innerHTML = rows;
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    showToast('Fout bij laden leaderboard', true);
  }
}

async function loadPlayerHistory(playerId) {
  try {
    console.log('[History] Loading player history...');
    const history = await fetchAPI(`/player-history/${playerId}`);
    
    const historyElement = document.getElementById('playerHistory');
    if (!historyElement) {
      console.error('[History] Element not found');
      return;
    }
    
    if (!Array.isArray(history) || history.length === 0) {
      historyElement.innerHTML = '<tr><td colspan="3">Geen boetes gevonden</td></tr>';
      return;
    }
    
    const total = history.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    
    const rows = history.map(fine => `
      <tr>
        <td>${formatDate(fine.date, true)}</td>
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

// Player search functionality
async function initializePlayerSearch() {
  try {
    console.log('[Search] Initializing player search...');
    const players = await fetchAPI('/players');
    
    const playerSelect = document.getElementById('playerSelect');
    if (!playerSelect) {
      console.error('[Search] Player select not found');
      return;
    }
    
    // Initialize select2 for better search
    $(playerSelect).select2({
      placeholder: 'Zoek een speler...',
      allowClear: true,
      data: players.map(player => ({
        id: player.id,
        text: player.name
      }))
    }).on('change', function() {
      const playerId = $(this).val();
      if (playerId) {
        loadPlayerHistory(playerId);
      }
    });
  } catch (error) {
    console.error('[Search] Error:', error);
    showToast('Fout bij initialiseren speler zoeken', true);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize theme
    initTheme();
    
    // Initialize Select2
    if ($.fn.select2) {
      $('#playerSelect').select2({
        placeholder: 'Zoek een speler...',
        allowClear: true,
        width: '100%'
      });
    } else {
      console.warn('Select2 not loaded');
    }
    
    // Set up player select event listener
    const playerSelect = document.getElementById('playerSelect');
    if (playerSelect) {
      playerSelect.addEventListener('change', loadPlayerHistory);
    }
    
    // Load all data
    loadTotalFines();
    loadRecentFines();
    loadLeaderboard();
    loadPlayers();
    
    console.log('App initialized');
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Er is een fout opgetreden bij het initialiseren van de app', true);
  }
}); 