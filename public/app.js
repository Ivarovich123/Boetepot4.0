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
  return new Date(dateString).toLocaleString('nl-NL');
}

function formatCurrency(amount) {
  return parseFloat(amount).toFixed(2) + '€';
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

async function loadRecentBoetes() {
  toggleLoading(true);
  try {
    const fines = await fetchAPI('/recent-boetes');
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Speler</th>
          <th>Datum</th>
          <th>Bedrag</th>
          <th>Reden</th>
        </tr>
      </thead>
      <tbody>
        ${fines.map(fine => `
          <tr>
            <td>${fine.speler}</td>
            <td>${formatDate(fine.datum)}</td>
            <td>${formatCurrency(fine.bedrag)}</td>
            <td>${fine.reden}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    document.getElementById('recentBoetes').innerHTML = '';
    document.getElementById('recentBoetes').appendChild(table);
  } catch (error) {
    showToast('Fout bij laden recente boetes: ' + error.message, true);
  } finally {
    toggleLoading(false);
  }
}

async function loadPlayerHistory() {
  const playerSelect = document.getElementById('playerInput');
  const selectedPlayer = playerSelect.value;
  
  if (!selectedPlayer) {
    showToast('Selecteer eerst een speler', true);
    return;
  }
  
  toggleLoading(true);
  try {
    const history = await fetchAPI(`/player-history/${encodeURIComponent(selectedPlayer)}`);
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Datum</th>
          <th>Bedrag</th>
          <th>Reden</th>
        </tr>
      </thead>
      <tbody>
        ${history.map(fine => `
          <tr>
            <td>${formatDate(fine.datum)}</td>
            <td>${formatCurrency(fine.bedrag)}</td>
            <td>${fine.reden}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    document.getElementById('playerHistory').innerHTML = '';
    document.getElementById('playerHistory').appendChild(table);
  } catch (error) {
    showToast('Fout bij laden speler historie: ' + error.message, true);
  } finally {
    toggleLoading(false);
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
  const speler = document.getElementById('playerAdminInput').value;
  const bedrag = document.getElementById('amount').value;
  const reden = document.getElementById('reasonAdminInput').value;
  
  if (!speler || !bedrag || !reden) {
    showToast('Vul alle velden in', true);
    return;
  }
  
  toggleLoading(true);
  try {
    await fetchAPI('/add-fine', {
      method: 'POST',
      body: JSON.stringify({ speler, bedrag, reden })
    });
    
    showToast('Boete succesvol toegevoegd!');
    document.getElementById('addFineForm').reset();
    loadAllFines();
    loadTotaalBoetes();
    loadRecentBoetes();
    loadLeaderboard();
  } catch (error) {
    showToast('Fout bij toevoegen boete: ' + error.message, true);
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
  loadTotaalBoetes();
  loadRecentBoetes();
  loadLeaderboard();
  loadDropdownOptions();
});

// Load all data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTotalFines();
    loadRecentFines();
    loadPlayerTotals();
});

// Load total fines
async function loadTotalFines() {
    try {
        const response = await fetch('/api/totaal-boetes');
        const data = await response.json();
        document.getElementById('totalFines').textContent = `€${data.total.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading total fines:', error);
    }
}

// Load recent fines
async function loadRecentFines() {
    try {
        const response = await fetch('/api/recent-boetes');
        const fines = await response.json();
        
        const recentFines = document.getElementById('recentFines');
        recentFines.innerHTML = '';
        
        fines.forEach(fine => {
            const date = new Date(fine.date).toLocaleString('nl-NL');
            recentFines.innerHTML += `
                <tr>
                    <td>${fine.player_name}</td>
                    <td>${fine.reason_description}</td>
                    <td>€${fine.amount.toFixed(2)}</td>
                    <td>${date}</td>
                </tr>
            `;
        });

        // Update number of fines
        document.getElementById('numberOfFines').textContent = fines.length;
    } catch (error) {
        console.error('Error loading recent fines:', error);
    }
}

// Load player totals
async function loadPlayerTotals() {
    try {
        const response = await fetch('/api/player-totals');
        const players = await response.json();
        
        const playerTotals = document.getElementById('playerTotals');
        playerTotals.innerHTML = '';
        
        players.forEach(player => {
            playerTotals.innerHTML += `
                <tr>
                    <td>${player.name}</td>
                    <td>€${(player.total || 0).toFixed(2)}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading player totals:', error);
    }
} 