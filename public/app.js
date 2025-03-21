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

// Sync with localStorage data from admin panel
function getLocalData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        debug(`Error getting ${key} from localStorage: ${e.message}`);
        return defaultValue;
    }
}

// Get dynamic fallback data from localStorage (used by admin panel)
function getFallbackData() {
    const players = getLocalData('players', []);
    const reasons = getLocalData('reasons', []);
    const fines = getLocalData('fines', []);
    
    // Calculate total amount
    const totalAmount = fines.reduce((sum, fine) => {
        return sum + (parseFloat(fine.amount) || 0);
    }, 0);
    
    // Calculate leaderboard
    const leaderboardMap = {};
    fines.forEach(fine => {
        const playerId = fine.player_id;
        if (!leaderboardMap[playerId]) {
            const player = players.find(p => p.id === playerId) || { name: 'Onbekend' };
            leaderboardMap[playerId] = {
                id: playerId,
                name: player.name,
                count: 0,
                total: 0
            };
        }
        leaderboardMap[playerId].count += 1;
        leaderboardMap[playerId].total += (parseFloat(fine.amount) || 0);
    });
    
    // Convert leaderboard to array and sort by total
    const leaderboard = Object.values(leaderboardMap).sort((a, b) => b.total - a.total);
    
    // Prepare enhanced fines with player and reason info
    const enhancedFines = fines.map(fine => {
        const player = players.find(p => p.id === fine.player_id) || { name: 'Onbekend' };
        const reason = reasons.find(r => r.id === fine.reason_id) || { description: 'Onbekend' };
        return {
            ...fine,
            player_name: player.name,
            reason_description: reason.description
        };
    });
    
    // Sort fines by timestamp descending
    const recentFines = [...enhancedFines].sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB - dateA;
    }).slice(0, 10); // Get 10 most recent
    
    return {
        total_amount: { total: totalAmount },
        players: players,
        reasons: reasons,
        recent_fines: recentFines,
        leaderboard: leaderboard,
        all_fines: enhancedFines
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
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    }
    
    // Update Select2 dropdowns theme
    updateSelect2Theme(isDark);
}

function updateSelect2Theme(isDark) {
    debug('Updating Select2 theme');
    // Update dropdown
    if (isDark) {
        $('.select2-container--default .select2-selection--single').css({
            'background-color': '#1f2937',
            'border-color': '#374151',
            'color': 'white'
        });
        $('.select2-container--default .select2-selection--single .select2-selection__rendered').css('color', 'white');
    } else {
        $('.select2-container--default .select2-selection--single').css({
            'background-color': '#f0f2f5',
            'border-color': '#D1D5DB',
            'color': 'black'
        });
        $('.select2-container--default .select2-selection--single .select2-selection__rendered').css('color', 'black');
    }
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

// Initialize Select2
function initializeSelect2() {
    debug('Initializing Select2');
    
    // Initialize player select for history
    $('#playerSelect').select2({
        placeholder: 'Selecteer een speler',
        allowClear: true,
        width: '100%',
        dropdownParent: $('body') // Fix for mobile
    });
    
    // Update the theme for Select2
    updateSelect2Theme(document.documentElement.classList.contains('dark'));
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
            
            // Handle specific endpoints
            if (endpoint.includes('total-amount')) {
                return localData.total_amount;
            } else if (endpoint.includes('recent-fines')) {
                return localData.recent_fines;
            } else if (endpoint.includes('leaderboard')) {
                return localData.leaderboard;
            } else if (endpoint.includes('players') && !endpoint.includes('player-fines')) {
                return localData.players;
            } else if (endpoint.includes('reasons')) {
                return localData.reasons;
            } else if (endpoint.includes('player-fines')) {
                const playerId = parseInt(endpoint.split('/').pop(), 10);
                return localData.all_fines.filter(fine => fine.player_id === playerId);
            } else if (endpoint.includes('player/')) {
                const playerId = parseInt(endpoint.split('/').pop(), 10);
                return localData.players.find(player => player.id === playerId) || { id: 0, name: 'Onbekend' };
            } else if (endpoint.includes('fines')) {
                return localData.all_fines;
            }
            
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
    debug(`Getting default response for ${endpoint}`);
    
    // Use local data from admin panel
    const localData = getFallbackData();
    
    // Handle specific endpoints
    if (endpoint.includes('total-amount')) {
        return localData.total_amount;
    } else if (endpoint.includes('recent-fines')) {
        return localData.recent_fines;
    } else if (endpoint.includes('leaderboard')) {
        return localData.leaderboard;
    } else if (endpoint.includes('players') && !endpoint.includes('player-fines')) {
        return localData.players;
    } else if (endpoint.includes('reasons')) {
        return localData.reasons;
    } else if (endpoint.includes('player-fines')) {
        const playerId = parseInt(endpoint.split('/').pop(), 10);
        return localData.all_fines.filter(fine => fine.player_id === playerId);
    } else if (endpoint.includes('player/')) {
        const playerId = parseInt(endpoint.split('/').pop(), 10);
        return localData.players.find(player => player.id === playerId) || { id: 0, name: 'Onbekend' };
    } else if (endpoint.includes('fines')) {
        return localData.all_fines;
    }
    
    return null;
}

// Create fine card - fixed dark mode
function createFineCard(fine) {
    try {
        const playerName = fine.player_name || 'Onbekend';
        const reasonDesc = fine.reason_description || 'Onbekend';
        const formattedDate = formatDate(fine.timestamp || fine.date);
        const amount = formatCurrency(parseFloat(fine.amount) || 0);
        
        return `
        <div class="fine-card bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-blue-600 dark:text-blue-500">${playerName}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${reasonDesc}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${formattedDate}</p>
                </div>
                <div class="text-lg font-bold">${amount}</div>
            </div>
        </div>
        `;
    } catch (error) {
        debug(`Error creating fine card: ${error.message}`);
        return `<div class="bg-red-100 dark:bg-red-900/20 p-4 rounded-xl text-red-600 dark:text-red-400">Error displaying fine</div>`;
    }
}

// Create player history card - fixed dark mode
function createPlayerHistoryCard(fine) {
    try {
        const reasonDesc = fine.reason_description || 'Onbekend';
        const formattedDate = formatDate(fine.timestamp || fine.date);
        const amount = formatCurrency(parseFloat(fine.amount) || 0);
        
        return `
        <div class="fine-card bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-gray-600 dark:text-gray-300">${reasonDesc}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${formattedDate}</p>
                </div>
                <div class="text-lg font-bold">${amount}</div>
            </div>
        </div>
        `;
    } catch (error) {
        debug(`Error creating player history card: ${error.message}`);
        return `<div class="bg-red-100 dark:bg-red-900/20 p-4 rounded-xl text-red-600 dark:text-red-400">Error displaying fine</div>`;
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
            <div class="text-5xl font-bold text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-8 py-4 mb-2 shadow-md">${formatCurrency(total)}</div>
        `);
    } catch (error) {
        debug(`Error loading total amount: ${error.message}`);
        $('#totalAmount').html(`
            <div class="text-5xl font-bold text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-8 py-4 mb-2 shadow-md">€0,00</div>
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
                        <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center font-bold mr-3">
                            ${index + 1}
                        </div>
                        <div>
                            <h3 class="font-semibold">${player.name || 'Onbekend'}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${player.count || 0} boetes</p>
                        </div>
                    </div>
                    <div class="text-lg font-bold">${formatCurrency(player.total || 0)}</div>
                </div>
            </div>
        `).join('');
        
        $('#leaderboard').html(leaderboardHtml);
    } catch (error) {
        debug(`Error loading leaderboard: ${error.message}`);
        $('#leaderboard').html('<div class="text-center py-4 text-red-500">Er is een fout opgetreden bij het laden van het leaderboard</div>');
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
        
        const [playerData, finesData] = await Promise.all([
            fetchAPI(`/player/${playerId}`),
            fetchAPI(`/player-fines/${playerId}`)
        ]);
        
        debug(`Player data: ${JSON.stringify(playerData)}`);
        debug(`Fines data: ${JSON.stringify(finesData)}`);
        
        $('#playerHistoryName').text(playerData?.name || 'Onbekend');
        
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

// Initialize
$(document).ready(function() {
    debug('Document ready');
    
    // Initialize the UI
    try {
        // Initialize Select2
        initializeSelect2();
        
        // Setup debug controls
        setupDebugControls();
        
        // Enable local data by default for first load
        localStorage.setItem('useLocalData', 'true');
        
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
