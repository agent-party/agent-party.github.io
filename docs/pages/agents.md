---
layout: page
title: Agent System
subtitle: The specialized AI agents that power the Agent Party platform
permalink: /agents/
---

<div class="agent-overview-content">
    <h2>The Agent Ecosystem</h2>
    <p>At Agent Party, we've created a diverse ecosystem of specialized AI agents that work together to solve complex problems. Each agent has specific capabilities and responsibilities, allowing them to collaborate effectively as a team.</p>
    
    <div class="agent-grid full-width">
        {% for agent in site.data.agents %}
        <div class="agent-card">
            <div class="agent-avatar">
                {% include svg/{{ agent.svg_file }} %}
            </div>
            <h3>{{ agent.name }}</h3>
            <h4>{{ agent.role }}</h4>
            <p>{{ agent.description }}</p>
            <p class="business-value"><strong>Business Value:</strong> {{ agent.business_value }}</p>
            <a href="{{ site.baseurl }}/agents/{{ agent.slug }}" class="button primary-button">Learn More</a>
        </div>
        {% endfor %}
    </div>
</div>

<div class="agent-concept-section">
    <h2>Core Agent Concepts</h2>
    
    <div class="concept-grid">
        <div class="concept-card">
            <h3>Agent Templates vs. Instances</h3>
            <p>Agent Party distinguishes between reusable <strong>templates</strong> (blueprints defining capabilities and parameters) and <strong>instances</strong> (runtime incarnations that maintain state and track resources).</p>
            <p>This separation enables:</p>
            <ul>
                <li>Consistent agent creation and configuration</li>
                <li>Versioning and governance of agent capabilities</li>
                <li>Performance analysis across multiple instances</li>
                <li>Efficient resource tracking and token accounting</li>
            </ul>
        </div>
        
        <div class="concept-card">
            <h3>Agent Lifecycle</h3>
            <p>Agents progress through a well-defined lifecycle:</p>
            <ol>
                <li><strong>TEMPLATE</strong>: The blueprint definition</li>
                <li><strong>PROVISIONED</strong>: Resources allocated</li>
                <li><strong>INITIALIZED</strong>: Loaded with context</li>
                <li><strong>RUNNING</strong>: Actively processing tasks</li>
                <li><strong>PAUSED</strong>: Temporarily halted</li>
                <li><strong>COMPLETED</strong>: Successfully finished work</li>
                <li><strong>FAILED</strong>: Encountered error</li>
                <li><strong>ARCHIVED</strong>: Preserved for analysis</li>
            </ol>
        </div>
        
        <div class="concept-card">
            <h3>Governance & Approvals</h3>
            <p>Agent transitions can require different approval types:</p>
            <ul>
                <li><strong>Automatic Transitions</strong>: System-initiated based on predefined criteria</li>
                <li><strong>Human-in-the-Loop</strong>: Explicit human verification required</li>
                <li><strong>Manager Agent Approval</strong>: Specialized agents that approve transitions</li>
            </ul>
            <p>This governance framework ensures appropriate oversight while maintaining efficiency.</p>
        </div>
    </div>
</div>

<div class="agent-capabilities-section bg-light">
    <div class="container">
        <h2>Common Agent Capabilities</h2>
        <p>While each agent specializes in specific roles, they share common capabilities that enable seamless collaboration:</p>
        
        <div class="capability-columns">
            <div class="capability-column">
                <h3>Communication Capabilities</h3>
                <ul>
                    <li><strong>Event Production</strong>: Publishing structured events</li>
                    <li><strong>Event Consumption</strong>: Responding to system events</li>
                    <li><strong>Request/Response</strong>: Direct communication patterns</li>
                    <li><strong>Message Routing</strong>: Directing messages appropriately</li>
                </ul>
            </div>
            
            <div class="capability-column">
                <h3>Information Capabilities</h3>
                <ul>
                    <li><strong>Context Management</strong>: Maintaining relevant information</li>
                    <li><strong>Memory Access</strong>: Retrieving historical interactions</li>
                    <li><strong>Knowledge Retrieval</strong>: Finding relevant information</li>
                    <li><strong>Information Synthesis</strong>: Combining data from multiple sources</li>
                </ul>
            </div>
            
            <div class="capability-column">
                <h3>Execution Capabilities</h3>
                <ul>
                    <li><strong>Task Processing</strong>: Handling assigned work</li>
                    <li><strong>Tool Usage</strong>: Leveraging external systems</li>
                    <li><strong>State Management</strong>: Tracking progress and status</li>
                    <li><strong>Resource Control</strong>: Managing computational resources</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="agent-observability-section">
    <h2>Agent Observability & Metrics</h2>
    <p>The Agent Party system comprehensively tracks agent performance through:</p>
    
    <div class="metrics-grid">
        <div class="metrics-card">
            <h3>State-Based Metrics</h3>
            <ul>
                <li><strong>Time Metrics</strong>: Duration in each state, time-to-completion</li>
                <li><strong>Resource Metrics</strong>: Token consumption, memory usage, API calls</li>
            </ul>
        </div>
        
        <div class="metrics-card">
            <h3>Transition Metrics</h3>
            <ul>
                <li><strong>Approval Metrics</strong>: Approval times, approval request counts</li>
                <li><strong>Quality Metrics</strong>: Success rates, error rates, recovery attempts</li>
            </ul>
        </div>
        
        <div class="metrics-card">
            <h3>Collaboration Metrics</h3>
            <ul>
                <li><strong>Team Performance</strong>: Collaboration success, communication efficiency</li>
                <li><strong>Compatibility Metrics</strong>: Agent pairing scores, team cohesion</li>
            </ul>
        </div>
    </div>
    
    <p class="metrics-conclusion">All metrics feed back into the template design process, allowing the system to continuously improve agent templates based on real-world performance data.</p>
</div>

<div class="cta-banner">
    <h2>Ready to deploy AI agents in your organization?</h2>
    <p>Explore our getting started guide to begin implementing Agent Party.</p>
    <a href="{{ site.baseurl }}/getting-started" class="button cta-button">Get Started</a>
</div> 