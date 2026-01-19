const { MongoClient, ObjectId } = require('mongodb');

let client;
let db;
let usersCollection;
let todosCollection;

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI;
        
        // If no MongoDB URI provided, skip MongoDB connection (use JSON file instead)
        if (!uri || uri === 'mongodb://localhost:27017/pennywise-todo') {
            console.log('⚠️  No MongoDB URI provided - using JSON file storage');
            return;
        }
        
        client = new MongoClient(uri);
        await client.connect();
        db = client.db('pennywise-todo');
        usersCollection = db.collection('users');
        todosCollection = db.collection('todos');
        
        // Create indexes
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ username: 1 });
        await todosCollection.createIndex({ user_id: 1 });
        
        console.log('🎪 MongoDB connected successfully');
    } catch (error) {
        console.error('⚠️  MongoDB connection error - falling back to JSON storage:', error.message);
        // Don't throw - allow fallback to JSON storage
    }
}

const db_interface = {
    prepare: (query) => {
        return {
            get: async (...params) => {
                try {
                    if (query.includes('SELECT * FROM users WHERE email')) {
                        const user = await usersCollection.findOne({
                            $or: [{ email: params[0] }, { username: params[1] || params[0] }]
                        });
                        return user ? { ...user, id: user._id.toString() } : null;
                    }
                    if (query.includes('SELECT * FROM todos WHERE id')) {
                        const todo = await todosCollection.findOne({
                            _id: new ObjectId(params[0]),
                            ...(params[1] && { user_id: params[1] })
                        });
                        return todo ? { ...todo, id: todo._id.toString() } : null;
                    }
                    return null;
                } catch (error) {
                    console.error('Get error:', error);
                    return null;
                }
            },
            all: async (...params) => {
                try {
                    if (query.includes('SELECT * FROM todos WHERE user_id')) {
                        const todos = await todosCollection.find({ user_id: params[0] }).toArray();
                        return todos.map(t => ({ ...t, id: t._id.toString() }));
                    }
                    return [];
                } catch (error) {
                    console.error('All error:', error);
                    return [];
                }
            },
            run: async (...params) => {
                try {
                    if (query.includes('INSERT INTO users')) {
                        const result = await usersCollection.insertOne({
                            username: params[0],
                            email: params[1],
                            password: params[2],
                            created_at: new Date().toISOString()
                        });
                        return { lastInsertRowid: result.insertedId.toString() };
                    }
                    
                    if (query.includes('INSERT INTO todos')) {
                        const result = await todosCollection.insertOne({
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
                        return { lastInsertRowid: result.insertedId.toString() };
                    }
                    
                    if (query.includes('UPDATE todos')) {
                        const todoId = params[5]; // ID is now at index 5
                        const updateData = {
                            completed: params[0],
                            text: params[1],
                            scheduled_day: params[2],
                            start_time: params[4] !== undefined ? params[4] : null
                        };
                        
                        if (params[0] === 1 && !params[3]) {
                            updateData.completed_date = new Date().toISOString();
                        } else if (params[0] === 0) {
                            updateData.completed_date = null;
                        } else if (params[3]) {
                            updateData.completed_date = params[3];
                        }
                        
                        await todosCollection.updateOne(
                            { _id: new ObjectId(todoId) },
                            { $set: updateData }
                        );
                        return { changes: 1 };
                    }
                    
                    if (query.includes('UPDATE users SET password')) {
                        await usersCollection.updateOne(
                            { _id: new ObjectId(params[1]) },
                            { $set: { password: params[0] } }
                        );
                        return { changes: 1 };
                    }
                    
                    if (query.includes('DELETE FROM todos WHERE id')) {
                        await todosCollection.deleteOne({ _id: new ObjectId(params[0]) });
                        return { changes: 1 };
                    }
                    
                    if (query.includes('DELETE FROM todos WHERE user_id')) {
                        await todosCollection.deleteMany({ user_id: params[0] });
                        return { changes: 1 };
                    }
                    
                    if (query.includes('DELETE FROM users WHERE id')) {
                        await usersCollection.deleteOne({ _id: new ObjectId(params[0]) });
                        return { changes: 1 };
                    }
                    
                    return { lastInsertRowid: 0 };
                } catch (error) {
                    console.error('Run error:', error);
                    throw error;
                }
            }
        };
    }
};

module.exports = { connectDB, db: db_interface };
