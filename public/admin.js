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
    
    // Remove active class from all tabs and hide all content
    $('#tab-boetes, #tab-beheer').removeClass('tab-active');
    $('#content-boetes, #content-beheer').addClass('hidden');
    
    // Add active class to selected tab and show content
    $(`#tab-${tabId}`).addClass('tab-active');
    $(`#content-${tabId}`).removeClass('hidden');
    
    console.log(`[DEBUG] Tab visibility: boetes=${$('#content-boetes').is(':visible')}, beheer=${$('#content-beheer').is(':visible')}`);
    
    // Re-initialize Select2 after tab switch to fix any display issues
    setTimeout(() => {
        console.log(`[DEBUG] Reinitializing Select2 after tab switch to ${tabId}`);
        initializeSelect2();
    }, 50);
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
    $('#loadingSpinner').toggleClass('flex hidden', show);
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

// Initialize Select2
function initializeSelect2() {
    // Clean up existing instances
    $('.select2-container').remove();
    
    // Initialize player select
    $('#playerSelect').select2({
        theme: 'classic',
        placeholder: 'Selecteer een speler',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#playerSelect').parent()
    });
    
    // Initialize reason select
    $('#reasonSelect').select2({
        theme: 'classic',
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
    
    // Initialize fine select
    $('#fineSelect').select2({
        theme: 'classic',
        placeholder: 'Selecteer een boete',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#fineSelect').parent()
    });
    
    // Update theme
    updateSelect2Theme(document.documentElement.classList.contains('dark'));
}

// Update Select2 theme
function updateSelect2Theme(isDark) {
    $('.select2-container--classic .select2-selection--single').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)',
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--classic .select2-selection--single .select2-selection__rendered').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--classic .select2-dropdown').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)'
    });
    
    $('.select2-container--classic .select2-results__option').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--classic .select2-search__field').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'color': isDark ? 'white' : 'inherit'
    });
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
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
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
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
        showToast(error.message || 'Er is een fout opgetreden bij het verwerken van het verzoek', 'error');
        throw error;
    } finally {
        // Hide loading indicator
        toggleLoading(false);
    }
}

// Load data
async function loadData() {
    try {
        console.log('[DEBUG] Starting loadData() function');
        console.log('[DEBUG] API_BASE_URL =', API_BASE_URL);
        
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
        
        // Update fine select for deletion
        console.log('[DEBUG] Updating fine select dropdown...');
        $('#fineSelect').empty().append('<option value="">Selecteer een boete</option>');
        if (Array.isArray(fines)) {
            fines.forEach(fine => {
                const label = `${fine.player_name || 'Onbekend'} - ${fine.reason_description || 'Onbekend'} - ${formatCurrency(fine.amount)}`;
                $('#fineSelect').append(`<option value="${fine.id}">${label}</option>`);
            });
            console.log('[DEBUG] Added', fines.length, 'fines to deletion dropdown');
        } else {
            console.error('[DEBUG] Expected fines to be an array but got:', typeof fines);
        }
        
        // Initialize Select2
        console.log('[DEBUG] Initializing Select2...');
        setTimeout(() => {
            initializeSelect2();
            console.log('[DEBUG] Select2 initialization complete');
        }, 100);
        
        console.log('[DEBUG] loadData() completed successfully');
        
    } catch (error) {
        console.error('[DEBUG] Error in loadData():', error);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
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
    
    // Wait a short time to ensure DOM is fully ready before loading data
    setTimeout(() => {
        console.log('[DEBUG] Starting initial data load');
        loadData();
    }, 300);
}); 