---
layout: page
title: Documentation
subtitle: Comprehensive guides and references for the Agent Party platform
permalink: /docs/
---

<div class="documentation-index">
    <h2>Agent Party Documentation</h2>
    <p>Find everything you need to understand, implement, and extend the Agent Party platform.</p>
    
    <div class="doc-category">
        <h3><i class="fas fa-book"></i> Core Concepts</h3>
        <div class="doc-grid">
            <a href="{{ site.baseurl }}/architecture" class="doc-card">
                <h4>System Architecture</h4>
                <p>The technical architecture powering seamless AI collaboration</p>
            </a>
            <a href="{{ site.baseurl }}/agents" class="doc-card">
                <h4>Agent System</h4>
                <p>The specialized AI agents that power the Agent Party platform</p>
            </a>
            <a href="{{ site.baseurl }}/team-formation" class="doc-card">
                <h4>Team Formation</h4>
                <p>How Agent Party dynamically assembles optimal AI agent teams</p>
            </a>
            <a href="{{ site.baseurl }}/capabilities" class="doc-card">
                <h4>Technical Capabilities</h4>
                <p>The advanced features that power the Agent Party platform</p>
            </a>
        </div>
    </div>
    
    <div class="doc-category">
        <h3><i class="fas fa-code"></i> Developer Guides</h3>
        <div class="doc-grid">
            <a href="{{ site.baseurl }}/getting-started" class="doc-card">
                <h4>Getting Started</h4>
                <p>Your guide to implementing AI agent collaboration</p>
            </a>
            <a href="https://agent-party.github.io/api-docs" class="doc-card">
                <h4>API Reference</h4>
                <p>Complete API documentation for developers</p>
            </a>
            <a href="https://agent-party.github.io/examples" class="doc-card">
                <h4>Code Examples</h4>
                <p>Practical examples demonstrating key functionality</p>
            </a>
            <a href="https://agent-party.github.io/sdk" class="doc-card">
                <h4>SDK Documentation</h4>
                <p>Client libraries for multiple programming languages</p>
            </a>
        </div>
    </div>
    
    <div class="doc-category">
        <h3><i class="fas fa-cogs"></i> Implementation Guides</h3>
        <div class="doc-grid">
            <a href="https://agent-party.github.io/docs/deployment" class="doc-card">
                <h4>Deployment Guide</h4>
                <p>How to deploy Agent Party in different environments</p>
            </a>
            <a href="https://agent-party.github.io/docs/security" class="doc-card">
                <h4>Security Guide</h4>
                <p>Security best practices and configuration</p>
            </a>
            <a href="https://agent-party.github.io/docs/integration" class="doc-card">
                <h4>Integration Guide</h4>
                <p>Connecting Agent Party with external systems</p>
            </a>
            <a href="https://agent-party.github.io/docs/scaling" class="doc-card">
                <h4>Scaling Guide</h4>
                <p>Handling growth and optimizing performance</p>
            </a>
        </div>
    </div>
    
    <div class="doc-category">
        <h3><i class="fas fa-user-cog"></i> Administrator Guides</h3>
        <div class="doc-grid">
            <a href="https://agent-party.github.io/docs/admin/system-monitoring" class="doc-card">
                <h4>System Monitoring</h4>
                <p>Monitoring and maintaining your Agent Party deployment</p>
            </a>
            <a href="https://agent-party.github.io/docs/admin/user-management" class="doc-card">
                <h4>User Management</h4>
                <p>Managing users, permissions, and access control</p>
            </a>
            <a href="https://agent-party.github.io/docs/admin/backup-recovery" class="doc-card">
                <h4>Backup & Recovery</h4>
                <p>Protecting and restoring your data</p>
            </a>
            <a href="https://agent-party.github.io/docs/admin/troubleshooting" class="doc-card">
                <h4>Troubleshooting Guide</h4>
                <p>Resolving common issues and errors</p>
            </a>
        </div>
    </div>
    
    <div class="doc-category">
        <h3><i class="fas fa-hands-helping"></i> Community Resources</h3>
        <div class="doc-grid">
            <a href="https://github.com/agent-party/agent-party/blob/main/CONTRIBUTING.md" class="doc-card">
                <h4>Contribution Guide</h4>
                <p>How to contribute to the Agent Party project</p>
            </a>
            <a href="https://github.com/agent-party/agent-party/discussions" class="doc-card">
                <h4>Discussion Forum</h4>
                <p>Community discussions and knowledge sharing</p>
            </a>
            <a href="https://discord.gg/agentparty" class="doc-card">
                <h4>Discord Community</h4>
                <p>Real-time chat with the Agent Party community</p>
            </a>
            <a href="https://agent-party.github.io/showcase" class="doc-card">
                <h4>Community Showcase</h4>
                <p>Projects built with Agent Party</p>
            </a>
        </div>
    </div>
</div>

<div class="doc-search-section">
    <h3>Looking for something specific?</h3>
    <p>Use our documentation search to find exactly what you need.</p>
    <div class="search-container">
        <input type="text" id="doc-search" placeholder="Search documentation...">
        <button id="search-button"><i class="fas fa-search"></i></button>
    </div>
    <div id="search-results" class="search-results"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('doc-search');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    
    // Simple search function - in a real implementation, this would connect to a search API
    function performSearch(query) {
        searchResults.innerHTML = '<p>Search results will appear here. This is a placeholder for an actual search implementation.</p>';
    }
    
    searchButton.addEventListener('click', function() {
        performSearch(searchInput.value);
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
});
</script>

<style>
.documentation-index {
    margin-bottom: 3rem;
}

.doc-category {
    margin-bottom: 2.5rem;
}

.doc-category h3 {
    border-bottom: 2px solid var(--border);
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
}

.doc-category h3 i {
    color: var(--primary);
    margin-right: 0.5rem;
}

.doc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.doc-card {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: var(--box-shadow);
    transition: var(--transition);
    display: block;
    color: var(--text);
    height: 100%;
}

.doc-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    color: var(--text);
}

.doc-card h4 {
    color: var(--primary);
    margin-bottom: 0.75rem;
}

.doc-card p {
    color: var(--text-light);
    margin-bottom: 0;
}

.doc-search-section {
    background-color: var(--light);
    padding: 2rem;
    border-radius: 0.5rem;
    text-align: center;
}

.search-container {
    max-width: 600px;
    margin: 1.5rem auto;
    display: flex;
}

#doc-search {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid var(--border);
    border-right: none;
    border-radius: 0.5rem 0 0 0.5rem;
    font-size: 1rem;
}

#search-button {
    background-color: var(--primary);
    color: white;
    border: none;
    padding: 0 1.5rem;
    border-radius: 0 0.5rem 0.5rem 0;
    cursor: pointer;
}

.search-results {
    max-width: 600px;
    margin: 1rem auto;
    text-align: left;
    min-height: 50px;
}
</style> 