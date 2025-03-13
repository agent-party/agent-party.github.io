# Agent Party Documentation Website

This repository contains the Jekyll-based documentation website for the Agent Party platform.

## Local Development Setup

There are multiple ways to set up the development environment:

1. [Standard Setup](#standard-setup) - Using Ruby and Jekyll directly
2. [Quick Setup Script](#quick-setup-script) - Using our provided setup scripts
3. [Docker Setup](#docker-setup) - Using Docker containers

## Standard Setup

### Prerequisites

- **Ruby**: Jekyll requires Ruby version 2.5.0 or higher
- **RubyGems**: The Ruby package manager
- **GCC and Make**: Required for installing some Ruby gems

### Installation Instructions

#### For macOS:

1. Install Ruby using Homebrew:
   ```bash
   brew install ruby
   ```

2. Add Ruby to your PATH in ~/.zshrc or ~/.bash_profile:
   ```bash
   echo 'export PATH="/usr/local/opt/ruby/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

#### For Ubuntu/Debian:

1. Install prerequisites:
   ```bash
   sudo apt-get update
   sudo apt-get install ruby-full build-essential zlib1g-dev
   ```

2. Set up Ruby Gems to install to your user directory:
   ```bash
   echo '# Install Ruby Gems to ~/gems' >> ~/.bashrc
   echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
   echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

#### For Windows:

1. Install Ruby using the [RubyInstaller](https://rubyinstaller.org/)
2. During installation, make sure to check "Add Ruby executables to your PATH"

### Setting Up the Site

1. Clone the repository:
   ```bash
   git clone https://github.com/agent-party/agent-party.github.io.git
   cd agent-party.github.io
   ```

2. Install Jekyll and Bundler:
   ```bash
   gem install jekyll bundler
   ```

3. Install dependencies:
   ```bash
   bundle install
   ```

### Running the Development Server

1. Start the Jekyll development server:
   ```bash
   bundle exec jekyll serve
   ```

2. View the site in your browser at [http://localhost:4000](http://localhost:4000)

The development server includes live reloading, so changes to files will automatically refresh in your browser.

## Quick Setup Script

We provide setup scripts to automate the installation process:

### For macOS/Linux:

```bash
# Make the script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

### For Windows:

```
setup.bat
```

After running the setup script, you can start the development server:

```bash
bundle exec jekyll serve
```

## Docker Setup

If you prefer using Docker, we provide a Docker configuration:

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Running with Docker

1. Build and start the container:
   ```bash
   docker-compose up
   ```

2. View the site in your browser at [http://localhost:4000](http://localhost:4000)

The Docker setup includes live reloading, and changes to files will be reflected in the container.

To stop the container:

```bash
docker-compose down
```

## Building for Production

To build the site for production:

```bash
bundle exec jekyll build
```

This generates the static site in the `_site` directory.

## Project Structure

- `_config.yml`: Jekyll configuration
- `_data/`: YAML files containing structured data (navigation, agents)
- `_includes/`: Reusable components and SVG files
- `_layouts/`: Template layouts
- `_posts/`: Blog posts
- `assets/`: Static files (CSS, JavaScript, images)
- `pages/`: Content pages

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Make your changes
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature/my-new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 