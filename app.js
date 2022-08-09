const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/users');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var crypto = require('crypto');
const { urlToHttpOptions } = require('url');
var key = "password";
var algo = 'aes256';
// 
var jwt = require('jsonwebtoken');
var jwtKey = "jwt";
// 
mongoose.connect('mongodb+srv://Abhishek:B77LUOnffBp6kd86@cluster0.sehxq.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("connected"))

app.post('/register', jsonParser, (req, res) => {
    var cipher = crypto.createCipher(algo, key);
    var encrypted = cipher.update(req.body.password, 'utf8', 'hex') + cipher.final('hex');
    // console.log(req.body,encrypted);
    // console.log(encrypted);
    const data = new User({
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        password: encrypted
    })

    data.save().then((result) => {
        jwt.sign({ result }, jwtKey, { expiresIn: '300s' }, (err, token) => {
            res.status(201).json({ token });
        })
        // res.status(201).json(result);
    }).catch((err) => console.log(err));

    // res.end("Hello");
});


app.post('/login', jsonParser, (req, res) => {
    User.findOne({ email: req.body.email }).then((data) => {
        // console.log(res.json(data));
        var decipher = crypto.createDecipher(algo, key);
        var decrypted = decipher.update(data.password, 'hex', 'utf8') + decipher.final('utf8');
        if (decrypted == req.body.password) {
            jwt.sign({ data }, jwtKey, { expiresIn: '300s' }, (err, token) => {
                res.status(200).json({ token });
            })
        }
        // console.log("Decrypted",decrypted);
    })
});

app.get('/users', verifyToken, (req, res) => {
    User.find().then((result) => {
        res.status(200).json(result);
    }).catch((err) => console.log(err))
});

// token verification
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        // console.log(bearer[1]);
        req.token = bearer[1];
        jwt.verify(req.token, jwtKey, (err, authData) => {
            if (err) {
                res.json({ result: err });
            } else {
                next();
            }
        })
    } else {
        res.send({ "result": "Token is not provide" });
    }
}

app.listen(3000);