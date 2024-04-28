import BoundingBox from "./BoundingBox.mjs";
import GeometricLine from "./GeometricLine.mjs";
import Point from "./Point.mjs";

export default class WhiteboardObject {
    constructor(options) {
        // ensure the option is set with the class and not just attributes
        if (options.origin) {
            options.origin = new Point(options.origin.x, options.origin.y);
        }
        if (options.boundingBox) {
            options.boundingBox = new BoundingBox(options.boundingBox.startPoint.x, options.boundingBox.startPoint.y, options.boundingBox.endPoint.x, options.boundingBox.endPoint.y);
        }
        const defaults = {
            origin: new Point(0, 0),
            rotation: 0,
            fill: '#000000',
            stroke: '#000000',
            lineWidth: 1,
            lineCap: 'butt',      // butt, round, square
            lineJoin: 'miter',    // miter, round, bevel
            lineDash: [],
            type: 'element',
            id: crypto.randomUUID(),
            boundingBox: new BoundingBox(0, 0, 0, 0),
            showBoundingBox: false,
            selected: false,
            boundingBoxColor: "#ff0000",
            selectBoxColor: "#00ff00"
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
        // draw the bounding box on the given context
        context.strokeStyle = this.boundingBoxColor;
        context.lineWidth = 5;
        context.beginPath();
        context.rect(this.boundingBox.startPoint.x, this.boundingBox.startPoint.y, this.boundingBox.getWidth(), this.boundingBox.getHeight());
        context.stroke();

        // if the element has segments, draw the bounding boxes on those segments
        if (this.segments) {
            this.segments.forEach(segment => segment.drawBoundingBox(context));
        }
    }

    drawSelected(context) {
        // draw the bounding box to signify the object is selected
        context.strokeStyle = this.selectBoxColor;
        context.lineWidth = 5;
        context.beginPath();
        context.rect(this.boundingBox.startPoint.x, this.boundingBox.startPoint.y, this.boundingBox.getWidth(), this.boundingBox.getHeight());
        context.stroke();
    }

    update() {
        throw('The update method must be implemented for the child class ' + this.type)
    }

    updateBoundingBox() {
        throw('The updateBoundingBox method must be implemented for the child class ' + this.type)
    }

    isLineIntersecting() {
        throw('The isLineIntersecting method must be implemented for the child class ' + this.type)
    }

    translate(x, y) {
        this.origin.x += x;
        this.origin.y += y;
        this.update();
    }

    translateTo(x, y) {
        this.origin.x = x;
        this.origin.y = y;
        this.update();
    }

    rotate(rad) {
        this.rotation += rad;
        this.rotation = this.rotation - Math.floor(this.rotation / (2 * Math.PI)) * (2 * Math.PI);
        this.update();
    }

    rotateTo(rad) {
        rad = rad - Math.floor(rad / (2 * Math.PI)) * (2 * Math.PI);
        this.rotation = rad;
        this.update();
    }

    pointIsInBoundingBox(point) {
        return this.boundingBox.isPointInside(point);
    }

    /**
     * 
     * @param {GeometricLine} line 
     * @returns 
     */
    lineIsInBoundingBox(line) {
        return this.boundingBox.lineIntersects(line);
    }

    boxIsInBoundingBox(box) {
        return this.boundingBox.boxIntersects(box);
    }
}