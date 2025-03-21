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
  document.body.classList.toggle('dark', theme === 'dark');
  document.getElementById('theme-icon').className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById('theme-icon');
  const isDark = body.classList.contains('dark');
  
  // Update theme
  body.classList.toggle('dark', !isDark);
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  
  // Update icon with animation
  if (themeIcon) {
    themeIcon.style.transform = 'scale(0)';
    setTimeout(() => {
      themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
      themeIcon.style.transform = 'scale(1)';
    }, 150);
  }
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: isDark ? 'light' : 'dark' } }));
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
    
    // Enhanced animation for the counter
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let start = 0;
    
    // Use requestAnimationFrame for smoother animation
    let lastTime = performance.now();
    let currentStep = 0;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= stepTime) {
        currentStep++;
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        const current = total * easedProgress;
        
        totalElement.textContent = formatCurrency(current);
        lastTime = currentTime;
        
        if (currentStep < steps) {
          requestAnimationFrame(animate);
        } else {
          totalElement.textContent = formatCurrency(total); // Ensure final value is exact
        }
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
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
      leaderboardElement.innerHTML = '<tr><td colspan="3">Geen spelers gevonden</td></tr>';
      return;
    }
    
    // Sort by total amount descending and take top 5
    const topPlayers = totals
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 5);
    
    const rows = topPlayers.map((player, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${player.name || 'Onbekend'}</td>
        <td>${formatCurrency(player.total || 0)}</td>
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
    const response = await fetchAPI(`/api/player-history/${playerId}`);
    
    const historyElement = document.getElementById('playerHistory');
    const historyTitleElement = document.getElementById('playerHistoryTitle');
    
    if (!historyElement) {
      console.error('[History] Element not found');
      return;
    }
    
    if (!response || !response.player_name || !response.fines || response.fines.length === 0) {
      historyElement.innerHTML = '<tr><td colspan="3" class="text-center">Geen boetes gevonden</td></tr>';
      if (historyTitleElement) {
        historyTitleElement.innerHTML = '<i class="fas fa-user-clock"></i>Speler Historie';
      }
      return;
    }
    
    const total = response.fines.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    
    if (historyTitleElement) {
      historyTitleElement.innerHTML = `<i class="fas fa-user-clock"></i>Historie van ${response.player_name}`;
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
async function initializePlayerSelect() {
  try {
    console.log('[Players] Loading players for select...');
    const players = await fetchAPI('/players');
    
    const select = $('#playerSelect');
    if (!select.length) {
      console.error('[Players] Select element not found');
      return;
    }
    
    select.empty().append('<option value="">Selecteer speler</option>');
    
    if (Array.isArray(players)) {
      players.forEach(player => {
        select.append(new Option(player.name, player.id));
      });
    }
    
    // Initialize Select2
    select.select2({
      theme: 'classic',
      placeholder: 'Selecteer speler',
      allowClear: true,
      width: '100%'
    }).on('change', function() {
      const playerId = $(this).val();
      if (playerId) {
        loadPlayerHistory(playerId);
      } else {
        const historyElement = document.getElementById('playerHistory');
        if (historyElement) {
          historyElement.innerHTML = '<tr><td colspan="3">Selecteer een speler</td></tr>';
        }
      }
    });
  } catch (error) {
    console.error('[Players] Error:', error);
    showToast('Fout bij laden spelers', true);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize theme
    initTheme();
    
    // Initialize Select2 for player select
    $('#playerSelect').select2({
      theme: 'classic',
      placeholder: 'Selecteer een speler',
      allowClear: true,
      width: '100%'
    }).on('select2:open', function() {
      document.querySelector('.select2-search__field').focus();
    });
    
    // Load data
    Promise.all([
      loadTotalFines(),
      loadRecentFines(),
      loadLeaderboard()
    ]).catch(error => {
      console.error('Error loading initial data:', error);
      showToast('Fout bij laden van gegevens', true);
    });
    
    // Initialize AOS
    AOS.init({
      duration: 800,
      once: true,
      offset: 50,
      easing: 'ease-in-out'
    });
    
    // Theme change listener for Select2
    window.addEventListener('themechange', () => {
      // Destroy and reinitialize Select2 to update theme
      const select = $('#playerSelect');
      const value = select.val();
      select.select2('destroy').select2({
        theme: 'classic',
        placeholder: 'Selecteer een speler',
        allowClear: true,
        width: '100%'
      });
      select.val(value).trigger('change');
    });
    
    // Set up theme toggle
    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      themeButton.addEventListener('click', toggleTheme);
    }
    
    console.log('App initialized');
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Fout bij initialiseren', true);
  }
}); 
