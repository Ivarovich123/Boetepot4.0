// Cache busting parameter
let cacheBustParam = Date.now();

// Supabase configuration
const SUPABASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc4ODM3ODksImV4cCI6MjAxMzQ1OTc4OX0.h3PwqEe-Tf_YSAK91J_I-0WXyP1MlRWvuKXp5WGxnZQ';

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
    toast.className = `rounded-lg p-4 mb-3 text-white text-sm flex items-center justify-between shadow-lg transform transition-all duration-300 ease-in-out translate-x-full opacity-0`;
    
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
            toast.classList.add('bg-blue-600');
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
        
        // Fix format for foreign key queries (nested relations)
        endpoint = endpoint.replace(/\(([^)]+)\)/g, '.select=$1');
        
        // Make sure query parameters are properly formatted
        let url = SUPABASE_URL + endpoint;
        
        // Apply cache busting
        url = addCacheBust(url);
        
        if (DEBUG) console.log('Attempting API Request to:', url);
        
        const defaultOptions = {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            mode: 'cors',
            credentials: 'omit' // Don't send cookies for CORS
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        // Add retry logic for network issues
        let retries = 3;
        let response = null;
        
        while (retries > 0) {
            try {
                if (DEBUG) console.log(`API request attempt ${4-retries}/3`);
                response = await fetch(url, requestOptions);
                break; // If successful, exit the retry loop
            } catch (fetchError) {
                console.error(`Fetch attempt ${4-retries} failed:`, fetchError);
                retries--;
                if (retries === 0) throw fetchError;
                // Wait before retrying (exponential backoff)
                const waitTime = (4 - retries) * 1000;
                console.log(`Retrying in ${waitTime/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        if (!response) {
            throw new Error('Network error after multiple retries');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response Error:', response.status, errorText);
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        // Parse JSON
        const data = await response.json();
        if (DEBUG) console.log('API Response Data:', data);
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        
        // More detailed error message to help with debugging
        let errorMessage = 'Fout bij verbinden met de database. ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Controleer uw internetverbinding en API-instellingen. Mogelijke oorzaken: CORS-restricties, ongeldige API-sleutel, of Supabase-server niet bereikbaar.';
            
            // Log detailed debugging information
            console.log('Debug info:');
            console.log('API Base URL:', SUPABASE_URL);
            console.log('API Key (masked):', SUPABASE_KEY.substring(0, 15) + '...');
            console.log('Headers:', options.headers);
            
            // Check if in development mode
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('Development environment detected - check for CORS issues');
                
                // Attempt a simple ping test to see if Supabase is accessible
                fetch(`${SUPABASE_URL}/health`, {
                    method: 'GET',
                    headers: { 'apikey': SUPABASE_KEY },
                    mode: 'cors'
                }).then(r => {
                    console.log('Health check succeeded');
                }).catch(e => {
                    console.log('Health check failed:', e);
                });
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
    try {
        // Get all fines
        const fines = await apiRequest('/fines?select=amount');
        
        // Calculate total
        const total = fines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);
        
        // Update UI
        totalAmountEl.textContent = formatCurrency(total);
        
        if (DEBUG) console.log('Total amount loaded:', total);
    } catch (error) {
        console.error('Error loading total amount:', error);
        totalAmountEl.textContent = '€0,00';
    }
}

// Load recent fines
async function loadRecentFines() {
    try {
        // Get fines with player and reason details, sort by created_at desc, limit to 5
        // Updated query syntax for Supabase PostgREST relations
        const fines = await apiRequest('/fines?select=*,player:player_id(name),reason:reason_id(description,amount)&order=created_at.desc&limit=5');
        
        if (fines && fines.length > 0) {
            noRecentFinesEl.classList.add('hidden');
            recentFinesEl.innerHTML = ''; // Clear previous fines
            
            // Create fine cards for each fine
            fines.forEach(fine => {
                const fineCard = document.createElement('div');
                fineCard.className = 'fine-card bg-white p-4 border border-gray-200 rounded-xl shadow-sm';
                
                fineCard.innerHTML = `
                <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="flex items-center mb-1">
                                <span class="font-semibold text-blue-800">${fine.player?.name || 'Onbekend'}</span>
                                <span class="text-gray-400 mx-2">•</span>
                                <span class="text-gray-500 text-sm">${formatDate(fine.created_at)}</span>
                        </div>
                            <div class="text-gray-700">${fine.reason?.description || 'Onbekende reden'}</div>
                        </div>
                        <div class="font-bold text-blue-700 text-lg">${formatCurrency(fine.reason?.amount || 0)}</div>
                    </div>
                `;
                
                recentFinesEl.appendChild(fineCard);
            });
            
            if (DEBUG) console.log('Recent fines loaded:', fines.length);
        } else {
            noRecentFinesEl.classList.remove('hidden');
            if (DEBUG) console.log('No recent fines found');
        }
    } catch (error) {
        console.error('Error loading recent fines:', error);
        noRecentFinesEl.classList.remove('hidden');
        recentFinesEl.innerHTML = ''; // Clear any partial data
    }
}

// Load players for history selector
async function loadPlayersForSelector() {
    try {
        const players = await apiRequest('/players?select=id,name&order=name');
        
        if (players && players.length > 0) {
            playerHistorySelectEl.innerHTML = '<option value="">-- Selecteer speler --</option>';
            
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = player.name;
                playerHistorySelectEl.appendChild(option);
            });
            
            if (DEBUG) console.log('Players loaded for selector:', players.length);
        }
    } catch (error) {
        console.error('Error loading players for selector:', error);
        playerHistorySelectEl.innerHTML = '<option value="">Fout bij laden spelers</option>';
    }
}

// Load player history
async function loadPlayerHistory(playerId) {
    try {
        if (!playerId) {
            noPlayerHistoryEl.textContent = 'Selecteer een speler om de geschiedenis te zien';
            noPlayerHistoryEl.classList.remove('hidden');
            playerHistoryEl.innerHTML = '';
            return;
        }
    
        // Get fines for the selected player with reason details, sort by created_at desc
        const fines = await apiRequest(`/fines?player_id=eq.${playerId}&select=*,reason:reason_id(description,amount)&order=created_at.desc`);
        
        if (fines && fines.length > 0) {
            noPlayerHistoryEl.classList.add('hidden');
            playerHistoryEl.innerHTML = ''; // Clear previous history
            
            // Create history items
            fines.forEach(fine => {
                const historyItem = document.createElement('div');
                historyItem.className = 'bg-white p-4 border border-gray-200 rounded-xl shadow-sm hover-card';
                
                historyItem.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="text-gray-500 text-sm mb-1">${formatDate(fine.created_at)}</div>
                            <div class="text-gray-700">${fine.reason?.description || 'Onbekende reden'}</div>
                        </div>
                        <div class="font-bold text-blue-700">${formatCurrency(fine.reason?.amount || 0)}</div>
                    </div>
                `;
                
                playerHistoryEl.appendChild(historyItem);
            });
            
            // Show total for this player
            const total = fines.reduce((sum, fine) => sum + parseFloat(fine.reason?.amount || 0), 0);
            
            const totalItem = document.createElement('div');
            totalItem.className = 'bg-blue-50 p-4 border border-blue-200 rounded-xl mt-4';
            totalItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="font-semibold text-blue-700">Totaal</div>
                    <div class="font-bold text-blue-800 text-lg">${formatCurrency(total)}</div>
                </div>
            `;
            
            playerHistoryEl.appendChild(totalItem);
            
            if (DEBUG) console.log('Player history loaded:', fines.length);
        } else {
            noPlayerHistoryEl.textContent = 'Geen boetes gevonden voor deze speler';
            noPlayerHistoryEl.classList.remove('hidden');
            playerHistoryEl.innerHTML = ''; // Clear any partial data
            if (DEBUG) console.log('No history found for player');
        }
    } catch (error) {
        console.error('Error loading player history:', error);
        noPlayerHistoryEl.textContent = 'Fout bij laden van speler geschiedenis';
        noPlayerHistoryEl.classList.remove('hidden');
        playerHistoryEl.innerHTML = ''; // Clear any partial data
    }
}

// Load and render leaderboard
async function loadLeaderboard() {
    try {
        // Get all fines with reason amount and player info using proper Supabase relation syntax
        const fines = await apiRequest('/fines?select=player_id,reason:reason_id(amount)');
        const players = await apiRequest('/players?select=id,name');
        
        if (DEBUG) console.log('Fines data:', fines);
        if (DEBUG) console.log('Players data:', players);
        
        if (fines && fines.length > 0 && players && players.length > 0) {
            // Calculate totals per player
            const playerTotals = {};
            
            // Initialize all players with zero
            players.forEach(player => {
                playerTotals[player.id] = {
                    id: player.id,
                    name: player.name,
                    total: 0,
                    count: 0
                };
            });
            
            // Sum up fines
            fines.forEach(fine => {
                const playerId = fine.player_id;
                const amount = parseFloat(fine.reason?.amount || 0);
                
                if (playerTotals[playerId]) {
                    playerTotals[playerId].total += amount;
                    playerTotals[playerId].count += 1;
                }
            });
            
            // Convert to array, filter players with fines, and sort by total (descending)
            const leaderboardData = Object.values(playerTotals)
                .filter(player => player.total > 0)
                .sort((a, b) => b.total - a.total);
            
            if (leaderboardData.length > 0) {
                renderLeaderboard(leaderboardData);
                if (DEBUG) console.log('Leaderboard data:', leaderboardData);
            } else {
                noLeaderboardEl.classList.remove('hidden');
                leaderboardEl.innerHTML = '';
                if (DEBUG) console.log('No players with fines for leaderboard');
            }
        } else {
            noLeaderboardEl.classList.remove('hidden');
            leaderboardEl.innerHTML = '';
            if (DEBUG) console.log('No data for leaderboard');
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        noLeaderboardEl.textContent = 'Fout bij laden van ranglijst';
        noLeaderboardEl.classList.remove('hidden');
        leaderboardEl.innerHTML = '';
    }
}

// Render the leaderboard with the provided data
function renderLeaderboard(leaderboardData) {
    noLeaderboardEl.classList.add('hidden');
    leaderboardEl.innerHTML = ''; // Clear previous leaderboard
    
    // Create leaderboard items
    leaderboardData.forEach((player, index) => {
        const rank = index + 1;
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = `leaderboard-item flex items-center p-4 border border-gray-200 rounded-xl mb-2 hover:bg-gray-50`;
        
        leaderboardItem.innerHTML = `
            <div class="leaderboard-rank ${rank <= 3 ? `leaderboard-rank-${rank}` : ''} mr-3">${rank}</div>
            <div class="flex-1">
                <div class="font-semibold">${player.name}</div>
                <div class="text-gray-500 text-sm">
                    ${player.count} boete${player.count !== 1 ? 's' : ''}
                </div>
            </div>
            <div class="font-bold text-blue-700">${formatCurrency(player.total)}</div>
        `;
        
        leaderboardEl.appendChild(leaderboardItem);
    });
}

// Event listener for player history selector
playerHistorySelectEl.addEventListener('change', function() {
    const playerId = this.value;
    loadPlayerHistory(playerId);
});

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
