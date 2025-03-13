@echo off
echo 🎉 Setting up Agent Party documentation site

REM Check if Ruby is installed
where ruby >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ruby is not installed. Please install Ruby 2.5.0 or higher.
    echo    See README.md for installation instructions.
    exit /b 1
)

REM Check Ruby version (simplified version check)
ruby -v | findstr /r "2\.[5-9]\.[0-9]\|3\.[0-9]\.[0-9]" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ruby version is too old. Please install Ruby 2.5.0 or higher.
    exit /b 1
) else (
    echo ✅ Ruby detected with compatible version
)

REM Check if Bundler is installed
where bundle >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Bundler...
    gem install bundler
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install Bundler. You might need to run with administrator privileges.
        exit /b 1
    )
) else (
    echo ✅ Bundler detected
)

REM Install dependencies
echo Installing project dependencies...
call bundle install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies. Please check the error messages above.
    exit /b 1
) else (
    echo ✅ Dependencies installed successfully
)

echo.
echo 🎉 Setup complete! You can now run the development server with:
echo    bundle exec jekyll serve
echo.
echo    Then view the site at: http://localhost:4000 