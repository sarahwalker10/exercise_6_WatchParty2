// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

CURRENT_ROOM = 0;


// Custom validation on the password reset fields
const passwordField = document.querySelector(".profile input[name=password]");
const repeatPasswordField = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password]").value;
  const r = repeatPassword.value;
  return p == r;
};


const checkPasswordRepeat = () => {
  const passwordField = document.querySelector(".profile input[name=password]");
  if(passwordField.value == repeatPasswordField.value) {
    repeatPasswordField.setCustomValidity("");
    return;
  } else {
    repeatPasswordField.setCustomValidity("Password doesn't match");
  }
}

passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);


// TODO:  On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

// TODO:  When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder. You do not have to parse variable names out
//        of the curly  braces—they are for illustration only. You can just replace the contents
//        of the parent element (and in fact can remove the {{}} from index.html if you want).

// TODO:  Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

// TODO:  When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process.
//        (Hint: https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value)

// user API: stored in database
// send the api key over endpoints
// endpoint can send the api key to the javascript
// local storage in the javascript can store the api key (store API key in local storage)
// in the headers, have the authroization as api key (not super important)
// 
//

// On page load, show the appropriate page and hide the others
let showOnly = (element) => {
  SPLASH.classList.add("hide")
  LOGIN.classList.add("hide")
  PROFILE.classList.add("hide")
  ROOM.classList.add("hide")

  element.classList.remove("hide");

}

//  router function says show me a new page
// you can open the console and type router() and the function will execute
function router(path) {
  //let path = window.location.pathname;
  
  if (path == "/") {
    showOnly(SPLASH);
    let user_api_key = localStorage.getItem("user_api_key")
    let logged_in = (user_api_key != null)
    getInOrOut(logged_in); 
  } 

  else if (path == "/login") { 
    showOnly(LOGIN);
    loginPageActions();
  }

  else if (path == "/profile") { 
    showOnly(PROFILE);
  }
  else if (path.startsWith("/room/")) { 
    showOnly(ROOM);
    room_id = window.location.pathname.split('/')[2];
    CURRENT_ROOM = room_id;
    // buildRoomBody(room_id)
    // setInterval() ? does this go here, or inside my getMessages function?
  } 

  else if (path == "/signup") {
    let logout = document.querySelector("#log-out")
    logout.classList.add("hide")
    let userBanner = document.querySelector(".loginHeader")
    userBanner.classList.add("hide")
    let updateUser= document.querySelector("#updateUser")
    updateUser.innerHTML = "set username"
    let updatePass = document.querySelector("#updatePassword")
    updatePass.innerHTML = "set password"
    showOnly(PROFILE);
    signUp();
  }

  else {
    // show a 404
    console.log("404")
  } 

}

window.addEventListener("DOMContentLoaded", ()=>{
  router(window.location.pathname);
})

window.addEventListener("popstate", () =>
  {router(window.location.pathname) }
); //this is "going back" aka accessing history


setInterval(500, () => { 
  if (CURRENT_ROOM == 0) return;

  fetch("/api/messages/room/" + CURRENT_ROOM)
})

function startMessagePolling() {
  setInterval(getMessages, 100)
}

// //build a function called stopMessagePolling(){
//   clearInterval()
// }
// and then when I navigate to a different path, the message will stop polling 

//console.log(history.state)




function getRoomMessages(room_id) {
  fetch(`/api/rooms/${room_id}`, {
    method: "GET",
    headers: {
      "user-id": WATCH_PARTY_USER_ID,
      "api-key": WATCH_PARTY_API_KEY,
      "room-id": room_id,
    }
  })
    .then(response => response.json())
    .then(messages => buildMessageBody(messages)) 
}


function buildMessageBody(messages) {
  let messagesBlock = document.getElementById("messages-block");

  // clear the page at beginning of each interval so that 
  // the messages don't get repeated on the page each time
  messagesBlock.innerHTML = ""

  messages.forEach(m => {
    let newMessage = document.createElement("message");
    let newAuthor = document.createElement("author");
    let newContent = document.createElement("content");

    newMessage.appendChild(newAuthor);
    newMessage.appendChild(newContent);
    messagesBlock.appendChild(newMessage);

    newContent.textContent = m.body;
    newAuthor.textContent = m.author;
});
}


function getInOrOut(logged_in) {
  if (logged_in) {
    console.log("logged in")
    let homeDisplayRooms = document.querySelector(".rooms");
    let homeScreenIn = document.querySelector(".loggedIn");
    let homeCreateRoom = document.querySelector(".create");
    homeScreenIn.classList.remove("hide")
    homeCreateRoom.classList.remove("hide")
    homeDisplayRooms.classList.remove("hide");
    getHomePage();
  }

  else {
    console.log("logged out")

    let homeScreenOut = document.querySelector(".loggedOut");
    let homeSignup = document.querySelector(".signup");
    let loginButton = document.querySelector(".loggedOut a");

    homeScreenOut.classList.remove("hide");
    homeSignup.classList.remove("hide");

    loginButton.addEventListener("click", function(event){
      event.preventDefault()
      // ask a question about this
      history.pushState({}, "", "/login")
      //console.log(history)
      router("/login")
    }
    )

    homeSignup.addEventListener("click", function(event){
      event.preventDefault()
      // ask a question about this
      history.pushState({}, "", "/signup")
      //console.log(history)
      router("/signup")
    }
    )
  }
}


function loginPageActions() {
  
  //person clicks to create a new account
  document.querySelector(".new").addEventListener("click", function(event){
    event.preventDefault()
    // ask a question about this
    history.pushState({}, "", "/signup")
    router("/signup")
  })
  
  
  // person clicks the button to login
  let loginButton = document.querySelector(".go")
  loginButton.addEventListener("click", (event) => {
    
    // get the username and password they inputted
    pw = document.getElementById("passwordInput").value;
    user = document.getElementById("usernameInput").value;

    // check for clarity
    console.log(pw)
    console.log(user)

    fetch(`/api/login`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "password": pw,
        "username": user,
      },
      }).then(response => response.json())
      .then(info => {
        info.forEach(item => {
          let user_id = item.user_id
          let user_api_key = item.user_api_key

          if (user_api_key == null) {
            document.querySelector(".message").classList.remove("hide")
          }

          else {
            localStorage.setItem("user_api_key", user_api_key);
            localStorage.setItem("user_id", user_id);
            localStorage.setItem("user_name", user);
            history.pushState({}, "", "/")
            //console.log(history)
            router("/")
          }
        })})
    })
}


function getHomePage() {
  document.querySelector("#home-page-username").innerHTML = localStorage.getItem("user_name")
  indexDisplayRooms()
  document.querySelector(".create").addEventListener("click", function(event) {
    //TODO: send request to app to create a new room
  })
  
}


function indexDisplayRooms() {
  // TODO!!!
  //let homeDisplayRooms = document.querySelector(".rooms");

}











function signUp() {

  document.querySelector("#updateUser").addEventListener("click", (event) => {
    new_username = document.querySelector("#name-set").value
    console.log(new_username)
  })

  document.querySelector("#updatePassword").addEventListener("click", (event) => {
    new_pw = document.querySelector("#pw-set").value
    console.log(new_pw)
  })
  

  document.querySelector("#cool").addEventListener("click", (event) => {
    repeat_pw = document.querySelector("#repeat-pw").value
    new_username = document.querySelector("#name-set").value
    new_pw = document.querySelector("#pw-set").value
    
    fetch(`/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "password": new_pw,
        "username": new_username,
        "verify-pw": repeat_pw,
      },
      }).then(response => response.json())
      .then(info => {
        info.forEach(item => {
          let user_api_key = item.user_api_key

          if (user_api_key == null) {
            console.log("there was an error")
          }

          else {
            localStorage.setItem("user_api_key", user_api_key);
            localStorage.setItem("user_name", new_username);
            history.pushState({}, "", "/")
            //console.log(history)
            router("/")
          }
        })})
    
  })

}

