var cookieSession = require("cookie-session");
var express = require("express");
// var cookieParser = require('cookie-parser');
let app = express();
var PORT = process.env.PORT || 8080; // default port 8080
// app.use(cookieParser());
app.use(cookieSession({
  name: 'user_id',
  secret: "mylittlesecret"
}));

let bcrypt = require("bcrypt");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

let methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({
  extended: true
}));

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

let urlDatabase = {
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
  // if (!req.session.user_id) {
  //   res.redirect("/login");
  // } else {
  res.redirect("/urls");
  // }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    username: userDatabase[req.session.user_id],
    urlDatabase: urlDatabase[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = {
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

    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.session.user_id][req.params.shortURL],
      username: userDatabase[req.session.user_id]
    };
    res.render("urls_show", templateVars);
    return;
  } else {
    res.status(400).send("You cant do it if you are not logged in.");
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
      res.status(400).send("This Short url does not exist");
    }
  }
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});


app.post("/urls", (req, res) => {

  if (req.session.user_id) {
    const userId = req.session.user_id;
    let shortURL = generateRandomString();
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
    res.status(400).send("You cant post if you arent logged in");
  }
});

app.delete("/urls/:shortURL", (req, res) => {
  if (req.session.user_id) {
    for (let urlId in urlDatabase[req.session.user_id]) {
      if (urlId === req.params.shortURL) {
        if (req.params.shortURL) {
          delete urlDatabase[req.session.user_id][req.params.shortURL];
          res.redirect("/urls");
        } else {
          res.status(400).send("I didnt find URL to delete.<script>setTimeout(function(){window.location = '/url'</script>}, 3000)");
        }
      } else {
        res.status(400).send("You are not be able to delete if you are not logged in.<script>setTimeout(function(){window.location = '/url'</script>}, 3000)");
      }
    }
  }
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  if (!userEmail || userEmail === '' && !userPassword || userPassword === '') {
    res.status(400).send("Fields cannot be Empty.<script>setTimeout(function(){window.location = '/url'</script>}, 3000)");
  } else {
    for (userId in userDatabase) {
      if (userDatabase[userId].email === userEmail) {
        // if (userDatabase[userId].password === userPassword) {
        if (bcrypt.compareSync(userPassword, userDatabase[userId].password)) {
          req.session.user_id = userId;
          res.redirect("/urls");
          return;
        }
      }
    }
    res.status(400).send("Login or password is not correct.<script>setTimeout(function(){window.location = '/url'</script>}, 3000)");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = bcrypt.hashSync(req.body.password, 15);
  const newUserId = randomString(6);
  let userExist = false;

  if (!userEmail || userEmail === "" && !userPassword || userPassword == "") {
    res.status(400).send("Blank is not a user.<script>setTimeout(function(){window.location = '/url'</script>}, 3000)");
  } else {
    for (let userId in userDatabase) {
      if (userDatabase[userId].email === userEmail) {
        res.status(400).send("User exist.<script>setTimeout(function(){window.location = '/url'</script>}, 3000)");
        userExist = true;
      }
    }
    if (userExist) {
      res.status(400).send("User exist.<script>setTimeout(function(){window.location = '/url'</script>}, 3000)");
    } else {
      userDatabase[newUserId] = {
        id: newUserId,
        email: userEmail,
        password: userPassword
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
  var randomString = '';
  for (var i = 0; i < len + 1; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});