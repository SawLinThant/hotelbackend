var express = require('express');
var path = require('path');

var indexRouter = require('./routes/index');
var terminalRouter = require('./routes/terminal');
var fileUploadRouter = require('./routes/fileUpload');
var staffRouter = require('./routes/staff');
var cardRouter = require('./routes/card');
var customerRouter = require('./routes/customer');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/terminal', terminalRouter);
app.use("/getFileUploadUrl", fileUploadRouter);
app.use("/staff", staffRouter);
app.use("/card", cardRouter);
app.use("/customer", customerRouter);
app.get('/test', (req, res) => {
    res.json({ message: "This is a test route" });
});

module.exports = app;
