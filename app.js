const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  User.findById('650973700bd842122defcfda')
  // User.findById('650ba8895311e54911d55268')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose.connect('mongodb+srv://vvm1004:test123@cluster0.4a2h5sc.mongodb.net/shop?retryWrites=true&w=majority')
// mongoose.connect("mongodb://127.0.0.1:27017/shop")
.then(result => {
  User.findOne()
  .then(user => {
    if(!user){
      const user = new User({
        name: 'Minh',
        email: 'vovanminhv23@gmail.com',
        cart: {
          items: []
        }
      });
      user.save();
    }
  });
  app.listen(3000)
})
.catch(err => {
  console.log(err)
});