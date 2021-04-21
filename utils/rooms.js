var rooms = [];

module.exports.addRoom = function(roomID){
    if(!rooms.includes(roomID)){
        rooms.push(roomID);
        console.log('Added a room to local memory. Rooms are now: ')
        console.log(rooms);
    }

}

module.exports.rooms = rooms;