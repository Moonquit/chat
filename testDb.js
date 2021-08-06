const mongoose = require('./libs/mongoose');

async function requireModels() {
    require('./models/user');

    let tasks = Object.keys(mongoose.models).map((modelName) => {
        return mongoose.models[modelName].ensureIndexes();
    });

    await Promise.all(tasks);
}

async function runTest() {
    await mongoose.connection.db.dropDatabase();
    console.log('Successfuly dropped!');

    await requireModels();
    const { User } = mongoose.models;

    try {
        let result = await Promise.all([
            new User({username: 'John', password: 'jhnPasswd'}).save(),
            new User({username: 'Alex', password: 'al123xx'}).save(),
            new User({username: 'Michael', password: 'michEl1'}).save(),
        ]);
        console.log(result);
    } catch(err) {
        console.error('Catch:', err)
    } finally {
        mongoose.disconnect().then(() => console.log('Connection closed'));
    }
}

// mongoose.set('debug', true);
mongoose.connection.on('error', (err) => console.error(err));
mongoose.connection.on('open', function() {
    runTest();
});
