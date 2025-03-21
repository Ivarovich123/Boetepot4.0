// Theme handling
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
    }
}; 