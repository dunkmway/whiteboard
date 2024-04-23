let whiteboard;

function main() {
    whiteboard = new Whiteboard(document.querySelector('#canvas'));
}

function save() {
    console.log(JSON.parse(JSON.stringify(whiteboard.toObject())));
}