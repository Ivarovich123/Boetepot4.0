// API Base URL
const API_BASE_URL = '/api';

// Check if we need to adjust the API base URL
const checkApiUrl = () => {
    // If we're not running from the root path, adjust the API URL
    const path = window.location.pathname;
    if (path !== '/' && !path.includes('/admin.html')) {
        debug(`Not running from root path. Current path: ${path}`);
        // We're likely running from a subdirectory or different domain
        debug(`Setting API fallback URL to absolute path`);
        return true; // Use absolute URL
    }
    return false; // Use relative URL
};

// Flag to decide if we should use absolute URLs
const useAbsoluteUrl = checkApiUrl();

// Debug setting
const DEBUG = true;
function debug(message) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
    }
}

// Theme handling
function setTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    }
    
    // Update Select2 dropdowns
    updateSelect2Theme(isDark);
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

// Tab functionality
function switchTab(tabId) {
    console.log(`[DEBUG] Switching to tab: ${tabId}`);
    
    // Validate tab ID
    if (tabId !== 'boetes' && tabId !== 'beheer') {
        console.error(`[DEBUG] Invalid tab ID: ${tabId}, defaulting to 'boetes'`);
        tabId = 'boetes';
    }
    
    // Store active tab in localStorage
    localStorage.setItem('activeAdminTab', tabId);
    
    // Check current visibility before change
    console.log(`[DEBUG] Before tab switch: boetes=${$('#content-boetes').is(':visible')}, beheer=${$('#content-beheer').is(':visible')}`);
    
    // Set display directly with CSS instead of using addClass/removeClass for hidden
    if (tabId === 'boetes') {
        $('#content-boetes').css('display', 'block');
        $('#content-beheer').css('display', 'none');
    } else {
        $('#content-boetes').css('display', 'none');
        $('#content-beheer').css('display', 'block');
    }
    
    // Update tab styling
    $('#tab-boetes, #tab-beheer').removeClass('tab-active');
    $(`#tab-${tabId}`).addClass('tab-active');
    
    // Check visibility after change
    console.log(`[DEBUG] After tab switch: boetes=${$('#content-boetes').is(':visible')}, beheer=${$('#content-beheer').is(':visible')}`);
    console.log(`[DEBUG] Element CSS - boetes: ${$('#content-boetes').css('display')}, beheer: ${$('#content-beheer').css('display')}`);
    
    // Force DOM update
    setTimeout(() => {
        console.log(`[DEBUG] Forcing reflow...`);
        $('#content-boetes, #content-beheer').each(function() {
            // Force a reflow
            void this.offsetHeight;
        });
        
        // Re-initialize Select2 after tab switch
        console.log(`[DEBUG] Reinitializing Select2 after tab switch to ${tabId}`);
        initializeSelect2();
        
        // Refresh display of visible elements
        if (tabId === 'boetes') {
            console.log(`[DEBUG] Refreshing fine displays`);
            $('#playerSelect, #reasonSelect, #recentFines, #fineSelect').trigger('update');
        } else {
            console.log(`[DEBUG] Refreshing management displays`);
            $('#playerName, #reasonDescription').trigger('update');
        }
    }, 100);
}

// Format currency
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn('Invalid amount:', amount);
        return '€0,00';
    }
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Onbekend';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
        return new Intl.DateTimeFormat('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ongeldige datum';
  }
}

// Show/hide loading spinner
function toggleLoading(show) {
    console.log(`[DEBUG] ${show ? 'Showing' : 'Hiding'} loading spinner`);
    if (show) {
        $('#loadingSpinner').removeClass('hidden').addClass('flex');
    } else {
        $('#loadingSpinner').removeClass('flex').addClass('hidden');
    }
    console.log(`[DEBUG] Loading spinner classes:`, $('#loadingSpinner').attr('class'));
}

// Show toast message
function showToast(message, type = 'success') {
    const toast = $(`
        <div class="flex items-center p-4 mb-4 rounded-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
    `).hide();
    
    $('#toastContainer').append(toast);
    toast.fadeIn();
    
    setTimeout(() => {
        toast.fadeOut(() => toast.remove());
    }, 3000);
}

// Create a card for a fine
function createFineCard(fine, canDelete = true) {
    if (!fine) {
        console.error('[DEBUG] createFineCard called with null or undefined fine');
        return '';
    }
    
    console.log('[DEBUG] Creating fine card for:', fine);
    
    try {
        const formattedAmount = formatCurrency(fine.amount);
        const playerName = fine.player_name || 'Onbekend';
        const reasonDesc = fine.reason_description || 'Onbekend';
        const formattedDate = formatDate(fine.date);
        
        console.log('[DEBUG] Fine card values:', {
            player: playerName,
            reason: reasonDesc,
            amount: formattedAmount,
            date: formattedDate
        });
        
        let deleteButton = '';
        if (canDelete) {
            deleteButton = `
                <button class="delete-fine-btn absolute top-2 right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors" 
                        data-id="${fine.id}" data-name="${playerName}" aria-label="Verwijder boete">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        
        return `
            <div class="fine-card bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 relative ${canDelete ? 'pr-12' : ''}">
                ${deleteButton}
                <div class="flex items-center justify-between">
                    <div class="font-semibold">${playerName}</div>
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formattedAmount}</div>
                </div>
                <div class="text-gray-600 dark:text-gray-400">${reasonDesc}</div>
                <div class="text-sm text-gray-500 dark:text-gray-500">${formattedDate}</div>
            </div>
        `;
    } catch (error) {
        console.error('[DEBUG] Error in createFineCard:', error, 'for fine:', fine);
        return `
            <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-red-600 dark:text-red-400">
                Er is een fout opgetreden bij het weergeven van deze boete
            </div>
        `;
    }
}

// Force Select2 visibility
function forceSelect2Visibility() {
    console.log('[DEBUG] Forcing Select2 visibility');
    
    // Force display style
    $('.select2-container').each(function() {
        const $this = $(this);
        const display = $this.css('display');
        
        if (display === 'none') {
            console.warn('[DEBUG] Found hidden Select2 container, forcing display');
            $this.css('display', 'block');
        }
        
        // Ensure proper z-index
        if (parseInt($this.css('z-index')) < 1000) {
            $this.css('z-index', '1000');
        }
        
        // Force proper positioning
        const position = $this.css('position');
        if (position !== 'absolute' && position !== 'relative') {
            $this.css('position', 'relative');
        }
    });
    
    // Force visibility of dropdowns when open
    $(document).on('select2:open', function() {
        setTimeout(() => {
            $('.select2-dropdown').css({
                'display': 'block',
                'z-index': '9999'
            });
        }, 10);
    });
}

// Initialize Select2
function initializeSelect2() {
    console.log('[DEBUG] Inside initializeSelect2 function');
    
    // Clean up existing instances
    console.log('[DEBUG] Removing existing Select2 containers...');
    $('.select2-container').remove();
    
    try {
        // Initialize player select
        console.log('[DEBUG] Initializing playerSelect...');
        $('#playerSelect').select2({
            theme: 'default',
            placeholder: 'Selecteer een speler',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#playerSelect').parent()
        });
        console.log('[DEBUG] playerSelect initialized');
        
        // Initialize reason select
        console.log('[DEBUG] Initializing reasonSelect...');
        $('#reasonSelect').select2({
            theme: 'default',
            placeholder: 'Selecteer een reden',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#reasonSelect').parent(),
            tags: true,
            createTag: function(params) {
                return {
                    id: params.term,
                    text: params.term,
                    newTag: true
                };
            }
        });
        console.log('[DEBUG] reasonSelect initialized');
        
        // Force display update
        setTimeout(() => {
            console.log('[DEBUG] Forcing display refresh...');
            $('.select2').css('width', '100%').trigger('change');
            
            // Force Select2 visibility
            forceSelect2Visibility();
        }, 50);
        
        console.log('[DEBUG] Select2 initialization successful');
    } catch (error) {
        console.error('[DEBUG] Error in initializeSelect2:', error);
    }
}

// Update Select2 theme
function updateSelect2Theme(isDark) {
    $('.select2-container--default .select2-selection--single').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)',
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--default .select2-selection--single .select2-selection__rendered').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--default .select2-dropdown').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)'
    });
    
    $('.select2-container--default .select2-results__option').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--default .select2-search__field').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'color': isDark ? 'white' : 'inherit'
    });
}

// Fetch API with improved error handling
const fetchAPI = async (endpoint, options = {}) => {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = useAbsoluteUrl 
        ? `${window.location.origin}${API_BASE_URL}${path}`
        : `${API_BASE_URL}${path}`;
    
    debug(`Fetching API: ${url} with options:`, options);
    toggleLoading(true);
    
    try {
        const headers = options.headers || {};
        const fetchOptions = {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...headers
            }
        };
        
        const timeout = setTimeout(() => {
            debug('API request timeout');
            toggleLoading(false);
        }, 10000);
        
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeout);
        
        if (!response.ok) {
            debug(`API error: ${response.status} ${response.statusText}`);
            toggleLoading(false);
            return null;
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            debug(`Received non-JSON response: ${contentType}`);
            
            // Try again with an absolute URL if we're not already using one
            if (!useAbsoluteUrl) {
                debug('Retrying with absolute URL');
                const absoluteUrl = `${window.location.origin}${API_BASE_URL}${path}`;
                debug(`Retrying fetch with absolute URL: ${absoluteUrl}`);
                
                const retryResponse = await fetch(absoluteUrl, fetchOptions);
                if (!retryResponse.ok) {
                    debug(`Retry failed: ${retryResponse.status} ${retryResponse.statusText}`);
                    toggleLoading(false);
                    return null;
                }
                
                try {
                    const retryData = await retryResponse.json();
                    toggleLoading(false);
                    return retryData;
                } catch (error) {
                    debug('Error parsing JSON from retry response:', error);
                    toggleLoading(false);
                    return null;
                }
            }
            
            toggleLoading(false);
            
            // Return empty values based on endpoint to prevent failures
            if (path.includes('/players')) return [];
            if (path.includes('/reasons')) return [];
            if (path.includes('/recent-fines')) return [];
            if (path.includes('/leaderboard')) return [];
            if (path.includes('/total-amount')) return 0;
            if (path.match(/\/players\/[^/]+$/)) {
                return { id: 0, name: 'Error Loading Player' };
            }
            
            return null;
        }
        
        const data = await response.json();
        debug(`API response:`, data);
        toggleLoading(false);
        return data;
    } catch (error) {
        debug('API fetch error:', error);
        toggleLoading(false);
        return null;
    }
};

// Load data
async function loadData() {
    try {
        debug('Start loading all data...');
        
        // Load players and reasons for dropdowns
        await loadPlayers();
        await loadReasons();
        
        // Set up select2 for both dropdowns
        initializeSelect2();
        
        // Load recent fines
        await loadRecentFines();
        
        debug('All data loaded successfully');
        $('#debugStatus').text('Data loaded successfully');
    } catch (error) {
        debug(`Error loading data: ${error.message}`);
        $('#debugStatus').text(`Error: ${error.message}`);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
    }
}

// Add better debug support to loadPlayers function
async function loadPlayers() {
    try {
        debug('Loading players for select...');
        const data = await fetchAPI('players');
        
        if (!$('#playerSelect').length) {
            debug('Error: Player select element not found');
            return;
        }
        
        debug(`Received ${data.length} players from API`);
        
        $('#playerSelect').empty().append('<option value="">Selecteer een speler</option>');
        
        data.forEach(player => {
            debug(`Adding player: ${player.name} (${player.id})`);
            $('#playerSelect').append(`<option value="${player.id}">${player.name}</option>`);
        });
        
        // Trigger change to update Select2
        $('#playerSelect').trigger('change');
        
        debug('Players dropdown populated successfully');
    } catch (error) {
        debug(`Error loading players: ${error.message}`);
        showToast('Fout bij het laden van spelers', 'error');
    }
}

// Load reasons
async function loadReasons() {
    try {
        console.log('[DEBUG] Fetching reasons...');
        const reasons = await fetchAPI('/reasons');
        console.log('[DEBUG] Reasons loaded:', reasons);
        
        // Update reason select dropdown
        console.log('[DEBUG] Updating reason select dropdown...');
        $('#reasonSelect').empty().append('<option value="">Selecteer een reden</option>');
        if (Array.isArray(reasons)) {
            reasons.forEach(reason => {
                $('#reasonSelect').append(`<option value="${reason.id}">${reason.description}</option>`);
            });
            console.log('[DEBUG] Added', reasons.length, 'reasons to dropdown');
            console.log('[DEBUG] reasonSelect HTML:', $('#reasonSelect').html());
        } else {
            console.error('[DEBUG] Expected reasons to be an array but got:', typeof reasons);
        }
    } catch (error) {
        console.error('[DEBUG] Error in loadReasons():', error);
        showToast('Er is een fout opgetreden bij het laden van de redenen', 'error');
    }
}

// Load recent fines
async function loadRecentFines() {
    try {
        console.log('[DEBUG] Fetching recent fines...');
        const fines = await fetchAPI('/recent-fines');
        console.log('[DEBUG] Recent fines loaded:', fines);
        
        // Update recent fines display
        console.log('[DEBUG] Updating recent fines display...');
        const finesContent = fines.length ? 
            fines.map(fine => createFineCard(fine, true)).join('') :
            '<div class="text-center py-4 text-gray-500">Geen recente boetes</div>';
        
        console.log('[DEBUG] Fines content generated:', fines.length ? `${fines.length} fine cards` : 'Empty state message');
        $('#recentFines').html(finesContent);
        console.log('[DEBUG] Recent fines display updated');
        console.log('[DEBUG] recentFines HTML:', $('#recentFines').html());
        
        // Set up delete buttons
        console.log('[DEBUG] Setting up delete buttons for recent fines');
        $('.delete-fine-btn').off('click').on('click', handleFineDelete);
        console.log('[DEBUG] Found', $('.delete-fine-btn').length, 'delete buttons');
    } catch (error) {
        console.error('[DEBUG] Error in loadRecentFines():', error);
        showToast('Er is een fout opgetreden bij het laden van de recente boetes', 'error');
    }
}

// Form Handlers

// Handle Add Fine form submission
const handleAddFine = async (event) => {
    event.preventDefault();
    debug('Add fine form submitted');
    
    // Get values from the form
    const playerId = $('#playerSelect').val();
    const reasonId = $('#reasonSelect').val();
    const amount = parseFloat($('#amount').val());
    
    // Basic validation
    if (!playerId) {
        debug('Missing player selection');
        showToast('Selecteer een speler', 'error');
        return;
    }
    
    if (!reasonId) {
        debug('Missing reason selection');
        showToast('Selecteer een reden', 'error');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        debug(`Invalid amount: ${amount}`);
        showToast('Voer een geldig bedrag in', 'error');
        return;
    }
    
    debug(`Adding fine: player=${playerId}, reason=${reasonId}, amount=${amount}`);
    toggleLoading(true);
    
    try {
        const response = await fetchAPI('/fines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_id: parseInt(playerId),
                reason_id: parseInt(reasonId),
                amount: amount
            })
        });
        
        if (response) {
            debug('Fine added successfully');
            showToast('Boete succesvol toegevoegd', 'success');
            resetForm();
            loadRecentFines();
        } else {
            debug('Failed to add fine - API returned no response');
            showToast('Fout bij toevoegen van boete', 'error');
        }
    } catch (error) {
        debug(`Error adding fine: ${error.message}`);
        showToast(`Fout bij toevoegen van boete: ${error.message}`, 'error');
    } finally {
        toggleLoading(false);
    }
};

// Add player
$('#addPlayerForm').on('submit', async function(e) {
    e.preventDefault();
    
    const name = $('#playerName').val().trim();
    
    if (!name) {
        showToast('Vul een naam in', 'error');
      return;
    }
    
    try {
        await fetchAPI('/players', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        
        showToast('Speler succesvol toegevoegd');
        this.reset();
        await loadData();
        
  } catch (error) {
        console.error('Error adding player:', error);
    }
});

// Add reason
$('#addReasonForm').on('submit', async function(e) {
    e.preventDefault();
    
    const description = $('#reasonDescription').val().trim();
    
    if (!description) {
        showToast('Vul een beschrijving in', 'error');
      return;
    }
    
    try {
        await fetchAPI('/reasons', {
            method: 'POST',
            body: JSON.stringify({ description })
        });
        
        showToast('Reden succesvol toegevoegd');
        this.reset();
        await loadData();
        
    } catch (error) {
        console.error('Error adding reason:', error);
    }
});

// Reset data
$('#resetButton').on('click', async function() {
    if (!confirm('WAARSCHUWING: Dit zal ALLE boetes verwijderen. Deze actie kan niet ongedaan worden gemaakt! Weet je zeker dat je wilt doorgaan?')) {
        return;
    }
    
    const confirmation = prompt('Typ "RESET" om te bevestigen:');
    if (confirmation !== 'RESET') {
        showToast('Reset geannuleerd', 'error');
    return;
  }
  
  try {
        await fetchAPI('/reset', {
            method: 'POST'
        });
        
        showToast('Alle gegevens zijn gereset');
        await loadData();
        
  } catch (error) {
        console.error('Error resetting data:', error);
    }
});

// Validate Select2 initialization
function validateSelect2() {
    console.log('[DEBUG] Validating Select2 setup...');
    
    // Check if Select2 containers exist
    const select2Count = $('.select2-container').length;
    console.log(`[DEBUG] Found ${select2Count} Select2 containers`);
    
    // Check each Select2 element
    ['#playerSelect', '#reasonSelect'].forEach(selector => {
        const $el = $(selector);
        const hasSelect2 = $el.hasClass('select2-hidden-accessible');
        
        console.log(`[DEBUG] ${selector}: exists=${$el.length > 0}, select2-initialized=${hasSelect2}`);
        
        if ($el.length > 0 && !hasSelect2) {
            console.warn(`[DEBUG] Re-initializing ${selector}`);
            try {
                $el.select2({
                    theme: 'default',
                    placeholder: $el.data('placeholder') || 'Selecteer een optie',
                    allowClear: true,
                    width: '100%',
                    dropdownParent: $el.parent()
                });
            } catch (err) {
                console.error(`[DEBUG] Error initializing ${selector}:`, err);
            }
        }
    });
    
    // Update Select2 theme
    const isDark = document.documentElement.classList.contains('dark');
    updateSelect2Theme(isDark);
}

// Debug functions
function enableDebugMode() {
    debug('Debug mode enabled');
    
    // Set debug flag
    window.DEBUG = true;
    
    // Create toggle function for the debug panel
    window.toggleDebugPanel = function() {
        const panel = $('#debugPanel');
        panel.toggleClass('hidden');
        debug('Debug panel toggled');
    };
    
    // Set up API health check
    window.checkApiHealth = async function() {
        debug('Running API health check');
        $('#debugStatus').text('Running API health check...');
        
        try {
            // Test endpoints
            const endpoints = ['/players', '/reasons', '/recent-fines'];
            const results = {};
            
            for (const endpoint of endpoints) {
                try {
                    debug(`Testing endpoint: ${endpoint}`);
                    const startTime = performance.now();
                    const response = await fetchAPI(endpoint);
                    const duration = Math.round(performance.now() - startTime);
                    results[endpoint] = { 
                        status: response ? 'OK' : 'ERROR', 
                        duration: `${duration}ms`,
                        data: response ? `Got ${Array.isArray(response) ? response.length : 'non-array'} items` : 'No data'
                    };
                } catch (err) {
                    results[endpoint] = { status: 'ERROR', error: err.message };
                }
            }
            
            // Format results
            const resultStr = Object.entries(results)
                .map(([endpoint, result]) => `${endpoint}: ${result.status} ${result.duration || ''} ${result.error || ''} ${result.data || ''}`)
                .join('\n');
            
            $('#debugStatus').html(`API Health Check Results:<br><pre>${resultStr}</pre>`);
            debug('Health check complete:', results);
        } catch (error) {
            debug(`Health check failed: ${error.message}`);
            $('#debugStatus').text(`Health check failed: ${error.message}`);
        }
    };
}

// Handle fine deletion directly from the card
async function handleFineDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const fineId = $(this).data('id');
    const playerName = $(this).data('name');
    
    if (!fineId) {
        showToast('Kan deze boete niet verwijderen: ongeldige ID', 'error');
        return;
    }
    
    if (!confirm(`Weet je zeker dat je de boete voor ${playerName} wilt verwijderen?`)) {
        return;
    }
    
    try {
        console.log(`[DEBUG] Deleting fine with ID: ${fineId}`);
        await fetchAPI(`/fines/${fineId}`, {
            method: 'DELETE'
        });
        
        showToast('Boete succesvol verwijderd');
        
        // Reload all data
        loadData();
        
    } catch (error) {
        console.error('[DEBUG] Error deleting fine:', error);
        showToast('Fout bij verwijderen van boete', 'error');
    }
}

// DOM checker and repair function
function checkAndRepairDOM() {
    debug('Running DOM check and repair');
    
    // List of required DOM elements
    const requiredElements = [
        '#tab-boetes', 
        '#tab-beheer', 
        '#content-boetes', 
        '#content-beheer',
        '#playerSelect',
        '#reasonSelect',
        '#recentFines'
    ];
    
    // Check if all required elements exist
    const missingElements = requiredElements.filter(selector => $(selector).length === 0);
    
    if (missingElements.length > 0) {
        debug(`Missing DOM elements: ${missingElements.join(', ')}`);
        return false;
    }
    
    debug('All required DOM elements found');
    
    // Set up tab functionality
    $('#tab-boetes').off('click').on('click', function() {
        debug('Switching to Boetes tab');
        $('#tab-boetes').addClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .removeClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#tab-beheer').removeClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .addClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#content-boetes').removeClass('hidden');
        $('#content-beheer').addClass('hidden');
        localStorage.setItem('activeTab', 'boetes');
    });
    
    $('#tab-beheer').off('click').on('click', function() {
        debug('Switching to Beheer tab');
        $('#tab-beheer').addClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .removeClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#tab-boetes').removeClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .addClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#content-beheer').removeClass('hidden');
        $('#content-boetes').addClass('hidden');
        localStorage.setItem('activeTab', 'beheer');
    });
    
    // Check if all forms are properly initialized
    const forms = ['addFineForm', 'addPlayerForm', 'addReasonForm'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            debug(`Form ${formId} found`);
        } else {
            debug(`Form ${formId} not found in DOM`);
        }
    });
    
    // Set up delete buttons
    $('.delete-fine-btn').off('click').on('click', handleFineDelete);
    
    // Check Select2 elements
    validateSelect2();
    
    // Repair any broken CSS 
    $('.select2-container').css({
        'display': 'block',
        'position': 'relative',
        'z-index': '1050'
    });
    
    // Check if content is visible
    const boetesVisible = $('#content-boetes').is(':visible');
    const beheerVisible = $('#content-beheer').is(':visible');
    
    debug(`Content visibility: boetes=${boetesVisible}, beheer=${beheerVisible}`);
    
    // If no content is visible, force display of boetes tab
    if (!boetesVisible && !beheerVisible) {
        debug('No content visible, forcing display of boetes tab');
        $('#content-boetes').css('display', 'block');
        $('#content-beheer').css('display', 'none');
        $('#tab-boetes').addClass('tab-active');
        $('#tab-beheer').removeClass('tab-active');
    }
    
    // Apply theme
    applyTheme();
    
    $('#debugStatus').text('DOM check completed: ' + new Date().toLocaleTimeString());
    return true;
}

// Initialize
$(document).ready(async function() {
    enableDebugMode();
    
    try {
        // Check if all required DOM elements exist 
        if (!checkAndRepairDOM()) {
            debug('DOM check failed - some elements are missing');
            $('#adminContent').html('<div class="alert alert-danger">Error: Some required elements are missing from the DOM.</div>');
            return;
        }
        
        debug('DOM check passed - initializing page');
        
        // Initialize Select2
        await initializeSelect2();
        
        // Add event handler for Add Fine form
        $('#addFineForm').off('submit').on('submit', handleAddFine);
        
        // Initialize manual load button
        $('#manualLoadButton').off('click').on('click', async function() {
            debug('Manual data load triggered');
            await loadData();
        });
        
        // Attach theme toggle handler
        $('#themeToggle').off('click').on('click', toggleTheme);
        
        // Load active tab from localStorage
        const activeTab = localStorage.getItem('activeTab') || 'boetes';
        debug(`Loading active tab from localStorage: ${activeTab}`);
        
        if (activeTab === 'beheer') {
            $('#tab-beheer').trigger('click');
        } else {
            $('#tab-boetes').trigger('click');
        }
        
        // Load data
        await loadData();
        
        debug('Admin page initialization complete');
        $('#debugStatus').text('Page initialized, data loaded successfully');
    } catch (error) {
        debug(`Error during initialization: ${error.message}`);
        $('#debugStatus').text(`Error during initialization: ${error.message}`);
        $('#adminContent').html(`<div class="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-400">
            <p><strong>Error during initialization:</strong> ${error.message}</p>
            <p>Please check the console for more details.</p>
        </div>`);
    }
});

// Apply theme function
function applyTheme() {
    debug('Applying current theme');
    const isDarkMode = localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    }
    
    // Update Select2 theme
    updateSelect2Theme(isDarkMode);
}

// Toggle theme function
function toggleTheme() {
    debug('Toggling theme');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isDarkMode) {
        localStorage.theme = 'light';
        document.documentElement.classList.remove('dark');
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    } else {
        localStorage.theme = 'dark';
        document.documentElement.classList.add('dark');
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
    }
    
    // Update Select2 theme
    updateSelect2Theme(!isDarkMode);
}

// Reset form helper function
function resetForm() {
    debug('Resetting form fields');
    // Reset the add fine form
    $('#addFineForm')[0].reset();
    
    // Reset Select2 dropdowns
    $('#playerSelect').val(null).trigger('change');
    $('#reasonSelect').val(null).trigger('change');
    
    // Reset other inputs if needed
    $('#amount').val('');
} 