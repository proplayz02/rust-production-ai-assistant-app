#!/usr/bin/env python3
"""
Simple TTS Server using pyttsx3
Provides HTTP endpoints for text-to-speech conversion
"""

import json
import io
import wave
import tempfile
import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pyttsx3
import threading

app = Flask(__name__)
CORS(app)

# Initialize TTS engine
engine = None
voices = []

def init_tts():
    """Initialize the TTS engine and get available voices"""
    global engine, voices
    try:
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        print(f"TTS initialized with {len(voices)} voices")
        return True
    except Exception as e:
        print(f"Failed to initialize TTS: {e}")
        return False

def get_voice_by_name(name):
    """Get voice by name or return default"""
    if not voices:
        return None
    
    # Try to find voice by name
    for voice in voices:
        if name.lower() in voice.name.lower():
            return voice
    
    # Return first available voice
    return voices[0] if voices else None

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get list of available voices"""
    try:
        voice_names = [voice.name for voice in voices] if voices else []
        return jsonify(voice_names)
    except Exception as e:
        print(f"Error getting voices: {e}")
        return jsonify([])

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """Convert text to speech and return audio"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        voice_name = data.get('voice', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        if not engine:
            return jsonify({'error': 'TTS engine not initialized'}), 500
        
        # Set voice if specified
        if voice_name and voices:
            voice = get_voice_by_name(voice_name)
            if voice:
                engine.setProperty('voice', voice.id)
        
        # Configure speech properties
        engine.setProperty('rate', 150)    # Speed of speech
        engine.setProperty('volume', 0.8)  # Volume (0.0 to 1.0)
        
        # Generate speech to temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            engine.save_to_file(text, temp_path)
            engine.runAndWait()
            
            # Read the generated audio file
            with open(temp_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            # Return audio as response
            response = app.response_class(
                response=audio_data,
                status=200,
                mimetype='audio/wav'
            )
            response.headers['Content-Disposition'] = 'inline; filename=tts.wav'
            return response
            
        except Exception as e:
            # Clean up on error
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
            
    except Exception as e:
        print(f"TTS error: {e}")
        return jsonify({'error': f'TTS generation failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'tts_available': engine is not None,
        'voices_count': len(voices) if voices else 0
    })

if __name__ == '__main__':
    print("Initializing TTS Server...")
    
    if not init_tts():
        print("Failed to initialize TTS engine. Server will start but TTS will not work.")
        print("Make sure you have pyttsx3 installed: pip install pyttsx3")
    
    print("Starting TTS Server on http://localhost:5002")
    print("Available endpoints:")
    print("  GET  /api/voices - List available voices")
    print("  POST /api/tts    - Convert text to speech")
    print("  GET  /health     - Health check")
    
    app.run(host='0.0.0.0', port=5002, debug=False) 