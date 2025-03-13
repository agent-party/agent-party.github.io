#!/bin/bash
# Setup script for Agent Party documentation website

echo "🎉 Setting up Agent Party documentation site"

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo "❌ Ruby is not installed. Please install Ruby 2.5.0 or higher."
    echo "   See README.md for installation instructions."
    exit 1
fi

# Check Ruby version
ruby_version=$(ruby -v | awk '{print $2}')
required_version="2.5.0"

if [ "$(printf '%s\n' "$required_version" "$ruby_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Ruby $ruby_version detected"
else
    echo "❌ Ruby version $ruby_version is too old. Please install Ruby 2.5.0 or higher."
    exit 1
fi

# Check if Bundler is installed
if ! command -v bundle &> /dev/null; then
    echo "Installing Bundler..."
    gem install bundler
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Bundler. You might need to run with sudo or fix permissions."
        exit 1
    fi
else
    echo "✅ Bundler detected"
fi

# Install dependencies
echo "Installing project dependencies..."
bundle install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
else
    echo "✅ Dependencies installed successfully"
fi

echo ""
echo "🎉 Setup complete! You can now run the development server with:"
echo "   bundle exec jekyll serve"
echo ""
echo "   Then view the site at: http://localhost:4000"

# Make the script executable when added to git
chmod +x setup.sh 