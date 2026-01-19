const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'pennywise.json');

function readDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            console.log('Database file not found, creating new one...');
            const defaultData = { users: [], todos: [] };
            writeDB(defaultData);
            return defaultData;
        }
        const fileContent = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading database:', error);
        return { users: [], todos: [] };
    }
}

function writeDB(data) {
    try {
        // Ensure directory exists
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing database:', error);
    }
}

function initialize() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            writeDB({ users: [], todos: [] });
        }
        console.log('🎪 Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

const db = {
    prepare: (query) => {
        return {
            get: (...params) => {
                const data = readDB();
                if (query.includes('SELECT * FROM users WHERE email')) {
                    return data.users.find(u => u.email === params[0] || u.username === params[1]);
                }
                if (query.includes('SELECT * FROM users WHERE email')) {
                    return data.users.find(u => u.email === params[0]);
                }
                if (query.includes('SELECT * FROM todos WHERE id')) {
                    return data.todos.find(t => t.id === parseInt(params[0]) && (!params[1] || t.user_id === params[1]));
                }
                return null;
            },
            all: (...params) => {
                const data = readDB();
                if (query.includes('SELECT * FROM todos WHERE user_id')) {
                    return data.todos.filter(t => t.user_id === params[0]);
                }
                return [];
            },
            run: (...params) => {
                const data = readDB();
                let lastInsertRowid = 0;
                
                if (query.includes('INSERT INTO users')) {
                    lastInsertRowid = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
                    data.users.push({
                        id: lastInsertRowid,
                        username: params[0],
                        email: params[1],
                        password: params[2],
                        created_at: new Date().toISOString()
                    });
                } else if (query.includes('INSERT INTO todos')) {
                    lastInsertRowid = data.todos.length > 0 ? Math.max(...data.todos.map(t => t.id)) + 1 : 1;
                    data.todos.push({
                        id: lastInsertRowid,
                        user_id: params[0],
                        text: params[1],
                        completed: 0,
                        scheduled_day: params[2] !== undefined ? params[2] : null,
                        start_time: params[3] || null,
                        target_date: params[4] || null,
                        target_datetime: params[5] || null,
                        completed_date: null,
                        created_at: new Date().toISOString()
                    });
                } else if (query.includes('UPDATE todos')) {
                    console.log('UPDATE todos - params:', params);
                    const todoIndex = data.todos.findIndex(t => t.id === parseInt(params[5]));
                    console.log('Found todo at index:', todoIndex);
                    if (todoIndex !== -1) {
                        console.log('Before update:', JSON.stringify(data.todos[todoIndex]));
                        data.todos[todoIndex].completed = params[0];
                        data.todos[todoIndex].text = params[1];
                        data.todos[todoIndex].scheduled_day = params[2];
                        data.todos[todoIndex].start_time = params[4] !== undefined ? params[4] : data.todos[todoIndex].start_time;
                        if (params[0] === 1 && !data.todos[todoIndex].completed_date) {
                            data.todos[todoIndex].completed_date = new Date().toISOString();
                        } else if (params[0] === 0) {
                            data.todos[todoIndex].completed_date = null;
                        }
                        if (params[3]) {
                            data.todos[todoIndex].completed_date = params[3];
                        }
                        console.log('After update:', JSON.stringify(data.todos[todoIndex]));
                    }
                } else if (query.includes('DELETE FROM todos')) {
                    data.todos = data.todos.filter(t => t.id !== parseInt(params[0]));
                }
                
                writeDB(data);
                return { lastInsertRowid };
            }
        };
    }
};

module.exports = {
    db,
    initialize
};
