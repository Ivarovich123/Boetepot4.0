// Theme management system
const Theme = {
    init() {
        // Check for saved theme or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            this.updateIcon(true);
        } else {
            document.documentElement.classList.remove('dark');
            this.updateIcon(false);
        }

        // Add event listener for theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggle());
        }

        // Add transition classes for smooth theme changes
        document.documentElement.classList.add('transition-colors', 'duration-200');
    },

    toggle() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        this.updateIcon(!isDark);
        
        // Dispatch event for components that need to react to theme changes
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: !isDark } }));
    },

    updateIcon(isDark) {
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
        }
    },
    
    // Update select2 elements for dark mode if present
    updateSelect2(isDark) {
        if (typeof $ !== 'undefined' && $('.select2-container').length) {
            try {
                $('.select2-container--default .select2-selection--single').css({
                    'background-color': isDark ? 'var(--input-bg)' : 'var(--input-bg)',
                    'border-color': isDark ? 'var(--input-border)' : 'var(--input-border)'
                });
                
                $('.select2-container--default .select2-selection--single .select2-selection__rendered').css({
                    'color': isDark ? 'var(--input-text)' : 'var(--input-text)'
                });
                
                $('.select2-dropdown').css({
                    'background-color': isDark ? 'var(--input-bg)' : 'var(--input-bg)',
                    'border-color': isDark ? 'var(--input-border)' : 'var(--input-border)'
                });
                
                $('.select2-search--dropdown .select2-search__field').css({
                    'background-color': isDark ? 'var(--input-bg)' : 'var(--input-bg)',
                    'border-color': isDark ? 'var(--input-border)' : 'var(--input-border)',
                    'color': isDark ? 'var(--input-text)' : 'var(--input-text)'
                });
            } catch (error) {
                console.error('Error updating Select2 theme:', error);
            }
        }
    }
}; 