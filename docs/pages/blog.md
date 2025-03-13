---
layout: page
title: Blog
subtitle: The latest news, updates, and insights from the Agent Party team
permalink: /blog/
---

<div class="blog-content">
    <div class="blog-posts">
        {% for post in site.posts %}
        <div class="blog-post-card">
            {% if post.featured_image %}
            <div class="post-card-image">
                <a href="{{ post.url | relative_url }}">
                    <img src="{{ post.featured_image | relative_url }}" alt="{{ post.title }}">
                </a>
            </div>
            {% endif %}
            <div class="post-card-content">
                <div class="post-meta">
                    <span class="post-date">{{ post.date | date: "%B %d, %Y" }}</span>
                    {% if post.categories.size > 0 %}
                    <span class="post-categories">
                        {% for category in post.categories %}
                        <a href="{{ site.baseurl }}/blog/categories/{{ category | slugify }}" class="post-category">{{ category }}</a>
                        {% endfor %}
                    </span>
                    {% endif %}
                </div>
                <h2 class="post-title">
                    <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
                </h2>
                {% if post.excerpt %}
                <div class="post-excerpt">
                    {{ post.excerpt }}
                </div>
                {% endif %}
                <a href="{{ post.url | relative_url }}" class="read-more">Read more →</a>
            </div>
        </div>
        {% endfor %}
    </div>
    
    <aside class="blog-sidebar">
        <div class="sidebar-widget">
            <h3>Categories</h3>
            <div class="category-list">
                {% assign categories = site.categories | sort %}
                {% for category in categories %}
                <a href="{{ site.baseurl }}/blog/categories/{{ category[0] | slugify }}" class="category-tag">
                    {{ category[0] }} ({{ category[1].size }})
                </a>
                {% endfor %}
            </div>
        </div>
        
        <div class="sidebar-widget">
            <h3>Subscribe to Updates</h3>
            <p>Get the latest news from Agent Party delivered directly to your inbox.</p>
            <form class="subscribe-form" action="#" method="post">
                <input type="email" name="email" placeholder="Your email address" required>
                <button type="submit" class="button primary-button">Subscribe</button>
            </form>
        </div>
        
        <div class="sidebar-widget">
            <h3>Connect With Us</h3>
            <div class="social-connect">
                <a href="https://github.com/agent-party" target="_blank" class="social-icon">
                    <i class="fab fa-github"></i>
                </a>
                <a href="https://twitter.com/agentparty" target="_blank" class="social-icon">
                    <i class="fab fa-twitter"></i>
                </a>
                <a href="https://linkedin.com/company/agent-party" target="_blank" class="social-icon">
                    <i class="fab fa-linkedin"></i>
                </a>
                <a href="https://discord.gg/agentparty" target="_blank" class="social-icon">
                    <i class="fab fa-discord"></i>
                </a>
            </div>
        </div>
        
        <div class="sidebar-widget featured-content">
            <h3>Featured Resource</h3>
            <div class="featured-resource">
                <img src="{{ '/assets/img/whitepaper-thumbnail.jpg' | relative_url }}" alt="AI Collaboration Whitepaper">
                <h4>The Future of AI Collaboration</h4>
                <p>Our comprehensive whitepaper on how collaborative AI teams are transforming enterprise workflows.</p>
                <a href="{{ site.baseurl }}/resources/ai-collaboration-whitepaper" class="button outline-button">Download</a>
            </div>
        </div>
    </aside>
</div>

<div class="pagination">
    {% if paginator.previous_page %}
    <a href="{{ paginator.previous_page_path | relative_url }}" class="previous">← Newer Posts</a>
    {% endif %}
    
    {% if paginator.next_page %}
    <a href="{{ paginator.next_page_path | relative_url }}" class="next">Older Posts →</a>
    {% endif %}
</div> 