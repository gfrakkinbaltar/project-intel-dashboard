#!/usr/bin/env python3
"""
AI Development Mission Control - Enhanced Backend
Real-time project monitoring with full AI integration
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import subprocess
import requests
import psutil
import time
from pathlib import Path
from datetime import datetime
from scanner import ProjectScanner

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

# Paths
PROJECT_ROOT = Path('/home/gaius/AI-Development')
SCAN_CACHE = Path('project_scan.json')
SKILL_SEEKERS = Path('/home/gaius/Skill_Seekers/venv/bin/skill-seekers')
CURSOR_CONFIG = Path('/home/gaius/.config/Cursor/User/settings.json')

# LMStudio endpoint
LMSTUDIO_API = 'http://localhost:1234/v1'

# Helper functions
def load_projects():
    if SCAN_CACHE.exists():
        with open(SCAN_CACHE) as f:
            return json.load(f)
    return {'projects': [], 'total_projects': 0}

def get_lmstudio_status():
    """Check LMStudio status and loaded model"""
    try:
        response = requests.get(f'{LMSTUDIO_API}/models', timeout=2)
        if response.status_code == 200:
            models = response.json().get('data', [])
            return {
                'online': True,
                'models': [m['id'] for m in models],
                'active_model': models[0]['id'] if models else None
            }
    except:
        pass
    return {'online': False, 'models': [], 'active_model': None}

def get_system_resources():
    """Get system resource usage"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available_gb': memory.available / (1024**3),
            'disk_percent': disk.percent,
            'disk_free_gb': disk.free / (1024**3)
        }
    except:
        return {}

def get_git_status(project_path):
    """Get git status for a project"""
    try:
        result = subprocess.run(
            ['git', '-C', project_path, 'status', '--short'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            return {
                'has_changes': len(result.stdout.strip()) > 0,
                'files_changed': len([l for l in lines if l.strip()])
            }
    except:
        pass
    return {'has_changes': False, 'files_changed': 0}

# API Routes
@app.route('/api/ai-status')
def ai_status():
    """Get status of all AI assistants"""
    lmstudio = get_lmstudio_status()
    
    status = {
        'desktop_commander': {
            'available': True,
            'type': 'cloud',
            'model': 'Claude Sonnet 4.5',
            'rate_limited': False  # Will be updated dynamically
        },
        'cline': {
            'configured': CURSOR_CONFIG.exists(),
            'type': 'local',
            'connected': lmstudio['online'],
            'model': lmstudio.get('active_model', 'Not loaded')
        },
        'lmstudio': lmstudio,
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(status)

@app.route('/api/system-resources')
def system_resources():
    """Get system resource usage"""
    resources = get_system_resources()
    return jsonify(resources)

@app.route('/api/projects')
def get_projects():
    """Get all scanned projects with enhanced data"""
    data = load_projects()
    projects = data.get('projects', [])
    
    # Enhance with git status
    for project in projects:
        project['git_status'] = get_git_status(project['path'])
    
    data['projects'] = projects
    return jsonify(data)

@app.route('/api/projects/<path:project_name>')
def get_project(project_name):
    """Get single project details"""
    data = load_projects()
    for project in data.get('projects', []):
        if project['name'] == project_name:
            project['git_status'] = get_git_status(project['path'])
            return jsonify(project)
    return jsonify({'error': 'Project not found'}), 404

@app.route('/api/scan', methods=['POST'])
def trigger_scan():
    """Trigger new project scan"""
    try:
        scanner = ProjectScanner(str(PROJECT_ROOT))
        projects = scanner.scan()
        scanner.export_json(str(SCAN_CACHE))
        return jsonify({
            'success': True,
            'projects_found': len(projects),
            'message': 'Scan complete'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/query', methods=['POST'])
def ai_query():
    """Query local AI about a project"""
    data = request.json
    prompt = data.get('prompt')
    project_context = data.get('project_context', '')
    
    if not prompt:
        return jsonify({'error': 'Missing prompt'}), 400
    
    try:
        response = requests.post(f'{LMSTUDIO_API}/chat/completions', json={
            'model': 'qwen3-coder-30b',
            'messages': [
                {'role': 'system', 'content': f'You are a helpful coding assistant. Project context: {project_context}'},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 500
        }, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({
                'success': True,
                'response': result['choices'][0]['message']['content']
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/project/open-cline', methods=['POST'])
def open_in_cline():
    """Open project in Cursor with Cline"""
    data = request.json
    project_path = data.get('project_path')
    
    if not project_path:
        return jsonify({'error': 'Missing project_path'}), 400
    
    try:
        subprocess.Popen(['cursor', project_path])
        return jsonify({'success': True, 'message': 'Opening in Cursor'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """Get enhanced dashboard statistics"""
    data = load_projects()
    projects = data.get('projects', [])
    
    stats = {
        'total_projects': len(projects),
        'average_health': sum(p['health_score'] for p in projects) / len(projects) if projects else 0,
        'tech_stack_breakdown': {},
        'project_types': {},
        'has_git': sum(1 for p in projects if p.get('has_git')),
        'has_readme': sum(1 for p in projects if p.get('has_readme')),
        'total_size_gb': sum(p.get('size', 0) for p in projects) / (1024**3)
    }
    
    for project in projects:
        for tech in project.get('stack', []):
            stats['tech_stack_breakdown'][tech] = stats['tech_stack_breakdown'].get(tech, 0) + 1
        proj_type = project.get('type', 'unknown')
        stats['project_types'][proj_type] = stats['project_types'].get(proj_type, 0) + 1
    
    return jsonify(stats)

@app.route('/')
def serve_frontend():
    return send_from_directory('dist', 'index.html')


if __name__ == '__main__':
    print("🚀 AI Development Mission Control")
    print("   Backend: http://localhost:5000")
    print("   API: http://localhost:5000/api/ai-status")
    print("   Enhanced with AI integration!")
    app.run(debug=True, host='0.0.0.0', port=5000)
