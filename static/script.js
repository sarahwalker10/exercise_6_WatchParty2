// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

CURRENT_ROOM = 0;
let intervalId;


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


// direct system which page to display based on url path
function router(path) {
  //let path = window.location.pathname;
  
  //clear message polling
  clearInterval(intervalId)
  let path_list = path.split("/")


  if (path_list[1] == "") {
    let user_api_key = localStorage.getItem("user_api_key")
    let logged_in = (user_api_key != null)
    showOnly(SPLASH);
    getInOrOut(logged_in); 
  } 

  else if (path_list[1] == "login") { 
    showOnly(LOGIN);
    loginPageActions();
  }

  else if (path_list[1] == "profile") { 
    if (localStorage.getItem("user_api_key") == null) {
      history.pushState({}, "", "/login")
      router("/login")
    }
    else {
      showOnly(PROFILE);
      profilePage();
    }
  }

  else if (path_list[1] == "room") { 
    if (localStorage.getItem("user_api_key") == null) {
      history.pushState({}, "", "/login")
      router("/login")
    }
    else {
      //room_id = window.location.pathname.split('/')[2];
      room_id = path_list[2]
      showOnly(ROOM);
      console.log("opening room")
      openRoom(room_id);
      //where do I clearInterval??
    } 
  } 

  else if (path == "/signup") {
    showOnly(PROFILE);
    signUp();
  }

  else {
    // show a 404
    console.log("404")
    document.querySelector(".noMessages").classList.remove("hide")

  } 

}

// function startMessagePolling(room_id) {
//   intervalId = setInterval(() => getMessages(room_id), 100);
//   return intervalId
// }

window.addEventListener("DOMContentLoaded", ()=>{
  if (history.state && history.state.length == 0) {
    localStorage.clear();
  }
  history.pushState({}, "", window.location.pathname)
  router(window.location.pathname);
})

window.addEventListener("popstate", () =>
  { history.pushState({}, "", window.location.pathname)
    router(window.location.pathname) }
); //this is "going back" aka accessing history


// setInterval(500, () => { 
//   if (CURRENT_ROOM == 0) return;

//   fetch("/api/messages/room/" + CURRENT_ROOM)
// })

//console.log(history.state)









//  _____________FUNCTIONS FOR THE "/profile" PAGE ______________________________________________

function profilePage() {
  // display user name in profile banner
  document.getElementById("username-banner").innerHTML = localStorage.getItem("user_name")
  //add event listner to the log-out button
  document.querySelector("#log-out").addEventListener("click", function () {
    localStorage.clear();
    history.pushState({}, "", "/");
    router("/");
  })

  //add event listener when they click to update their username
  // send request to app.py to update in db
  let update_user = document.querySelector("#updateUser")
  update_user.addEventListener("click", (event) => {
    new_username = document.querySelector("#name-set").value
    console.log(new_username)
    fetch(`/api/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", 
        "user-api": localStorage.getItem("user_api"),
        "username": new_username,
        "new-pw": "",
       },
       }).then(response => { if (response.status == 200) {
        // update the localStorage with new credentials
        console.log("your username has been updated")
        localStorage.setItem("user_name", new_username)
        document.getElementById("username-banner").innerHTML = localStorage.getItem("user_name")
       }
       else {console.log("not valid")}})
  })

  // add event listener when they click to update their password
  // send request to app.py to update in db
  let update_pw = document.querySelector("#updatePassword");
  update_pw.addEventListener("click", (event) => {
    // update local storage with new credentials
    new_pw = document.querySelector("#pw-set").value
    console.log(new_pw)
    repeat_pw = document.querySelector("#repeat-pw").value
    if (new_pw == repeat_pw) {
      fetch(`/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
          "user-api": localStorage.getItem("user_api"),
          "username": localStorage.getItem("user_name"),
          "new-pw": new_pw
         },
         }).then(response => { if (response.status == 200) {
          console.log("your password has been updated")
         }
         else {console.log("not valid")}})
    }
    else {
      console.log("didn't send request")
    }
    
  })
  
  // add event listner when they click "cool, let's go"
  // send them back to the home page
  let cool = document.querySelector("#cool")
  cool.addEventListener("click", (event) => {
    //empty inputs
    document.querySelector("#pw-set").value = "";
    document.querySelector("#name-set").value = "";
    document.querySelector("#repeat-pw").value = "";
    history.back()
})
}



//  _____________FUNCTIONS FOR THE "/room" PAGE ______________________________________________

function getMessages(room_id) {
  fetch(`/api/room/${room_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "room-id": room_id,
    }
    }).then(response => response.json())
    .then(info => buildMessageBody(info))
    }


function buildMessageBody(messages) {
  let messagesBlock = document.getElementById("messages-block");
  console.log("made it")
    
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


function openRoom(room_id)  {
  //see if a valid room number exists
  console.log("in room")
  fetch(`/api/room/${room_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "room-id": room_id,
    }
    }).then(response => response.json())
    .then(info => handleReturn(info, room_id))
      
      }

function handleReturn(info, room_id) {
  room_name = info[0].room_name
  if (room_name == null) {
    router("/404")
  }
  else {
    let user_banner = document.querySelector(".loggedIn")

    // input room elements
    user_banner.innerHTML = localStorage.getItem("user_name")
    document.querySelector("#invite-ppl").innerHTML = "/rooms/" + str(room_id)
    document.querySelector("#put-room-name").innerHTML = room_name

    //add event listner to user profile banner
    user_banner.addEventListener("click", function () {
      history.pushState({}, "", "/profile")
      router("/profile")
      return
    })
    
    // start message polling every 100 miliseconds
    // let intervalId = setInterval(() => getMessages(room_id), 100);

      
    // add event listner to edit button
    let edit_button = document.getElementById(".displayRoomName")
    edit_button.addEventListener("click", editAndSaveRoomName)

    let post_button = document.getElementById("#post-button")
    post_button.addEventListener("click", postMessage)

  }

}

function postMessage(event) {
  event.preventDefault()
  
  room_id = window.location.pathname.split('/')[2];
  comments = document.getElementById("post-box").value;
  // clear the post box once they post soemthing
  document.getElementById("input-box").value= "";

  fetch(`/api/rooms/${room_id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "room-id": room_id,
      "action": "comment"
     },
    body: JSON.stringify(comments),
     })
     .then(response =>{ if (response.status == 200) {
      getMessages(room_id)
      
     }
     else {console.log("error on the returened response")}
})
  
  }



  function editAndSaveRoomName(event) {
    console.log("write function")
    // room_id = window.location.pathname.split('/')[2];
    // new_name = document.getElementById("input-value").value;
    // document.getElementById("edit-id").classList.add("hide");
    // document.getElementById("display-id").classList.remove("hide");
  
    // fetch(`/api/rooms/${room_id}/name`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json", 
    //     "user-id": WATCH_PARTY_USER_ID,
    //     "api-key": WATCH_PARTY_API_KEY,
    //     "room-id": room_id
    //    },
    //   body: JSON.stringify(new_name),
    //    }).then(response => { if (response.status == 200) {
    //     document.getElementById("room-name-span").innerHTML = new_name;
        
    //    }
    //    else {console.log("not a valid user")}})
    }
    






//  _____________FUNCTIONS FOR THE "/" PAGE ______________________________________________

// function to handle "/" page based on whether user is logged in or out
function getInOrOut(logged_in) {
  if (logged_in) {
    console.log("logged in")
    // hide signup button
    document.querySelector(".signup").classList.add("hide")
    // hide the log-in button
    document.querySelector(".loggedOut").classList.add("hide");
    // show room list 
    document.querySelector(".rooms").classList.remove("hide");
    // show "create a room" button
    document.querySelector(".create").classList.remove("hide");
    // show username banner
    document.querySelector(".loggedIn").classList.remove("hide");
    //redirect to another function to handle event listeners on
    // home page buttons
    getHomePage();
  }

  else {
    console.log("logged out")
    // hide room list 
    document.querySelector(".rooms").classList.add("hide");
    // hide "create a room" button
    document.querySelector(".create").classList.add("hide");
    // hide username banner
    document.querySelector(".loggedIn").classList.add("hide");
    // show signup button
    document.querySelector(".signup").classList.remove("hide")
    // show the log-in button
    document.querySelector(".loggedOut").classList.remove("hide");
    // add event listener to login button
    let loginButton = document.querySelector(".loggedOut a");
    loginButton.addEventListener("click", function(event){
      event.preventDefault()
      history.pushState({}, "", "/login")
      router("/login")
    }
    )
    //add event lister to sign up button
    let homeSignup = document.querySelector(".signup");
    homeSignup.addEventListener("click", function(event){
      event.preventDefault()
      history.pushState({}, "", "/signup")
      router("/signup")
    }
    )
  }
}


function getHomePage() {
  // 1. display the user's username in the profile banner 
  // and add an event listener to user profile banner
  document.querySelector("#home-page-username").innerHTML = localStorage.getItem("user_name")
  document.querySelector("#home-page-username").addEventListener("click", function () {
    history.pushState({}, "", "/profile")
    router("/profile")
  })
  
  
  // 2. display the rooms:
  // send a request to app.py to get all of the rooms in the db
  fetch(`/api/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    }).then(response => response.json())
    .then(info => {
      // if there are no rooms, display message
      if (info.length == 0) {
        document.querySelector("noRooms").classList.remove("hide")
      }
      // otherwise, build room list on DOM
      else {
        roomList.innerHTML = ""
        info.forEach(item => {
          //get the results from the response
          let room_id = item.room_id
          let room_name = item.room_name
          // create the elements on DOM
          roomList = document.querySelector("#roomList")
          // clear room list so it doesnt get duplicated every time
          let aTag = document.createElement("a");
          let aBody = document.createTextNode(room_id + ": ")
          let strongTag = document.createElement("strong");
          let strongBody = document.createTextNode(room_name)
          aTag.appendChild(aBody);
          //add an event listener if a person clicks the room 
          // it will take them to the room
          aTag.addEventListener("click", function () {
            let room = "/room/"+room_id
            history.pushState({}, "", room)
            router(room)
          })
          strongTag.appendChild(strongBody);
          aTag.appendChild(strongTag);
          roomList.appendChild(aTag)
        })
      }
    }) 

    // 3. add an event listner to the "create room" button
    let createRoomButton = document.querySelector(".create")
    createRoomButton.addEventListener("click", function () {
      fetch(`/api/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        }).then(response => response.json())
        .then(info => {
          room_number = info[0].room_id
          path = "/room/" +str(room_number)
          history.pushState({}, "", path) 
          router(path);
        })
      })
}

//  _____________FUNCTIONS FOR THE "/login" PAGE ______________________________________________

// function to handle log-in page
function loginPageActions() {
  //add event listener to when person clicks to create new account
  // i.e. redirect them to the signup page
  document.querySelector(".new").addEventListener("click", function(event){
    event.preventDefault()
    history.pushState({}, "", "/signup")
    router("/signup")
  })
  // add event listener to log-in button
  document.querySelector(".go").addEventListener("click", (event) => {
    // get the username and password they inputted
    pw = document.getElementById("passwordInput").value;
    user = document.getElementById("usernameInput").value;
    //send request to app.py to verify if valid user
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
          // response will have their user_id and api_key
          let user_id = item.user_id
          let user_api_key = item.user_api_key
          //if their log-in is invalid, api-key will be null
          //and display error message
          if (user_api_key == null) {
            document.querySelector(".message").classList.remove("hide")
          }
          // otherwise, save their apikey in localStorage and redirect to "/"
          //page (they will be logged in)
          else {
            localStorage.setItem("user_api_key", user_api_key);
            localStorage.setItem("user_id", user_id);
            localStorage.setItem("user_name", user);
            history.back()
            // history.pushState({}, "", "/")
            // router("/")
          }
        })})
    })
}


//  _____________FUNCTIONS FOR THE "/signup" PAGE ______________________________________________

// function to handle the sign-up page for new users - creates their new account
function signUp() {
  //hide the log-out button
  document.querySelector("#log-out").classList.add("hide")
  //hide the user banner
  document.querySelector("#salmon-box").classList.add("hide")
  //change the "update" buttons to say "set"
  document.querySelector("#updateUser").innerHTML = "set username"
  document.querySelector("#updatePassword").innerHTML = "set password"

  //add event listener when they click to set their username
  let set_name = document.querySelector("#updateUser")
  set_name.addEventListener("click", (event) => {
    new_username = document.querySelector("#name-set").value
    console.log(new_username)
  })

  // add event listener when they click to set their password
  let set_pw = document.querySelector("#updatePassword")
  set_pw.addEventListener("click", (event) => {
    new_pw = document.querySelector("#pw-set").value
    console.log(new_pw)
  })
  
  // add event listner when they click "cool, let's go"
  //send the request to app.py to create their new account in the db
  let cool = document.querySelector("#cool");
  cool.addEventListener("click", (event) => {
    //get username and input values
    repeat_pw = document.querySelector("#repeat-pw").value
    new_username = document.querySelector("#name-set").value
    new_pw = document.querySelector("#pw-set").value
    
    //send the request to app.py
    fetch(`/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "password": new_pw,
        "username": new_username,
        "verify-pw": repeat_pw,
      },
      }).then(response => response.json()) //the response should contain their api-key
      .then(info => {
        info.forEach(item => {
          let user_api_key = item.user_api_key 
          //api-key will be null if their sign-up process was invalid
          if (user_api_key == null) {         
            console.log("there was an error")
          }
          // otherwise, save their api-key to the localStorage
          // and send them back to the home page (they will be logged in)
          else {
            localStorage.setItem("user_api_key", user_api_key);
            localStorage.setItem("user_name", new_username);
            history.pushState({}, "", "/")
            router("/")
          }
        })})
  })
}

