const commands = [
    {
        name: 'FROM',
        example: 'ubuntu:22.04',
        description: 'Sets the base image for subsequent instructions'
    },
    {
        name: 'RUN',
        example: 'apt-get update && apt-get install -y curl',
        description: 'Executes commands in a new layer'
    },
    {
        name: 'COPY',
        example: './app /usr/src/app',
        description: 'Copies files/directories from source to dest'
    },
    {
        name: 'WORKDIR',
        example: '/app',
        description: 'Sets the working directory'
    },
    {
        name: 'EXPOSE',
        example: '8080',
        description: 'Documents which ports the container listens on'
    },
    {
        name: 'ENV',
        example: 'NODE_ENV production',
        description: 'Sets environment variables'
    },
    {
        name: 'CMD',
        example: '["npm", "start"]',
        description: 'Default command to execute when container runs'
    },
    {
        name: 'ARG',
        example: 'VERSION=latest',
        description: 'Defines build-time variables'
    },
    {
        name: 'VOLUME',
        example: '/data',
        description: 'Creates a mount point for volumes'
    },
    {
        name: 'ENTRYPOINT',
        example: '["/app/entrypoint.sh"]',
        description: 'Configure container to run as executable'
    }
];

let editor = null;
let selectedCommand = commands[0];
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '',
        language: 'dockerfile',
        theme: 'vs-dark',
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        contextmenu: false
    });

    // Add keybinding for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        compileDockerfile();
    });
});

function initCommands() {
    const container = document.getElementById('commands-list');
    const filterInput = document.getElementById('command-filter');
    
    const renderCommands = (filter = '') => {
        container.innerHTML = '';
        commands
            .filter(cmd => cmd.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(cmd => {
                const btn = document.createElement('button');
                btn.className = 'command-btn';
                btn.innerHTML = `
                    <span>${cmd.name}</span>
                    <i class="info-icon fas fa-info-circle" data-cmd="${cmd.name}"></i>
                `;
                
                btn.addEventListener('click', () => selectCommand(cmd));
                btn.querySelector('.info-icon').addEventListener('click', (e) => {
                    e.stopPropagation();
                    showTooltip(cmd, e.target);
                });
                container.appendChild(btn);
            });
    };

    filterInput.addEventListener('input', (e) => renderCommands(e.target.value));
    renderCommands();
}

function showTooltip(cmd, target) {
    const rect = target.getBoundingClientRect();
    tooltip.innerHTML = `
        <h3>${cmd.name}</h3>
        <p>${cmd.description}</p>
        <pre><code>${cmd.name} ${cmd.example}</code></pre>
    `;
    tooltip.style.left = `${rect.left + 20}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.classList.add('visible');
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

function selectCommand(cmd) {
    selectedCommand = cmd;
    document.querySelectorAll('.command-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent.includes(cmd.name));
    });
    document.getElementById('selected-command').textContent = cmd.name;
    document.getElementById('command-arg').placeholder = `e.g.: ${cmd.example}`;
    document.getElementById('command-arg').focus();
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.info-icon')) {
        hideTooltip();
    }
});

async function addCommand() {
    const arg = document.getElementById('command-arg').value.trim();
    if (!arg) return;
    
    const line = `${selectedCommand.name} ${arg}\n`;
    const model = editor.getModel();
    const position = editor.getPosition();
    const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    };
    
    editor.executeEdits('add-command', [{
        range,
        text: line,
        forceMoveMarkers: true
    }]);
    
    document.getElementById('command-arg').value = '';
}

async function compileDockerfile() {
    const content = editor.getValue();
    const projectName = document.getElementById('project-name').value.trim();
    
    if (!projectName) {
        alert('Please enter a project name');
        return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
        alert('Project name can only contain letters, numbers, underscores and hyphens');
        return;
    }

    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName, content })
        });

        if (!response.ok) throw new Error('Save failed');
        
        alert('Project saved successfully!');
        loadProjects();
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving project: ' + error.message);
    }
}

async function loadProjects() {
    try {
        const response = await fetch('/projects');
        if (!response.ok) throw new Error('Failed to load projects');
        
        const projects = await response.json();
        const select = document.getElementById('projects-list');
        select.innerHTML = `
            <option value="">Select a project...</option>
            ${projects.map(p => `<option>${p}</option>`).join('')}
        `;
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading projects: ' + error.message);
    }
}

async function loadProject(projectName) {
    if (!projectName) return;
    
    try {
        const response = await fetch(`/getDockerfile/${projectName}`);
        if (!response.ok) throw new Error('Failed to load project');
        
        const { content } = await response.json();
        editor.setValue(content);
        document.getElementById('project-name').value = projectName;
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading project: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCommands();
    selectCommand(commands[0]);
    loadProjects();
});