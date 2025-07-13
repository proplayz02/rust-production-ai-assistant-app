#!/bin/bash

# TTS Server Startup Script

echo "Starting TTS Server..."

# Check if virtual environment exists
if [ ! -d "tts_env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv tts_env
fi

# Activate virtual environment and install dependencies
echo "Installing dependencies..."
source tts_env/bin/activate
pip install flask flask-cors pyttsx3

# Start the TTS server
echo "Starting TTS server on http://localhost:5002"
python tts_server.py 