// Cache busting parameter
let cacheBustParam = Date.now();

// Supabase configuration
const SUPABASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDA3OTYsImV4cCI6MjA1ODA3Njc5Nn0.2qrrNC2bKichC63SvUhNgXlcG0ElViRsqM5CYU3QSfg';

// Debug mode (set to true during development to see console logs)
const DEBUG = true;

// Dom elements
const loadingSpinner = document.getElementById('loadingSpinner');
const totalAmountEl = document.getElementById('totalAmount');
const recentFinesEl = document.getElementById('recentFines');
const noRecentFinesEl = document.getElementById('noRecentFines');
const playerHistorySelectEl = document.getElementById('playerHistorySelect');
const playerHistoryEl = document.getElementById('playerHistory');
const noPlayerHistoryEl = document.getElementById('noPlayerHistory');
const leaderboardEl = document.getElementById('leaderboard');
const noLeaderboardEl = document.getElementById('noLeaderboardData');
const toastContainer = document.getElementById('toastContainer');
const addFineForm = document.getElementById('addFineForm');
const playerSelect = document.getElementById('playerSelect');
const reasonSelect = document.getElementById('reasonSelect');
const dateInput = document.getElementById('dateInput');

// Show loading spinner
function showLoading(isLoading) {
    if (loadingSpinner) {
    if (isLoading) {
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

// Format currency
function formatCurrency(amount) {
    return '€' + parseFloat(amount).toFixed(2).replace('.', ',');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
}

// Add cache busting parameter to URL - Fixed to use a simple timestamp approach
function addCacheBust(url) {
    const timestamp = new Date().getTime();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
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
        
        if (DEBUG) console.log('Attempting API Request to:', url);
        
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
        
        if (DEBUG) console.log('Request options:', JSON.stringify({
            method: requestOptions.method || 'GET',
            headers: Object.keys(requestOptions.headers),
            mode: requestOptions.mode
        }));
        
        // Simplified fetch with no retries to diagnose the issue
        const response = await fetch(url, requestOptions);
                
                if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response Error:', response.status, errorText);
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        if (DEBUG) console.log('API Response Data:', data);
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

// Load total amount
async function loadTotalAmount() {
    showLoading();
    
    try {
        const { data: fines, error } = await apiRequest('/fines?select=id');
        
        if (error) throw error;
        
        // Calculate total based on fixed €5.00 per fine
        const totalAmount = fines.length * 5.00;
        totalAmountEl.textContent = formatCurrency(totalAmount);
        
    } catch (error) {
        console.error('Error loading total amount:', error);
        totalAmountEl.textContent = '€0,00';
    } finally {
        showLoading(false);
    }
}

// Load recent fines
async function loadRecentFines() {
    showLoading();
    
    try {
        const { data: fines, error } = await apiRequest('/fines?select=id,created_at,players(name),reasons(description)&order=created_at.desc&limit=5');
        
        if (error) throw error;
        
        if (!fines || fines.length === 0) {
            noRecentFinesEl.classList.remove('hidden');
            recentFinesEl.innerHTML = '<div class="text-gray-500 text-center py-4">Geen recente boetes gevonden</div>';
            return;
        }

        noRecentFinesEl.classList.add('hidden');
        recentFinesEl.innerHTML = ''; // Clear previous fines
        
        // Create fine cards for each fine
        fines.forEach(fine => {
            const fineCard = document.createElement('div');
            fineCard.className = 'fine-card bg-white p-4 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all';
            
            // Use standard amount of €5.00
            const fineAmount = '€5,00';
            
            fineCard.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <span class="font-medium text-gray-800">${fine.players?.name || 'Onbekende speler'}</span>
                        <span class="text-gray-400 mx-2">•</span>
                        <span class="text-gray-500 text-sm">${fine.reasons?.description || 'Onbekende reden'}</span>
                    </div>
                    <div class="text-gray-700">${formatDate(fine.created_at)}</div>
                </div>
                <div class="font-bold text-primary-600 text-lg">${fineAmount}</div>
            </div>
            `;
            
            recentFinesEl.appendChild(fineCard);
        });
        
        if (DEBUG) console.log('Recent fines loaded:', fines.length);
    } catch (error) {
        console.error('Error loading recent fines:', error);
        noRecentFinesEl.classList.remove('hidden');
        recentFinesEl.innerHTML = '<div class="text-red-500 text-center py-4">Fout bij laden van recente boetes</div>';
    }
}

// Load players for selectors (both history and multi-select)
async function loadPlayersForSelector() {
    try {
        const players = await apiRequest('/players?select=id,name&order=name');
        
        if (players && players.length > 0) {
            // Update player history dropdown
            playerHistorySelectEl.innerHTML = '<option value="">Selecteer een speler</option>';
            
            // Also update multi-select player dropdown if exists
            if (playerSelect) playerSelect.innerHTML = '';
            
            players.forEach(player => {
                // Add to player history dropdown
                const option1 = document.createElement('option');
                option1.value = player.id;
                option1.textContent = player.name;
                playerHistorySelectEl.appendChild(option1);
                
                // Add to multi-select player dropdown if exists
                if (playerSelect) {
                    const option2 = document.createElement('option');
                    option2.value = player.id;
                    option2.textContent = player.name;
                    playerSelect.appendChild(option2);
                }
            });
            
            // Refresh Select2 if initialized
            if (window.$ && $.fn.select2) {
                $(playerHistorySelectEl).select2({
                    placeholder: 'Selecteer een speler',
                    allowClear: true,
                    width: '100%',
                });
                
                if (playerSelect) {
                    $(playerSelect).select2({
                        placeholder: 'Selecteer speler(s)',
                        allowClear: true,
                        width: '100%',
                    });
                }
            }
            
            if (DEBUG) console.log('Players loaded for selector:', players.length);
        }
    } catch (error) {
        console.error('Error loading players for selector:', error);
        playerHistorySelectEl.innerHTML = '<option value="">Fout bij laden spelers</option>';
        if (playerSelect) playerSelect.innerHTML = '<option value="">Fout bij laden spelers</option>';
    }
}

// Load reasons for selector
async function loadReasonsForSelector() {
    try {
        if (!reasonSelect) return;
        
        // Update query to not reference the missing amount column
        const reasons = await apiRequest('/reasons?select=id,description&order=description');
        
        if (reasons && reasons.length > 0) {
            // Clear existing options but keep the placeholder
            reasonSelect.innerHTML = '<option value="">Selecteer een reden</option>';
            
            reasons.forEach(reason => {
                const option = document.createElement('option');
                option.value = reason.id;
                option.textContent = reason.description;
                reasonSelect.appendChild(option);
            });
            
            // Refresh Select2 if initialized
            if (window.$ && $.fn.select2) {
                $(reasonSelect).select2({
                    placeholder: 'Selecteer een reden',
                    allowClear: true,
                    width: '100%',
                });
            }
            
            if (DEBUG) console.log('Reasons loaded for selector:', reasons.length);
        }
    } catch (error) {
        console.error('Error loading reasons for selector:', error);
        if (reasonSelect) reasonSelect.innerHTML = '<option value="">Fout bij laden redenen</option>';
    }
}

// Load player history
async function loadPlayerHistory(playerId) {
    if (!playerId) {
        playerHistoryEl.innerHTML = '<div class="text-gray-500 text-center py-4">Selecteer een speler om geschiedenis te zien</div>';
        return;
    }

    showLoading();
    
    try {
        const { data: fines, error } = await apiRequest(`/fines?player_id=eq.${playerId}&select=id,created_at,reasons(description),players(name)&order=created_at.desc`);
        
        if (error) throw error;
        
        if (!fines || fines.length === 0) {
            playerHistoryEl.innerHTML = '<div class="text-gray-500 text-center py-4">Geen boetes gevonden voor deze speler</div>';
            return;
        }

        // Calculate total for this player
        const standardAmount = 5.00;
        const totalFineAmount = fines.length * standardAmount;
        
        let html = `
            <div class="mb-3 p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg shadow">
                <h3 class="text-lg font-semibold">Totaal: ${formatCurrency(totalFineAmount)}</h3>
                <p class="text-sm opacity-90">Aantal boetes: ${fines.length}</p>
            </div>
            <div class="space-y-2">
        `;

        fines.forEach(fine => {
            const fineAmount = '€5,00'; // Fixed amount for all fines
            html += `
                <div class="bg-white p-3 rounded-lg shadow-sm hover:shadow transition-all">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">${fine.reasons?.description || 'Onbekende reden'}</p>
                            <span class="text-xs text-gray-500">${formatDate(fine.created_at)}</span>
                        </div>
                        <span class="font-medium">${fineAmount}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        playerHistoryEl.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading player history:', error);
        playerHistoryEl.innerHTML = '<div class="text-red-500 text-center py-4">Fout bij laden van speler geschiedenis</div>';
    } finally {
        showLoading(false);
    }
}

// Load and render leaderboard
async function loadLeaderboard() {
    showLoading();
    
    try {
        const { data: players, error: playersError } = await apiRequest('/players?select=id,name');
        if (playersError) throw playersError;
        
        const { data: fines, error: finesError } = await apiRequest('/fines?select=id,player_id');
        if (finesError) throw finesError;
        
        if (!players || players.length === 0) {
            leaderboardEl.innerHTML = '<div class="text-gray-500 text-center py-4">Geen spelers gevonden</div>';
            return;
        }

        // Group fines by player
        const playerFines = {};
        players.forEach(player => {
            playerFines[player.id] = {
                id: player.id,
                name: player.name,
                count: 0,
                total: 0
            };
        });
        
        // Count fines and calculate totals (fixed €5.00 per fine)
        fines.forEach(fine => {
            if (playerFines[fine.player_id]) {
                playerFines[fine.player_id].count += 1;
                playerFines[fine.player_id].total += 5.00; // Fixed amount per fine
            }
        });
        
        // Sort by total amount
        const sortedPlayers = Object.values(playerFines)
            .filter(player => player.count > 0)
            .sort((a, b) => b.total - a.total);
            
        if (sortedPlayers.length === 0) {
            leaderboardEl.innerHTML = '<div class="text-gray-500 text-center py-4">Nog geen boetes uitgedeeld</div>';
            return;
        }

        let html = '<div class="space-y-2">';
        
        sortedPlayers.forEach((player, index) => {
            let rankClass = '';
            let medal = '';
            
            if (index === 0) {
                rankClass = 'bg-yellow-100 border-yellow-300';
                medal = '<span class="text-yellow-500 mr-2">🥇</span>';
            } else if (index === 1) {
                rankClass = 'bg-gray-100 border-gray-300';
                medal = '<span class="text-gray-400 mr-2">🥈</span>';
            } else if (index === 2) {
                rankClass = 'bg-orange-100 border-orange-300';
                medal = '<span class="text-orange-500 mr-2">🥉</span>';
            }
            
            html += `
                <div class="bg-white p-3 rounded-lg shadow-sm hover:shadow transition-all ${rankClass} border-l-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            ${medal}
                            <div>
                                <p class="font-medium">${player.name}</p>
                                <span class="text-xs text-gray-500">${player.count} boete${player.count !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <span class="font-medium">${formatCurrency(player.total)}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        leaderboardEl.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardEl.innerHTML = '<div class="text-red-500 text-center py-4">Fout bij laden van ranglijst</div>';
    } finally {
        showLoading(false);
    }
}

// Add fine form submission
if (addFineForm) {
    addFineForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get selected player IDs (supports multiple selections)
        let playerIds = [];
        if (window.$ && $.fn.select2) {
            playerIds = $(playerSelect).val() || [];
        } else {
            // Fallback for when Select2 is not available
            Array.from(playerSelect.selectedOptions).forEach(option => {
                playerIds.push(option.value);
            });
        }
        
        const reasonId = reasonSelect.value;
        const date = dateInput.value || new Date().toISOString().split('T')[0];
        
        if (playerIds.length === 0) {
            showToast('Selecteer minimaal één speler', 'warning');
            return;
        }
        
        if (!reasonId) {
            showToast('Selecteer een reden voor de boete', 'warning');
            return;
        }
        
        try {
            showLoading(true);
            
            // Add a fine for each selected player
            const finePromises = playerIds.map(playerId => {
                return apiRequest('/fines', {
                    method: 'POST',
                    body: JSON.stringify({
                        player_id: playerId,
                        reason_id: reasonId,
                        created_at: date
                    })
                });
            });
            
            await Promise.all(finePromises);
            
            showToast(`${playerIds.length > 1 ? 'Boetes' : 'Boete'} toegevoegd voor ${playerIds.length} ${playerIds.length > 1 ? 'spelers' : 'speler'}`, 'success');
            
            // Reset form
            if (window.$ && $.fn.select2) {
                $(playerSelect).val(null).trigger('change');
                $(reasonSelect).val(null).trigger('change');
            } else {
                playerSelect.value = '';
                reasonSelect.value = '';
            }
            
            // Refresh data
            await Promise.all([
                loadTotalAmount(),
                loadRecentFines(),
                loadLeaderboard()
            ]);
            
        } catch (error) {
            console.error('Error adding fines:', error);
            showToast('Fout bij toevoegen van boetes', 'error');
        } finally {
            showLoading(false);
        }
    });
}

// Event listener for player history selector
if (playerHistorySelectEl) {
    playerHistorySelectEl.addEventListener('change', function() {
        const playerId = this.value;
        loadPlayerHistory(playerId);
    });
}

// Initialize the app
async function init() {
    try {
        showLoading(true);
        
        // Refresh cache bust parameter
        cacheBustParam = Date.now();
        
        // Load data in parallel
        await Promise.all([
            loadTotalAmount(),
            loadRecentFines(),
            loadPlayersForSelector(),
            loadReasonsForSelector(),
            loadLeaderboard()
        ]);
        
        if (DEBUG) console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
    } finally {
        showLoading(false);
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Add refresh button event (optional)
document.querySelector('h1').addEventListener('click', function() {
    init();
    showToast('Gegevens worden vernieuwd...', 'info');
}); 
