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

function formatDate(dateString, includeYear = false) {
  if (!dateString) return 'Onbekend';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    return includeYear 
      ? `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
      : `${date.getDate()} ${months[date.getMonth()]}`;
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
    console.log(`[API] Fetching ${endpoint}...`);
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
    console.log(`[API] Response from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`[API] Error fetching ${endpoint}:`, error);
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

async function loadTotaalBoetes() {
  try {
    console.log('[Total] Loading total fines...');
    const { total } = await fetchAPI('/totaal-boetes');
    
    const totalElement = document.getElementById('totalAmount');
    if (totalElement) {
      const totalLabel = document.getElementById('totalLabel');
      if (totalLabel) {
        totalLabel.textContent = 'Totaal';
      }
      animateCounter(totalElement, 0, total || 0, 2000);
    }
  } catch (error) {
    console.error('[Total] Error:', error);
    showToast('Fout bij laden totaal boetes', true);
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

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = document.body.classList.contains('dark') ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Init] Document loaded, initializing...');
  
  // Load all data
  loadTotaalBoetes();
  loadRecentFines();
  loadLeaderboard();
  
  // Initialize player search
  initializePlayerSearch();
  
  // Initialize theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
  
  // Add theme toggle button to header
  const header = document.querySelector('header');
  if (header) {
    const themeButton = document.createElement('button');
    themeButton.className = 'btn btn-link position-absolute end-0 me-3';
    themeButton.innerHTML = `<i id="theme-icon" class="fas ${savedTheme === 'dark' ? 'fa-sun' : 'fa-moon'} fs-4"></i>`;
    themeButton.onclick = toggleTheme;
    header.style.position = 'relative';
    header.appendChild(themeButton);
  }
  
  console.log('[Init] Initialization complete');
}); 