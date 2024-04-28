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
*     - Polygon (still needs point inside method - consider casting ray to the right and see how many edges it hits to see if we are inside.)
*     - Text Box
*   - Be able to select an element and modify it: change control points (corners, edges), edit text, translate, rotate
*   - check on isPointInStroke and isPointInPath methods of the canvas context
*   - Keyboard shortcuts, ctrl+z, ctrl+y, ctrl+c, ctrl+v, etc
*   - fix rotation and translation to work with all types, they should all have their own rotate and translate methods to handle each case
*   - clean up selecting objects, make a method that selects and element by adding it to the set and setting the object property
*
*/

import Box from "./Box.mjs";
import Circle from "./Circle.mjs";
import Line from "./Line.mjs";
import Path from "./Path.mjs";
import Rectangle from "./Rectangle.mjs";
import Ring from "./Ring.mjs";
import Polygon from "./Polygon.mjs";
import Point from "./Point.mjs";
import GeometricLine from "./GeometricLine.mjs";

class CanvasMode {
    static Select = new CanvasMode('Select');
    static Pen = new CanvasMode('Pen');
    static Erase = new CanvasMode('Erase');
    static Line = new CanvasMode('Line');
    static Rectangle = new CanvasMode('Rectangle');
    static Circle = new CanvasMode('Circle');
    static Box = new CanvasMode('Box');
    static Ring = new CanvasMode('Ring');
    static Polygon = new CanvasMode('Polygon');

    constructor(name) {
        this.name = name;
    }
}

export default class Whiteboard {
    constructor(canvas) {
        if (!canvas.getContext) {
            throw 'A whiteboard must be constructed with a canvas element.'
        }

        this.debug = false;

        this.clipboard = [];

        this.elements = new Map();
        this.hoveredElements = new Set();
        this.selectedElements = new Set();

        this.canvas = canvas;
        this.isDarkMode = true;
        this.toolbar = document.createElement('div');
        this.context = canvas.getContext('2d', { alpha: false });
        this.width = canvas.getBoundingClientRect().width;
        this.height = canvas.getBoundingClientRect().height;

        this.isMouseDown = false;
        this.isDragging = false;
        this.mouseCurrentPosition = new Point(0, 0);
        this.mousePreviousPosition = new Point(0, 0);
        
        this.mode = CanvasMode.Select;
        
        this.currentObject = null;
        this.fillStyle = this.isDarkMode ? "#ffffff" : "#000000";
        this.strokeStyle = this.isDarkMode ? "#ffffff" : "#000000";
        this.backgroundColor = this.isDarkMode ? "#000000" : "#ffffff";
        this.lineWidth = 5;
        this.lineCap = 'butt';      // butt, round, square
        this.lineJoin = 'miter';    // miter, round, bevel
        this.lineDash = [];
        this.selectBoxColor = "#00ff00";
        this.boundingBoxColor = "#ff0000";

        this.polygonNumSides = 5;
        
        
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
        const polygonButton = document.createElement('button');
        const polygonInput = document.createElement('input');
        const eraseButton = document.createElement('button');
        const strokeColorPicker = document.createElement('input');
        const fillColorPicker = document.createElement('input');
        const widthInput = document.createElement('input');
        const debugButton = document.createElement('button');

        this.modeText.textContent = this.mode.name;
        this.modeText.style.color = this.strokeStyle;
        selectButton.textContent = 'Select';
        penButton.textContent = 'Pen';
        lineButton.textContent = 'Line';
        rectangleButton.textContent = 'Rectangle';
        boxButton.textContent = 'Box';
        circleButton.textContent = 'Circle';
        ringButton.textContent = 'Ring';
        polygonButton.textContent = 'Polygon';
        polygonInput.type = 'number';
        polygonInput.value = this.polygonNumSides.toString();
        eraseButton.textContent = 'Erase';
        strokeColorPicker.type = 'color';
        strokeColorPicker.value = this.strokeStyle;
        fillColorPicker.type = 'color';
        fillColorPicker.value = this.fillStyle;
        widthInput.type = 'number';
        widthInput.value = this.lineWidth.toString();
        debugButton.textContent = 'DEBUG';

        selectButton.addEventListener('click', () => this.setMode(CanvasMode.Select));
        penButton.addEventListener('click', () => this.setMode(CanvasMode.Pen));
        lineButton.addEventListener('click', () => this.setMode(CanvasMode.Line));
        rectangleButton.addEventListener('click', () => this.setMode(CanvasMode.Rectangle));
        boxButton.addEventListener('click', () => this.setMode(CanvasMode.Box));
        circleButton.addEventListener('click', () => this.setMode(CanvasMode.Circle));
        ringButton.addEventListener('click', () => this.setMode(CanvasMode.Ring));
        polygonButton.addEventListener('click', () => this.setMode(CanvasMode.Polygon));
        polygonInput.addEventListener('input', () => this.polygonNumSides = parseInt(polygonInput.value));
        eraseButton.addEventListener('click', () => this.setMode(CanvasMode.Erase));
        strokeColorPicker.addEventListener('change', () => this.strokeStyle = strokeColorPicker.value);
        fillColorPicker.addEventListener('change', () => this.fillStyle = fillColorPicker.value);
        widthInput.addEventListener('input', () => this.lineWidth = parseInt(widthInput.value));
        debugButton.addEventListener('click', () => this.toggleDebug());
        
        this.toolbar.appendChild(this.modeText);
        this.toolbar.appendChild(selectButton);
        this.toolbar.appendChild(penButton);
        this.toolbar.appendChild(lineButton);
        this.toolbar.appendChild(rectangleButton);
        this.toolbar.appendChild(boxButton);
        this.toolbar.appendChild(circleButton);
        this.toolbar.appendChild(ringButton);
        this.toolbar.appendChild(polygonButton);
        this.toolbar.appendChild(polygonInput);
        this.toolbar.appendChild(eraseButton);  
        this.toolbar.appendChild(strokeColorPicker);
        this.toolbar.appendChild(fillColorPicker);
        this.toolbar.appendChild(widthInput);
        this.toolbar.appendChild(debugButton);

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
                case 'polygon':
                    this.add(new Polygon(current));
                    break;
                default:
            }
        }
    }

    convertObjectToWhiteboardObject(object) {
        switch (object.type) {
            case 'path':
                return new Path(object);
            case 'line':
                return new Line(object);
            case 'rectangle':
                return new Rectangle(object);
            case 'box':
                return new Box(object);
            case 'circle':
                return new Circle(object);
            case 'ring':
                return new Ring(object);
            case 'polygon':
                return new Polygon(object);
            default:
                return null;
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

    toggleDebug() {
        this.debug = !this.debug;

        if (this.debug) {
            this.elements.forEach(element => this.showBoundingBox(element));
        } else {
            this.elements.forEach(element => this.hideBoundingBox(element));
            this.redraw();
        }
    }

    showBoundingBox(element) {
        element.showBoundingBox = true;
        element.drawBoundingBox(this.context);

        if (element.segments) {
            element.segments.forEach(segment => {
                segment.showBoundingBox = true;
                segment.drawBoundingBox(this.context);
            })
        }
    }

    hideBoundingBox(element) {
        element.showBoundingBox = false;

        if (element.segments) {
            element.segments.forEach(segment => {
                segment.showBoundingBox = false;
            })
        }
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
            boundingBoxColor: this.boundingBoxColor,
            showBoundingBox: this.debug
        }

        switch (this.mode) {
            case CanvasMode.Select:
                this.selectDown(e);
                break
            case CanvasMode.Pen:
                this.objectDown(new Path({ ...objectDefaults, lineCap: 'round', lineJoin: 'round' }));
                break;
            case CanvasMode.Line:
                this.objectDown(new Line(objectDefaults))
                break;
            case CanvasMode.Rectangle:
                this.objectDown(new Rectangle(objectDefaults))
                break;
            case CanvasMode.Box:
                this.objectDown(new Box(objectDefaults))
                break;
            case CanvasMode.Circle:
                this.objectDown(new Circle(objectDefaults))
                break;
            case CanvasMode.Ring:
                this.objectDown(new Ring(objectDefaults))
                break;
            case CanvasMode.Polygon:
                this.objectDown(new Polygon({ ...objectDefaults, numSides: this.polygonNumSides, lineCap: 'round', lineJoin: 'round' }))
                break;
            case CanvasMode.Erase:
                this.eraserDown();
                break;
            default:
        }
        this.isMouseDown = true;
        this.isDragging = false;
    }

    handleMouseUp(e) {
        switch (this.mode) {
            case CanvasMode.Select:
                this.selectUp(e);
                break
            case CanvasMode.Pen:
            case CanvasMode.Line:
            case CanvasMode.Box:
            case CanvasMode.Rectangle:
            case CanvasMode.Circle:
            case CanvasMode.Ring:
            case CanvasMode.Polygon:
                this.objectUp();
                break;
            case CanvasMode.Erase:
                this.eraserUp();
                break;
            default:
        }
        this.isMouseDown = false;
        this.isDragging = false;
    }

    handleMouseMove(e) {
        this.mouseCurrentPosition = this.getMousePosition(e);
        switch (this.mode) {
            case CanvasMode.Select:
                this.selectMove();
                break
            case CanvasMode.Pen:
                this.pathMove();
                break;
            case CanvasMode.Line:
                this.lineMove();
                break; 
            case CanvasMode.Rectangle:
                this.rectangleMove();
                break;
            case CanvasMode.Box:
                this.boxMove();
                break;
            case CanvasMode.Circle:
                this.circleMove();
                break;
            case CanvasMode.Ring:
                this.ringMove();
                break;
            case CanvasMode.Polygon:
                this.polygonMove();
                break;
            case CanvasMode.Erase:
                this.eraserMove();
                break;
            default:
        }
        this.mousePreviousPosition = this.mouseCurrentPosition;
        this.isDragging = this.isMouseDown;
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
            case 'g':
                this.setMode(CanvasMode.Polygon);
                break;
            case 'c':
                if (e.ctrlKey) {
                    if (this.mode == CanvasMode.Select) {
                        this.clipboard = Array.from(this.elements, ([key, value]) => value)
                        .filter(element => element.selected)
                        .map(element => {
                            return this.convertObjectToWhiteboardObject({...element});
                        });
                    }
                }
                break;
            case 'x':
                if (e.ctrlKey) {
                    if (this.mode == CanvasMode.Select) {
                        this.clipboard = Array.from(this.elements, ([key, value]) => value)
                        .filter(element => element.selected)
                        .map(element => {
                            this.elements.delete(element.id)
                            return this.convertObjectToWhiteboardObject({...element});
                        });
                        this.redraw();
                    }
                }
                break;
            case 'v':
                if (e.ctrlKey) {
                    this.clipboard = this.clipboard.map(element => {
                        // change the id
                        element.id = crypto.randomUUID();
                        // change the origin (and endpoint) to the current mouse position
                        if (element.endPoint) {
                            element.endPoint = new Point(this.mouseCurrentPosition.x + (element.endPoint.x - element.origin.x), this.mouseCurrentPosition.y + (element.endPoint.y - element.origin.y));
                        }
                        element.origin = this.mouseCurrentPosition;
                        // remove the selected state
                        element.selected = false;
                        // update the element
                        element.update();
                        // add the new element to the whiteboard
                        this.add(element);
                        // copy the element for the clipboard (to paste again a copy)
                        return this.convertObjectToWhiteboardObject({...element});
                    });
                    this.redraw();
                }
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
            case 'ArrowUp':
                e.preventDefault();
                if (e.ctrlKey) {

                } else {
                    if (this.mode == CanvasMode.Select) {
                        this.elements.forEach(element => {
                            if (element.selected) {
                                element.translate(0, -1);
                            }
                        })
                        this.redraw();
                    }
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (e.ctrlKey) {
                    if (this.mode == CanvasMode.Select) {
                        this.elements.forEach(element => {
                            if (element.selected) {
                                element.rotate(2 * Math.PI / 360)
                                element.update();
                            }
                        })
                        this.redraw();
                    }
                } else {
                    if (this.mode == CanvasMode.Select) {
                        this.elements.forEach(element => {
                            if (element.selected) {
                                element.translate(1, 0);
                            }
                        })
                        this.redraw();
                    }
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (e.ctrlKey) {

                } else {
                    if (this.mode == CanvasMode.Select) {
                        this.elements.forEach(element => {
                            if (element.selected) {
                                element.translate(0, 1);
                            }
                        })
                        this.redraw();
                    }
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (e.ctrlKey) {
                    if (this.mode == CanvasMode.Select) {
                        this.elements.forEach(element => {
                            if (element.selected) {
                                element.rotate(-2 * Math.PI / 360)
                            }
                        })
                        this.redraw();
                    }
                } else {
                    if (this.mode == CanvasMode.Select) {
                        this.elements.forEach(element => {
                            if (element.selected) {
                                element.translate(-1, 0);
                            }
                        })
                        this.redraw();
                    }
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

    objectDown(newObject) {
        this.currentObject = newObject;
        this.elements.set(this.currentObject.id, this.currentObject)
    }
    objectUp() {
        this.currentObject.update();
        this.currentObject = null;
        this.redraw();
    }

    pathMove() {
        if (this.isMouseDown) {
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
        }
    }
    lineMove() {
        if (this.isMouseDown) {
            this.currentObject.endPoint = this.mouseCurrentPosition;
            this.currentObject.update();
            this.redraw();
        }
    }
    rectangleMove() {
        if (this.isMouseDown) {
            this.currentObject.width = this.mouseCurrentPosition.x - this.currentObject.origin.x;
            this.currentObject.height = this.mouseCurrentPosition.y - this.currentObject.origin.y;
            this.currentObject.update();
            this.redraw();
        }
    }
    boxMove() {
        if (this.isMouseDown) {
            this.currentObject.width = this.mouseCurrentPosition.x - this.currentObject.origin.x;
            this.currentObject.height = this.mouseCurrentPosition.y - this.currentObject.origin.y;
            this.currentObject.update();
            this.redraw();
        }
    }
    circleMove() {
        if (this.isMouseDown) {
            this.currentObject.radius = Point.distance(this.currentObject.origin, this.mouseCurrentPosition);
            this.currentObject.update();
            this.redraw();
        }
    }
    ringMove() {
        if (this.isMouseDown) {
            this.currentObject.radius = Point.distance(this.currentObject.origin, this.mouseCurrentPosition);
            this.currentObject.update();
            this.redraw();
        }
    }
    polygonMove() {
        if (this.isMouseDown) {
            this.currentObject.radius = Point.distance(this.currentObject.origin, this.mouseCurrentPosition);
            this.currentObject.update();
            this.redraw();
        }
    }

    selectDown(e) {
        this.detectHovering();
        if (this.hoveredElements.size > 0) {
            this.canvas.style.cursor = 'grabbing';
        }
    }
    selectUp(e) {
        this.selectedElements.clear();
        
        for (const [id, element] of this.elements) {
            const isInside = element.boundingBox.isPointInside(this.mouseCurrentPosition);
            
            if (isInside) {
                this.canvas.style.cursor = 'grab';
            }
    
            if (e.ctrlKey) {
                element.selected = element.selected || isInside;
            } else {
                element.selected = (element.selected && this.isDragging) || isInside;
            }
    
            if (element.selected) this.selectedElements.add(id);
            console.log(element.selected && element)
        };
    
        this.redraw();
    }
    selectMove() {
        this.detectHovering();

        // handle mouse down
        if (this.isMouseDown && this.hoveredElements.size > 0) {
            // if the mouse is down and there are elements that are being hovered
            // start to move the object
            this.selectedElements.forEach(id => {
                const current = this.elements.get(id);
                const deltaX = this.mouseCurrentPosition.x - this.mousePreviousPosition.x;
                const deltaY = this.mouseCurrentPosition.y - this.mousePreviousPosition.y;
                current.translate(deltaX, deltaY);
            })

            this.canvas.style.cursor = 'grabbing';
            this.redraw();
        }
    }

    detectHovering() {
        // handle hover detection
        this.hoveredElements.clear();
        for (let [id, element] of this.elements) {
            if (element.selected && element.boundingBox.isPointInside(this.mouseCurrentPosition)) {
                this.hoveredElements.add(id);
            }
        }

        // change cursor
        if (this.hoveredElements.size > 0) {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    eraserDown() {
    }
    eraserUp() {
    }
    eraserMove() {
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
    }


}