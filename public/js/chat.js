const socket = io();

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  //New messages element
  const $newMessage = $messages.lastElementChild;

  //Height of the the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messages.offsetHeight;

  //Height of messages container
  const containerheight = $messages.scrollHeight;

  //How far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerheight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (msg) => {
  console.log(msg);
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("h:mm A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (data) => {
  console.log(data);
  const html = Mustache.render(locationTemplate, {
    username: data.username,
    location: data.url,
    createdAt: moment(data.createdAt).format("h:mm A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const msg = e.target.elements.message.value;
  socket.emit("sendMessage", msg, (err) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (err) {
      return console.error(err);
    }
    console.log("Message was sent successfully");
  });
});

$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported on this browser");
  }
  $locationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit("sendLocation", location, () => {
      $locationButton.removeAttribute("disabled");
      console.log("Location is shared with users");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
