let whiteboard;

function main() {
    whiteboard = new Whiteboard(document.querySelector('#canvas'));
}

function save() {
    document.getElementById('load').value = JSON.stringify(whiteboard.toObject());
}

function load() {
    const data = JSON.parse(document.getElementById('load').value);
    whiteboard.load(data);
}