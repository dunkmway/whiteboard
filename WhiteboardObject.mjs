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
        context.strokeStyle = this.boundingBoxColor;
        context.lineWidth = 5;
        context.beginPath();
        context.rect(this.boundingBox.startPoint.x, this.boundingBox.startPoint.y, this.boundingBox.getWidth(), this.boundingBox.getHeight());
        context.stroke();
    }

    drawSelected(context) {
        context.strokeStyle = this.selectBoxColor;
        context.lineWidth = 5;
        context.beginPath();
        context.rect(this.boundingBox.startPoint.x, this.boundingBox.startPoint.y, this.boundingBox.getWidth(), this.boundingBox.getHeight());
        context.stroke();
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