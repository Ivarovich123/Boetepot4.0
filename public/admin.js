// API Base URL
const API_BASE_URL = '/api';

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
function createFineCard(fine) {
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
        
        return `
            <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
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
        
        // Initialize fine select
        console.log('[DEBUG] Initializing fineSelect...');
        $('#fineSelect').select2({
            theme: 'default',
            placeholder: 'Selecteer een boete',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#fineSelect').parent()
        });
        console.log('[DEBUG] fineSelect initialized');
        
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

// API Functions
async function fetchAPI(endpoint, options = {}) {
    // Set a timeout to ensure loading spinner doesn't stay on forever
    const timeoutId = setTimeout(() => {
        console.warn(`[API] Request timeout for ${endpoint}`);
        toggleLoading(false);
    }, 10000); // 10 second timeout
    
    try {
        // Show loading indicator
        toggleLoading(true);
        
        // Make sure endpoint starts with a slash for consistency
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // Log the API request
        console.log(`[API] Fetching ${API_BASE_URL}${path}...`);
        
        // Make the API request
        const url = `${API_BASE_URL}${path}`;
        console.log(`[DEBUG] Full request URL: ${url}`);
        
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => {
                controller.abort();
                reject(new Error('Request timeout'));
            }, 8000)
        );
        
        // Race between fetch and timeout
        const response = await Promise.race([
            fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            }),
            timeoutPromise
        ]);
        
        console.log(`[DEBUG] Response status:`, response.status);
        
        // Process the response data
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
            console.warn(`[API] Non-JSON response: ${data.substring(0, 100)}...`);
        }
        
        // Handle error responses
        if (!response.ok) {
            console.error(`[API] Error response:`, data);
            throw new Error(typeof data === 'object' && data.error ? data.error : `HTTP error! status: ${response.status}`);
        }
        
        // Log success
        console.log(`[API] Response from ${path}:`, data);
        return data;
    } catch (error) {
        console.error(`[API] Error fetching ${endpoint}:`, error);
        console.error(`[DEBUG] Error details:`, { message: error.message, stack: error.stack });
        
        // Show helpful error message
        let errorMessage = 'Er is een fout opgetreden bij het verwerken van het verzoek';
        if (error.message === 'Request timeout') {
            errorMessage = 'De server reageert niet, controleer de verbinding';
        } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
            errorMessage = 'Kan geen verbinding maken met de server';
        }
        
        showToast(errorMessage, 'error');
        
        // Return empty data with appropriate type based on endpoint
        if (endpoint.includes('players') || endpoint.includes('reasons') || endpoint.includes('fines')) {
            return [];
        }
        throw error;
    } finally {
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Hide loading indicator
        toggleLoading(false);
    }
}

// Load data
async function loadData() {
    try {
        console.log('[DEBUG] Starting loadData() function');
        console.log('[DEBUG] API_BASE_URL =', API_BASE_URL);
        
        // Show loading spinner
        toggleLoading(true);
        
        // Load players
        console.log('[DEBUG] Fetching players...');
        const players = await fetchAPI('/players');
        console.log('[DEBUG] Players loaded:', players);
        
        // Update player select dropdown
        console.log('[DEBUG] Updating player select dropdown...');
        $('#playerSelect').empty().append('<option value="">Selecteer een speler</option>');
        if (Array.isArray(players)) {
            players.forEach(player => {
                $('#playerSelect').append(`<option value="${player.id}">${player.name}</option>`);
            });
            console.log('[DEBUG] Added', players.length, 'players to dropdown');
            console.log('[DEBUG] playerSelect HTML:', $('#playerSelect').html());
        } else {
            console.error('[DEBUG] Expected players to be an array but got:', typeof players);
        }
        
        // Load reasons
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
        
        // Load recent fines
        console.log('[DEBUG] Fetching recent fines...');
        const fines = await fetchAPI('/recent-fines');
        console.log('[DEBUG] Recent fines loaded:', fines);
        
        // Update recent fines display
        console.log('[DEBUG] Updating recent fines display...');
        const finesContent = fines.length ? 
            fines.map(fine => createFineCard(fine)).join('') :
            '<div class="text-center py-4 text-gray-500">Geen recente boetes</div>';
        
        console.log('[DEBUG] Fines content generated:', fines.length ? `${fines.length} fine cards` : 'Empty state message');
        $('#recentFines').html(finesContent);
        console.log('[DEBUG] Recent fines display updated');
        console.log('[DEBUG] recentFines HTML:', $('#recentFines').html());
        
        // Update fine select for deletion
        console.log('[DEBUG] Updating fine select dropdown...');
        $('#fineSelect').empty().append('<option value="">Selecteer een boete</option>');
        if (Array.isArray(fines)) {
            fines.forEach(fine => {
                const label = `${fine.player_name || 'Onbekend'} - ${fine.reason_description || 'Onbekend'} - ${formatCurrency(fine.amount)}`;
                $('#fineSelect').append(`<option value="${fine.id}">${label}</option>`);
            });
            console.log('[DEBUG] Added', fines.length, 'fines to deletion dropdown');
            console.log('[DEBUG] fineSelect HTML:', $('#fineSelect').html());
        } else {
            console.error('[DEBUG] Expected fines to be an array but got:', typeof fines);
        }
        
        // Check DOM visibility
        console.log('[DEBUG] DOM visibility checks:');
        console.log('- Player form visible:', $('#playerSelect').is(':visible'));
        console.log('- Reason form visible:', $('#reasonSelect').is(':visible'));
        console.log('- Recent fines visible:', $('#recentFines').is(':visible'));
        console.log('- Fine select visible:', $('#fineSelect').is(':visible'));
        console.log('- Content boetes visible:', $('#content-boetes').is(':visible'));
        console.log('- Content beheer visible:', $('#content-beheer').is(':visible'));
        
        // Initialize Select2
        console.log('[DEBUG] Initializing Select2...');
        setTimeout(() => {
            initializeSelect2();
            console.log('[DEBUG] Select2 initialization complete');
            
            // Check Select2 existence and visibility
            console.log('[DEBUG] Select2 container count:', $('.select2-container').length);
            console.log('[DEBUG] Select2 visibility:', $('.select2-container').is(':visible'));
        }, 100);
        
        console.log('[DEBUG] loadData() completed successfully');
        
    } catch (error) {
        console.error('[DEBUG] Error in loadData():', error);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
    } finally {
        // Ensure loading spinner is hidden
        toggleLoading(false);
        
        // Update debug status
        if (document.getElementById('debug-status')) {
            document.getElementById('debug-status').textContent = 'Data loaded: ' + new Date().toLocaleTimeString();
        }
    }
}

// Form Handlers

// Add fine
$('#addFineForm').on('submit', async function(e) {
    e.preventDefault();
    
    const playerId = $('#playerSelect').val();
    const reasonId = $('#reasonSelect').val();
    const amount = parseFloat($('#amount').val());
    
    if (!playerId || !reasonId || isNaN(amount)) {
        showToast('Vul alle velden correct in', 'error');
        return;
    }
    
    try {
        await fetchAPI('/fines', {
            method: 'POST',
            body: JSON.stringify({ 
                player_id: playerId, 
                reason_id: reasonId,
                amount 
            })
        });
        
        showToast('Boete succesvol toegevoegd');
        this.reset();
        $('#playerSelect').val('').trigger('change');
        $('#reasonSelect').val('').trigger('change');
        await loadData();
        
    } catch (error) {
        console.error('Error adding fine:', error);
    }
});

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

// Delete fine
$('#deleteFineForm').on('submit', async function(e) {
    e.preventDefault();
    
    const fineId = $('#fineSelect').val();
    
    if (!fineId) {
        showToast('Selecteer een boete om te verwijderen', 'error');
        return;
    }
    
    if (!confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
        return;
    }
    
    try {
        await fetchAPI(`/fines/${fineId}`, {
            method: 'DELETE'
        });
        
        showToast('Boete succesvol verwijderd');
        this.reset();
        $('#fineSelect').val('').trigger('change');
        await loadData();
        
    } catch (error) {
        console.error('Error deleting fine:', error);
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
    ['#playerSelect', '#reasonSelect', '#fineSelect'].forEach(selector => {
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

// API Health Check
async function checkApiHealth() {
    console.log('[DEBUG] Running API health check');
    document.getElementById('debug-status').textContent = 'Running API health check...';
    
    try {
        // Test endpoints
        const endpoints = ['/players', '/reasons', '/recent-fines'];
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                console.log(`[DEBUG] Testing endpoint: ${endpoint}`);
                const startTime = performance.now();
                await fetch(`${API_BASE_URL}${endpoint}`);
                const duration = Math.round(performance.now() - startTime);
                results[endpoint] = { status: 'OK', duration: `${duration}ms` };
            } catch (err) {
                results[endpoint] = { status: 'ERROR', error: err.message };
            }
        }
        
        // Format results
        const resultStr = Object.entries(results)
            .map(([endpoint, result]) => `${endpoint}: ${result.status} ${result.duration || result.error || ''}`)
            .join('\n');
        
        document.getElementById('debug-status').innerHTML = `API Health Check Results:<br><pre>${resultStr}</pre>`;
        console.log('[DEBUG] Health check complete:', results);
    } catch (error) {
        console.error('[DEBUG] Health check failed:', error);
        document.getElementById('debug-status').textContent = `Health check failed: ${error.message}`;
    }
}

// DOM checker and repair function
function checkAndRepairDOM() {
    console.log('[DEBUG] Running DOM check and repair');
    
    // Check if all forms are properly initialized
    const forms = ['addFineForm', 'addPlayerForm', 'addReasonForm', 'deleteFineForm'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            // Ensure form has submit handler
            const hasHandler = $._data(form, 'events')?.submit?.length > 0;
            console.log(`[DEBUG] Form ${formId}: exists=true, has submit handler=${hasHandler}`);
            
            if (!hasHandler) {
                console.warn(`[DEBUG] Re-attaching submit handler to ${formId}`);
                // Reattach form handlers based on form ID
                switch(formId) {
                    case 'addFineForm':
                        $(form).off('submit').on('submit', async function(e) {
                            e.preventDefault();
                            
                            const playerId = $('#playerSelect').val();
                            const reasonId = $('#reasonSelect').val();
                            const amount = parseFloat($('#amount').val());
                            
                            if (!playerId || !reasonId || isNaN(amount)) {
                                showToast('Vul alle velden correct in', 'error');
                                return;
                            }
                            
                            try {
                                await fetchAPI('/fines', {
                                    method: 'POST',
                                    body: JSON.stringify({ 
                                        player_id: playerId, 
                                        reason_id: reasonId,
                                        amount 
                                    })
                                });
                                
                                showToast('Boete succesvol toegevoegd');
                                this.reset();
                                $('#playerSelect').val('').trigger('change');
                                $('#reasonSelect').val('').trigger('change');
                                await loadData();
                                
                            } catch (error) {
                                console.error('Error adding fine:', error);
                            }
                        });
                        break;
                    // Similar for other forms
                }
            }
        } else {
            console.error(`[DEBUG] Form ${formId} not found in DOM`);
        }
    });
    
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
    
    console.log(`[DEBUG] Content visibility: boetes=${boetesVisible}, beheer=${beheerVisible}`);
    
    // If no content is visible, force display of boetes tab
    if (!boetesVisible && !beheerVisible) {
        console.warn('[DEBUG] No content visible, forcing display of boetes tab');
        $('#content-boetes').css('display', 'block');
        $('#content-beheer').css('display', 'none');
        $('#tab-boetes').addClass('tab-active');
        $('#tab-beheer').removeClass('tab-active');
    }
    
    document.getElementById('debug-status').textContent = 'DOM check completed: ' + new Date().toLocaleTimeString();
}

// Initialize
$(document).ready(function() {
    console.log('[DEBUG] Document ready event fired');
    
    // Check if all required elements exist
    const requiredElements = [
        '#tab-boetes', 
        '#tab-beheer', 
        '#content-boetes', 
        '#content-beheer',
        '#playerSelect',
        '#reasonSelect',
        '#recentFines',
        '#fineSelect'
    ];
    
    const missingElements = requiredElements.filter(selector => $(selector).length === 0);
    
    if (missingElements.length > 0) {
        console.error('[DEBUG] Missing DOM elements:', missingElements);
        showToast('Er is een fout opgetreden bij het laden van de pagina', 'error');
        return;
    }
    
    console.log('[DEBUG] All required DOM elements found');
    
    // Make sure content is visible initially
    $('#content-boetes').css('display', 'block');
    $('#content-beheer').css('display', 'none');
    
    // Set up tab switching
    $('#tab-boetes').on('click', function() {
        console.log('[DEBUG] Switching to boetes tab');
        switchTab('boetes');
    });
    
    $('#tab-beheer').on('click', function() {
        console.log('[DEBUG] Switching to beheer tab');
        switchTab('beheer');
    });
    
    // Load active tab from localStorage or default to 'boetes'
    const activeTab = localStorage.getItem('activeAdminTab') || 'boetes';
    console.log('[DEBUG] Initial active tab:', activeTab);
    switchTab(activeTab);
    
    // Initialize theme
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.log('[DEBUG] Initial theme - Dark mode:', isDarkMode);
    setTheme(isDarkMode);
    
    // Wait a short time to ensure DOM is fully ready before loading data
    setTimeout(() => {
        console.log('[DEBUG] Starting initial data load');
        // Force visibility of containers again
        if (activeTab === 'boetes') {
            $('#content-boetes').css('display', 'block');
            $('#content-beheer').css('display', 'none');
        } else {
            $('#content-boetes').css('display', 'none');
            $('#content-beheer').css('display', 'block');
        }
        
        loadData().then(() => {
            // Validate Select2 after data is loaded
            setTimeout(validateSelect2, 500);
        });
    }, 300);

    // Add health check button to debug panel
    if (document.getElementById('fallback-debug')) {
        const healthBtn = document.createElement('button');
        healthBtn.className = 'px-3 py-1 ml-2 bg-green-600 text-white rounded';
        healthBtn.textContent = 'API Health Check';
        healthBtn.onclick = checkApiHealth;
        
        const debugPanel = document.getElementById('fallback-debug');
        const existingBtn = debugPanel.querySelector('button');
        existingBtn.parentNode.insertBefore(healthBtn, existingBtn.nextSibling);
    }

    // Add DOM repair button to debug panel
    if (document.getElementById('fallback-debug')) {
        const repairBtn = document.createElement('button');
        repairBtn.className = 'px-3 py-1 ml-2 bg-yellow-600 text-white rounded';
        repairBtn.textContent = 'Repair DOM';
        repairBtn.onclick = checkAndRepairDOM;
        
        const debugPanel = document.getElementById('fallback-debug');
        const existingBtn = debugPanel.querySelector('button');
        existingBtn.parentNode.insertBefore(repairBtn, existingBtn.nextSibling);
    }
}); 