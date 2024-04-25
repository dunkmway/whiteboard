import Whiteboard from "./Whiteboard.mjs"

let whiteboard;

function main() {
    whiteboard = new Whiteboard(document.querySelector('#canvas'));
}

function save() {
    document.getElementById('load').value = JSON.stringify(whiteboard.toObject());
}

function load() {
    whiteboard.load(JSON.parse(document.getElementById('load').value));
}

document.addEventListener('DOMContentLoaded', main);