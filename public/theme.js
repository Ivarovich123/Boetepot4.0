// Theme handling
const Theme = {
    init() {
        // Set initial theme
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
    },

    toggle() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            this.updateIcon(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            this.updateIcon(true);
        }
    },

    updateIcon(isDark) {
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = `fas fa-${isDark ? 'sun' : 'moon'} text-xl`;
        }
    }
}; 