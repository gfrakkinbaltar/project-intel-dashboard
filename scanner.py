#!/usr/bin/env python3
"""
Project Intelligence Scanner
Analyzes AI-Development directory and generates comprehensive project metadata
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class ProjectScanner:
    """Intelligent project scanner with tech stack detection"""
    
    TECH_INDICATORS = {
        'nextjs': ['next.config.js', 'next.config.mjs', 'next.config.ts'],
        'react': ['package.json'],  # Check contents for react
        'python': ['requirements.txt', 'setup.py', 'pyproject.toml'],
        'typescript': ['tsconfig.json'],
        'docker': ['Dockerfile', 'docker-compose.yml'],
        'prisma': ['prisma/schema.prisma'],
        'tailwind': ['tailwind.config.js', 'tailwind.config.ts'],
        'flask': ['app.py', 'wsgi.py'],
        'django': ['manage.py', 'settings.py']
    }
    
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.projects = []
    
    def scan(self) -> List[Dict]:
        """Scan root directory for projects"""
        print(f"🔍 Scanning: {self.root_dir}")
        
        for item in self.root_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                project = self._analyze_project(item)
                if project:
                    self.projects.append(project)
                    print(f"  ✅ Found: {project['name']} ({project['type']})")
        
        return self.projects
    
    def _analyze_project(self, path: Path) -> Optional[Dict]:
        """Analyze single project directory"""
        # Skip if no substantial files
        files = list(path.glob('*'))
        if len(files) < 3:
            return None
        
        project = {
            'name': path.name,
            'path': str(path),
            'type': 'unknown',
            'stack': [],
            'files': [],
            'size': self._get_dir_size(path),
            'last_modified': datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
            'has_git': (path / '.git').exists(),
            'has_readme': any((path / name).exists() for name in ['README.md', 'README.txt']),
            'health_score': 0
        }
        
        # Detect tech stack
        for tech, indicators in self.TECH_INDICATORS.items():
            for indicator in indicators:
                if (path / indicator).exists():
                    project['stack'].append(tech)
        
        # Determine project type
        project['type'] = self._infer_type(project['stack'], path)
        
        # Check package.json for more details
        package_json = path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json) as f:
                    pkg = json.load(f)
                    project['package_name'] = pkg.get('name')
                    project['version'] = pkg.get('version')
                    # Check for React
                    deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
                    if 'react' in deps and 'react' not in project['stack']:
                        project['stack'].append('react')
            except:
                pass
        
        # Calculate health score
        project['health_score'] = self._calculate_health(project, path)
        
        return project
    
    def _infer_type(self, stack: List[str], path: Path) -> str:
        """Infer project type from stack"""
        if 'nextjs' in stack:
            return 'nextjs_app'
        elif 'django' in stack:
            return 'django_app'
        elif 'flask' in stack:
            return 'flask_app'
        elif 'python' in stack:
            return 'python_package'
        elif 'react' in stack:
            return 'react_app'
        elif (path / '.git').exists():
            return 'repository'
        else:
            return 'project'
    
    def _calculate_health(self, project: Dict, path: Path) -> int:
        """Calculate project health score (0-100)"""
        score = 50  # Base score
        
        # Has README
        if project['has_readme']:
            score += 10
        
        # Has git
        if project['has_git']:
            score += 10
        
        # Has package.json with version
        if project.get('version'):
            score += 10
        
        # Multiple tech stack (more sophisticated)
        if len(project['stack']) >= 2:
            score += 10
        
        # Has tests
        if any((path / test_dir).exists() for test_dir in ['tests', 'test', '__tests__']):
            score += 10
        
        return min(score, 100)
    
    def _get_dir_size(self, path: Path) -> int:
        """Get directory size in bytes"""
        total = 0
        try:
            for entry in path.rglob('*'):
                if entry.is_file():
                    total += entry.stat().st_size
        except:
            pass
        return total
    
    def export_json(self, output_path: str):
        """Export scan results to JSON"""
        data = {
            'scanned_at': datetime.now().isoformat(),
            'root_dir': str(self.root_dir),
            'total_projects': len(self.projects),
            'projects': self.projects
        }
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n📊 Exported {len(self.projects)} projects to {output_path}")


if __name__ == '__main__':
    import sys
    
    root = sys.argv[1] if len(sys.argv) > 1 else '/home/gaius/AI-Development'
    output = sys.argv[2] if len(sys.argv) > 2 else 'project_scan.json'
    
    scanner = ProjectScanner(root)
    projects = scanner.scan()
    scanner.export_json(output)
    
    print(f"\n✅ Scan complete!")
    print(f"   Projects found: {len(projects)}")
    print(f"   Average health: {sum(p['health_score'] for p in projects) / len(projects):.1f}/100")
