// API Base URL
const API_BASE_URL = '/api';

// Utility Functions
function toggleLoading(show) {
  document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.backgroundColor = isError ? 'var(--error-color)' : 'var(--success-color)';
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function formatCurrency(amount) {
  return `€${parseFloat(amount).toFixed(2)}`;
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
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// UI Functions
function animateCounter(element, start, end, duration, formattedValue) {
  const startTimestamp = performance.now();
  const updateCounter = (currentTimestamp) => {
    const elapsed = currentTimestamp - startTimestamp;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = Math.floor(start + (end - start) * progress);
    element.textContent = formattedValue || `€${current.toFixed(2)}`;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  };
  requestAnimationFrame(updateCounter);
}

async function loadTotaalBoetes() {
  toggleLoading(true);
  try {
    const { total } = await fetchAPI('/totaal-boetes');
    const counterElement = document.getElementById('totaalBoetes');
    animateCounter(counterElement, 0, total, 2000);
  } catch (error) {
    showToast('Fout bij laden totaal boetes: ' + error.message, true);
  } finally {
    toggleLoading(false);
  }
}

async function loadRecentFines() {
  try {
    console.log('Loading recent fines...');
    const fines = await fetchAPI('/recent-boetes');
    
    console.log('Received fines:', fines);
    
    const recentFines = document.getElementById('recentFines');
    if (!recentFines) {
      console.error('Recent fines element not found');
      return;
    }
    
    if (!Array.isArray(fines) || fines.length === 0) {
      recentFines.innerHTML = '<tr><td colspan="4" class="text-center">Geen recente boetes gevonden.</td></tr>';
      return;
    }
    
    recentFines.innerHTML = fines.map(fine => `
      <tr>
        <td>${fine.player}</td>
        <td>${fine.reason}</td>
        <td>€${fine.amount.toFixed(2)}</td>
        <td>${fine.date}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading recent fines:', error);
    const recentFines = document.getElementById('recentFines');
    if (recentFines) {
      recentFines.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Er is een fout opgetreden bij het laden van de boetes.</td></tr>';
    }
  }
}

async function loadPlayerHistory() {
  const playerSelect = document.getElementById('playerSelect');
  const selectedPlayer = playerSelect.value;
  
  if (!selectedPlayer) {
    showToast('Selecteer eerst een speler', true);
    return;
  }
  
  try {
    console.log('Loading history for player:', selectedPlayer);
    const history = await fetchAPI(`/player-history/${selectedPlayer}`);
    console.log('Received player history:', history);
    
    const tbody = document.getElementById('playerHistory');
    if (!tbody) {
      console.error('Player history tbody element not found');
      return;
    }
    
    if (!Array.isArray(history) || history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center">Geen boetes gevonden voor deze speler</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = history.map(fine => `
      <tr>
        <td>${fine.date}</td>
        <td>€${fine.amount.toFixed(2)}</td>
        <td>${fine.reasons?.description || 'Onbekend'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading player history:', error);
    showToast('Fout bij laden speler historie: ' + error.message, true);
    
    const tbody = document.getElementById('playerHistory');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-danger">
            Er is een fout opgetreden bij het laden van de historie
          </td>
        </tr>
      `;
    }
  }
}

async function loadLeaderboard() {
  toggleLoading(true);
  try {
    const totals = await fetchAPI('/player-totals');
    const sortedTotals = totals.sort((a, b) => b.totaal - a.totaal);
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Speler</th>
          <th>Totaal</th>
        </tr>
      </thead>
      <tbody>
        ${sortedTotals.map(player => `
          <tr>
            <td>${player.speler}</td>
            <td>${formatCurrency(player.totaal)}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    document.getElementById('leaderboardTable').innerHTML = '';
    document.getElementById('leaderboardTable').appendChild(table);
  } catch (error) {
    showToast('Fout bij laden leaderboard: ' + error.message, true);
  } finally {
    toggleLoading(false);
  }
}

async function loadDropdownOptions() {
  try {
    const { spelers } = await fetchAPI('/dropdown-options');
    const playerSelect = document.getElementById('playerInput');
    const playerAdminSelect = document.getElementById('playerAdminInput');
    
    const options = spelers.map(player => `<option value="${player}">${player}</option>`).join('');
    
    playerSelect.innerHTML = '<option value=""></option>' + options;
    playerAdminSelect.innerHTML = '<option value=""></option>' + options;
    
    $('.chosen-select').trigger('chosen:updated');
  } catch (error) {
    showToast('Fout bij laden spelers: ' + error.message, true);
  }
}

// Admin Functions
function toggleAdminPanel(show) {
  document.getElementById('adminPanel').style.display = show ? 'block' : 'none';
  document.getElementById('loginSection').style.display = show ? 'none' : 'block';
}

function logoutAdmin() {
  toggleAdminPanel(false);
}

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      toggleAdminPanel(true);
      loadAllFines();
    } else {
      showToast('Incorrect wachtwoord', true);
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Er is een fout opgetreden bij het inloggen', true);
  }
});

document.getElementById('addFineForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const playerId = document.getElementById('playerSelect').value;
  const reasonId = document.getElementById('reasonSelect').value;
  const amount = document.getElementById('amount').value;
  
  if (!playerId || !reasonId || !amount) {
    showToast('Vul alle velden in', true);
    return;
  }
  
  toggleLoading(true);
  try {
    const response = await fetch('/api/admin/fines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({
        player_id: parseInt(playerId),
        reason_id: parseInt(reasonId),
        amount: parseFloat(amount)
      })
    });

    if (response.ok) {
      showToast('Boete succesvol toegevoegd!');
      document.getElementById('addFineForm').reset();
      await loadFines();
      await loadRecentFines();
      await loadPlayerTotals();
    } else {
      const error = await response.json();
      console.error('Server error:', error);
      showToast(error.error || 'Er is een fout opgetreden bij het toevoegen van de boete', true);
    }
  } catch (error) {
    console.error('Error adding fine:', error);
    showToast('Er is een fout opgetreden bij het toevoegen van de boete', true);
  } finally {
    toggleLoading(false);
  }
});

document.getElementById('fineSearch').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll('#allFines table tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
});

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle('dark');
  const icon = document.getElementById('theme-icon');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Document loaded, initializing...');
  loadTotalFines();
  loadRecentFines();
  loadPlayerTotals();
  loadPlayers();
});

// Load total fines
async function loadTotalFines() {
  try {
    console.log('Loading total fines...');
    const { total, formatted } = await fetchAPI('/totaal-boetes');
    console.log('Received total:', total, formatted);
    
    const totalElement = document.getElementById('totalFines');
    if (!totalElement) {
      console.error('Total fines element not found');
      return;
    }
    
    // Animate the counter from 0 to total
    animateCounter(totalElement, 0, total, 2000, formatted);
  } catch (error) {
    console.error('Error loading total fines:', error);
    const totalElement = document.getElementById('totalFines');
    if (totalElement) {
      totalElement.textContent = 'Error';
    }
  }
}

// Load player totals
async function loadPlayerTotals() {
  try {
    console.log('Loading player totals...');
    const totals = await fetchAPI('/player-totals');
    console.log('Received player totals:', totals);
    
    const playerTotalsList = document.getElementById('playerTotals');
    if (!playerTotalsList) {
      console.error('Player totals element not found');
      return;
    }
    
    if (!Array.isArray(totals) || totals.length === 0) {
      playerTotalsList.innerHTML = '<tr><td colspan="2" class="text-center">Geen speler totalen gevonden</td></tr>';
      return;
    }
    
    playerTotalsList.innerHTML = totals.map(player => `
      <tr>
        <td>${player.name}</td>
        <td>${player.formatted}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading player totals:', error);
    const playerTotalsList = document.getElementById('playerTotals');
    if (playerTotalsList) {
      playerTotalsList.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Er is een fout opgetreden bij het laden van de totalen.</td></tr>';
    }
  }
}

// Load players for the dropdown
async function loadPlayers() {
  try {
    const players = await fetchAPI('/players');
    console.log('Received players:', players);
    
    const playerSelect = document.getElementById('playerSelect');
    if (!playerSelect) {
      console.error('Player select element not found');
      return;
    }
    
    playerSelect.innerHTML = '<option value="">Selecteer speler</option>';
    players.forEach(player => {
      playerSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
    });
  } catch (error) {
    console.error('Error loading players:', error);
    showToast('Fout bij laden spelers: ' + error.message, true);
  }
} 