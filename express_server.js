var cookieSession = require("cookie-session");
var express = require("express");
let app = express();
var PORT = process.env.PORT || 8080;
let bcrypt = require("bcrypt");

app.use(cookieSession({
  name: 'user_id',
  secret: "mylittlesecret"
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

let methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({
  extended: true
}));


// A function to format a message with html and 3 seconds to user
function systemMessages(text) {
  let userMessage = '';
  userMessage = '<body style="background-color:powderblue;text-align:center;font-size:50px"><br/><br/>' + text + '</body> <script>onload = function(){ setTimeout(function(){history.back();}, 3000);}</script>'
  return userMessage;
}

const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.set("view engine", "ejs")

const urlDatabase = {
  "111111": {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  },
  "222222": {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  }
};

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: userDatabase[req.session.user_id],
    urlDatabase: urlDatabase[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      username: userDatabase[req.session.user_id],
      urlDatabase: urlDatabase[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

app.put("/urls/:shortURL", (req, res) => {
  urlDatabase[req.session.user_id][req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/urls/:shortURL", function(req, res) {
  if (req.session.user_id) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.session.user_id][req.params.shortURL],
      username: userDatabase[req.session.user_id]
    };
    res.render("urls_show", templateVars);
    return;
  } else {
    res.status(400).send(systemMessages('You cant do it if you are not logged in.'));
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  } else {
    let longURL;
    for (let userId in urlDatabase) {
      for (let shortUrl in urlDatabase[userId]) {
        if (shortUrl === req.params.shortURL)
          longURL = urlDatabase[userId][shortUrl];
      }
    }
    if (longURL) {
      res.redirect(longURL);
      return;
    } else {
      res.status(400).send(systemMessages('This Short url does not exist'));
    }
  }
});

app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_register");
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    const shortURL = generateRandomString();
    let longURL = `http://${req.body.longURL}`;

    if (urlDatabase[req.session.user_id]) {
      urlDatabase[req.session.user_id][shortURL] = longURL;
    } else {
      urlDatabase[req.session.user_id] = {
        [shortURL]: longURL
      };
    }

    res.redirect("/urls");
    return;
  } else {
    res.status(400).send(systemMessages('You cant post if you arent logged in'));
  }
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id) {
    for (let urlId in urlDatabase[req.session.user_id]) {

      if (urlId === req.params.shortURL) {
        if (req.params.shortURL) {
          delete urlDatabase[req.session.user_id][req.params.shortURL];
          res.redirect("/urls");
          return;
        } else {
          res.status(400).send(systemMessages('I didnt find URL to delete.'));
          return;
        }
      }
    }
  } else {
    res.status(400).send(systemMessages('You are not be able to delete if you are not logged in.'));
    return;
  }
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  if (!userEmail || userEmail === '' && !userPassword || userPassword === '') {
    res.status(400).send(systemMessages('Fields cannot be Empty.'));
  } else {
    for (userId in userDatabase) {
      if (userDatabase[userId].email === userEmail) {
        if (bcrypt.compareSync(userPassword, userDatabase[userId].password)) {
          req.session.user_id = userId;
          res.redirect("/urls");
          return;
        }
      }
    }
    res.status(400).send(systemMessages('Login or password is not correct.'));
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password) {
    res.status(400).send(systemMessages('Blank cannot be used for user or password.'));
  } else {

    const newUserId = randomString(6);
    let userExist = false;

    for (let userId in userDatabase) {
      if (userDatabase[userId].email === req.body.email) {
        userExist = true;
      }
    }
    if (userExist) {
      res.status(400).send(systemMessages('User exist. Choose another one.'));
    } else {
      userDatabase[newUserId] = {
        id: newUserId,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 15)
      };
      req.session.user_id = newUserId;
      res.redirect("/urls");
    }
  }
});

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

function randomString(len, charSet) {
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < len + 1; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});