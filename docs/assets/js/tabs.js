// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the target tab id
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Add active class to the clicked button and corresponding pane
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
});
