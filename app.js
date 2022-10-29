let express = require("express");
let app = express();

app.use(express.json());

module.exports = app;

let path = require("path");
let dbPath = path.join(__dirname, "userData.db");
let sqlite = require("sqlite");
let sqlite3 = require("sqlite3");
let { open } = sqlite;

let bcrypt = require("bcrypt");

let db = null;
let intializeDBAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Server Started at: http://localhost:3000/");
  });
};

intializeDBAndServer();

//register API-1

app.post("/register", async (request, response) => {
  try {
    let { username, name, password, gender, location } = request.body;
    //password lessthan
    let getUserDetails = `SELECT * FROM user WHERE username = ${username};`;
    let dbUser = await db.get(getUserDetails);
    let hashedPassword = await bcrypt.hash(password, 10);
    let passwordLength = password.length();
    if (dbUser === undefined) {
      let createUserIntoDBQuery = `
            INSERT INTO 
                user (username, name, password, gender, location)
                VALUES (
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}',
                )`;
      let dbUser = await db.run(createUserIntoDBQuery);
      let userId = dbUser.lastID;
      response.status(200);
      response.send("User created successfully");
    } else if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (dbUser !== undefined) {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(`DBError: ${e.message}`);
  }
});

//login API-2

app.post("/login", async (request, response) => {
  try {
    let { username, password } = request.body;

    let getUserDetails = `SELECT * FROM user WHERE username = ${username};`;
    let user = await db.get(getUserDetails);

    let isPasswordMatched = await bcrypt.compare(password, user.password);

    if (user === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else if (user !== undefined || isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else if (user !== undefined || isPasswordMatched === true) {
      response.status(200);
      response.send("Login success");
    }
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});

//change-password API-3

app.put("/change-password", async (request, response) => {
  try {
    let { username, oldPassword, newPassword } = request.body;
    let getUserDetails = `SELECT * FROM user WHERE username = ${username};`;
    let user = await db.get(getUserDetails);
    let isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

    let lengthOfNewPassword = newPassword.length();

    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid current password");
    } else if (lengthOfNewPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (isPasswordMatched === true) {
      let updatePasswordQuery = `
            UPDATE 
                user 
            SET 
                password = '${newPassword}',`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});
