// API Base URL
const API_BASE_URL = '/api';

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

function formatCurrency(amount) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
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
            'background-color': 'white',
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
    toggleLoading(true);
    try {
        debug(`Fetching API: ${endpoint}`);
        // Ensure endpoint starts with a slash
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const response = await fetch(`${API_BASE_URL}${path}`, options);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        // Check if the response is valid JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Invalid response format: expected JSON but got ${contentType}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        debug(`API Error: ${error.message}`);
        showToast(`Er is een fout opgetreden: ${error.message}`, 'error');
        throw error;
    } finally {
        toggleLoading(false);
    }
}

// Create fine card
function createFineCard(fine) {
    return `
    <div class="fine-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-semibold text-blue-600 dark:text-blue-500">${fine.player_name}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${fine.reason_description}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${formatDate(fine.timestamp)}</p>
            </div>
            <div class="text-lg font-bold">${formatCurrency(fine.amount)}</div>
        </div>
    </div>
    `;
}

// Create player history card
function createPlayerHistoryCard(fine) {
    return `
    <div class="fine-card bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-sm transition-shadow">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-gray-600 dark:text-gray-300">${fine.reason_description}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${formatDate(fine.timestamp)}</p>
            </div>
            <div class="text-lg font-bold">${formatCurrency(fine.amount)}</div>
        </div>
    </div>
    `;
}

// Load total fines
async function loadTotalAmount() {
    try {
        debug('Loading total amount');
        const data = await fetchAPI('/total-amount');
        if (!$('#totalAmount').length) {
            debug('Error: Total amount element not found');
            return;
        }
        
        $('#totalAmount').html(`
            <div class="text-5xl font-bold text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-8 py-4 mb-2 animate-pulse-soft shadow-md">${formatCurrency(data.total)}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">Laatst bijgewerkt: ${formatDate(new Date())}</div>
        `);
    } catch (error) {
        debug(`Error loading total amount: ${error.message}`);
    }
}

// Load recent fines
async function loadRecentFines() {
    try {
        debug('Loading recent fines');
        const data = await fetchAPI('/recent-fines');
        if (!$('#recentFines').length) {
            debug('Error: Recent fines element not found');
            return;
        }
        
        if (data.length === 0) {
            $('#recentFines').html('<div class="text-center py-4 text-gray-500">Geen recente boetes gevonden</div>');
            return;
        }
        
        const finesHtml = data.map(fine => createFineCard(fine)).join('');
        $('#recentFines').html(finesHtml);
    } catch (error) {
        debug(`Error loading recent fines: ${error.message}`);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        debug('Loading leaderboard');
        const data = await fetchAPI('/leaderboard');
        if (!$('#leaderboard').length) {
            debug('Error: Leaderboard element not found');
            return;
        }
        
        if (data.length === 0) {
            $('#leaderboard').html('<div class="text-center py-4 text-gray-500">Geen spelers gevonden</div>');
            return;
        }
        
        const leaderboardHtml = data.map((player, index) => `
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center font-bold mr-3">
                            ${index + 1}
                        </div>
                        <div>
                            <h3 class="font-semibold">${player.name}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${player.count} boetes</p>
                        </div>
                    </div>
                    <div class="text-lg font-bold">${formatCurrency(player.total)}</div>
                </div>
            </div>
        `).join('');
        
        $('#leaderboard').html(leaderboardHtml);
    } catch (error) {
        debug(`Error loading leaderboard: ${error.message}`);
    }
}

// Load players for history dropdown
async function loadPlayers() {
    try {
        debug('Loading players for dropdown');
        const data = await fetchAPI('/players');
        if (!$('#playerSelect').length) {
            debug('Error: Player select element not found');
            return;
        }
        
        $('#playerSelect').empty().append('<option value="">Selecteer een speler</option>');
        
        data.forEach(player => {
            $('#playerSelect').append(`<option value="${player.id}">${player.name}</option>`);
        });
        
        debug('Player dropdown populated with ' + data.length + ' players');
    } catch (error) {
        debug(`Error loading players: ${error.message}`);
    }
}

// Load player history
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
        
        $('#playerHistoryName').text(player.name);
        
        // Calculate total
        const total = data.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);
        $('#playerHistoryTotal').text(formatCurrency(total));
        
        if (data.length === 0) {
            $('#playerHistoryFines').html('<div class="text-center py-4 text-gray-500">Geen boetes gevonden voor deze speler</div>');
        } else {
            const finesHtml = data.map(fine => createPlayerHistoryCard(fine)).join('');
            $('#playerHistoryFines').html(finesHtml);
        }
        
        $('#playerHistoryEmpty').addClass('hidden');
        $('#playerHistoryContent').removeClass('hidden');
        
        debug(`Loaded ${data.length} fines for player ${player.name}`);
    } catch (error) {
        debug(`Error loading player history: ${error.message}`);
        $('#playerHistoryContent').addClass('hidden');
        $('#playerHistoryEmpty').removeClass('hidden').text('Er is een fout opgetreden bij het laden van de spelersgeschiedenis');
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
