const socket = io();
const sendForm = document.querySelector('#send-form');
const sendBtn = sendForm.querySelector('button');
const sendFormInput = sendForm.querySelector('input');
const locationBtn = document.querySelector('.share-location-btn');
const msgContainer = document.querySelector('.msg-container');
const listGroup = document.querySelector('.list-group');
const roomName = document.querySelector('#roomName');

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

socket.on('message', (message)=>{
    const d = new Date();
    const time = d.toLocaleTimeString();
    msgContainer.innerHTML += `
    <div class="row msg mr-auto ml-2 bg-light d-flex flex-column">
        <p><span class="badge badge-warning">${message.from}</span></p>
        <p>${message.text}</p>
        <p><span class="time text-secondary p-0">${time}</span></p>
    </div>
    `;
    scrollDown(msgContainer);
});

socket.on('serverMessage', (message)=>{
    const d = new Date();
    const time = d.toLocaleTimeString();
    msgContainer.innerHTML += `
    <div class="row msg mr-auto ml-2 bg-light d-flex flex-column">
        <p class="text-primary">
            <p><span class="badge badge-danger">${message.from}</span></p>
            <span class="badge text-primary p-0">${message.text}</span>
            <p><span class="time text-secondary p-0">${time}</span></p>
        </p>
    </div>
    `;
    scrollDown(msgContainer);
});

socket.on('locationMsg', (message)=>{
    const d = new Date();
    const time = d.toLocaleTimeString();
    msgContainer.innerHTML += `
    <div class="row msg mr-auto ml-2 bg-light d-flex flex-column">
        <p class="text-primary">
            <p><span class="badge badge-warning">${message.from}</span></p>
            <span class="badge text-info p-0">Location: ${message.text}</span>
            <p><span class="time text-secondary p-0">${time}</span></p>
        </p>
    </div>
    `;
    scrollDown(msgContainer);
});
socket.on('roomUsers', (roomUsers)=>{
    roomName.textContent = roomUsers[0].room;
    listGroup.innerHTML = '';
    roomUsers.forEach(user=>{
        listGroup.innerHTML += `
        <li class="list-group-item">${user.username}</li>
        `;
    });
    scrollDown(listGroup);
});
socket.emit('join', {username, room});

sendForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const message = sendFormInput.value;
    if(message != ''){
        sendBtn.setAttribute('disabled', 'disabled');
        socket.emit('incomingMessage', message, (err)=>{
            sendFormInput.value = '';
            sendBtn.removeAttribute('disabled');
            sendFormInput.focus();
            const d = new Date();
            const time = d.toLocaleTimeString();
            if(err){
                msgContainer.innerHTML += `
                <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                    <p><span class="badge badge-success">You</span></p>
                    <p>${message}</p>
                    <p><span class="badge text-danger p-0">Error!! ${err}</span></p>
                    <p><span class="time text-secondary p-0">${time}</span></p>
                </div>
                `;
            }else{
                msgContainer.innerHTML += `
                <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                    <p><span class="badge badge-success">You</span></p>
                    <p>${message}</p>
                    <p><span class="badge text-success p-0">Message Sent Successfully</span></p>
                    <p><span class="time text-secondary p-0">${time}</span></p>
                    </div>
                `;
            }
            scrollDown(msgContainer);
        });
    }
});

// Location Retrieveing
function setPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    getPosition(latitude, longitude);
}

async function getPosition(lat, long){
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?key=50511ee31e7b4d52a9415b2471962c08&q=${lat},${long}`);
    const data = await response.json();
    const currLocation=`${data.results[0].formatted}`;
    socket.emit('locationMsg', currLocation, ()=>{
        const d = new Date();
        const time = d.toLocaleTimeString();
        msgContainer.innerHTML += `
            <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                <p><span class="badge text-success p-0">Location shared Successfully</span></p>
                <p><span class="time text-secondary p-0">${time}</span></p>
            </div>
            `;
            scrollDown(msgContainer);
            locationBtn.removeAttribute('disabled', 'disabled');
    });
}
function showError(error) {
    socket.emit('errorMessage', `You denied Geolocation`, (err)=>{
        const d = new Date();
        const time = d.toLocaleTimeString();
        msgContainer.innerHTML += `
            <div class="row msg ml-auto mr-2 bg-light d-flex flex-column">
                <p><span class="badge text-danger p-0">Error!! Location Coundn't be shared!</span></p>
                <p><span class="time text-secondary p-0">${time}</span></p>    
            </div>
        `;
        scrollDown(msgContainer);
    });
    locationBtn.removeAttribute('disabled', 'disabled');
}

locationBtn.addEventListener('click', getLocation);

function getLocation() {
    locationBtn.setAttribute('disabled', 'disabled');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition, showError);
    } else {
        console.log('not supported');
    }
}

function scrollDown(container){
    container.scrollTop = container.scrollHeight;
}
