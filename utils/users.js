const users = [];

const addUser = ({id, username, room})=>{
    // clean Data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // validate the Data
    if(!username || !room){
        return{
            error: 'Username and Room are Required'
        }
    }

    //Check For Existing User 
    const existingUser = users.find((user)=>{
        return user.room == room && user.username === username;
    });
    //Validate Username 
    if(existingUser){
        return {
            error: 'Username is in use!'
        }
    }
    // Store User 
    const user = {id, username, room};
    users.push(user);
    return {user};
};

const removeUser = (id)=>{
    const index = users.findIndex(user => user.id == id);
    if(index>=0){
       return users.splice(index, 1)[0]; 
    }
};

const getUser = (id)=>{
    return users.find(user => user.id === id);
};

const getUsersInRoom = (room)=>{
    return users.filter(user => user.room === room);
};
const addUserInChat = ({id, username, room})=>{
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();
    const index = users.findIndex(user => user.room===room&&user.username===username);
    users[index].id = id;
    const user = {...users[index]};
    return {user};
}
module.exports = {
    addUserInChat,
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
};