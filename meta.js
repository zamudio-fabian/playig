var accessTokenMeta = null;
var accessTokenInstagram = null;
var igid = null;
var loggedUser = null;
var profileTokens = {};
var pageIgIds = [];
var selectedChat = {};
var chats = {};

const facebookApiVersion = "v17.0";

function showChat() {
  $("#login-container").hide();
  $("#chat-container").show();
}

function getTokenMeta(response) {
  accessTokenMeta = response.authResponse.accessToken;
}

function getProfile() {
  const apiUrl =
    "https://graph.facebook.com/" +
    facebookApiVersion +
    "/me?fields=id,name,email,birthday,education,favorite_athletes,picture{url}&access_token=" +
    accessTokenMeta;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((response) => {
      loggedUser = response;
      $("#loged-user img")[0].src = response.picture.data.url;
      $($("#loged-user .name")[0]).text(response.name);
    });
}

function getAccounts() {
  const apiUrl =
    "https://graph.facebook.com/" +
    facebookApiVersion +
    "/me/accounts?fields=instagram_business_account,name,access_token&access_token=" +
    accessTokenMeta;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((response) => {
      response.data.forEach((profile) => {
        if (profile.instagram_business_account) {
          pageIgIds.push(profile.instagram_business_account.id);
          profileTokens[profile.id] = profile.access_token;
          getConversations(profile.id);
        }
      });
    });
}

function getConversations(pageId) {
  const apiUrl =
    "https://graph.facebook.com/" +
    facebookApiVersion +
    "/" +
    pageId +
    "/conversations?fields=participants,name,message_count,link,updated_time,unread_count&platform=instagram&access_token=" +
    profileTokens[pageId];

  fetch(apiUrl)
    .then((response) => response.json())
    .then((response) => {
      if (!response.data) return;
      response.data.forEach((single) => {
        var clientId = "";
        single.participants.data.forEach((participantSingle) => {
          if (!isMyId(participantSingle.id)) clientId = participantSingle.id;
        });
        const randomImgNumber = Math.floor(Math.random() * (8 - 1 + 1) + 1);
        document.querySelector("#profilesContainer").insertAdjacentHTML(
          "beforeend",
          `
        <li class="clearfix" id="loged-user" onClick="selectChat('` +
            single.id +
            `', '` +
            pageId +
            `', '` +
            single.name +
            `', '` +
            clientId +
            `')">
          <img
              src="https://bootdey.com/img/Content/avatar/avatar` +
            randomImgNumber +
            `.png"
              alt="avatar"
            />
            <div class="about">
            <div class="name">` +
            single.name +
            `</div>
            <div class="status">
              <i class="fa fa-circle offline"></i> ` +
            single.updated_time.substring(0, 10) +
            `
            </div>
          </div>
        </li>
      `
        );
      });
    });
}

function startChat(response) {
  getTokenMeta(response);
  getProfile(response);
  getAccounts(response);
  showChat();
}

function isMyId(igId) {
  return pageIgIds.includes(igId);
}

function isMyMessage(igId) {
  let classes = isMyId(igId) ? "other-message float-right" : "my-message";
  return classes;
}

function selectChat(conversationId, pageId, chatName, clientId) {
  selectedChat.conversationId = conversationId;
  selectedChat.pageId = pageId;
  selectedChat.chatName = chatName;
  selectedChat.clientId = clientId;

  $("#chat-selected-img").attr(
    "src",
    "https://bootdey.com/img/Content/avatar/avatar1.png"
  );
  $("#chat-selected-img").show();
  $("#chat-selected-name").html(chatName);
  getMessages();
}

function getMessages() {
  const conversationId = selectedChat.conversationId;
  const pageId = selectedChat.pageId;
  const apiUrl =
    "https://graph.facebook.com/" +
    facebookApiVersion +
    "/" +
    conversationId +
    "/messages?fields=from,to,name,message&access_token=" +
    profileTokens[pageId];
  fetch(apiUrl)
    .then((response) => response.json())
    .then((response) => {
      $("#chat-message-container").empty();
      response.data.reverse().forEach((single) => {
        document.querySelector("#chat-message-container").insertAdjacentHTML(
          "beforeend",
          `
          <li class="clearfix">
            <div class="message ` +
            isMyMessage(single.from.id) +
            `">` +
            single.message +
            `</div>
          </li>
      `
        );
      });
      $("#chat-message-container").scrollTop(
        $("#chat-message-container")[0].scrollHeight
      );
    });
}

function sendMessage() {
  const message = $("#input-message").val();
  $("#input-message").val("");
  // recipient.id es el ID del cliente
  const apiUrl =
    "https://graph.facebook.com/" +
    facebookApiVersion +
    "/" +
    selectedChat.pageId +
    "/messages?recipient={'id':'" +
    selectedChat.clientId +
    "'}&messaging_type=RESPONSE&message={'text':'" +
    message +
    "'}&access_token=" +
    profileTokens[selectedChat.pageId];

  fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
    .then((response) => response.json())
    .then((response) => {
      console.log(response);
      getMessages();
    });
}

$("#input-message").keyup(function (event) {
  if (event.keyCode === 13) {
    sendMessage();
  }
});

function checkStatus(response) {
  if (response.status === "connected") {
    startChat(response);
  }
}

window.fbAsyncInit = function () {
  FB.init({
    appId: "254476297402875",
    xfbml: true,
    cookie: true,
    version: "v2.8",
  });

  FB.AppEvents.logPageView();

  FB.getLoginStatus(function (response) {
    if (response.status === "connected") {
      startChat(response);
    }
  });
};

(function (d, s, id) {
  var js,
    fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
})(document, "script", "facebook-jssdk");

function checkLoginState() {
  FB.getLoginStatus(function (response) {
    checkStatus(response);
  });
}
