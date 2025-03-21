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
    // Store active tab in localStorage
    localStorage.setItem('activeAdminTab', tabId);
    
    // Remove active class from all tabs and hide all content
    $('#tab-boetes, #tab-beheer').removeClass('tab-active');
    $('#content-boetes, #content-beheer').addClass('hidden');
    
    // Add active class to selected tab and show content
    $(`#tab-${tabId}`).addClass('tab-active');
    $(`#content-${tabId}`).removeClass('hidden');
    
    // Re-initialize Select2 after tab switch to fix any display issues
    setTimeout(initializeSelect2, 50);
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
    return `
        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
                <div class="font-semibold">${fine.player_name || 'Onbekend'}</div>
                <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(fine.amount)}</div>
            </div>
            <div class="text-gray-600 dark:text-gray-400">${fine.reason_description || 'Onbekend'}</div>
            <div class="text-sm text-gray-500 dark:text-gray-500">${formatDate(fine.date)}</div>
        </div>
    `;
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
        toggleLoading(true);
        
        // Make sure endpoint starts with a slash for consistency
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        console.log(`[API] Fetching ${API_BASE_URL}${path}...`);
        
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
            console.warn(`[API] Non-JSON response: ${data.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
            console.error(`[API] Error response:`, data);
            throw new Error(typeof data === 'object' && data.error ? data.error : `HTTP error! status: ${response.status}`);
        }
        
        console.log(`[API] Response from ${endpoint}:`, data);
        return data;
    } catch (error) {
        console.error(`[API] Error fetching ${endpoint}:`, error);
        showToast(error.message || 'Er is een fout opgetreden bij het verwerken van het verzoek', 'error');
        throw error;
    } finally {
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
        
        $('#playerSelect').empty().append('<option value="">Selecteer een speler</option>');
        if (Array.isArray(players)) {
            players.forEach(player => {
                $('#playerSelect').append(`<option value="${player.id}">${player.name}</option>`);
            });
        }
        
        // Load reasons
        console.log('[DEBUG] Fetching reasons...');
        const reasons = await fetchAPI('/reasons');
        console.log('[DEBUG] Reasons loaded:', reasons);
        
        $('#reasonSelect').empty().append('<option value="">Selecteer een reden</option>');
        if (Array.isArray(reasons)) {
            reasons.forEach(reason => {
                $('#reasonSelect').append(`<option value="${reason.id}">${reason.description}</option>`);
            });
        }
        
        // Load recent fines
        console.log('[DEBUG] Fetching recent fines...');
        const fines = await fetchAPI('/recent-fines');
        console.log('[DEBUG] Recent fines loaded:', fines);
        
        // Update recent fines display
        $('#recentFines').html(
            fines.length ? 
            fines.map(fine => createFineCard(fine)).join('') :
            '<div class="text-center py-4 text-gray-500">Geen recente boetes</div>'
        );
        
        // Update fine select for deletion
        $('#fineSelect').empty().append('<option value="">Selecteer een boete</option>');
        if (Array.isArray(fines)) {
            fines.forEach(fine => {
                const label = `${fine.player_name} - ${fine.reason_description} - ${formatCurrency(fine.amount)}`;
                $('#fineSelect').append(`<option value="${fine.id}">${label}</option>`);
            });
        }
        
        // Initialize Select2
        console.log('[DEBUG] Initializing Select2...');
        initializeSelect2();
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
    // Set up tab switching
    $('#tab-boetes').on('click', function() {
        switchTab('boetes');
    });
    
    $('#tab-beheer').on('click', function() {
        switchTab('beheer');
    });
    
    // Load active tab from localStorage or default to 'boetes'
    const activeTab = localStorage.getItem('activeAdminTab') || 'boetes';
    switchTab(activeTab);
    
    // Load data
    loadData();
}); 