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
  return date.toLocaleString('nl-NL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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
function animateCounter(element, start, end, duration) {
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const current = Math.min(start + (progress / duration) * (end - start), end);
    element.innerText = formatCurrency(current);
    if (progress < duration) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

async function loadTotalFines() {
  toggleLoading(true);
  try {
    const { total } = await fetchAPI('/totaal-boetes');
    const counterElement = document.getElementById('numberOfFines');
    animateCounter(counterElement, 0, total, 2000);
  } catch (error) {
    showToast('Fout bij laden totaal boetes: ' + error.message, true);
  } finally {
    toggleLoading(false);
  }
}

async function loadRecentFines() {
  toggleLoading(true);
  try {
    const fines = await fetchAPI('/recent-boetes');
    const tbody = document.getElementById('recentFines');
    tbody.innerHTML = '';
    
    if (fines.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">Geen recente boetes gevonden</td>
        </tr>
      `;
    } else {
      fines.forEach(fine => {
        tbody.innerHTML += `
          <tr>
            <td>${fine.players.name}</td>
            <td>${fine.reasons.description}</td>
            <td>${formatCurrency(fine.amount)}</td>
            <td>${fine.date}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    showToast('Fout bij laden recente boetes: ' + error.message, true);
  } finally {
    toggleLoading(false);
  }
}

async function loadPlayerTotals() {
  toggleLoading(true);
  try {
    const totals = await fetchAPI('/player-totals');
    const tbody = document.getElementById('playerTotals');
    tbody.innerHTML = '';
    
    if (totals.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center">Geen spelers gevonden</td>
        </tr>
      `;
    } else {
      totals.forEach(player => {
        tbody.innerHTML += `
          <tr>
            <td>${player.name}</td>
            <td>${player.formatted}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    showToast('Fout bij laden speler totalen: ' + error.message, true);
  } finally {
    toggleLoading(false);
  }
}

async function loadPlayers() {
  try {
    const players = await fetchAPI('/players');
    const playerSelect = document.getElementById('playerSelect');
    playerSelect.innerHTML = '<option value="">Selecteer speler</option>';
    
    players.forEach(player => {
      playerSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
    });
  } catch (error) {
    showToast('Fout bij laden spelers: ' + error.message, true);
  }
}

async function loadPlayerHistory() {
  const playerSelect = document.getElementById('playerSelect');
  const selectedPlayer = playerSelect.value;
  
  if (!selectedPlayer) {
    showToast('Selecteer eerst een speler', true);
    return;
  }
  
  toggleLoading(true);
  try {
    const history = await fetchAPI(`/player-history/${selectedPlayer}`);
    const tbody = document.getElementById('playerHistory');
    tbody.innerHTML = '';
    
    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center">Geen boetes gevonden voor deze speler</td>
        </tr>
      `;
    } else {
      history.forEach(fine => {
        tbody.innerHTML += `
          <tr>
            <td>${fine.date}</td>
            <td>${fine.formatted}</td>
            <td>${fine.reasons.description}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error('Error loading player history:', error);
    showToast('Fout bij laden speler historie: ' + error.message, true);
  } finally {
    toggleLoading(false);
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  loadTotalFines();
  loadRecentFines();
  loadPlayerTotals();
  loadPlayers();
});

// Load leaderboard
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

// Load dropdown options
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
$(document).ready(function() {
  $('.chosen-select').chosen();
  loadLeaderboard();
  loadDropdownOptions();
}); 