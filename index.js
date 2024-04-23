let whiteboard;

function main() {
    whiteboard = new Whiteboard(document.querySelector('#canvas'));
}

function save() {
    console.log(JSON.stringify(whiteboard.toObject()));
    console.log(whiteboard.toObject())
}

function load() {
    const data = JSON.parse(document.getElementById('load').value);
    whiteboard.load(data);
}