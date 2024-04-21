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
*   - do we need a bounding box property on objects?
*
*/

const DEBUG_MODE = false;

const SELECTED_COLOR = "green";
const BOUNDING_BOX_COLOR = "red";

const SELECT_MODE = 0;
const PEN_MODE = 1;
const ERASE_MODE = 2;

const LINE_MODE = 101;
const RECTANGLE_MODE = 102;
const CIRCLE_MODE = 103;
const BOX_MODE = 104;
const RING_MODE = 105;

const DEFAULT_MODE = SELECT_MODE;

class Whiteboard {
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

        this.mode = DEFAULT_MODE;

        this.currentObject = null;
        this.fillStyle = 'black';
        this.strokeStyle = 'black';
        this.lineWidth = 5;
        this.lineCap = 'butt';      // butt, round, square
        this.lineJoin = 'miter';    // miter, round, bevel
        this.lineDash = [];


        canvas.width = this.width;
        canvas.height = this.height;

        canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        canvas.addEventListener('keydown', (event) => this.handleKeyDown(event));



        this.toolbar.style = `
            position: fixed;
            top: 20px;
            left: 20px;
        `;
        const selectButton = document.createElement('button');
        const penButton = document.createElement('button');
        const rectangleButton = document.createElement('button');
        const boxButton = document.createElement('button');
        const circleButton = document.createElement('button');
        const ringButton = document.createElement('button');
        const eraseButton = document.createElement('button');
        const strokeColorPicker = document.createElement('input');
        const fillColorPicker = document.createElement('input');
        const widthInput = document.createElement('input');

        selectButton.textContent = 'Select';
        penButton.textContent = 'Pen';
        rectangleButton.textContent = 'Rectangle';
        boxButton.textContent = 'Box';
        circleButton.textContent = 'Circle';
        ringButton.textContent = 'Ring';
        eraseButton.textContent = 'Erase';
        strokeColorPicker.type = 'color';
        fillColorPicker.type = 'color';
        widthInput.type = 'number';
        widthInput.value = '5';

        selectButton.addEventListener('click', () => this.mode = SELECT_MODE);
        penButton.addEventListener('click', () => this.mode = PEN_MODE);
        rectangleButton.addEventListener('click', () => this.mode = RECTANGLE_MODE);
        boxButton.addEventListener('click', () => this.mode = BOX_MODE);
        circleButton.addEventListener('click', () => this.mode = CIRCLE_MODE);
        ringButton.addEventListener('click', () => this.mode = RING_MODE);
        eraseButton.addEventListener('click', () => this.mode = ERASE_MODE);
        strokeColorPicker.addEventListener('change', () => this.strokeStyle = strokeColorPicker.value);
        fillColorPicker.addEventListener('change', () => this.fillStyle = fillColorPicker.value);
        widthInput.addEventListener('change', () => this.lineWidth = parseInt(widthInput.value));
        
        this.toolbar.appendChild(selectButton);
        this.toolbar.appendChild(penButton);
        this.toolbar.appendChild(rectangleButton);
        this.toolbar.appendChild(boxButton);
        this.toolbar.appendChild(circleButton);
        this.toolbar.appendChild(ringButton);
        this.toolbar.appendChild(eraseButton);  
        this.toolbar.appendChild(strokeColorPicker);
        this.toolbar.appendChild(fillColorPicker);
        this.toolbar.appendChild(widthInput);

        document.body.appendChild(this.toolbar);

    }

    toObject() {
        return Object.fromEntries(this.elements);
    }

    static fromObject(object, canvas) {
        const whiteboard = new Whiteboard(canvas);
        whiteboard.elements = new Map(Object.entries(object));
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
        switch (this.mode) {
            case SELECT_MODE:
                this.selectDown(e);
                break
            case PEN_MODE:
                this.objectDown(e, new Path({
                    origin: this.getMousePosition(e),
                    fill: this.fillStyle,
                    stroke: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineCap: 'round',
                    lineJoin: 'round',
                    lineDash: [],
                }));
                break;
            case LINE_MODE:
                this.objectDown(e, new Line({
                    origin: this.getMousePosition(e),
                    fill: this.fillStyle,
                    stroke: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineCap: this.lineCap,
                    lineJoin: this.lineJoin,
                    lineDash: [],
                }))
                break;
            case RECTANGLE_MODE:
                this.objectDown(e, new Rectangle({
                    origin: this.getMousePosition(e),
                    fill: this.fillStyle,
                    stroke: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineCap: this.lineCap,
                    lineJoin: this.lineJoin,
                    lineDash: [],
                }))
                break;
            case BOX_MODE:
                this.objectDown(e, new Box({
                    origin: this.getMousePosition(e),
                    fill: this.fillStyle,
                    stroke: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineCap: this.lineCap,
                    lineJoin: this.lineJoin,
                    lineDash: [],
                }))
                break;
            case CIRCLE_MODE:
                this.objectDown(e, new Circle({
                    origin: this.getMousePosition(e),
                    fill: this.fillStyle,
                    stroke: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineCap: this.lineCap,
                    lineJoin: this.lineJoin,
                    lineDash: [],
                }))
                break;
            case RING_MODE:
                this.objectDown(e, new Ring({
                    origin: this.getMousePosition(e),
                    fill: this.fillStyle,
                    stroke: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineCap: this.lineCap,
                    lineJoin: this.lineJoin,
                    lineDash: [],
                }))
                break;
            case ERASE_MODE:
                this.eraserDown();
                break;
            default:
        }
    }

    handleMouseUp(e) {
        switch (this.mode) {
            case SELECT_MODE:
                this.selectUp();
                break
            case PEN_MODE:
            case LINE_MODE:
            case BOX_MODE:
            case RECTANGLE_MODE:
            case CIRCLE_MODE:
            case RING_MODE:
                this.objectUp();
                break;
            case ERASE_MODE:
                this.eraserUp();
                break;
            default:
        }
    }

    handleMouseMove(e) {
        switch (this.mode) {
            case SELECT_MODE:
                this.selectMove(e);
                break
            case PEN_MODE:
                this.pathMove(e);
                break;
            case LINE_MODE:
                this.lineMove(e);
                break; 
            case RECTANGLE_MODE:
                this.rectangleMove(e);
                break;
            case BOX_MODE:
                this.boxMove(e);
                break;
            case CIRCLE_MODE:
                this.circleMove(e);
                break;
            case RING_MODE:
                this.ringMove(e);
                break;
            case ERASE_MODE:
                this.eraserMove(e);
                break;
            default:
        }
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 's':
                console.log('SELECT_MODE')
                this.mode = SELECT_MODE;
                break;
            case 'p':
                console.log('PEN_MODE')
                this.mode = PEN_MODE;
                break;
            case 'e':
                console.log('ERASE_MODE')
                this.mode = ERASE_MODE;
                break;
            case 'l':
                console.log('LINE_MODE')
                this.mode = LINE_MODE;
                break;
            case 'R':
                console.log('RECTANGLE_MODE')
                this.mode = RECTANGLE_MODE;
                break;
            case 'C':
                console.log('CIRCLE_MODE')
                this.mode = CIRCLE_MODE;
                break;
            case 'b':
                console.log('BOX_MODE')
                this.mode = BOX_MODE;
                break;
            case 'r':
                console.log('RING_MODE')
                this.mode = RING_MODE;
                break;
            case 'Delete':
                if (this.mode == SELECT_MODE) {
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
            this.context.strokeStyle = SELECTED_COLOR;
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
            const eraserLine = new Line({
                origin: new Point(this.mousePreviousPosition.x, this.mousePreviousPosition.y),
                endPoint: new Point(this.mouseCurrentPosition.x, this.mouseCurrentPosition.y)
            })

            // check if intersects with any elements
            // first check bounding box to narrow the search
            let boundingIntersections = [];
            this.elements.forEach(element => {
                if (element.lineIsInBoundingBox(eraserLine)) {
                    boundingIntersections.push(element);
                }
            })

            // now check only the bounding intersection for their more complex intersection function
            boundingIntersections.forEach(element => {
                if (element.isLineIntersecting(eraserLine)) {
                    this.elements.delete(element.id);
                    this.redraw()
                }
            })
        }

        this.mousePreviousPosition.update(mousePos.x, mousePos.y)
    }


}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }

    static distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    }

    // Given three collinear points p, q, r, the function checks if
    // point q lies on line segment 'pr'
    static onSegment(p, q, r)
    {
        if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
        return true;
        
        return false;
    }

    // To find orientation of ordered triplet (p, q, r).
    // The function returns following values
    // 0 --> p, q and r are collinear
    // 1 --> Clockwise
    // 2 --> Counterclockwise
    static orientation(p, q, r)
    {
    
        // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
        // for details of below formula.
        let val = (q.y - p.y) * (r.x - q.x) -
                (q.x - p.x) * (r.y - q.y);
        
        if (val == 0) return 0; // collinear
        
        return (val > 0)? 1: 2; // clock or counterclock wise
    }
}

class BoundingBox {
    constructor(x1, y1, x2, y2) {
        this.startPoint = new Point(x1, y1);
        this.endPoint = new Point(x2, y2);
    }

    update(x1, y1, x2, y2) {
        this.startPoint.update(x1, y1);
        this.endPoint.update(x2, y2);
    }

    getWidth() {
        return this.endPoint.x - this.startPoint.x;
    }

    getHeight() {
        return this.endPoint.y - this.startPoint.y;
    }

    isPointInside(point) {
        // if the point lies in between the x boundary and the y boundary
        return (
            Math.abs(this.startPoint.x - point.x) + Math.abs(this.endPoint.x - point.x) == Math.abs(this.startPoint.x - this.endPoint.x) &&
            Math.abs(this.startPoint.y - point.y) + Math.abs(this.endPoint.y - point.y) == Math.abs(this.startPoint.y - this.endPoint.y)
        )
    }

    lineIntersects(line) {
        // check end points of the line if they are inside
        if (this.isPointInside(line.origin) || this.isPointInside(line.endPoint)) {
            return true;
        }

        // FIXME: we might be able to optimize the intersecting algorithm with the assumption
        // that the bounding box line are horizontal and vertical
        // check if the line intersects any side of the bounding box
        const top = new Line({
            origin: new Point(this.startPoint.x, this.startPoint.y),
            endPoint: new Point(this.endPoint.x, this.startPoint.y)
        })
        const right = new Line({
            origin: new Point(this.endPoint.x, this.startPoint.y),
            endPoint: new Point(this.endPoint.x, this.endPoint.y)
        })
        const bottom = new Line({
            origin: new Point(this.endPoint.x, this.endPoint.y),
            endPoint: new Point(this.startPoint.x, this.endPoint.y)
        })
        const left = new Line({
            origin: new Point(this.startPoint.x, this.endPoint.y),
            endPoint: new Point(this.startPoint.x, this.startPoint.y)
        })

        return (
            Line.doIntersect(line, top) ||
            Line.doIntersect(line, right) ||
            Line.doIntersect(line, bottom) ||
            Line.doIntersect(line, left)
        )
    }

    boxIntersects(box) {
        // check for false as it's only condition is the opposite sides are not touching

        return !(
            (this.startPoint.y > box.startPoint.y && this.startPoint.y > box.endPoint.y &&
            this.endPoint.y > box.startPoint.y && this.endPoint.y > box.endPoint.y)
            ||
            (this.startPoint.x > box.startPoint.x && this.startPoint.x > box.endPoint.x &&
            this.endPoint.x > box.startPoint.x && this.endPoint.x > box.endPoint.x)
            ||
            (this.startPoint.y < box.startPoint.y && this.startPoint.y < box.endPoint.y &&
            this.endPoint.y < box.startPoint.y && this.endPoint.y < box.endPoint.y)
            ||
            (this.startPoint.x < box.startPoint.x && this.startPoint.x < box.endPoint.x &&
            this.endPoint.x < box.startPoint.x && this.endPoint.x < box.endPoint.x)
        )
    }
}

class WhiteboardObject {
    constructor(options) {
        const defaults = {
            origin: new Point(0, 0),
            fill: '#000000',
            stroke: '#000000',
            lineWidth: 1,
            lineCap: 'butt',      // butt, round, square
            lineJoin: 'miter',    // miter, round, bevel
            lineDash: [],
            type: 'element',
            id: crypto.randomUUID(),
            boundingBox: new BoundingBox(0, 0, 0, 0),
            showBoundingBox: DEBUG_MODE,
            selected: false
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);
    }

    draw(context) {
        if (this.showBoundingBox) {
            this.drawBoundingBox(context);
        }

        if (this.selected) {
            this.drawSelected(context);
        }

        context.fillStyle = this.fill;
        context.strokeStyle = this.stroke;
        context.lineWidth = this.lineWidth;
        context.lineCap = this.lineCap;
        context.lineJoin = this.lineJoin;
        context.setLineDash(this.lineDash);
        context.beginPath();
    }

    drawBoundingBox(context) {
        context.strokeStyle = BOUNDING_BOX_COLOR;
        context.beginPath();
        context.rect(this.boundingBox.startPoint.x, this.boundingBox.startPoint.y, this.boundingBox.getWidth(), this.boundingBox.getHeight());
        context.stroke();
    }

    drawSelected(context) {
        context.strokeStyle = SELECTED_COLOR;
        context.beginPath();
        context.rect(this.boundingBox.startPoint.x, this.boundingBox.startPoint.y, this.boundingBox.getWidth(), this.boundingBox.getHeight());
        context.stroke();
    }

    pointIsInBoundingBox(point) {
        return this.boundingBox.isPointInside(point);
    }

    lineIsInBoundingBox(line) {
        return this.boundingBox.lineIntersects(line);
    }

    boxIsInBoundingBox(box) {
        return this.boundingBox.boxIntersects(box);
    }
}

class Fraction {
    constructor(numerator, denominator) {
        this.numerator = numerator;
        this.denominator = denominator;
    }

    reduce() {
        let a = this.numerator;
        let b = this.denominator; 
        let r;
        while ((a % b) > 0)  {
            r = a % b;
            a = b;
            b = r;
        }
        
        return new Fraction(this.numerator / b, this.denominator / b);
    }

    static equals(frac1, frac2) {
        return frac1.reduce() == frac2.reduce();
    }
}

class Line extends WhiteboardObject {
    constructor(options) {
        super(options);

        const defaults = {
            endPoint: new Point(0, 0),
            type: 'line'
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.updateBoundingBox();
    }

    draw(context) {
        super.draw(context);
        context.moveTo(this.origin.x, this.origin.y);
        context.lineTo(this.endPoint.x, this.endPoint.y);
        context.stroke();
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x, this.origin.y, this.endPoint.x, this.endPoint.y);
    }

    getSlope() {
        return new Fraction(this.origin.y - this.endPoint.y, this.origin.x - this.endPoint.x);
    }

    getLength() {
        return Point.distance(this.origin, this.endPoint);
    }

    isLineIntersecting(line) {
        return Line.doIntersect(this, line);
    }

    static isParallel(line1, line2) {
        return Fraction.equals(line1.getSlope(), line2.getSlope());
    }

    static doIntersect(line1, line2) {

        const p1 = line1.origin;
        const q1 = line1.endPoint;
        const p2 = line2.origin;
        const q2 = line2.endPoint;
    
        // Find the four orientations needed for general and
        // special cases
        let o1 = Point.orientation(p1, q1, p2);
        let o2 = Point.orientation(p1, q1, q2);
        let o3 = Point.orientation(p2, q2, p1);
        let o4 = Point.orientation(p2, q2, q1);
        
        // General case
        if (o1 != o2 && o3 != o4)
            return true;
        
        // Special Cases
        // p1, q1 and p2 are collinear and p2 lies on segment p1q1
        if (o1 == 0 && Point.onSegment(p1, p2, q1)) return true;
        
        // p1, q1 and q2 are collinear and q2 lies on segment p1q1
        if (o2 == 0 && Point.onSegment(p1, q2, q1)) return true;
        
        // p2, q2 and p1 are collinear and p1 lies on segment p2q2
        if (o3 == 0 && Point.onSegment(p2, p1, q2)) return true;
        
        // p2, q2 and q1 are collinear and q1 lies on segment p2q2
        if (o4 == 0 && Point.onSegment(p2, q1, q2)) return true;
        
        return false; // Doesn't fall in any of the above cases
    }
}

class Path extends WhiteboardObject {
    constructor(options) {
        super(options);

        const defaults = {
            type: 'path',
            segments: [],
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);
    }

    draw(context) {
        super.draw(context);
        this.segments.forEach(segment => {
            segment.draw(context)
        });
    }

    drawNextSegment(context, newSegment) {
        this.segments.push(newSegment);
        newSegment.draw(context);

        this.updateBoundingBox();
    }

    updateBoundingBox() {
        // find the boundaries

        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;

        this.segments.forEach(segment => {
            // left bound origin
            if (segment.origin.x < left) {
                left = segment.origin.x
            }
            // right bound origin 
            if (segment.origin.x > right) {
                right = segment.origin.x
            }
            // left bound end
            if (segment.endPoint.x < left) {
                left = segment.endPoint.x
            }
            // right bound end
            if (segment.endPoint.x > right) {
                right = segment.endPoint.x
            }
            // top bound origin
            if (segment.origin.y < top) {
                top = segment.origin.y
            }
            // bottom bound origin
            if (segment.origin.y > bottom) {
                bottom = segment.origin.y
            }
            // top bound end
            if (segment.endPoint.y < top) {
                top = segment.endPoint.y
            }
            // bottom bound end
            if (segment.endPoint.y > bottom) {
                bottom = segment.endPoint.y
            }
        })

        this.boundingBox.update(left, top, right, bottom);
    }

    isLineIntersecting(line) {
        for (let i = 0; i < this.segments.length; i++) {
            if (this.segments[i].isLineIntersecting(line)) {
                return true;
            }
        }

        return false;
    }
}

class Rectangle extends WhiteboardObject {
    constructor(options) {
        super(options);

        const defaults = {
            width: 100,
            height: 100,
            type: 'rectangle'
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.updateBoundingBox();
    }

    draw(context) {
        super.draw(context);
        context.rect(this.origin.x, this.origin.y, this.width, this.height);
        context.fill();
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x, this.origin.y, this.origin.x + this.width, this.origin.y + this.height);
    }

    isPointInside(point) {
        // if the point lies in between the x boundary and the y boundary
        const endPoint = new Point(this.origin.x + this.width, this.origin.y + this.height);
        return (
            Math.abs(this.origin.x - point.x) + Math.abs(endPoint.x - point.x) == Math.abs(this.origin.x - endPoint.x) &&
            Math.abs(this.origin.y - point.y) + Math.abs(endPoint.y - point.y) == Math.abs(this.origin.y - endPoint.y)
        )
    }

    isLineIntersecting(line) {
        // check end points of the line if they are inside
        if (this.isPointInside(line.origin) || this.isPointInside(line.endPoint)) {
            return true;
        }

        const endPoint = new Point(this.origin.x + this.width, this.origin.y + this.height);
        // check if the line intersects any side of the box
        const top = new Line({
            origin: new Point(this.origin.x, this.origin.y),
            endPoint: new Point(endPoint.x, this.origin.y)
        })
        const right = new Line({
            origin: new Point(endPoint.x, this.origin.y),
            endPoint: new Point(endPoint.x, endPoint.y)
        })
        const bottom = new Line({
            origin: new Point(endPoint.x, endPoint.y),
            endPoint: new Point(this.origin.x, endPoint.y)
        })
        const left = new Line({
            origin: new Point(this.origin.x, endPoint.y),
            endPoint: new Point(this.origin.x, this.origin.y)
        })

        return (
            Line.doIntersect(line, top) ||
            Line.doIntersect(line, right) ||
            Line.doIntersect(line, bottom) ||
            Line.doIntersect(line, left)
        )
    }
}

class Box extends WhiteboardObject {
    constructor(options) {
        super(options);

        const defaults = {
            width: 100,
            height: 100,
            type: 'box'
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.updateBoundingBox();
    }

    draw(context) {
        super.draw(context);
        context.rect(this.origin.x, this.origin.y, this.width, this.height);
        context.stroke();
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x, this.origin.y, this.origin.x + this.width, this.origin.y + this.height);
    }

    isPointInside(point) {
        // if the point lies in between the x boundary and the y boundary
        const endPoint = new Point(this.origin.x + this.width, this.origin.y + this.height);
        return (
            Math.abs(this.origin.x - point.x) + Math.abs(endPoint.x - point.x) == Math.abs(this.origin.x - endPoint.x) &&
            Math.abs(this.origin.y - point.y) + Math.abs(endPoint.y - point.y) == Math.abs(this.origin.y - endPoint.y)
        )
    }

    isLineIntersecting(line) {
        // check if one end point is inside and the other outside
        if (
            this.isPointInside(line.origin) && !this.isPointInside(line.endPoint) || 
            this.isPointInside(line.endPoint) && !this.isPointInside(line.origin)
        ) {
            return true;
        }

        const endPoint = new Point(this.origin.x + this.width, this.origin.y + this.height);
        // check if the line intersects any side of the box
        const top = new Line({
            origin: new Point(this.origin.x, this.origin.y),
            endPoint: new Point(endPoint.x, this.origin.y)
        })
        const right = new Line({
            origin: new Point(endPoint.x, this.origin.y),
            endPoint: new Point(endPoint.x, endPoint.y)
        })
        const bottom = new Line({
            origin: new Point(endPoint.x, endPoint.y),
            endPoint: new Point(this.origin.x, endPoint.y)
        })
        const left = new Line({
            origin: new Point(this.origin.x, endPoint.y),
            endPoint: new Point(this.origin.x, this.origin.y)
        })

        return (
            Line.doIntersect(line, top) ||
            Line.doIntersect(line, right) ||
            Line.doIntersect(line, bottom) ||
            Line.doIntersect(line, left)
        )
    }
}

class Circle extends WhiteboardObject {
    constructor(options) {
        super(options);

        const defaults = {
            radius: 50,
            type: 'circle'
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.updateBoundingBox();
    }

    draw(context) {
        super.draw(context);
        context.arc(this.origin.x, this.origin.y, Math.abs(this.radius), 0, 2 * Math.PI);
        context.fill();
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x - this.radius, this.origin.y - this.radius, this.origin.x + this.radius, this.origin.y + this.radius);
    }

    isPointInside(point) {
        return Point.distance(this.origin, point) <= this.radius;
    }

    isLineIntersecting(line) {
        // check if one end point is inside and the other outside
        if (this.isPointInside(line.origin) || this.isPointInside(line.endPoint)) {
            return true;
        }

        // FIXME: figure out the case when both endpoints are outside of the circle but interect

        return false;
    }
}

class Ring extends WhiteboardObject {
    constructor(options) {
        super(options);

        const defaults = {
            radius: 50,
            type: 'ring'
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.updateBoundingBox();
    }

    draw(context) {
        super.draw(context);
        context.arc(this.origin.x, this.origin.y, this.radius, 0, 2 * Math.PI);
        context.stroke();
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x - this.radius, this.origin.y - this.radius, this.origin.x + this.radius, this.origin.y + this.radius);
    }

    isPointInside(point) {
        return Point.distance(this.origin, point) <= this.radius;
    }

    isLineIntersecting(line) {
        // check if one end point is inside and the other outside
        if (
            this.isPointInside(line.origin) && !this.isPointInside(line.endPoint) || 
            this.isPointInside(line.endPoint) && !this.isPointInside(line.origin)
        ) {
            return true;
        }

        // FIXME: figure out the case when both endpoints are outside of the ring but interect

        return false;
    }
}