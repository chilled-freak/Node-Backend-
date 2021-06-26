const mongoose = require('mongoose');
const app = require('./app');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env'});

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
) 

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    userFindAndModify: false,
    useUnifiedTopology: true
}).then(con => {
    console.log('DB Connection Successfully...')
});
 
const port = 3000;
app.listen(port, () => {
    console.log('Port is', port)
});