/*
*
* TODO:
*   - erase whole object, the eraser will return a line segment that represents the start and stop of the mousemove
*     the objects will need to have a function that checks if a given line segement intersects with it
*   - instead of looping over all objects for checking for client events (i.e. clicked, hover, etc) we should binary search tree the object by location
*     this might not be too bad as the search for intersection will be O(n) where n is the number of objects
*      
*     https://www.youtube.com/watch?v=OJxEcs0w_kE (The Coding Train - Coding Challenge #98.1 Quadtree - Part 1)
*     https://en.wikipedia.org/wiki/Binary_space_partitioning (Binary Space Partition)
*     https://en.wikipedia.org/wiki/Quadtree (Quad Tree)
*   - figure out how to bezier curves on the path for smoother lines instead of lineTo
*
*   - New Whiteboard Elements
*     - Polygon
*     - Text Box
*   - Be able to select an element and modify it: change control points (corners, edges), edit text, translate, rotate
*   - check on isPointInStroke and isPointInPath methods of the canvas context
*
*/

import Box from "./Box.mjs";
import Circle from "./Circle.mjs";
import Line from "./Line.mjs";
import Path from "./Path.mjs";
import Rectangle from "./Rectangle.mjs";
import Ring from "./Ring.mjs";
import Point from "./Point.mjs";
import BoundingBox from "./BoundingBox.mjs";
import GeometricLine from "./GeometricLine.mjs";

const isDarkMode = true;

const SELECTED_COLOR = "#00ff00";

class CanvasMode {
    static Select = new CanvasMode('Select');
    static Pen = new CanvasMode('Pen');
    static Erase = new CanvasMode('Erase');
    static Line = new CanvasMode('Line');
    static Rectangle = new CanvasMode('Rectangle');
    static Circle = new CanvasMode('Circle');
    static Box = new CanvasMode('Box');
    static Ring = new CanvasMode('Ring');

    constructor(name) {
        this.name = name;
    }
}

export default class Whiteboard {
    constructor(canvas) {
        if (!canvas.getContext) {
            throw 'A whiteboard must be constructed with a canvas element.'
        }

        this.elements = new Map();
        this.canvas = canvas;
        this.toolbar = document.createElement('div');
        this.context = canvas.getContext('2d', { alpha: false });
        this.width = canvas.getBoundingClientRect().width;
        this.height = canvas.getBoundingClientRect().height;

        this.isMouseDown = false;
        this.mouseCurrentPosition = new Point(0, 0);
        this.mousePreviousPosition = new Point(0, 0);
        
        this.mode = CanvasMode.Select;
        
        this.currentObject = null;
        this.fillStyle = isDarkMode ? "#ffffff" : "#000000";
        this.strokeStyle = isDarkMode ? "#ffffff" : "#000000";
        this.backgroundColor = isDarkMode ? "#000000" : "#ffffff";
        this.lineWidth = 5;
        this.lineCap = 'butt';      // butt, round, square
        this.lineJoin = 'miter';    // miter, round, bevel
        this.lineDash = [];
        this.selectBoxColor = "#00ff00";
        this.boundingBoxColor = "#ff0000";
        
        
        canvas.width = this.width;
        canvas.height = this.height;
        
        canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        canvas.addEventListener('keydown', (event) => this.handleKeyDown(event));

        this.toolbar.style = `
            position: absolute;
            top: 20px;
            left: 20px;
        `;
        this.modeText = document.createElement('span');
        const selectButton = document.createElement('button');
        const penButton = document.createElement('button');
        const lineButton = document.createElement('button');
        const rectangleButton = document.createElement('button');
        const boxButton = document.createElement('button');
        const circleButton = document.createElement('button');
        const ringButton = document.createElement('button');
        const eraseButton = document.createElement('button');
        const strokeColorPicker = document.createElement('input');
        const fillColorPicker = document.createElement('input');
        const widthInput = document.createElement('input');

        this.modeText.textContent = this.mode.name;
        this.modeText.style.color = this.strokeStyle;
        selectButton.textContent = 'Select';
        penButton.textContent = 'Pen';
        lineButton.textContent = 'Line';
        rectangleButton.textContent = 'Rectangle';
        boxButton.textContent = 'Box';
        circleButton.textContent = 'Circle';
        ringButton.textContent = 'Ring';
        eraseButton.textContent = 'Erase';
        strokeColorPicker.type = 'color';
        strokeColorPicker.value = this.strokeStyle;
        fillColorPicker.type = 'color';
        fillColorPicker.value = this.fillStyle;
        widthInput.type = 'number';
        widthInput.value = this.lineWidth.toString();

        selectButton.addEventListener('click', () => this.setMode(CanvasMode.Select));
        penButton.addEventListener('click', () => this.setMode(CanvasMode.Pen));
        lineButton.addEventListener('click', () => this.setMode(CanvasMode.Line));
        rectangleButton.addEventListener('click', () => this.setMode(CanvasMode.Rectangle));
        boxButton.addEventListener('click', () => this.setMode(CanvasMode.Box));
        circleButton.addEventListener('click', () => this.setMode(CanvasMode.Circle));
        ringButton.addEventListener('click', () => this.setMode(CanvasMode.Ring));
        eraseButton.addEventListener('click', () => this.setMode(CanvasMode.Erase));
        strokeColorPicker.addEventListener('change', () => this.strokeStyle = strokeColorPicker.value);
        fillColorPicker.addEventListener('change', () => this.fillStyle = fillColorPicker.value);
        widthInput.addEventListener('change', () => this.lineWidth = parseInt(widthInput.value));
        
        this.toolbar.appendChild(this.modeText);
        this.toolbar.appendChild(selectButton);
        this.toolbar.appendChild(penButton);
        this.toolbar.appendChild(lineButton);
        this.toolbar.appendChild(rectangleButton);
        this.toolbar.appendChild(boxButton);
        this.toolbar.appendChild(circleButton);
        this.toolbar.appendChild(ringButton);
        this.toolbar.appendChild(eraseButton);  
        this.toolbar.appendChild(strokeColorPicker);
        this.toolbar.appendChild(fillColorPicker);
        this.toolbar.appendChild(widthInput);

        document.body.appendChild(this.toolbar);

        this.redraw();
    }

    toObject() {
        return Object.fromEntries(this.elements);
    }

    static fromObject(object, canvas) {
        const whiteboard = new Whiteboard(canvas);
        whiteboard.load(object);
        return whiteboard;
    }

    load(object) {
        for (const elementID in object) {
            const current = object[elementID];
            switch (current.type) {
                case 'path':
                    this.add(new Path(current));
                    break;
                case 'line':
                    this.add(new Line(current));
                    break;
                case 'rectangle':
                    this.add(new Rectangle(current));
                    break;
                case 'box':
                    this.add(new Box(current));
                    break;
                case 'circle':
                    this.add(new Circle(current));
                    break;
                case 'ring':
                    this.add(new Ring(current));
                    break;
                default:
            }
        }
    }

    setMode(mode) {
        this.mode = mode;
        
        // rerender the current mode
        this.modeText.textContent = this.mode.name;
    }

    getMousePosition(event) {
        let rect = this.canvas.getBoundingClientRect();
        return new Point(event.clientX - rect.left, event.clientY - rect.top);
    }

    add(element) {
        this.elements.set(element.id, element)
        element.draw(this.context);
    }

    remove(element) {
        // remove the element from the elements object
        this.elements.delete(element.id)

        // redraw the canvas
        this.redraw();
    }

    redraw() {
        // better performance to only redraw after animation frame
        // breaks select since the selection box isn't an object in the whiteboard

        // window.requestAnimationFrame(() => {
        //     // clear the entire canvas
        //     this.context.clearRect(0, 0, this.width, this.height);

        //     // redraw all of the elements
        //     this.elements.forEach(element => {
        //         element.draw(this.context);
        //     })
        // })


        // clear the entire canvas
        this.context.clearRect(0, 0, this.width, this.height);
        // set the whiteboard background color
        this.context.fillStyle = this.backgroundColor;
        this.context.fillRect(0, 0, canvas.width, canvas.height);

        // redraw all of the elements
        this.elements.forEach(element => {
            element.draw(this.context);
        })
    }

    showBoundingBox(element) {
        element.setShowBoundingBox(true);
        element.drawBoundingBox(this.context);
    }

    hideBoundingBox(element) {
        element.setShowBoundingBox(false);
        this.redraw();
    }

    handleMouseDown(e) {
        const objectDefaults = {
            origin: this.getMousePosition(e),
            fill: this.fillStyle,
            stroke: this.strokeStyle,
            lineWidth: this.lineWidth,
            lineCap: this.lineCap,
            lineJoin: this.lineJoin,
            lineDash: [],
            selectBoxColor: this.selectBoxColor,
            boundingBoxColor: this.boundingBoxColor
        }
        switch (this.mode) {
            case CanvasMode.Select:
                this.selectDown(e);
                break
            case CanvasMode.Pen:
                this.objectDown(e, new Path({ ...objectDefaults, lineCap: 'round', lineJoin: 'round' }));
                break;
            case CanvasMode.Line:
                this.objectDown(e, new Line(objectDefaults))
                break;
            case CanvasMode.Rectangle:
                this.objectDown(e, new Rectangle(objectDefaults))
                break;
            case CanvasMode.Box:
                this.objectDown(e, new Box(objectDefaults))
                break;
            case CanvasMode.Circle:
                this.objectDown(e, new Circle(objectDefaults))
                break;
            case CanvasMode.Ring:
                this.objectDown(e, new Ring(objectDefaults))
                break;
            case CanvasMode.Erase:
                this.eraserDown();
                break;
            default:
        }
    }

    handleMouseUp(e) {
        switch (this.mode) {
            case CanvasMode.Select:
                this.selectUp();
                break
            case CanvasMode.Pen:
            case CanvasMode.Line:
            case CanvasMode.Box:
            case CanvasMode.Rectangle:
            case CanvasMode.Circle:
            case CanvasMode.Ring:
                this.objectUp();
                break;
            case CanvasMode.Erase:
                this.eraserUp();
                break;
            default:
        }
    }

    handleMouseMove(e) {
        switch (this.mode) {
            case CanvasMode.Select:
                this.selectMove(e);
                break
            case CanvasMode.Pen:
                this.pathMove(e);
                break;
            case CanvasMode.Line:
                this.lineMove(e);
                break; 
            case CanvasMode.Rectangle:
                this.rectangleMove(e);
                break;
            case CanvasMode.Box:
                this.boxMove(e);
                break;
            case CanvasMode.Circle:
                this.circleMove(e);
                break;
            case CanvasMode.Ring:
                this.ringMove(e);
                break;
            case CanvasMode.Erase:
                this.eraserMove(e);
                break;
            default:
        }
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 's':
                this.setMode(CanvasMode.Select);
                break;
            case 'p':
                this.setMode(CanvasMode.Pen);
                break;
            case 'e':
                this.setMode(CanvasMode.Erase);
                break;
            case 'l':
                this.setMode(CanvasMode.Line);
                break;
            case 'R':
                this.setMode(CanvasMode.Rectangle);
                break;
            case 'C':
                this.setMode(CanvasMode.Circle);
                break;
            case 'b':
                this.setMode(CanvasMode.Box);
                break;
            case 'r':
                this.setMode(CanvasMode.Ring);
                break;
            case 'Delete':
            case 'Backspace':
                if (this.mode == CanvasMode.Select) {
                    this.elements.forEach(element => {
                        if (element.selected) {
                            this.elements.delete(element.id);
                        }
                    })
                    this.redraw();
                }
                break;
            default:
        }
    }

    queryAtPoint(point) {
        let foundElements = [];
        this.elements.forEach(element => {
            if (element.pointIsInBoundingBox(point)) {
                foundElements.push(element);
            }
        })
        return foundElements;
    }

    /**
     * 
     * @param {GeometricLine} line 
     * @returns 
     */
    queryAtLine(line) {
        let foundElements = [];
        this.elements.forEach(element => {
            if (element.lineIsInBoundingBox(line)) {
                foundElements.push(element);
            }
        })
        return foundElements;
    }

    queryAtBox(boundingBox) {
        let foundElements = [];
        this.elements.forEach(element => {
            if (element.boxIsInBoundingBox(boundingBox)) {
                foundElements.push(element);
            }
        })
        return foundElements;
    }

    objectDown(e, newObject) {
        const mousePos = this.getMousePosition(e)
        this.mousePreviousPosition.update(mousePos.x, mousePos.y)
        this.isMouseDown = true;

        this.currentObject = newObject;
        this.elements.set(this.currentObject.id, this.currentObject)
    }
    objectUp() {
        this.currentObject = null;
        this.isMouseDown = false;

        this.redraw();
    }

    pathMove(e) {
        if (this.isMouseDown) {
            const mousePos = this.getMousePosition(e)
            this.mouseCurrentPosition.update(mousePos.x, mousePos.y)

            this.currentObject.drawNextSegment(
                this.context,
                new Line({
                    origin: new Point(this.mousePreviousPosition.x, this.mousePreviousPosition.y),
                    endPoint: new Point(this.mouseCurrentPosition.x, this.mouseCurrentPosition.y),
                    fill: this.currentObject.fill,
                    stroke: this.currentObject.stroke,
                    lineWidth: this.currentObject.lineWidth,
                    lineCap: this.currentObject.lineCap,
                    lineJoin: this.currentObject.lineJoin,
                    lineDash: this.currentObject.lineDash
                }
            ))
            this.mousePreviousPosition.update(mousePos.x, mousePos.y)
        }
    }
    lineMove(e) {
        if (this.isMouseDown) {
            const mousePos = this.getMousePosition(e)

            this.currentObject.endPoint = mousePos;
            this.currentObject.updateBoundingBox();

            this.redraw();
        }
    }
    rectangleMove(e) {
        if (this.isMouseDown) {
            const mousePos = this.getMousePosition(e)
            this.mouseCurrentPosition.update(mousePos.x, mousePos.y)

            this.currentObject.width = this.mouseCurrentPosition.x - this.currentObject.origin.x;
            this.currentObject.height = this.mouseCurrentPosition.y - this.currentObject.origin.y;
            this.currentObject.updateBoundingBox();

            this.redraw();
        }
    }
    boxMove(e) {
        if (this.isMouseDown) {
            const mousePos = this.getMousePosition(e)
            this.mouseCurrentPosition.update(mousePos.x, mousePos.y)

            this.currentObject.width = this.mouseCurrentPosition.x - this.currentObject.origin.x;
            this.currentObject.height = this.mouseCurrentPosition.y - this.currentObject.origin.y;
            this.currentObject.updateBoundingBox();

            this.redraw();
        }
    }
    circleMove(e) {
        if (this.isMouseDown) {
            const mousePos = this.getMousePosition(e)
            this.mouseCurrentPosition.update(mousePos.x, mousePos.y)

            this.currentObject.radius = Point.distance(this.currentObject.origin, this.mouseCurrentPosition);
            this.currentObject.updateBoundingBox();

            this.redraw();
        }
    }
    ringMove(e) {
        if (this.isMouseDown) {
            const mousePos = this.getMousePosition(e)
            this.mouseCurrentPosition.update(mousePos.x, mousePos.y)

            this.currentObject.radius = Point.distance(this.currentObject.origin, this.mouseCurrentPosition);
            this.currentObject.updateBoundingBox();

            this.redraw();
        }
    }

    selectDown(e) {
        // unselect everything
        this.elements.forEach(element => element.selected = false);

        const mousePos = this.getMousePosition(e)
        this.isMouseDown = true;

        this.currentObject = new BoundingBox(mousePos.x, mousePos.y, mousePos.x, mousePos.y);
    }
    selectUp() {
        // check if any elements intersect with the selection box and select them
        this.elements.forEach(element => {
            if (element.boxIsInBoundingBox(this.currentObject)) {
                element.selected = true;
                console.log(element);
            }
        })

        this.currentObject = null;
        this.isMouseDown = false;

        this.redraw();
    }
    selectMove(e) {

        if (this.isMouseDown) {
            const mousePos = this.getMousePosition(e)
            this.currentObject.update(this.currentObject.startPoint.x, this.currentObject.startPoint.y, mousePos.x, mousePos.y);

            // redraw to prepare for new selection box
            this.redraw();

            // manually draw in the box
            this.context.beginPath();
            this.context.strokeStyle = this.selectBoxColor;
            this.context.lineWidth = 5;
            this.context.setLineDash([4,2]);
            this.context.rect(this.currentObject.startPoint.x, this.currentObject.startPoint.y, this.currentObject.getWidth(), this.currentObject.getHeight());
            this.context.stroke();
        }
    }

    eraserDown() {
        this.isMouseDown = true;
    }
    eraserUp() {
        this.isMouseDown = false;
    }
    eraserMove(e) {
        const mousePos = this.getMousePosition(e)
        this.mouseCurrentPosition.update(mousePos.x, mousePos.y)

        if (this.isMouseDown) {
            // eraser line
            const eraserLine = new GeometricLine(
                new Point(this.mousePreviousPosition.x, this.mousePreviousPosition.y),
                new Point(this.mouseCurrentPosition.x, this.mouseCurrentPosition.y)
            )

            // check if intersects with any elements
            // first check bounding box to narrow the search
            this.elements.forEach(element => {
                if (element.lineIsInBoundingBox(eraserLine)) {
                    // now check only the bounding intersection for their more complex intersection function
                    if (element.isLineIntersecting(eraserLine)) {
                        this.elements.delete(element.id);
                        this.redraw()
                    }
                }
            })
        }

        this.mousePreviousPosition.update(mousePos.x, mousePos.y)
    }


}