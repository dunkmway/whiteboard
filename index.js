import Whiteboard from "./Whiteboard.mjs"

let whiteboard;

function main() {
    whiteboard = new Whiteboard(document.querySelector('#canvas'));
    document.getElementById('saveBtn').addEventListener('click', save);
    document.getElementById('loadBtn').addEventListener('click', load);
    document.getElementById('clipBtn').addEventListener('click', getClipboard);
}

function save() {
    document.getElementById('load').value = JSON.stringify(whiteboard.toObject());
}

function load() {
    whiteboard.load(JSON.parse(document.getElementById('load').value));
}

function getClipboard() {
    console.log(whiteboard.clipboard);
}

document.addEventListener('DOMContentLoaded', main);
