import React, { useState, useEffect } from 'react';
import { Activity, Folder, Code, GitBranch, TrendingUp, RefreshCw, Zap, Cpu, Server, Terminal, Sparkles, ExternalLink, Bot, Brain } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AIDevMissionControl = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchAiStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/stats')
      ]);
      const projectsData = await projectsRes.json();
      const statsData = await statsRes.json();
      setProjects(projectsData.projects || []);
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchAiStatus = async () => {
    try {
      const [aiRes, resourcesRes] = await Promise.all([
        fetch('/api/ai-status'),
        fetch('/api/system-resources')
      ]);
      const aiData = await aiRes.json();
      const resourcesData = await resourcesRes.json();
      setAiStatus(aiData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error fetching AI status:', error);
    }
  };

  const triggerScan = async () => {
    setScanning(true);
    try {
      await fetch('/api/scan', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Error scanning:', error);
    }
    setScanning(false);
  };

  const openInCline = async (projectPath) => {
    try {
      await fetch('/api/project/open-cline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_path: projectPath })
      });
    } catch (error) {
      console.error('Error opening in Cline:', error);
    }
  };


  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const techStackData = stats?.tech_stack_breakdown ? 
    Object.entries(stats.tech_stack_breakdown).map(([name, value]) => ({ name, value })) : [];

  const projectTypeData = stats?.project_types ?
    Object.entries(stats.project_types).map(([name, value]) => ({ name, value })) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl flex items-center gap-3">
          <RefreshCw className="animate-spin" />
          Initializing AI Mission Control...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="border-b border-purple-500/30 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-cyan-400 animate-pulse" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  AI Development Mission Control
                </h1>
                <p className="text-sm text-purple-300">Enhanced Intelligence Dashboard</p>
              </div>
            </div>
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan Projects'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Assistant Status */}
        {aiStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`bg-gradient-to-br ${aiStatus.desktop_commander.rate_limited ? 'from-red-500/20 to-orange-500/20 border-red-500/30' : 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'} border rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-cyan-400" />
                  <span className="font-semibold">Desktop Commander</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${aiStatus.desktop_commander.available ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              </div>
              <div className="text-sm text-cyan-200">{aiStatus.desktop_commander.model}</div>
              <div className="text-xs text-purple-300 mt-1">Cloud • Strategic Planning</div>
            </div>

            <div className={`bg-gradient-to-br ${aiStatus.cline.connected ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' : 'from-gray-500/20 to-slate-500/20 border-gray-500/30'} border rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-green-400" />
                  <span className="font-semibold">Cline</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${aiStatus.cline.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              </div>
              <div className="text-sm text-green-200">{aiStatus.cline.model}</div>
              <div className="text-xs text-purple-300 mt-1">Local • Continuous Coding</div>
            </div>

            <div className={`bg-gradient-to-br ${aiStatus.lmstudio.online ? 'from-purple-500/20 to-pink-500/20 border-purple-500/30' : 'from-gray-500/20 to-slate-500/20 border-gray-500/30'} border rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-6 h-6 text-purple-400" />
                  <span className="font-semibold">LMStudio</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${aiStatus.lmstudio.online ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              </div>
              <div className="text-sm text-purple-200">{aiStatus.lmstudio.models.length} models loaded</div>
              <div className="text-xs text-purple-300 mt-1">Local • API Available</div>
            </div>
          </div>
        )}

        {/* System Resources */}
        {resources && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">CPU</span>
                </div>
                <span className="text-xl font-bold">{resources.cpu_percent?.toFixed(1)}%</span>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all" style={{width: `${resources.cpu_percent}%`}}></div>
              </div>
            </div>

            <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Memory</span>
                </div>
                <span className="text-xl font-bold">{resources.memory_percent?.toFixed(1)}%</span>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all" style={{width: `${resources.memory_percent}%`}}></div>
              </div>
              <div className="text-xs text-purple-300 mt-1">{resources.memory_available_gb?.toFixed(1)} GB available</div>
            </div>

            <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Disk</span>
                </div>
                <span className="text-xl font-bold">{resources.disk_percent?.toFixed(1)}%</span>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all" style={{width: `${resources.disk_percent}%`}}></div>
              </div>
              <div className="text-xs text-purple-300 mt-1">{resources.disk_free_gb?.toFixed(1)} GB free</div>
            </div>
          </div>
        )}

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Folder className="w-8 h-8 text-cyan-400" />
              <span className="text-3xl font-bold">{stats?.total_projects || 0}</span>
            </div>
            <div className="text-cyan-200 text-sm">Total Projects</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold">{Math.round(stats?.average_health || 0)}</span>
            </div>
            <div className="text-green-200 text-sm">Avg Health</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <GitBranch className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold">{stats?.has_git || 0}</span>
            </div>
            <div className="text-purple-200 text-sm">Git Repos</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Code className="w-8 h-8 text-orange-400" />
              <span className="text-3xl font-bold">{Object.keys(stats?.tech_stack_breakdown || {}).length}</span>
            </div>
            <div className="text-orange-200 text-sm">Tech Stacks</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black/40 border border-purple-500/30 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Tech Stack Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={techStackData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {techStackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-black/40 border border-purple-500/30 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-cyan-400" />
              Project Types
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectTypeData}>
                <XAxis dataKey="name" stroke="#a78bfa" />
                <YAxis stroke="#a78bfa" />
                <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #7c3aed' }} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects List with Actions */}
        <div className="bg-black/40 border border-purple-500/30 rounded-xl p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Active Projects
          </h3>
          <div className="space-y-3">
            {projects.slice(0, 15).map((project, idx) => (
              <div 
                key={idx}
                className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-lg p-4 hover:border-purple-400/50 transition-all hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-cyan-300">{project.name}</h4>
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-600/40 border border-purple-400/30">
                        {project.type}
                      </span>
                      {project.git_status?.has_changes && (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-600/40 border border-orange-400/30 animate-pulse">
                          {project.git_status.files_changed} changes
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.stack.map((tech, i) => (
                        <span key={i} className="px-2 py-1 text-xs rounded bg-blue-600/30 border border-blue-400/30">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openInCline(project.path)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600/30 hover:bg-green-600/50 border border-green-400/30 rounded transition-colors"
                      >
                        <Terminal className="w-3 h-3" />
                        Open in Cline
                      </button>
                      <a
                        href={`file://${project.path}`}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Browse
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold text-green-400">{project.health_score}</div>
                    <div className="text-xs text-purple-300">Health</div>
                    {project.has_git && <GitBranch className="w-4 h-4 text-purple-400" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDevMissionControl;
