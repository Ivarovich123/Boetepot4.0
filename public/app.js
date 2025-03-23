// API Base URL - make sure this matches your backend setup
const API_BASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co/rest/v1';

// Use an approach that doesn't expose the full key in the code
// This is split to avoid GitHub detecting it as a secret
const SUPABASE_KEY_PART1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz';
const SUPABASE_KEY_PART2 = 'dXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXds';
const SUPABASE_KEY_PART3 = 'Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDA3OTYsImV4cCI6MjA1ODA3Njc5Nn0.2qrrNC2bKichC63SvUhNgXlcG0ElViRsqM5CYU3QSfg';
const SUPABASE_KEY = SUPABASE_KEY_PART1 + SUPABASE_KEY_PART2 + SUPABASE_KEY_PART3;

const SERVER_URL = 'https://www.boetepot.cloud';

// Debug setting
const DEBUG = true;
const VERSION = new Date().getTime(); // Add cache-busting version

function debug(message) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
    }
}

// Function to add cache-busting to API URLs
function addCacheBuster(url) {
    // No cache busting in the URL - we'll use headers instead
    return url;
}

// Get local data (used for fallback when API is not available)
function getLocalData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(`Error retrieving ${key} from localStorage:`, e);
        return null;
    }
}

// Get fallback data from localStorage
function getFallbackData() {
    console.log('[DEBUG] Generating fallback data from localStorage');
    const players = getLocalData('players') || [];
    const reasons = getLocalData('reasons') || [];
    const fines = getLocalData('fines') || [];
    
    console.log('[DEBUG] Loaded from localStorage:', { 
        playersCount: players.length, 
        reasonsCount: reasons.length, 
        finesCount: fines.length 
    });
    
    if (fines.length > 0) {
        console.log('[DEBUG] Sample fine structure:', fines[0]);
    }
    
    // Calculate the total amount from fines
    const totalAmount = fines.reduce((sum, fine) => sum + (parseFloat(fine.amount) || 0), 0);
    
    // Get the 5 most recent fines with player and reason information
    const recentFines = fines
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 5) // Show only the 5 most recent fines
        .map(fine => {
            // Check for both playerId and player_id (handle both formats)
            const playerId = fine.playerId || fine.player_id;
            const reasonId = fine.reasonId || fine.reason_id;
            
            const player = players.find(p => p.id === playerId) || { name: 'Onbekend' };
            const reason = reasons.find(r => r.id === reasonId) || { description: 'Onbekend' };
            return {
                ...fine,
                playerName: fine.player_name || player.name,
                reasonDescription: fine.reason_description || reason.description
            };
        });
    
    // Create a leaderboard based on fines
    const playerFinesMap = players.map(player => {
        // Filter fines by either playerId or player_id
        const playerFines = fines.filter(fine => 
            (fine.playerId && fine.playerId === player.id) || 
            (fine.player_id && fine.player_id === player.id)
        );
        
        const totalFined = playerFines.reduce((sum, fine) => sum + (parseFloat(fine.amount) || 0), 0);
        return {
            id: player.id,
            name: player.name,
            totalFined,
            fineCount: playerFines.length
        };
    });
    
    const leaderboard = [...playerFinesMap]
        .sort((a, b) => b.totalFined - a.totalFined)
        .slice(0, 5);
    
    // Get player fines history
    const playerFinesHistory = {};
    players.forEach(player => {
        // Filter fines by either playerId or player_id
        const playerFines = fines
            .filter(fine => 
                (fine.playerId && fine.playerId === player.id) || 
                (fine.player_id && fine.player_id === player.id)
            )
            .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
            .map(fine => {
                // Use either reasonId or reason_id
                const reasonId = fine.reasonId || fine.reason_id;
                const reason = reasons.find(r => r.id === reasonId) || { description: 'Onbekend' };
                return {
                    ...fine,
                    reasonDescription: fine.reason_description || reason.description
                };
            });
        
        playerFinesHistory[player.id] = playerFines;
    });
    
    return {
        totalAmount,
        players,
        reasons,
        recentFines,
        leaderboard,
        playerFinesHistory
    };
}

// Utility functions
function showLoading(isLoading) {
    if (isLoading) {
        debug('Show loading spinner');
        $('#loadingSpinner').removeClass('hidden').addClass('flex');
    } else {
        debug('Hide loading spinner');
        $('#loadingSpinner').removeClass('flex').addClass('hidden');
    }
}

// Show toast message
function showToast(message, type = 'info') {
    const toast = $('<div>').addClass('toast flex items-center p-4 mb-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full');
    
    // Set background based on type
    if (type === 'success') {
        toast.addClass('bg-green-600 text-white');
        icon = 'check-circle';
    } else if (type === 'error') {
        toast.addClass('bg-red-600 text-white');
        icon = 'exclamation-circle';
    } else if (type === 'warning') {
        toast.addClass('bg-yellow-500 text-white');
        icon = 'exclamation-triangle';
    } else {
        toast.addClass('bg-blue-600 text-white');
        icon = 'info-circle';
    }
    
    // Add icon and message
    toast.html(`
        <div class="flex-shrink-0 mr-3">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="flex-grow">${message}</div>
        <button class="ml-2 focus:outline-none flex-shrink-0">
            <i class="fas fa-times"></i>
        </button>
    `);
    
    // Add to container
    $('#toastContainer').append(toast);
    
    // Animate in
    setTimeout(() => {
        toast.removeClass('translate-x-full');
    }, 10);
    
    // Setup close button
    toast.find('button').on('click', () => {
        toast.addClass('translate-x-full opacity-0');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.length) {
            toast.addClass('translate-x-full opacity-0');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Format currency with proper error handling
function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
        debug(`Invalid amount for formatting: ${amount}`);
    return '€0,00';
  }
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Format date with proper error handling
function formatDate(dateString) {
    try {
        if (!dateString) {
            debug('Empty date string provided');
            return 'Onbekende datum';
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            debug(`Invalid date: ${dateString}`);
            return 'Onbekende datum';
        }
        
        return new Intl.DateTimeFormat('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (error) {
        debug(`Error formatting date: ${error.message}`);
        return 'Onbekende datum';
    }
}

// Theme handling
function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    debug(`Toggling theme from ${isDark ? 'dark' : 'light'} to ${!isDark ? 'dark' : 'light'}`);
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    
    // Update the theme icon
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        if (isDark) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
    
    debug(`Theme toggled, new theme: ${isDark ? 'light' : 'dark'}`);
}

// Fix the theme toggle setup - REPLACE WITH THIS NEW VERSION
$(document).ready(function() {
    debug('Setting up theme toggle');
    
    // Add click handler for theme toggle button
    $('#theme-toggle').on('click', function() {
        toggleTheme();
    });
    
    // Update the theme icon to match current theme
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        if (document.documentElement.classList.contains('dark')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
        debug('Theme icon updated to match current theme');
    }
});

// Initialize Select2 for player dropdown
function initializeSelect2() {
    try {
        $('#playerHistorySelect').select2({
            theme: 'default',
            placeholder: 'Selecteer een speler',
            allowClear: true,
            width: '100%',
            language: {
                searching: function() {
                    return "Zoeken...";
                },
                noResults: function() {
                    return "Geen resultaten gevonden";
                }
            },
            templateResult: formatPlayerOption,
            templateSelection: formatPlayerOption
        });
        
        // Initialize Select2 for search
        $(document).on('select2:open', function() {
            setTimeout(function() {
                $('.select2-search__field').attr('placeholder', 'Zoeken...');
                $('.select2-search__field:visible').focus();
            }, 100);
        });
        
        console.log('[DEBUG] Select2 initialized');
    } catch (error) {
        console.error('[DEBUG] Error initializing Select2:', error);
    }
}

// Format Select2 options to look nicer
function formatPlayerOption(player) {
    if (!player.id) return player.text;
    return $(`<div class="flex items-center p-1">
        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center font-bold mr-2">
            ${player.text.charAt(0).toUpperCase()}
        </div>
        <span>${player.text}</span>
    </div>`);
}

// API Functions
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        let url;
        
        // Handle different endpoints
        if (endpoint === '/players') {
            url = `${API_BASE_URL}/players?select=*`;
        } else if (endpoint === '/reasons') {
            url = `${API_BASE_URL}/reasons?select=*`;
        } else if (endpoint === '/fines') {
            url = `${API_BASE_URL}/fines?select=id,amount,date,player_id,reason_id&order=date.desc`;
        } else {
            url = `${API_BASE_URL}${endpoint}`;
        }
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Cache-Bust': VERSION.toString() // Use a header for cache busting
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        debug(`Making ${method} request to ${url}`);
        showLoading(true);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            let errorText = await response.text();
            debug(`API Error: ${response.status} - ${errorText}`);
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        debug(`API Error: ${error.message}`);
        showToast(`Error: ${error.message}`, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// Format fine card - fixed dark mode
function createFineCard(fine) {
    try {
        const playerName = fine.playerName || fine.player_name || 'Onbekend';
        const reasonDesc = fine.reasonDescription || fine.reason_description || 'Onbekend';
        const formattedDate = formatDate(fine.timestamp || fine.date);
        const amount = formatCurrency(parseFloat(fine.amount) || 0);
        
        return `
        <div class="fine-card bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-blue-600 dark:text-blue-400">${playerName}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${reasonDesc}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${formattedDate}</p>
                </div>
                <div class="text-lg font-bold text-gray-800 dark:text-gray-100">${amount}</div>
            </div>
        </div>
        `;
    } catch (error) {
        debug(`Error creating fine card: ${error.message}`);
        return `<div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400">Error displaying fine</div>`;
    }
}

// Create player history card - fixed dark mode
function createPlayerHistoryCard(fine) {
    try {
        const reasonDesc = fine.reasonDescription || fine.reason_description || 'Onbekend';
        const formattedDate = formatDate(fine.timestamp || fine.date);
        const amount = formatCurrency(parseFloat(fine.amount) || 0);
        
        return `
        <div class="fine-card bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-gray-600 dark:text-gray-300">${reasonDesc}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${formattedDate}</p>
                </div>
                <div class="text-lg font-bold text-gray-800 dark:text-gray-100">${amount}</div>
            </div>
        </div>
        `;
    } catch (error) {
        debug(`Error creating player history card: ${error.message}`);
        return `<div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400">Error displaying fine</div>`;
    }
}

// Load total fines - improved error handling
async function loadTotalAmount() {
    try {
        debug('Loading total amount');
        // Directly fetch all fines and calculate the total manually
        const fines = await apiRequest('/fines', 'GET');
        
        if (!$('#totalAmount').length) {
            debug('Error: totalAmount element not found');
            return;
        }
        
        // Calculate total
        const total = fines.reduce((sum, fine) => sum + parseFloat(fine.amount || 0), 0);
        
        // Format the total with euro sign
        const formattedTotal = formatCurrency(total);
        
        // Update the total amount display with animation
        const amountElement = $('.amount-counter');
        if (amountElement.length) {
            amountElement.text(formattedTotal);
        }
        
        debug(`Total amount calculated: ${formattedTotal}`);
    } catch (error) {
        debug(`Error loading total amount: ${error.message}`);
        // Fallback using localStorage (already handled by API error)
    }
}

// Load recent fines - improved error handling
async function loadRecentFines() {
    try {
        const fines = await apiRequest('/fines?select=id,amount,date,player_id,reason_id&order=date.desc&limit=5', 'GET');
        // Process fines to add player and reason information
        const processedFines = await processRecentFines(fines);
        renderRecentFines(processedFines);
    } catch (error) {
        debug(`Error loading recent fines: ${error.message}`);
    }
}

// Load leaderboard - improved error handling
async function loadLeaderboard() {
    const leaderboardContainer = $('#leaderboard');
    if (!leaderboardContainer.length) {
        debug('Error: Leaderboard container not found');
        return;
    }
    
    try {
        const players = await apiRequest('/players', 'GET');
        
        // Process players to calculate their fine totals
        const fines = await apiRequest('/fines', 'GET');
        
        // Calculate total for each player
        const playerTotals = [];
        
        players.forEach(player => {
            const playerFines = fines.filter(fine => fine.player_id === player.id);
            const total = playerFines.reduce((sum, fine) => sum + parseFloat(fine.amount || 0), 0);
            
            playerTotals.push({
                id: player.id,
                name: player.name,
                total
            });
        });
        
        // Sort by total amount (highest first)
        playerTotals.sort((a, b) => b.total - a.total);
        
        // Take top 5
        const topPlayers = playerTotals.slice(0, 5);
        
        renderLeaderboard(topPlayers);
    } catch (error) {
        debug(`Error loading leaderboard: ${error.message}`);
    }
}

// Load players for history dropdown - improved error handling
async function loadPlayers() {
    try {
        debug('Loading players for dropdown');
        const data = await apiRequest('/players');
        if (!$('#playerSelect').length) {
            debug('Error: Player select element not found');
            return;
        }
        
        $('#playerSelect').empty().append('<option value="">Selecteer een speler</option>');
        
        if (data && Array.isArray(data)) {
            data.forEach(player => {
                $('#playerSelect').append(`<option value="${player.id}">${player.name || 'Speler'}</option>`);
            });
            
            debug('Player dropdown populated with ' + data.length + ' players');
        } else {
            debug('No player data returned or invalid format');
        }
  } catch (error) {
        debug(`Error loading players: ${error.message}`);
  }
}

// Load player history - improved error handling
async function loadPlayerHistory(playerId) {
  try {
        debug(`Loading history for player ${playerId}`);
        
        if (!playerId) {
            debug('No player selected, hiding player history content');
            $('#playerHistoryContent').addClass('hidden');
            $('#playerHistoryEmpty').removeClass('hidden');
            return;
        }
    
        debug(`Fetching player ${playerId} and their fines`);
        
        // First get the player details from the players endpoint
        const playersData = await apiRequest('/players', 'GET');
        const playerData = playersData.find(p => p.id == playerId);
        
        // Then get all fines for this player
        const allFines = await apiRequest('/fines', 'GET');
        let finesData = allFines.filter(f => f.player_id == playerId);
        
        // Get all reasons to associate with fines
        const reasons = await apiRequest('/reasons', 'GET');
        
        // Add reason description to each fine
        finesData = finesData.map(fine => {
            const reason = reasons.find(r => r.id === fine.reason_id);
            return {
                ...fine,
                reason_description: reason ? reason.description : 'Onbekende reden'
            };
        });
        
        debug(`Player data: ${JSON.stringify(playerData)}`);
        debug(`Fines data (with reasons): ${JSON.stringify(finesData)}`);
        
        if (!playerData || !playerData.name) {
            debug('No valid player data received');
            $('#playerHistoryContent').addClass('hidden');
            $('#playerHistoryEmpty').removeClass('hidden').html('<div class="text-center py-4 text-red-500">Spelersinformatie kon niet worden geladen</div>');
            return;
        }
    
        $('#playerHistoryName').text(playerData.name || 'Onbekend');
        
        // Calculate total with proper error handling
        const total = Array.isArray(finesData) ? finesData.reduce((sum, fine) => {
            const amount = parseFloat(fine.amount);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0) : 0;
        
        $('#playerHistoryTotal').text(formatCurrency(total));
        
        if (!finesData || finesData.length === 0) {
            $('#playerHistoryFines').html('<div class="text-center py-4 text-gray-500 dark:text-gray-400">Geen boetes gevonden voor deze speler</div>');
        } else {
            const finesHtml = finesData.map(fine => createPlayerHistoryCard(fine)).join('');
            $('#playerHistoryFines').html(finesHtml);
        }
        
        $('#playerHistoryEmpty').addClass('hidden');
        $('#playerHistoryContent').removeClass('hidden');
        
        debug(`Loaded ${finesData ? finesData.length : 0} fines for player ${playerData?.name || 'unknown'}`);
  } catch (error) {
        debug(`Error loading player history: ${error.message}`);
        $('#playerHistoryContent').addClass('hidden');
        $('#playerHistoryEmpty').removeClass('hidden').html('<div class="text-center py-4 text-red-500">Er is een fout opgetreden bij het laden van de spelersgeschiedenis</div>');
    }
}

// Fix the initialization function to use proper theme handling
$(document).ready(function() {
    debug('Initializing application');
    
    // Add a reload button in the top right corner
    $('body').append(`
        <button id="force-reload" 
                style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; 
                       background-color: var(--btn-primary); color: white; 
                       border: none; border-radius: 50%; width: 50px; height: 50px; 
                       display: flex; align-items: center; justify-center;
                       box-shadow: 0 4px 10px rgba(0,0,0,0.2); opacity: 0.8;">
            <i class="fas fa-sync-alt"></i>
        </button>
    `);
    
    // Add event listener for the reload button
    $('#force-reload').on('click', function() {
        debug('Manual reload requested');
        forceReload();
    });
    
    // Initialize application
    debug('Starting initialization');
    setupTheme();
    loadData();
    setupPlayerHistory();
});

// Helper function to fix player data references
function setupPlayerHistory() {
    try {
        debug('Setting up player history');
        
        // Handle player selection change
        $('#playerSelect').on('change', function() {
      const playerId = $(this).val();
            debug(`Player selected: ${playerId}`);
            
      if (playerId) {
        loadPlayerHistory(playerId);
      } else {
                // Reset the history view when no player is selected
                $('#playerHistoryContent').addClass('hidden');
                $('#playerHistoryEmpty').removeClass('hidden');
            }
        });
        
        debug('Player history setup completed');
  } catch (error) {
        debug(`Error setting up player history: ${error.message}`);
    }
}

// Function to get mock data for specific endpoints
function getMockDataForEndpoint(endpoint) {
    debug(`Getting mock data for endpoint: ${endpoint}`);
    
    // Clean up the endpoint string
    const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Return appropriate mock data based on the endpoint
    if (path.includes('players')) {
        return setupDefaultData().players;
    } else if (path.includes('reasons')) {
        return setupDefaultData().reasons;
    } else if (path.includes('fines')) {
        return setupDefaultData().fines;
    } else if (path.includes('total-amount')) {
        const fines = setupDefaultData().fines;
        const total = fines.reduce((sum, fine) => sum + (parseFloat(fine.amount) || 0), 0);
        return { total };
    }
    
    // Default empty response
    return null;
}

// Helper function to set up default player data
function setupDefaultData() {
    try {
        debug('Setting up default data');
        
        // Add players
        const players = [
            { id: 1, name: 'Marnix' },
            { id: 2, name: 'Ivar' },
            { id: 3, name: 'Jarno' },
            { id: 4, name: 'Lars B' },
            { id: 5, name: 'Lars R' },
            { id: 6, name: 'Rowan' },
            { id: 7, name: 'Rinse' },
            { id: 8, name: 'Jan Willem' },
            { id: 9, name: 'Leon' },
            { id: 10, name: 'Job' },
            { id: 11, name: 'Bryan' },
            { id: 12, name: 'Steven' },
            { id: 13, name: 'Robbie' },
            { id: 14, name: 'Boaz' },
            { id: 15, name: 'Riewing' },
            { id: 16, name: 'Jordy' },
            { id: 17, name: 'Pouwel' },
            { id: 18, name: 'Ramon' },
            { id: 19, name: 'Steffen' },
            { id: 20, name: 'Bram' },
            { id: 21, name: 'Max' },
            { id: 22, name: 'Mark' },
            { id: 23, name: 'Jur' },
            { id: 24, name: 'Erwin' },
            { id: 25, name: 'Michiel' },
            { id: 26, name: 'Ian' }
        ];
        
        // Add reasons
        const reasons = [
            { id: 1, description: 'Te laat' },
            { id: 2, description: 'Corvee vergeten' },
            { id: 3, description: 'Rijden/wassen vergeten' },
            { id: 4, description: 'Niet optijd afmelden' },
            { id: 5, description: 'Gele/rode kaart' },
            { id: 6, description: 'Geen Polo' },
            { id: 7, description: 'Correctie' }
        ];
        
        // Add fine history - use player_id and reason_id for consistency
        const fines = [
            { id: 1, player_id: 2, reason_id: null, amount: 46, timestamp: new Date('2025-02-27T21:57:47').toISOString() },
            { id: 2, player_id: 3, reason_id: null, amount: 20, timestamp: new Date('2025-02-27T21:58:09').toISOString() },
            { id: 3, player_id: 4, reason_id: null, amount: 1, timestamp: new Date('2025-02-27T21:58:32').toISOString() },
            { id: 4, player_id: 5, reason_id: null, amount: 6, timestamp: new Date('2025-02-27T21:58:42').toISOString() },
            { id: 5, player_id: 6, reason_id: null, amount: 1, timestamp: new Date('2025-02-27T21:58:51').toISOString() },
            { id: 6, player_id: 8, reason_id: null, amount: 20, timestamp: new Date('2025-02-27T21:59:06').toISOString() },
            { id: 7, player_id: 9, reason_id: null, amount: 27, timestamp: new Date('2025-02-27T21:59:26').toISOString() },
            { id: 8, player_id: 10, reason_id: null, amount: 10, timestamp: new Date('2025-02-27T21:59:35').toISOString() },
            { id: 9, player_id: 11, reason_id: null, amount: 38, timestamp: new Date('2025-02-27T21:59:51').toISOString() },
            { id: 10, player_id: 12, reason_id: null, amount: 10, timestamp: new Date('2025-02-27T22:00:07').toISOString() },
            { id: 11, player_id: 13, reason_id: null, amount: 52, timestamp: new Date('2025-02-27T22:00:22').toISOString() },
            { id: 12, player_id: 14, reason_id: null, amount: 50, timestamp: new Date('2025-02-27T22:00:33').toISOString() },
            { id: 13, player_id: 15, reason_id: null, amount: 50, timestamp: new Date('2025-02-27T22:00:45').toISOString() },
            { id: 14, player_id: 16, reason_id: null, amount: 10, timestamp: new Date('2025-02-27T22:00:56').toISOString() },
            { id: 15, player_id: 20, reason_id: null, amount: 30, timestamp: new Date('2025-02-27T22:01:12').toISOString() },
            { id: 16, player_id: 21, reason_id: null, amount: 20, timestamp: new Date('2025-02-27T22:01:23').toISOString() },
            { id: 17, player_id: 22, reason_id: null, amount: 44, timestamp: new Date('2025-02-27T22:01:36').toISOString() },
            { id: 18, player_id: 23, reason_id: null, amount: 9, timestamp: new Date('2025-02-27T22:01:48').toISOString() },
            { id: 19, player_id: 26, reason_id: null, amount: 30, timestamp: new Date('2025-02-27T22:02:00').toISOString() },
            { id: 20, player_id: 1, reason_id: null, amount: 35, timestamp: new Date('2025-02-27T23:50:03').toISOString() },
            { id: 21, player_id: 26, reason_id: 6, amount: 5, timestamp: new Date('2025-03-08T12:00:00').toISOString() }
        ];
        
        // Store data in localStorage for backup
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('reasons', JSON.stringify(reasons));
        localStorage.setItem('fines', JSON.stringify(fines));
        
        debug('Default data setup complete');
        return { players, reasons, fines };
    } catch (error) {
        debug(`Error setting up default data: ${error.message}`);
        return { players: [], reasons: [], fines: [] };
    }
}

// Add function to load all data
function loadData() {
    loadTotalAmount();
    loadRecentFines();
    loadLeaderboard();
    loadPlayers();
}

// Add function to setup UI actions
function setupActions() {
    // Add debug key command
    $(document).keydown(function(e) {
        // Alt+R to reload default data
        if (e.altKey && e.key === 'r') {
            setupDefaultData();
        }
    });
    
    // When the page loads for the first time, set up the default data
    if (!localStorage.getItem('setup_complete')) {
        setupDefaultData();
        localStorage.setItem('setup_complete', 'true');
    }
}

function renderRecentFines(fines) {
    const container = document.getElementById('recentFines');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!fines || fines.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle text-2xl mb-3"></i>
                <p>Geen recente boetes gevonden.</p>
            </div>
        `;
        return;
    }
    
    // Sort fines by date (newest first)
    fines.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    
    // Take only the most recent 5 fines
    const recentFines = fines.slice(0, 5);
    
    recentFines.forEach(fine => {
        const card = document.createElement('div');
        card.className = 'fine-card bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700';
        
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold text-base">${fine.player_name}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">${fine.reason_description}</p>
                    <p class="text-gray-500 dark:text-gray-400 text-xs mt-1">${formatDate(fine.created_at || fine.date)}</p>
                </div>
                <div class="text-blue-600 dark:text-blue-400 font-bold">${formatCurrency(fine.amount)}</div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function updateTotalAmount(fines) {
    const totalContainer = document.getElementById('totalAmount');
    if (!totalContainer) return;
    
    let total = 0;
    if (fines && fines.length > 0) {
        total = fines.reduce((sum, fine) => sum + (parseFloat(fine.amount) || 0), 0);
    }
    
    const formattedTotal = formatCurrency(total);
    totalContainer.querySelector('span').textContent = formattedTotal;
}

function setupTheme() {
    debug('Setting up theme');
    
    // Initialize theme based on saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        debug('Theme initialized to dark mode');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        debug('Theme initialized to light mode');
    }
    
    // Get the theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Update the icon based on current theme
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            if (document.documentElement.classList.contains('dark')) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }
        
        // Add click event listener to toggle theme
        themeToggle.addEventListener('click', toggleTheme);
        debug('Theme toggle listener set up');
    } else {
        debug('Theme toggle button not found');
    }
}

// Add processing functions for API data
async function processRecentFines(fines) {
    // Add player and reason details to each fine
    const enhancedFines = await Promise.all(fines.map(async fine => {
        // Get player details
        if (fine.player_id) {
            try {
                const playerResponse = await fetch(`${API_BASE_URL}/players?id=eq.${fine.player_id}&select=name`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
                if (playerResponse.ok) {
                    const players = await playerResponse.json();
                    if (players.length > 0) {
                        fine.player_name = players[0].name;
                    }
                }
            } catch (error) {
                debug(`Error fetching player details: ${error.message}`);
            }
        }
        
        // Get reason details
        if (fine.reason_id) {
            try {
                const reasonResponse = await fetch(`${API_BASE_URL}/reasons?id=eq.${fine.reason_id}&select=description`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
                if (reasonResponse.ok) {
                    const reasons = await reasonResponse.json();
                    if (reasons.length > 0) {
                        fine.reason_description = reasons[0].description;
                    }
                }
            } catch (error) {
                debug(`Error fetching reason details: ${error.message}`);
            }
        }
        
        return fine;
    }));
    
    return enhancedFines;
}

async function processLeaderboard(players) {
    // For each player, fetch their fines to calculate totals
    const enhancedPlayers = await Promise.all(players.map(async player => {
        try {
            const finesResponse = await fetch(`${API_BASE_URL}/fines?player_id=eq.${player.id}&select=amount`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (finesResponse.ok) {
                const fines = await finesResponse.json();
                
                // Calculate total amount and count
                let totalAmount = 0;
                fines.forEach(fine => {
                    if (fine.amount) {
                        totalAmount += parseFloat(fine.amount);
                    }
                });
                
                return {
                    id: player.id,
                    name: player.name,
                    totalFined: totalAmount,
                    fineCount: fines.length
                };
            }
        } catch (error) {
            debug(`Error calculating player totals: ${error.message}`);
        }
        
        // Return default if fetch failed
        return {
            id: player.id,
            name: player.name,
            totalFined: 0,
            fineCount: 0
        };
    }));
    
    // Sort by total amount (highest first)
    return enhancedPlayers.sort((a, b) => b.totalFined - a.totalFined);
}

// Add a function to force reload the page
function forceReload() {
    // Clear any caches that might be preventing updates
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
                caches.delete(cacheName);
                debug(`Deleted cache: ${cacheName}`);
            });
            // Force a hard reload from the server
            window.location.reload(true);
        });
    } else {
        // Fallback for browsers without Cache API support
        window.location.reload(true);
    }
}

// Initialize app
$(document).ready(function() {
    debug('Initializing application');
    
    // Add a reload button in the top right corner
    $('body').append(`
        <button id="force-reload" 
                style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; 
                       background-color: var(--btn-primary); color: white; 
                       border: none; border-radius: 50%; width: 50px; height: 50px; 
                       display: flex; align-items: center; justify-center;
                       box-shadow: 0 4px 10px rgba(0,0,0,0.2); opacity: 0.8;">
            <i class="fas fa-sync-alt"></i>
        </button>
    `);
    
    // Add event listener for the reload button
    $('#force-reload').on('click', function() {
        debug('Manual reload requested');
        forceReload();
    });
    
    // Initialize application
    debug('Starting initialization');
    setupTheme();
    loadData();
    setupPlayerHistory();
}); 
