# TTS Server Implementation

This document describes the Text-to-Speech (TTS) server implementation for the AI Doctor Assistant.

## Overview

The TTS server is a Python-based microservice that provides text-to-speech capabilities using the `pyttsx3` library. It runs on port 5002 and provides HTTP endpoints for voice generation and voice listing.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Rust Backend  │    │   TTS Server    │
│   (Next.js)     │◄──►│   (Axum)        │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. TTS Server (`tts_server.py`)
- **Language**: Python 3
- **Framework**: Flask
- **TTS Engine**: pyttsx3
- **Port**: 5002

### 2. Backend Integration (`src/api/tts.rs`)
- **Language**: Rust
- **Framework**: Axum
- **Function**: Proxies TTS requests to Python server

## API Endpoints

### TTS Server (Python)

#### `GET /health`
Health check endpoint.
```json
{
  "status": "ok",
  "tts_available": true,
  "voices_count": 177
}
```

#### `GET /api/voices`
Returns list of available voices.
```json
["Samantha", "Alex", "Daniel", "Victoria", "Tom", ...]
```

#### `POST /api/tts`
Converts text to speech.
```json
{
  "text": "Hello, this is a test.",
  "voice": "Samantha"
}
```
**Response**: Audio file (WAV format)

### Backend (Rust)

#### `GET /api/tts/voices`
Proxies to TTS server and returns available voices.

#### `POST /api/tts`
Proxies to TTS server and returns audio.

## Setup Instructions

### 1. Install Dependencies

The TTS server uses a Python virtual environment to avoid conflicts with system packages.

```bash
# Create virtual environment
python3 -m venv tts_env

# Activate virtual environment
source tts_env/bin/activate

# Install dependencies
pip install flask flask-cors pyttsx3
```

### 2. Start the TTS Server

#### Option A: Using the startup script
```bash
./start_tts_server.sh
```

#### Option B: Manual startup
```bash
source tts_env/bin/activate
python tts_server.py
```

### 3. Start the Backend

```bash
cargo run
```

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

## Testing

### Test TTS Server Directly
```bash
# Test health endpoint
curl http://localhost:5002/health

# Test voices endpoint
curl http://localhost:5002/api/voices

# Test TTS endpoint
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test.","voice":"Samantha"}' \
  --output test.wav
```

### Test Backend Integration
```bash
# Test backend voices endpoint
curl http://localhost:3001/api/tts/voices

# Test backend TTS endpoint
curl -X POST http://localhost:3001/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test.","voice":"Samantha"}' \
  --output test.wav
```

## Features

### ✅ Implemented
- [x] Text-to-speech conversion
- [x] Voice selection
- [x] Multiple voice support (177+ voices)
- [x] Health monitoring
- [x] Error handling and fallbacks
- [x] CORS support
- [x] Backend integration
- [x] Frontend integration

### 🔧 Configuration

#### Voice Settings
The TTS server configures speech properties:
- **Rate**: 150 (words per minute)
- **Volume**: 0.8 (80% volume)
- **Format**: WAV audio

#### Available Voices
The server provides access to all system voices, including:
- **English**: Samantha, Alex, Daniel, Victoria, Tom
- **International**: Various language-specific voices
- **Special**: Whisper, Bad News, Good News, etc.

## Troubleshooting

### Common Issues

#### 1. TTS Server Not Starting
```bash
# Check if port 5002 is in use
lsof -i :5002

# Kill existing process if needed
pkill -f tts_server.py
```

#### 2. No Voices Available
- Ensure pyttsx3 is properly installed
- Check system speech synthesis settings
- Try different voice names

#### 3. Audio Quality Issues
- Adjust rate and volume in `tts_server.py`
- Try different voices
- Check system audio settings

#### 4. Backend Connection Issues
- Verify TTS server is running on port 5002
- Check firewall settings
- Ensure CORS is properly configured

### Logs

The TTS server provides detailed logging:
- Initialization status
- Voice count
- Error messages
- Request processing

## Performance

### Benchmarks
- **Startup Time**: ~2-3 seconds
- **Voice Generation**: ~1-2 seconds per request
- **Memory Usage**: ~50MB
- **CPU Usage**: Low during idle, moderate during generation

### Optimization Tips
- Use shorter text for faster response
- Cache frequently used phrases
- Consider voice preloading for common voices

## Security

### Current Implementation
- No authentication required
- CORS enabled for development
- Input validation on text length
- Error handling prevents crashes

### Production Considerations
- Add authentication if needed
- Implement rate limiting
- Use HTTPS in production
- Add input sanitization

## Future Enhancements

### Potential Improvements
- [ ] Voice caching
- [ ] Streaming audio
- [ ] Multiple audio formats
- [ ] Voice cloning
- [ ] Emotion detection
- [ ] Real-time speech synthesis

### Alternative TTS Engines
- [ ] Coqui TTS
- [ ] Piper TTS
- [ ] eSpeak
- [ ] Festival
- [ ] Cloud TTS services

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify all services are running
3. Test endpoints individually
4. Check system requirements

## System Requirements

- **Python**: 3.8+
- **Rust**: 1.70+
- **Node.js**: 18+
- **macOS**: 10.15+ (for pyttsx3 compatibility)
- **Memory**: 100MB+ available
- **Storage**: 50MB+ for dependencies 