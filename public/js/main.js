//! Initialize Socket Connection
const socket = io();

//! Declare all useful elemnts
const sendForm = document.querySelector('#send-form');
const sendBtn = sendForm.querySelector('button');
const sendFormInput = sendForm.querySelector('input');
const locationBtn = document.querySelector('.share-location-btn');
const msgContainer = document.querySelector('.msg-container');
const listGroup = document.querySelector('.list-group');
const roomName = document.querySelector('#roomName');


//! User Join on Window onload
const {
    username,
    room
} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})
socket.emit('join', {
    username,
    room
});


//! incoming Message from server
socket.on('message', (message) => {
    msgContainer.innerHTML += `
    <div class="row msg mr-auto ml-2 bg-light d-flex flex-column">
        <p><span class="badge badge-warning">${message.from}</span></p>
        <p>${message.text}</p>
        <p><span class="time text-secondary p-0">${getCurrentTime()}</span></p>
    </div>
    `;
    scrollDown(msgContainer);
});

//! Admin Messages from Server
socket.on('serverMessage', (message) => {
    msgContainer.innerHTML += `
    <div class="row msg mr-auto ml-2 bg-light d-flex flex-column">
        <p class="text-primary">
            <p><span class="badge badge-danger">${message.from}</span></p>
            <span class="badge text-primary p-0">${message.text}</span>
            <p><span class="time text-secondary p-0">${getCurrentTime()}</span></p>
        </p>
    </div>
    `;
    scrollDown(msgContainer);
});

//! Receive location Messages
socket.on('locationMsg', (message) => {
    msgContainer.innerHTML += `
    <div class="row msg mr-auto ml-2 bg-light d-flex flex-column">
        <p class="text-primary">
            <p><span class="badge badge-warning">${message.from}</span></p>
            <span class="badge text-info p-0">Location: ${message.text}</span>
            <p><span class="time text-secondary p-0">${getCurrentTime()}</span></p>
        </p>
    </div>
    `;
    scrollDown(msgContainer);
});

//! Get all users in this Chat Room
socket.on('roomUsers', (roomUsers) => {
    roomName.textContent = roomUsers[0].room;
    listGroup.innerHTML = '';
    roomUsers.forEach(user => {
        listGroup.innerHTML += `
        <li class="list-group-item">${user.username}</li>
        `;
    });
    scrollDown(listGroup);
});



//! Handling Sending Messages
sendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = sendFormInput.value;
    if (message != '') {
        //! Disable the send Button for a while
        sendBtn.disabled = true;

        //! Send this message to Server
        socket.emit('incomingMessage', message, (err) => {
            sendFormInput.value = '';

            //! If Callback has an Error
            if (err) {
                msgContainer.innerHTML += `
                <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                    <p><span class="badge badge-success">You</span></p>
                    <p>${message}</p>
                    <p><span class="badge text-danger p-0">Error!! ${err}</span></p>
                    <p><span class="time text-secondary p-0">${getCurrentTime()}</span></p>
                </div>
                `;
                //! Otherwise
            } else {
                msgContainer.innerHTML += `
                <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                    <p><span class="badge badge-success">You</span></p>
                    <p>${message}</p>
                    <p><span class="badge text-success p-0">Message Sent Successfully</span></p>
                    <p><span class="time text-secondary p-0">${getCurrentTime()}</span></p>
                    </div>
                `;
            }
            scrollDown(msgContainer);
            //! Remove disable attr
            sendBtn.removeAttribute('disabled');
            sendFormInput.focus();
        });
    }
});


//! Click on Share location button
locationBtn.addEventListener('click', getLocation);

//! Get location by Browser ( By Geo Location )
function getLocation() {
    locationBtn.disabled = true;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition, showError);
    } else {
        console.log('not supported');
    }
}

//! Location Retrieveing ( latitude and longitude )
function setPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    //! Call for reverse Geo Coding
    getPosition(latitude, longitude);
}


//! Reverse Geo Coding Using an API
async function getPosition(lat, long) {

    //! Inspect api result and get what we need
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?key=50511ee31e7b4d52a9415b2471962c08&q=${lat},${long}`);
    const data = await response.json();
    const currLocation = `${data.results[0].formatted}`;

    //! Send Location to server
    socket.emit('locationMsg', currLocation, () => {
        msgContainer.innerHTML += `
            <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                <p><span class="badge text-success p-0">Location shared Successfully</span></p>
                <p><span class="time text-secondary p-0">${getCurrentTime()}</span></p>
            </div>
            `;
        scrollDown(msgContainer);
        locationBtn.removeAttribute('disabled');
    });
}

//! If user dened Geolocation Service
function showError() {
    socket.emit('errorMessage', `You denied Geolocation`, () => {
        msgContainer.innerHTML += `
            <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                <p><span class="badge text-danger p-0">Error!! Location Coundn't be shared!</span></p>
                <p><span class="time text-secondary p-0">${getCurrentTime()}</span></p>    
            </div>
        `;
        scrollDown(msgContainer);
    });
    locationBtn.removeAttribute('disabled', 'disabled');
}

//! Get formatted date
const getCurrentTime = () => {
    const d = new Date();
    const time = d.toLocaleTimeString();
    return time
}

//! function for scroll down to bootom
function scrollDown(container) {
    container.scrollTop = container.scrollHeight;
}