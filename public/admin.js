// Cache busting parameter for API requests
let cacheBustParam = Date.now();

// Supabase configuration
const SUPABASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDA3OTYsImV4cCI6MjA1ODA3Njc5Nn0.2qrrNC2bKichC63SvUhNgXlcG0ElViRsqM5CYU3QSfg';

// Debug mode
const DEBUG = true;

// DOM elements
const loadingSpinner = document.getElementById('loadingSpinner');
const toastContainer = document.getElementById('toastContainer');

// Form elements
const addFineForm = document.getElementById('addFineForm');
const playerSelect = document.getElementById('playerSelect');
const reasonSelect = document.getElementById('reasonSelect');

// Player elements
const playerNameInput = document.getElementById('playerName');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const bulkPlayerNamesInput = document.getElementById('bulkPlayerNames');
const addBulkPlayersBtn = document.getElementById('addBulkPlayersBtn');
const playersListEl = document.getElementById('playersList');
const noPlayersFoundEl = document.getElementById('noPlayersFound');

// Reason elements
const reasonDescriptionInput = document.getElementById('reasonDescription');
const reasonAmountInput = document.getElementById('reasonAmount');
const addReasonBtn = document.getElementById('addReasonBtn');
const bulkReasonsInput = document.getElementById('bulkReasons');
const addBulkReasonsBtn = document.getElementById('addBulkReasonsBtn');
const reasonsListEl = document.getElementById('reasonsList');
const noReasonsFoundEl = document.getElementById('noReasonsFound');

// Recent fines elements
const recentFinesEl = document.getElementById('recentFines');
const noRecentFinesEl = document.getElementById('noRecentFines');

// Debug & reset elements
const checkConnectionBtn = document.getElementById('checkConnectionBtn');
const exportDataBtn = document.getElementById('exportDataBtn');
const resetEverythingBtn = document.getElementById('resetEverythingBtn');

// Confirmation modal elements
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');

// Debug function for logging
function debug(message, data = null) {
    if (DEBUG) {
        if (data) {
            console.log(`[DEBUG] ${message}:`, data);
    } else {
            console.log(`[DEBUG] ${message}`);
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return '€' + parseFloat(amount).toFixed(2).replace('.', ',');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
}

// Show/hide loading spinner
function showLoading(show = true) {
    if (loadingSpinner) {
    if (show) {
            loadingSpinner.classList.remove('hidden');
    } else {
            loadingSpinner.classList.add('hidden');
    }
    }
}

// Show toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `rounded-lg p-4 mb-3 text-white text-sm flex items-center justify-between shadow-lg transform transition-all duration-300 ease-in-out opacity-0 translate-x-full`;
    
    // Set color based on type
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-600');
            break;
        case 'error':
            toast.classList.add('bg-red-600');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-600');
            break;
        default:
            toast.classList.add('bg-primary-600');
    }
    
    // Add message and close button
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
        <button class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            `;
    
    // Add to DOM
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Setup close button
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto close after 3 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Make API request
async function apiRequest(endpoint, options = {}) {
    showLoading(true);
    try {
        // Ensure endpoint starts with '/' if not already
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        // Fix the endpoint format - CRITICAL CHANGE
        // Supabase REST API expects: /rest/v1/tablename
        let finalEndpoint = endpoint;
        
        // Extract the table name from the endpoint
        const pathParts = endpoint.split('?')[0].split('/');
        const tableName = pathParts[pathParts.length - 1];
        
        if (!endpoint.includes('/rest/v1/')) {
            finalEndpoint = `/rest/v1/${tableName}`;
            
            // Append query parameters if they exist
            if (endpoint.includes('?')) {
                finalEndpoint += endpoint.substring(endpoint.indexOf('?'));
            }
        }
        
        // Build the full URL
        let url = SUPABASE_URL + finalEndpoint;
        
        // Add cache busting to headers instead of URL params to avoid PostgREST trying to interpret it as a filter
        const timestamp = Date.now();
        
        debug('Attempting API Request to:', url);
        
        // Headers are CRITICAL for Supabase
        const headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            'Cache-Control': 'no-cache',
            'X-Cache-Bust': timestamp.toString() // Add cache busting as a custom header
        };
        
        const requestOptions = {
            ...options,
            headers: headers,
            mode: 'cors'
        };
        
        debug('Request options:', JSON.stringify({
            method: requestOptions.method || 'GET',
            headers: Object.keys(requestOptions.headers),
            mode: requestOptions.mode
        }));
        
        // Make the request with fetch
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response Error:', response.status, errorText);
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        debug('API Response Data:', data);
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        
        // More detailed error message and logging
        let errorMessage = 'Database connection error: ';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Cannot reach the database server. This might be due to CORS issues, network problems, or an incorrect API URL.';
            
            console.log('Diagnostic info:');
            console.log('- API URL:', SUPABASE_URL);
            console.log('- API Key (first 10 chars):', SUPABASE_KEY.substring(0, 10) + '...');
            console.log('- Browser:', navigator.userAgent);
            
            // Try a direct fetch to Supabase health endpoint
            try {
                const healthCheck = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`);
                console.log('Health check response:', healthCheck.status, healthCheck.statusText);
            } catch (e) {
                console.log('Health check failed completely:', e.message);
            }
        } else {
            errorMessage += error.message;
        }
        
        showToast(errorMessage, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// Show confirmation modal
function showConfirmModal(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    
    confirmModal.classList.remove('hidden');
    
    // Setup button handlers
    confirmButton.onclick = () => {
        onConfirm();
        confirmModal.classList.add('hidden');
    };
    
    cancelButton.onclick = () => {
        confirmModal.classList.add('hidden');
    };
}

// Load and display players
async function loadPlayers() {
    try {
        const players = await apiRequest('/players?select=id,name&order=name');
        
        // Update player select dropdown (for adding fines)
        if (playerSelect) {
            playerSelect.innerHTML = '';
            
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = player.name;
                playerSelect.appendChild(option);
            });
            
            // Update Select2 if initialized
            if (window.$ && $.fn.select2) {
                $(playerSelect).trigger('change');
            }
        }
        
        // Update players list in the Beheer tab
        renderPlayersList(players);
        
        debug('Players loaded:', players.length);
    } catch (error) {
        console.error('Error loading players:', error);
        showToast('Fout bij laden van spelers', 'error');
    }
}

// Load and display reasons
async function loadReasons() {
    try {
        // Change the query to not assume an amount column exists
        const reasons = await apiRequest('/reasons?select=id,description&order=description');
        
        // Update reason select dropdown (for adding fines)
        if (reasonSelect) {
            reasonSelect.innerHTML = '<option value="">Selecteer een reden</option>';
            
            reasons.forEach(reason => {
                const option = document.createElement('option');
                option.value = reason.id;
                // Don't include amount in the display text since it doesn't exist
                option.textContent = reason.description;
                reasonSelect.appendChild(option);
            });
            
            // Update Select2 if initialized
            if (window.$ && $.fn.select2) {
                $(reasonSelect).trigger('change');
            }
        }
        
        // Update reasons list in the Beheer tab
        renderReasonsList(reasons);
        
        debug('Reasons loaded:', reasons.length);
    } catch (error) {
        console.error('Error loading reasons:', error);
        showToast('Fout bij laden van redenen', 'error');
    }
}

// Load recent fines
async function loadRecentFines() {
    try {
        // Update query to not reference the missing created_at column
        const fines = await apiRequest('/fines?select=*,player:player_id(name),reason:reason_id(description)');
        
        renderFinesList(fines);
        
        debug('Recent fines loaded:', fines.length);
    } catch (error) {
        console.error('Error loading fines:', error);
        showToast('Fout bij laden van recente boetes', 'error');
    }
}

// Load all data
async function loadAllData() {
    try {
        showLoading(true);
        
        // Refresh cache bust parameter
        cacheBustParam = Date.now();
        
        // Load data in parallel
        await Promise.all([
            loadPlayers(),
            loadReasons(),
            loadRecentFines()
        ]);
        
        debug('All data loaded successfully');
  } catch (error) {
        console.error('Error loading data:', error);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
    } finally {
        showLoading(false);
    }
}

// Render fines list - update to handle missing amount field
function renderFinesList(fines) {
    if (!recentFinesEl || !noRecentFinesEl) return;
    
    if (fines && fines.length > 0) {
        noRecentFinesEl.classList.add('hidden');
        recentFinesEl.innerHTML = ''; // Clear previous fines
        
        // Create fine cards for each fine
        fines.forEach(fine => {
            const fineCard = document.createElement('div');
            fineCard.className = 'fine-card bg-white p-4 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all';
            
            // Use a fixed standard amount of €5.00 for all fines
            const fineAmount = '€5,00';
            
            fineCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="flex items-center mb-1">
                            <span class="font-medium text-gray-800">${fine.player?.name || 'Onbekend'}</span>
                            <span class="text-gray-400 mx-2">•</span>
                            <span class="text-gray-500 text-sm">Vandaag</span>
                        </div>
                        <div class="text-gray-700">${fine.reason?.description || 'Onbekende reden'}</div>
                    </div>
                    <div class="flex items-center">
                        <div class="font-bold text-primary-600 text-lg mr-3">${fineAmount}</div>
                        <button class="delete-button text-gray-400 hover:text-red-500" data-id="${fine.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Add delete event listener
            const deleteBtn = fineCard.querySelector('.delete-button');
            deleteBtn.addEventListener('click', () => {
                showConfirmModal(
                    'Boete verwijderen',
                    `Weet je zeker dat je de boete voor ${fine.player?.name} wilt verwijderen?`,
                    () => deleteFine(fine.id)
                );
            });
            
            recentFinesEl.appendChild(fineCard);
        });
    } else {
        noRecentFinesEl.classList.remove('hidden');
        recentFinesEl.innerHTML = ''; // Clear any partial data
    }
}

// Render players list
function renderPlayersList(players) {
    if (!playersListEl || !noPlayersFoundEl) return;
    
    if (players && players.length > 0) {
        playersListEl.innerHTML = ''; // Clear previous players
        noPlayersFoundEl.classList.add('hidden');
        
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'flex items-center justify-between bg-white p-3 rounded-lg shadow-sm';
            
            playerItem.innerHTML = `
                <span class="text-gray-800">${player.name}</span>
                <button class="delete-player-btn text-gray-400 hover:text-red-500" data-id="${player.id}">
                    <i class="fas fa-trash-alt"></i>
            </button>
            `;
            
            // Add delete event listener
            const deleteBtn = playerItem.querySelector('.delete-player-btn');
            deleteBtn.addEventListener('click', () => {
                showConfirmModal(
                    'Speler verwijderen',
                    `Weet je zeker dat je ${player.name} wilt verwijderen? Alle bijbehorende boetes worden ook verwijderd.`,
                    () => deletePlayer(player.id)
                );
            });
            
            playersListEl.appendChild(playerItem);
        });
    } else {
        noPlayersFoundEl.classList.remove('hidden');
        playersListEl.innerHTML = ''; // Clear any partial data
    }
}

// Render reasons list - update to handle missing amount field
function renderReasonsList(reasons) {
    if (!reasonsListEl || !noReasonsFoundEl) return;
    
    if (reasons && reasons.length > 0) {
        reasonsListEl.innerHTML = ''; // Clear previous reasons
        noReasonsFoundEl.classList.add('hidden');
        
        reasons.forEach(reason => {
            const reasonItem = document.createElement('div');
            reasonItem.className = 'flex items-center justify-between bg-white p-3 rounded-lg shadow-sm';
            
            reasonItem.innerHTML = `
                <div>
                    <span class="text-gray-800">${reason.description}</span>
                </div>
                <button class="delete-reason-btn text-gray-400 hover:text-red-500" data-id="${reason.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            // Add delete event listener
            const deleteBtn = reasonItem.querySelector('.delete-reason-btn');
            deleteBtn.addEventListener('click', () => {
                showConfirmModal(
                    'Reden verwijderen',
                    `Weet je zeker dat je de reden "${reason.description}" wilt verwijderen? Alle bijbehorende boetes worden ook verwijderd.`,
                    () => deleteReason(reason.id)
                );
            });
            
            reasonsListEl.appendChild(reasonItem);
        });
    } else {
        noReasonsFoundEl.classList.remove('hidden');
        reasonsListEl.innerHTML = ''; // Clear any partial data
    }
}

// Add a single player
async function addPlayer(name) {
    if (!name || name.trim() === '') {
        showToast('Voer een naam in voor de speler', 'warning');
      return;
    }
    
    try {
        showLoading(true);
        
        const player = await apiRequest('/players', {
            method: 'POST',
            body: JSON.stringify({
                name: name.trim()
            })
        });
        
        showToast(`Speler "${name}" toegevoegd`, 'success');
        playerNameInput.value = ''; // Clear input
        
        // Refresh players list
        await loadPlayers();
  } catch (error) {
        console.error('Error adding player:', error);
        showToast('Fout bij toevoegen van speler', 'error');
    } finally {
        showLoading(false);
    }
}

// Bulk add players
async function addBulkPlayers(namesText) {
    if (!namesText || namesText.trim() === '') {
        showToast('Voer tenminste één naam in', 'warning');
        return;
    }
    
    // Split by newline or comma
    const names = namesText
        .split(/[\n,]/)
        .map(name => name.trim())
        .filter(name => name !== '');
    
    if (names.length === 0) {
        showToast('Geen geldige namen gevonden', 'warning');
    return;
  }
    
    try {
        showLoading(true);
        
        const promises = names.map(name => 
            apiRequest('/players', {
      method: 'POST',
      body: JSON.stringify({ name })
            })
        );
        
        await Promise.all(promises);
        
        showToast(`${names.length} spelers toegevoegd`, 'success');
        bulkPlayerNamesInput.value = ''; // Clear input
        
        // Refresh players list
        await loadPlayers();
  } catch (error) {
        console.error('Error bulk adding players:', error);
        showToast('Fout bij bulk toevoegen van spelers', 'error');
  } finally {
        showLoading(false);
    }
}

// Delete a player
async function deletePlayer(id) {
    try {
        showLoading(true);
        
        // Delete all fines for this player first
        await apiRequest(`/fines?player_id=eq.${id}`, {
            method: 'DELETE'
        });
        
        // Then delete the player
        await apiRequest(`/players?id=eq.${id}`, {
            method: 'DELETE'
        });
        
        showToast('Speler verwijderd', 'success');
        
        // Refresh data
        await loadAllData();
  } catch (error) {
        console.error('Error deleting player:', error);
        showToast('Fout bij verwijderen van speler', 'error');
  } finally {
        showLoading(false);
    }
}

// Add a single reason - update to handle database without amount column
async function addReason(description, amount) {
    if (!description || description.trim() === '') {
        showToast('Voer een beschrijving in voor de reden', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        const reason = await apiRequest('/reasons', {
            method: 'POST',
            body: JSON.stringify({
                description: description.trim()
                // Remove amount field from the request since it doesn't exist in the DB
            })
        });
        
        showToast(`Reden "${description}" toegevoegd`, 'success');
        reasonDescriptionInput.value = ''; // Clear inputs
        reasonAmountInput.value = '';
        
        // Refresh reasons list
        await loadReasons();
    } catch (error) {
        console.error('Error adding reason:', error);
        showToast('Fout bij toevoegen van reden', 'error');
    } finally {
        showLoading(false);
    }
}

// Bulk add reasons - update to handle database without amount column
async function addBulkReasons(reasonsText) {
    if (!reasonsText || reasonsText.trim() === '') {
        showToast('Voer tenminste één reden in', 'warning');
        return;
    }
    
    // Split by newline
    const reasonLines = reasonsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
    
    if (reasonLines.length === 0) {
        showToast('Geen geldige redenen gevonden', 'warning');
        return;
    }
    
    // Parse each line - update to ignore the amount portion
    const reasons = [];
    
    reasonLines.forEach(line => {
        // Extract only the description part before any comma
        const description = line.split(',')[0].trim();
        if (description) {
            reasons.push({ description });
        }
    });
    
    if (reasons.length === 0) {
        showToast('Geen geldige redenen gevonden', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        const promises = reasons.map(reason => 
            apiRequest('/reasons', {
                method: 'POST',
                body: JSON.stringify(reason)
            })
        );
        
        await Promise.all(promises);
        
        showToast(`${reasons.length} redenen toegevoegd`, 'success');
        bulkReasonsInput.value = ''; // Clear input
        
        // Refresh reasons list
        await loadReasons();
    } catch (error) {
        console.error('Error bulk adding reasons:', error);
        showToast('Fout bij bulk toevoegen van redenen', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete a reason
async function deleteReason(id) {
    try {
        showLoading(true);
        
        // Delete all fines with this reason first
        await apiRequest(`/fines?reason_id=eq.${id}`, {
            method: 'DELETE'
        });
        
        // Then delete the reason
        await apiRequest(`/reasons?id=eq.${id}`, {
            method: 'DELETE'
        });
        
        showToast('Reden verwijderd', 'success');
        
        // Refresh data
        await loadAllData();
    } catch (error) {
        console.error('Error deleting reason:', error);
        showToast('Fout bij verwijderen van reden', 'error');
    } finally {
        showLoading(false);
    }
}

// Add a fine
async function addFine() {
    const selectedPlayers = $(playerSelect).select2('data');
    const selectedReasonId = reasonSelect.value;

    if (selectedPlayers.length === 0) {
        showToast('Selecteer ten minste één speler', 'error');
        return;
    }

    if (!selectedReasonId) {
        showToast('Selecteer een reden', 'error');
        return;
    }

    showLoading();

    try {
        // Process each selected player
        for (const player of selectedPlayers) {
            const playerId = player.id;
            
            try {
                const { data, error } = await apiRequest('/fines', {
                    method: 'POST',
                    body: JSON.stringify({
                        player_id: playerId,
                        reason_id: selectedReasonId,
                    })
                });

                if (error) throw error;
            } catch (err) {
                console.error('Error adding fine for player', playerId, err);
                // Continue with next player even if one fails
            }
        }

        showToast(`Boete${selectedPlayers.length > 1 ? 's' : ''} succesvol toegevoegd!`, 'success');
        
        // Reset form
        $(playerSelect).val(null).trigger('change');
        reasonSelect.value = '';
        
        // Reload fines
        loadRecentFines();
        
    } catch (error) {
        console.error('Error adding fine:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de boete', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete a fine
async function deleteFine(id) {
    try {
        showLoading(true);
        
        await apiRequest(`/fines?id=eq.${id}`, {
            method: 'DELETE'
        });
        
        showToast('Boete verwijderd', 'success');
        
        // Refresh recent fines
        await loadRecentFines();
    } catch (error) {
        console.error('Error deleting fine:', error);
        showToast('Fout bij verwijderen van boete', 'error');
    } finally {
        showLoading(false);
    }
}

// Check database connection
async function checkConnection() {
    try {
        showLoading(true);
        
        // Try to fetch something simple from the database
        await apiRequest('/players?limit=1');
        
        showToast('Database verbinding succesvol', 'success');
        return true;
  } catch (error) {
        console.error('Connection check failed:', error);
        showToast('Database verbinding mislukt: ' + error.message, 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// Export all data as JSON file
async function exportData() {
    try {
        showLoading(true);
        
        // Fetch all data
        const [players, reasons, fines] = await Promise.all([
            apiRequest('/players'),
            apiRequest('/reasons'),
            apiRequest('/fines?select=*,player:player_id(name),reason:reason_id(description,amount)')
        ]);
        
        const data = {
            players,
            reasons,
            fines,
            exportDate: new Date().toISOString()
        };
        
        // Create and download a JSON file
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `boetepot_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showToast('Data geëxporteerd', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Fout bij exporteren: ' + error.message, 'error');
  } finally {
        showLoading(false);
    }
}

// Reset all data
async function resetEverything() {
    try {
        showLoading(true);
        
        // Delete all fines first (due to foreign key constraints)
        await apiRequest('/fines', {
            method: 'DELETE'
        });
        
        // Delete all players and reasons
        await Promise.all([
            apiRequest('/players', { method: 'DELETE' }),
            apiRequest('/reasons', { method: 'DELETE' })
        ]);
        
        showToast('Alle data is verwijderd', 'success');
        
        // Refresh all data
        await loadAllData();
    } catch (error) {
        console.error('Reset failed:', error);
        showToast('Fout bij resetten: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Initialize the app
function initialize() {
    debug('Initializing app...');
    
    // Load all data
    loadAllData();
    
    // Set up event listeners for Fine Form
    if (addFineForm) {
        addFineForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addFine();
        });
    }
    
    // Set up event listeners for Player management
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', () => {
            addPlayer(playerNameInput.value);
        });
    }
    
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addPlayer(playerNameInput.value);
            }
        });
    }
    
    if (addBulkPlayersBtn) {
        addBulkPlayersBtn.addEventListener('click', () => {
            addBulkPlayers(bulkPlayerNamesInput.value);
        });
    }
    
    // Set up event listeners for Reason management
    if (addReasonBtn) {
        addReasonBtn.addEventListener('click', () => {
            addReason(reasonDescriptionInput.value, reasonAmountInput.value);
        });
    }
    
    if (reasonDescriptionInput && reasonAmountInput) {
        const handleEnterKey = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addReason(reasonDescriptionInput.value, reasonAmountInput.value);
            }
        };
        
        reasonDescriptionInput.addEventListener('keypress', handleEnterKey);
        reasonAmountInput.addEventListener('keypress', handleEnterKey);
    }
    
    if (addBulkReasonsBtn) {
        addBulkReasonsBtn.addEventListener('click', () => {
            addBulkReasons(bulkReasonsInput.value);
        });
    }
    
    // Set up event listeners for Debug & Reset options
    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener('click', checkConnection);
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    if (resetEverythingBtn) {
        resetEverythingBtn.addEventListener('click', () => {
            showConfirmModal(
                'Reset alles',
                'Weet je ZEKER dat je ALLE data wilt verwijderen? Dit kan niet ongedaan worden gemaakt!',
                resetEverything
            );
        });
    }
    
    debug('Initialization complete');
}

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);