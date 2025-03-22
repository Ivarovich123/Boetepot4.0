// API Base URL - make sure this matches your backend setup
const API_BASE_URL = '/api';  // Use relative path to avoid CORS issues
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
const SERVER_URL = 'https://www.boetepot.cloud';

// Debug setting
const DEBUG = true;
function debug(message) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
    }
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
function toggleLoading(isLoading) {
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
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
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
}

// Fix the theme toggle setup
$(document).ready(function() {
    // Initialize theme based on saved preference or system preference
    const isDarkSaved = localStorage.theme === 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDarkSaved || (!localStorage.theme && prefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Add click handler for theme toggle button
    $('#theme-toggle').on('click', function() {
        toggleTheme();
    });
    
    // Update the theme icon
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
async function fetchAPI(endpoint, options = {}) {
    let abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 15000);
    
    try {
        debug(`Fetching API: ${endpoint}`);
        toggleLoading(true);
        
        // Ensure endpoint starts with slash
        const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        
        // Try different URL formats
        const urls = [
            `${API_BASE_URL}/${path}`,
            `${window.location.origin}/api/${path}`
        ];
        
        debug(`Trying URLs: ${urls.join(', ')}`);
        
        let lastError = null;
        
        // Try each URL until one works
        for (const url of urls) {
            try {
                debug(`Trying URL: ${url}`);
                
                const fetchOptions = {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        ...options.headers
                    },
                    mode: 'cors',
                    credentials: 'omit',
                    signal: abortController.signal
                };
                
                const response = await fetch(url, fetchOptions);
                
                if (!response.ok) {
                    debug(`URL ${url} failed with ${response.status}`);
                    lastError = new Error(`API Error: ${response.status} ${response.statusText}`);
                    continue;
                }
                
                // Check content type
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    debug(`Response from ${url} is not JSON: ${contentType}`);
                    lastError = new Error('Response is not JSON');
                    continue;
                }
                
                // Try to parse as JSON
                const data = await response.json();
                debug(`API response successful with ${typeof data} from ${url}`);
                return data;
            } catch (error) {
                debug(`Error for ${url}: ${error.message}`);
                lastError = error;
            }
        }
        
        // If all URLs failed, throw the last error
        throw lastError || new Error('All API endpoints failed');
    } catch (error) {
        debug(`API Error: ${error.message}`);
        
        if (error.name === 'AbortError') {
            debug('Request timed out');
            showToast('De server reageert niet. Probeer het later opnieuw.', 'error');
        } else {
            debug(`General API error: ${error.message}`);
            showToast(`API fout: ${error.message}`, 'error');
        }
        
        // Return empty data instead of mock data
        if (endpoint.includes('total-amount')) {
            return { total: 0 };
        } else if (endpoint.includes('players')) {
            return [];
        } else {
            return [];
        }
    } finally {
        clearTimeout(timeoutId);
        toggleLoading(false);
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
        const data = await fetchAPI('/total-amount');
        if (!$('#totalAmount').length) {
            debug('Error: Total amount element not found');
            return;
        }
        
        const total = data && typeof data.total === 'number' ? data.total : 0;
        
        $('#totalAmount').html(`
            <div class="text-5xl font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-2xl px-8 py-4 mb-2 shadow-md">${formatCurrency(total)}</div>
        `);
  } catch (error) {
        debug(`Error loading total amount: ${error.message}`);
        $('#totalAmount').html(`
            <div class="text-5xl font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-2xl px-8 py-4 mb-2 shadow-md">€0,00</div>
        `);
    }
}

// Load recent fines - improved error handling
async function loadRecentFines() {
  try {
        debug('Loading recent fines');
        const data = await fetchAPI('/recent-fines');
        if (!$('#recentFines').length) {
            debug('Error: Recent fines element not found');
      return;
    }
    
        if (!data || data.length === 0) {
            $('#recentFines').html('<div class="text-center py-4 text-gray-500 dark:text-gray-400">Geen recente boetes gevonden</div>');
      return;
    }
    
        const finesHtml = data.map(fine => createFineCard(fine)).join('');
        $('#recentFines').html(finesHtml);
  } catch (error) {
        debug(`Error loading recent fines: ${error.message}`);
        $('#recentFines').html('<div class="text-center py-4 text-red-500">Er is een fout opgetreden bij het laden van recente boetes</div>');
  }
}

// Load leaderboard - improved error handling
async function loadLeaderboard() {
  try {
        debug('Loading leaderboard');
        const data = await fetchAPI('/leaderboard');
        if (!$('#leaderboard').length) {
            debug('Error: Leaderboard element not found');
      return;
    }
    
        if (!data || data.length === 0) {
            $('#leaderboard').html('<div class="text-center py-4 text-gray-500 dark:text-gray-400">Geen spelers gevonden</div>');
      return;
    }
    
        const leaderboardHtml = data.map((player, index) => `
            <div class="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold mr-3">
                            ${index + 1}
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 dark:text-gray-200">${player.name || 'Onbekend'}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${player.fineCount || 0} boetes</p>
                        </div>
                    </div>
                    <div class="text-lg font-bold text-gray-800 dark:text-gray-100">${formatCurrency(player.totalFined || 0)}</div>
                </div>
            </div>
    `).join('');
    
        $('#leaderboard').html(leaderboardHtml);
    } catch (error) {
        debug(`Error loading leaderboard: ${error.message}`);
        $('#leaderboard').html('<div class="text-center py-4 text-red-500 dark:text-red-400">Er is een fout opgetreden bij het laden van het leaderboard</div>');
    }
}

// Load players for history dropdown - improved error handling
async function loadPlayers() {
    try {
        debug('Loading players for dropdown');
        const data = await fetchAPI('/players');
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
        debug(`Loading history for player ID: ${playerId}`);
        
        if (!playerId) {
            debug('No player selected, hiding player history content');
            $('#playerHistoryContent').addClass('hidden');
            $('#playerHistoryEmpty').removeClass('hidden');
      return;
    }
    
        debug(`Fetching player ${playerId} and their fines`);
        
        const [playerData, finesData] = await Promise.all([
            fetchAPI(`/player/${playerId}`),
            fetchAPI(`/player-fines/${playerId}`)
        ]);
        
        debug(`Player data: ${JSON.stringify(playerData)}`);
        debug(`Fines data: ${JSON.stringify(finesData)}`);
        
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
    // Initialize the UI
    try {
        debug('Document ready');
        
        // Setup theme
        setupTheme();
        
        // Setup player history
        setupPlayerHistory();
        
        // Load data
        loadData();
        
        // Setup other actions
        setupActions();
        
        debug('Initialization complete');
    } catch (error) {
        debug(`Initialization error: ${error.message}`);
        showToast('Er is een fout opgetreden bij het initialiseren van de pagina', 'error');
    }
});

// Helper function to fix player data references
function setupPlayerHistory() {
    try {
        // Initialize the player history select
        const players = getLocalData('players') || [];
        
        // Clear and populate the select dropdown
        const playerSelect = $('#playerHistorySelect');
        playerSelect.empty();
        
        // Add a default option
        playerSelect.append('<option value="">Selecteer een speler</option>');
        
        // Add player options
        players.forEach(player => {
            playerSelect.append(`<option value="${player.id}">${player.name}</option>`);
        });
    
    // Initialize Select2
        initializeSelect2();
        
        // Handle player selection change
        $('#playerHistorySelect').on('change', function() {
      const playerId = $(this).val();
      if (playerId) {
        loadPlayerHistory(playerId);
      } else {
                // Clear the history section
                $('#playerHistory').empty();
            }
        });
        
        console.log('[DEBUG] Player history setup completed');
  } catch (error) {
        console.error('[DEBUG] Error setting up player history:', error);
    }
}

// Helper function to set up default player data
function setupDefaultData() {
    try {
        console.log('[DEBUG] Setting up default data');
        
        // Clear existing data
        localStorage.removeItem('players');
        localStorage.removeItem('reasons');
        localStorage.removeItem('fines');
        
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
        
        // Save to localStorage
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('reasons', JSON.stringify(reasons));
        localStorage.setItem('fines', JSON.stringify(fines));
        localStorage.setItem('useLocalData', 'true');
        
        console.log('[DEBUG] Default data setup completed');
        
        // Show success message
        showToast('Standaard gegevens zijn geladen', 'success');
        
        // Force immediate reload of data
        loadData();
        setupPlayerHistory();
        
        // Reload the page after a short delay to ensure everything is refreshed
        setTimeout(() => {
            location.reload();
        }, 500);
        
        return true;
    } catch (error) {
        console.error('[DEBUG] Error setting up default data:', error);
        showToast('Fout bij het laden van standaard gegevens', 'error');
        return false;
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
    // Get the theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Update the initial icon based on current theme
        const isDark = document.documentElement.classList.contains('dark');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            if (isDark) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }
        
        // Add click event listener to toggle theme
        themeToggle.addEventListener('click', toggleTheme);
    }
} 
