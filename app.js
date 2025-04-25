const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Save Dockerfile
app.post('/save', async (req, res) => {
    const { projectName, content } = req.body;
    const projectPath = path.join(__dirname, 'MyProjects', projectName);
    
    try {
        await fs.ensureDir(projectPath);
        await fs.writeFile(path.join(projectPath, 'Dockerfile'), content);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get list of projects
app.get('/projects', async (req, res) => {
    try {
        const projects = await fs.readdir(path.join(__dirname, 'MyProjects'));
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Dockerfile content
app.get('/getDockerfile/:project', async (req, res) => {
    try {
        const content = await fs.readFile(
            path.join(__dirname, 'MyProjects', req.params.project, 'Dockerfile'),
            'utf-8'
        );
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));