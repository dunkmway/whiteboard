let whiteboard;

function main() {
    whiteboard = new Whiteboard(document.querySelector('#canvas'));
}

function Save() {
    console.log(JSON.parse(JSON.stringify(whiteboard.toObject())));
}