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


// On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

// When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder. You do not have to parse variable names out
//        of the curly  braces—they are for illustration only. You can just replace the contents
//        of the parent element (and in fact can remove the {{}} from index.html if you want).

// Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

// TODO:  When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process.
//        (Hint: https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value)



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
  const path_list = path.split("/")

  // home page
  if (path_list[1] == "") {
    const user_api_key = sessionStorage.getItem("user_api_key")
    const logged_in = (user_api_key != null)
    showOnly(SPLASH);
    getInOrOut(logged_in); 
  } 

  // login page
  else if (path_list[1] == "login") { 
    if (sessionStorage.getItem("user_api_key") != null) {
      history.pushState({}, "", "/")
      router("/")
    }
    else {
      showOnly(LOGIN);
      loginPageActions();
    }
  
  }

  // profile page
  else if (path_list[1] == "profile") { 
    if (sessionStorage.getItem("user_api_key") == null) {
      history.pushState({}, "", "/login")
      router("/login")
    }
    else {
      showOnly(PROFILE);
      profilePage();
    }
  }

  // room pages
  else if (path_list[1] == "room") { 
    if (sessionStorage.getItem("user_api_key") == null) {
      history.pushState({}, "", "/login")
      router("/login")
    }
    else {
      //room_id = window.location.pathname.split('/')[2];
      room_id = path_list[2]
      openRoom(room_id);
    } 
  } 

  // page not found
  else {
    // show a 404
    console.log("404")
    document.querySelector(".noMessages").classList.remove("hide")

  } 

}



window.addEventListener("DOMContentLoaded", ()=>{
  history.pushState({}, "", window.location.pathname)
  console.log("page load pushed" + window.location.pathname)
  loadEventListeners();
  router(window.location.pathname);
})



window.addEventListener("popstate", () => {
  // clear the history on popstate events
  window.history.go(-(window.history.length - 1));
  console.log("popstate, delete history")
  router(window.location.pathname) }
); //this is "going back" aka accessing history


// setInterval(500, () => { 
//   if (CURRENT_ROOM == 0) return;

//   fetch("/api/messages/room/" + CURRENT_ROOM)
// })


// function startMessagePolling(room_id) {
//   intervalId = setInterval(() => getMessages(room_id), 100);
//   return intervalId
// }

function loadEventListeners() {

  //add event listner to the log-out button
  document.querySelector("#log-out").addEventListener("click", function () {
    sessionStorage.clear();
    history.pushState({}, "", "/");
    router("/");
  })

  //add event listener when they click to update their username
  // send request to app.py to update in db
  const update_user = document.querySelector("#updateUser")
  update_user.addEventListener("click", (event) => {
    new_username = document.querySelector("#name-set").value
    console.log("profile page update username")
    fetch(`/api/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", 
        "user-api": sessionStorage.getItem("user_api_key"),
        "username": new_username,
        "update-type": "username",
       },
       }).then(response => { if (response.status == 200) {
        // update the sessionStorage with new credentials
        console.log("your username has been updated")
        sessionStorage.setItem("user_name", new_username)
        document.getElementById("username-banner").innerHTML = sessionStorage.getItem("user_name")
       }
       else {console.log("not valid")}})
  })

  // add event listener when they click to update their password
  // send request to app.py to update in db
  const update_pw = document.querySelector("#updatePassword");
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
          "user-api": sessionStorage.getItem("user_api_key"),
          "username": sessionStorage.getItem("user_name"),
          "new-pw": new_pw,
          "update-type": "password",
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
  // send them back to whatever page they were just at
  const cool = document.querySelector("#cool")
  cool.addEventListener("click", (event) => {
    //empty inputs
    console.log("from the profile page")
    document.querySelector("#pw-set").value = "";
    document.querySelector("#name-set").value = "";
    document.querySelector("#repeat-pw").value = "";
    history.back()
})

// and add an event listener to user profile banner on home page
document.querySelector("#home-page-username").addEventListener("click", function () {
  history.pushState({}, "", "/profile")
  console.log("history pushed /profile")
  router("/profile")
})

// add an event listner to the "create room" button
const createRoomButton = document.querySelector(".create")
createRoomButton.addEventListener("click", function () {
  fetch(`/api/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "post-type": "create_room",
    },
    }).then(response => response.json())
    .then(info => {
      room_number = info[0].room_id
      path = "/room/" +room_number
      history.pushState({}, "", path) 
      router(path);
    })
  })


  // add event listener to log-in button (goes inside loginPageActions)
  document.querySelector(".go").addEventListener("click", (event) => {
    // get the username and password they inputted
    console.log("log in pushed")
    pw = document.getElementById("passwordInput").value;
    user = document.getElementById("usernameInput").value;
    console.log(pw, user, "login inputs")
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
        console.log(info)
        info.forEach(item => {
          // response will have their user_id and api_key
          const user_id = item.user_id
          const user_api_key = item.user_api_key
          //if their log-in is invalid, api-key will be null
          //and display error message
          if (user_api_key == null) {
            document.querySelector(".message").classList.remove("hide")
          }
          // otherwise, save their apikey in sessionStorage and redirect to "/"
          //page (they will be logged in)
          else {
            sessionStorage.setItem("user_api_key", user_api_key);
            sessionStorage.setItem("user_id", user_id);
            sessionStorage.setItem("user_name", user);
            history.back()
            // history.pushState({}, "", "/")
            // router("/")
          }
        })})
    })
  

   //add event listner to user profile banner inside the rooms
   document.querySelector("#room-username").addEventListener("click", function () {
    history.pushState({}, "", "/profile")
    router("/profile")
    return
  })

  //add event listener to when person clicks to create new account
  document.querySelector(".new").addEventListener("click", function(event){
    event.preventDefault()
    console.log("clicked create account button")
    fetch(`/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      }).then(response => response.json())
      .then(info => {
        sessionStorage.setItem("user_api_key", info[0].user_api);
        sessionStorage.setItem("user_name", info[0].user_name);
        sessionStorage.setItem("user_id", info[0].user_id);

        history.pushState({}, "", "/")
        router("/")
      })   
    }
    )

}




//  _____________FUNCTIONS FOR THE "/profile" PAGE ______________________________________________

function profilePage() {
  // display user name in profile banner
  document.getElementById("username-banner").innerHTML = sessionStorage.getItem("user_name")
  // have empty input values for the boxes
  document.querySelector("#pw-set").value = "";
  document.querySelector("#name-set").value = "";
  document.querySelector("#repeat-pw").value = "";
  
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
    const loginButton = document.querySelector(".loggedOut a");
    loginButton.addEventListener("click", function(event){
      event.preventDefault()
      history.pushState({}, "", "/login")
      router("/login")
      }
    )
    //add event lister to sign up button
    const homeSignup = document.querySelector(".signup");
    homeSignup.addEventListener("click", function(event){
      event.preventDefault()
      console.log("clicked signup button")
      fetch(`/api/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "post-type": "signup",
        },
        }).then(response => response.json())
        .then(info => {
          sessionStorage.setItem("user_api_key", info[0].user_api);
          sessionStorage.setItem("user_name", info[0].user_name);
          sessionStorage.setItem("user_id", info[0].user_id);
          router("/");
        })
        
    }
    )
  }
}


function getHomePage() {
  // 1. display the user's username in the profile banner 
  console.log(sessionStorage.getItem("user_name"))
  document.querySelector("#home-page-username").innerHTML = sessionStorage.getItem("user_name")
  
  
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
          const room_id = item.room_id
          const room_name = item.room_name
          // create the elements on DOM
          roomList = document.querySelector("#roomList")
          // clear room list so it doesnt get duplicated every time
          const aTag = document.createElement("a");
          const aBody = document.createTextNode(room_id + ": ")
          const strongTag = document.createElement("strong");
          const strongBody = document.createTextNode(room_name)
          aTag.appendChild(aBody);
          //add an event listener if a person clicks the room 
          // it will take them to the room
          aTag.addEventListener("click", function () {
            const room = "/room/"+room_id
            history.pushState({}, "", room)
            router(room)
          })
          strongTag.appendChild(strongBody);
          aTag.appendChild(strongTag);
          roomList.appendChild(aTag)
        })
      }
    }) 

}



//  _____________FUNCTIONS FOR THE "/login" PAGE ______________________________________________

// function to handle log-in page
function loginPageActions() {
  // make sure the username and password inputs are empty
  document.getElementById("passwordInput").value = "";
  document.getElementById("usernameInput").value = "";
 
}





// _____________FUNCTIONS FOR THE "/room" PAGE ______________________________________________

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
  const messagesBlock = document.getElementById("messages-block");
  console.log("made it")
    
  // clear the page at beginning of each interval so that 
  // the messages don't get repeated on the page each time
  messagesBlock.innerHTML = ""
    
  messages.forEach(m => {
    const newMessage = document.createElement("message");
    const newAuthor = document.createElement("author");
    const newContent = document.createElement("content");
    
    newMessage.appendChild(newAuthor);
    newMessage.appendChild(newContent);
    messagesBlock.appendChild(newMessage);
    
    newContent.textContent = m.body;
    newAuthor.textContent = m.author;
  });
  }


function openRoom(room_id)  {
  //send a request to the db for the room number
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
    window.location.pathname = "/404"
  }
  else {
    showOnly(ROOM);
    const user_banner = document.querySelector("#room-username")

    // input room elements
    user_banner.innerHTML = sessionStorage.getItem("user_name")
    document.querySelector("#invite-ppl").innerHTML = "/rooms/" + room_id
    document.querySelector("#put-room-name").innerHTML = room_name
    
    
    // start message polling every .5 seconds = 500 milliseconds
    let intervalId = setInterval(() => {
      if (window.location.pathname.split('/')[1] == "room") {
        getMessages(room_id);
      } else {
        clearInterval(intervalId);
        return;
      }
    }, 500);

  }

}


function postMessage(event) {
  event.preventDefault()
  
  room_id = window.location.pathname.split('/')[2];
  comments = document.getElementById("post-box").value;
  // clear the post box once they post soemthing
  document.getElementById("post-box").value= "";

  console.log(comments)

  fetch(`/api/room/${room_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": sessionStorage.user_id,
      "room-id": room_id,
      "post-type": "comment"
     },
    body: JSON.stringify(comments),
     })
     .then(response =>{ if (response.status == 200) {
      getMessages(room_id)
      
     }
     else {console.log("error on the returened response")}
})
  
  }


  // change room name

  function clickEdit(event) {
    event.preventDefault()
    document.getElementById("display-id").classList.add("hide");
    document.getElementById("input-value").value = ""; 
    document.getElementById("edit-id").classList.remove("hide");
    
  }

  function clickSave(event) {
    event.preventDefault()

    room_id = window.location.pathname.split('/')[2];
    new_name = document.getElementById("input-value").value;
    document.getElementById("edit-id").classList.add("hide");
    document.getElementById("display-id").classList.remove("hide");
  
    fetch(`/api/room/${room_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "room-id": room_id,
        "post-type": "name"
       },
      body: JSON.stringify(new_name),
       }).then(response => { if (response.status == 200) {
        document.getElementById("put-room-name").innerHTML = new_name;
        
       }
       else {console.log("couldn't save the room name")}})
    }
    


