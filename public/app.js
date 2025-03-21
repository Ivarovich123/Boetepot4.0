// API Base URL - make sure this matches your backend setup
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// Debug setting
const DEBUG = true;
function debug(message) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
    }
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
            'background-color': '#111827',
            'border-color': '#374151',
            'color': 'white'
        });
        $('.select2-container--default .select2-selection--single .select2-selection__rendered').css('color', 'white');
    } else {
        $('.select2-container--default .select2-selection--single').css({
            'background-color': '#f8fafc',
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
        width: '100%'
    });
    
    // Update the theme for Select2
    updateSelect2Theme(document.documentElement.classList.contains('dark'));
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
    let abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);
    
    try {
        debug(`Fetching API: ${endpoint}`);
        toggleLoading(true);
        
        // Ensure endpoint starts with slash
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${API_BASE_URL}${path}`;
        
        debug(`Full URL: ${url}`);
        
        // Add default headers
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
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            debug(`Response is not JSON: ${contentType}`);
            
            // Try fallback URL
            debug('Trying fallback with direct URL format');
            return await tryFallbackApi(endpoint, options);
        }
        
        // Try to parse as JSON
        const data = await response.json();
        debug(`API response successful with ${typeof data}`);
        return data;
    } catch (error) {
        debug(`API Error: ${error.message}`);
        
        if (error.name === 'AbortError') {
            debug('Request timed out');
            showToast('De server reageert niet. Probeer het later opnieuw.', 'error');
            return getDefaultResponse(endpoint);
        }
        
        if (error.message.includes('Unexpected token')) {
            debug('JSON parse error - trying fallback');
            return await tryFallbackApi(endpoint, options);
        }
        
        // For other errors, try fallback
        debug('General error - trying fallback');
        return await tryFallbackApi(endpoint, options);
    } finally {
        clearTimeout(timeoutId);
        toggleLoading(false);
    }
}

// Try fallback API
async function tryFallbackApi(endpoint, options = {}) {
    try {
        debug("Trying fallback with absolute URL");
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // Try different URL formats
        const urls = [
            `${window.location.origin}/api${path}`,
            `https://boetepot.cloud/api${path}`
        ];
        
        debug(`Trying fallback URLs: ${urls.join(', ')}`);
        
        for (const fallbackUrl of urls) {
            try {
                debug(`Trying URL: ${fallbackUrl}`);
                
                const fallbackOptions = {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...options.headers
                    }
                };
                
                const fallbackResponse = await fetch(fallbackUrl, fallbackOptions);
                
                if (!fallbackResponse.ok) {
                    debug(`Fallback URL ${fallbackUrl} failed with ${fallbackResponse.status}`);
                    continue;
                }
                
                // Check content type
                const contentType = fallbackResponse.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    debug(`Fallback response is not JSON: ${contentType}`);
                    continue;
                }
                
                const fallbackData = await fallbackResponse.json();
                debug(`Fallback API successful with URL: ${fallbackUrl}`);
                return fallbackData;
            } catch (error) {
                debug(`Fallback attempt failed for ${fallbackUrl}: ${error.message}`);
            }
        }
        
        // If all fallbacks fail, return default empty data
        debug('All fallback attempts failed - returning default data');
        return getDefaultResponse(endpoint);
    } catch (error) {
        debug(`Fallback error: ${error.message}`);
        return getDefaultResponse(endpoint);
    }
}

// Get default response based on endpoint type
function getDefaultResponse(endpoint) {
    if (endpoint.includes('players')) return [];
    if (endpoint.includes('reasons')) return [];
    if (endpoint.includes('recent-fines')) return [];
    if (endpoint.includes('leaderboard')) return [];
    if (endpoint.includes('total-amount')) return { total: 0 };
    if (endpoint.match(/\/player\/[^/]+$/)) return { id: 0, name: 'Onbekend' };
    if (endpoint.match(/\/player-fines\/[^/]+$/)) return [];
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
        <div class="fine-card bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
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
        <div class="fine-card bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-sm transition-shadow">
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
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">Laatst bijgewerkt: ${formatDate(new Date())}</div>
        `);
    } catch (error) {
        debug(`Error loading total amount: ${error.message}`);
        $('#totalAmount').html(`
            <div class="text-5xl font-bold text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-8 py-4 mb-2 shadow-md">€0,00</div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">Fout bij het laden van data</div>
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
            <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
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
        
        const data = await fetchAPI(`/player-fines/${playerId}`);
        const player = await fetchAPI(`/player/${playerId}`);
        
        $('#playerHistoryName').text(player?.name || 'Onbekend');
        
        // Calculate total with proper error handling
        const total = Array.isArray(data) ? data.reduce((sum, fine) => {
            const amount = parseFloat(fine.amount);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0) : 0;
        
        $('#playerHistoryTotal').text(formatCurrency(total));
        
        if (!data || data.length === 0) {
            $('#playerHistoryFines').html('<div class="text-center py-4 text-gray-500 dark:text-gray-400">Geen boetes gevonden voor deze speler</div>');
        } else {
            const finesHtml = data.map(fine => createPlayerHistoryCard(fine)).join('');
            $('#playerHistoryFines').html(finesHtml);
        }
        
        $('#playerHistoryEmpty').addClass('hidden');
        $('#playerHistoryContent').removeClass('hidden');
        
        debug(`Loaded ${data ? data.length : 0} fines for player ${player?.name || 'unknown'}`);
    } catch (error) {
        debug(`Error loading player history: ${error.message}`);
        $('#playerHistoryContent').addClass('hidden');
        $('#playerHistoryEmpty').removeClass('hidden').html('<div class="text-center py-4 text-red-500">Er is een fout opgetreden bij het laden van de spelersgeschiedenis</div>');
    }
}

// Initialize
$(document).ready(function() {
    debug('Document ready');
    
    // Initialize the UI
    try {
        // Initialize Select2
        initializeSelect2();
        
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
