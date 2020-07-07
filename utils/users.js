const users = [];

//! Trying to add user in Array
const addUser = ({
    id,
    username,
    room
}) => {
    // clean Data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // validate the Data
    if (!username || !room) {
        return {
            error: 'Username and Room are Required'
        }
    }

    //Check For Existing User 
    const existingUser = users.find(user =>
        user.room == room && user.username === username
    );

    //Validate Username 
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }
    // Store User 
    const user = {
        id, //! ( uuid )
        username,
        room
    };
    users.push(user);
    return {
        user
    };
};

const removeUser = (id) => {
    const index = users.findIndex(user => user.id == id);
    if (index >= 0) {
        return users.splice(index, 1)[0];
    }
};

//! get a specific user ( by socket ID )
const getUser = id => users.find(user => user.id === id);


//! get all users in a Room ( by Room Name )
const getUsersInRoom = room => users.filter(user => user.room === room);

//! Add user in Chat Room
const addUserInChat = ({
    id,
    username,
    room
}) => {
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();
    const index = users.findIndex(user => user.room === room && user.username === username);
    users[index].id = id; //! Replace ( uuid ) with socketID
    const user = {
        ...users[index]
    };
    return {
        user
    };
}
module.exports = {
    addUserInChat,
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
};