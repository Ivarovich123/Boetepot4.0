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

// Load data
async function loadData() {
    try {
        toggleLoading(true);
        
        // Load players
        const playersResponse = await fetch(`${API_BASE_URL}/players`);
        const players = await playersResponse.json();
        
        if (!playersResponse.ok) throw new Error('Failed to load players');
        
        $('#playerSelect').empty().append('<option value="">Selecteer een speler</option>');
        players.forEach(player => {
            $('#playerSelect').append(`<option value="${player.id}">${player.name}</option>`);
        });
        
        // Load recent fines
        const finesResponse = await fetch(`${API_BASE_URL}/recent-fines`);
        const fines = await finesResponse.json();
        
        if (!finesResponse.ok) throw new Error('Failed to load fines');
        
        // Update recent fines display
        $('#recentFines').html(
            fines.length ? 
            fines.map(fine => createFineCard(fine)).join('') :
            '<div class="text-center py-4 text-gray-500">Geen recente boetes</div>'
        );
        
        // Update fine select for deletion
        $('#fineSelect').empty().append('<option value="">Selecteer een boete</option>');
        fines.forEach(fine => {
            const label = `${fine.player_name} - ${fine.reason_description} - ${formatCurrency(fine.amount)} - ${formatDate(fine.date)}`;
            $('#fineSelect').append(`<option value="${fine.id}">${label}</option>`);
        });
        
        // Initialize Select2
        initializeSelect2();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
    } finally {
        toggleLoading(false);
    }
}

// Add fine
$('#addFineForm').on('submit', async function(e) {
    e.preventDefault();
    
    const playerId = $('#playerSelect').val();
    const reason = $('#reason').val().trim();
    const amount = parseFloat($('#amount').val());
    
    if (!playerId || !reason || isNaN(amount)) {
        showToast('Vul alle velden correct in', 'error');
        return;
    }
    
    try {
        toggleLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/fines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId, reason_description: reason, amount })
        });
        
        if (!response.ok) throw new Error('Failed to add fine');
        
        showToast('Boete succesvol toegevoegd');
        this.reset();
        $('#playerSelect').val('').trigger('change');
        await loadData();
        
    } catch (error) {
        console.error('Error adding fine:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de boete', 'error');
    } finally {
        toggleLoading(false);
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
        toggleLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        if (!response.ok) throw new Error('Failed to add player');
        
        showToast('Speler succesvol toegevoegd');
        this.reset();
        await loadData();
        
    } catch (error) {
        console.error('Error adding player:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de speler', 'error');
    } finally {
        toggleLoading(false);
    }
});

// Delete fine
$('#deleteFineForm').on('submit', async function(e) {
    e.preventDefault();
    
    const fineId = $('#fineSelect').val();
    
    if (!fineId) {
        showToast('Selecteer een boete', 'error');
        return;
    }
    
    if (!confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
        return;
    }
    
    try {
        toggleLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/fines/${fineId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete fine');
        
        showToast('Boete succesvol verwijderd');
        $('#fineSelect').val('').trigger('change');
        await loadData();
        
    } catch (error) {
        console.error('Error deleting fine:', error);
        showToast('Er is een fout opgetreden bij het verwijderen van de boete', 'error');
    } finally {
        toggleLoading(false);
    }
});

// Reset data
$('#resetButton').on('click', async function() {
    if (!confirm('Weet je heel zeker dat je alle gegevens wilt resetten? Dit kan niet ongedaan worden gemaakt!')) {
        return;
    }
    
    try {
        toggleLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/reset`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to reset data');
        
        showToast('Alle gegevens zijn succesvol gereset');
        await loadData();
        
    } catch (error) {
        console.error('Error resetting data:', error);
        showToast('Er is een fout opgetreden bij het resetten van de gegevens', 'error');
    } finally {
        toggleLoading(false);
    }
});

// Initialize app
$(document).ready(() => {
    loadData();
}); 