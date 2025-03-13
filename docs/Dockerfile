FROM ruby:3.2-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy Gemfile and Gemfile.lock
COPY Gemfile* ./

# Install Jekyll and dependencies
RUN gem install bundler && \
    bundle install

# Copy the rest of the application
COPY . .

# Expose port 4000 for Jekyll server
EXPOSE 4000

# Command to run the Jekyll server
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"] 