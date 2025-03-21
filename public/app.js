// API Base URL - make sure this matches your backend setup
// Try the direct API endpoint first, or use a proxy if needed
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
const SERVER_URL = 'https://boetepot.cloud';

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
function setTheme(isDark) {
    debug(`Setting theme to ${isDark ? 'dark' : 'light'}`);
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
        
        // Additional dark mode fixes for containers and backgrounds
        $('.bg-white').addClass('bg-gray-900').removeClass('bg-white');
        $('.border-gray-200').addClass('border-gray-700').removeClass('border-gray-200');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
        
        // Revert dark mode changes
        $('.bg-gray-900').addClass('bg-white').removeClass('bg-gray-900');
        $('.border-gray-700').addClass('border-gray-200').removeClass('border-gray-700');
    }
    
    // Update Select2 dropdowns theme
    updateSelect2Theme(isDark);
}

function updateSelect2Theme(isDark) {
    // Update the select2 theme to match the current theme
    $('.select2-container--default .select2-selection--single').css({
        'background-color': isDark ? 'rgb(31, 41, 55)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)',
        'color': isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)'
    });
    
    $('.select2-container--default .select2-selection--single .select2-selection__rendered').css({
        'color': isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)'
    });
    
    $('.select2-container--default .select2-dropdown').css({
        'background-color': isDark ? 'rgb(31, 41, 55)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)',
        'color': isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)'
    });
    
    $('.select2-container--default .select2-results__option').css({
        'color': isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)'
    });
    
    $('.select2-container--default .select2-search__field').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'color': isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)'
    });
    
    // Fix for Select2 dropdown options when highlighted/selected
    $('.select2-container--default .select2-results__option--highlighted').css({
        'background-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)',
        'color': isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)'
    });
    
    $('.select2-container--default .select2-results__option[aria-selected=true]').css({
        'background-color': isDark ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)'
    });
    
    // Ensure dropdowns appear above other elements
    $('.select2-dropdown').css('z-index', '9999');
    $('.select2-container').css('z-index', '1051');
}

// Initialize theme
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
} else {
    setTheme(false);
}

$('#theme-toggle').click(() => {
    setTheme(!document.documentElement.classList.contains('dark'));
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
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // First try to get data from localStorage/admin panel
        const useLocalData = localStorage.getItem('useLocalData') === 'true';
        if (useLocalData) {
            debug('Using local data from admin panel');
            const localData = getFallbackData();
            
            // Normalize property names for endpoints
            if (endpoint.includes('total-amount')) {
                return { total: localData.totalAmount };
            } else if (endpoint.includes('recent-fines')) {
                debug(`Returning ${localData.recentFines.length} recent fines from local data`);
                return localData.recentFines;
            } else if (endpoint.includes('leaderboard')) {
                debug(`Returning ${localData.leaderboard.length} leaderboard entries from local data`);
                return localData.leaderboard;
            } else if (endpoint.includes('players') && !endpoint.includes('player-fines')) {
                debug(`Returning ${localData.players.length} players from local data`);
                return localData.players;
            } else if (endpoint.includes('reasons')) {
                debug(`Returning ${localData.reasons.length} reasons from local data`);
                return localData.reasons;
            } else if (endpoint.includes('player-fines')) {
                const playerId = parseInt(endpoint.split('/').pop(), 10);
                const playerFines = localData.playerFinesHistory[playerId] || [];
                debug(`Returning ${playerFines.length} fines for player ${playerId} from local data`);
                return playerFines;
            } else if (endpoint.includes('player/')) {
                const playerId = parseInt(endpoint.split('/').pop(), 10);
                const player = localData.players.find(player => player.id === playerId) || { id: 0, name: 'Onbekend' };
                debug(`Returning player ${player.name} (${player.id}) from local data`);
                return player;
            } else if (endpoint.includes('fines')) {
                const allFines = Object.values(localData.playerFinesHistory).flat();
                debug(`Returning ${allFines.length} total fines from local data`);
                return allFines;
            }
            
            debug(`No specific handler for endpoint ${endpoint}, returning empty array`);
            return [];
        }
        
        // Try different URL formats
        const urls = [
            `${API_BASE_URL}${path}`,
            `${window.location.origin}/api${path}`,
            `${SERVER_URL}/api${path}`,
            `https://www.${SERVER_URL.replace('https://', '')}/api${path}`
        ];
        
        debug(`Trying URLs: ${urls[0]}, ${urls[1]}, ...`);
        
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
                        ...options.headers
                    },
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
        
        // If all URLs failed, fall back to local data
        localStorage.setItem('useLocalData', 'true');
        return getDefaultResponse(endpoint);
    } catch (error) {
        debug(`API Error: ${error.message}`);
        
        if (error.name === 'AbortError') {
            debug('Request timed out');
            showToast('De server reageert niet. Probeer het later opnieuw.', 'error');
        } else {
            debug(`General API error: ${error.message}`);
        }
        
        // Set to use local data on failure
        localStorage.setItem('useLocalData', 'true');
        return getDefaultResponse(endpoint);
    } finally {
        clearTimeout(timeoutId);
        toggleLoading(false);
    }
}

// Get default response based on endpoint type
function getDefaultResponse(endpoint) {
    try {
        const useLocalData = localStorage.getItem('useLocalData') === 'true';
        if (useLocalData) {
            debug(`Getting default response for ${endpoint} from local data`);
            const localData = getFallbackData();
            
            // Normalize property names for endpoints
            if (endpoint.includes('total-amount')) {
                return { total: localData.totalAmount };
            } else if (endpoint.includes('recent-fines')) {
                return localData.recentFines;
            } else if (endpoint.includes('leaderboard')) {
                return localData.leaderboard;
            } else if (endpoint.includes('players')) {
                return localData.players;
            } else if (endpoint.includes('reasons')) {
                return localData.reasons;
            } else if (endpoint.includes('player-fines')) {
                const playerId = parseInt(endpoint.split('/').pop(), 10);
                return localData.playerFinesHistory[playerId] || [];
            } else if (endpoint.includes('player/')) {
                const playerId = parseInt(endpoint.split('/').pop(), 10);
                return localData.players.find(player => player.id === playerId) || { id: 0, name: 'Onbekend' };
            } else if (endpoint.includes('fines')) {
                return Object.values(localData.playerFinesHistory).flat();
            }
        }
        
        // Default empty response
        return [];
    } catch (error) {
        debug(`Error in getDefaultResponse: ${error.message}`);
        return [];
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

// Add Debug UI Control
function setupDebugControls() {
    // Add a hidden debug control (activate with Alt+D)
    $(document).keydown(function(e) {
        if (e.altKey && e.key === 'd') {
            const currentSetting = localStorage.getItem('useLocalData') === 'true';
            localStorage.setItem('useLocalData', (!currentSetting).toString());
            showToast(`Lokale data ${!currentSetting ? 'ingeschakeld' : 'uitgeschakeld'}`, 'info');
            setTimeout(() => location.reload(), 1000);
        }
    });
}

// Auto-initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded event fired');
    initializeApp();
});

// Initialize the application
function initializeApp() {
    console.log('[DEBUG] Initializing app...');
    
    try {
        // Initialize UI components
        setupTheme();
        setupPlayerHistory();
        
        // Set up default data if needed and UI actions
        setupActions();
        
        // Try to load data
        console.log('[DEBUG] Attempting to load data automatically...');
        loadData();
        
        console.log('[DEBUG] App initialized successfully');
    } catch (error) {
        console.error('[DEBUG] Error initializing app:', error);
    }
}

// Initialize
$(document).ready(function() {
    debug('Document ready');
    
    // Initialize the UI
    try {
        // Check and fix dark mode first
        const prefersDark = localStorage.theme === 'dark' || 
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setTheme(prefersDark);
        
        // Enable local data by default
        localStorage.setItem('useLocalData', 'true');
        
        // Initialize Select2
        initializeSelect2();
        
        // Setup debug controls
        setupDebugControls();
        
        // Load data
        loadTotalAmount();
        loadRecentFines();
        loadLeaderboard();
        loadPlayers();
        
        // Set up player history dropdown change event
        $('#playerSelect').on('change', function() {
            const playerId = $(this).val();
            debug(`Player selection changed to: ${playerId}`);
            loadPlayerHistory(playerId);
        });
        
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

// Add function to setup theme
function setupTheme() {
    // Check and fix dark mode
    const prefersDark = localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(prefersDark);
    
    // Setup theme toggle
    $('#theme-toggle').click(() => {
        setTheme(!document.documentElement.classList.contains('dark'));
    });
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
