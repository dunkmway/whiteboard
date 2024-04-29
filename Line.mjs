import WhiteboardObject from "./WhiteboardObject.mjs";
import Point from "./Point.mjs";
import GeometricLine from "./GeometricLine.mjs";

export default class Line extends WhiteboardObject {
    constructor(options) {
        super(options);

        // ensure the option is set with the class and not just attributes
        if (options.endPoint) {
            options.endPoint = new Point(options.endPoint.x, options.endPoint.y);
        }
        const defaults = {
            endPoint: new Point(this.origin.x + this.minSize, this.origin.y),
            type: 'line',
            isSegment: false
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.update();
    }

    clone() {
        const newObject = super.clone();
        newObject.endPoint = new Point(this.endPoint.x, this.endPoint.y);
        return new Line(newObject);
    }

    draw(context) {
        super.draw(context);
        context.moveTo(this.origin.x, this.origin.y);
        context.lineTo(this.endPoint.x, this.endPoint.y);
        context.stroke();
    }

    update() {
        // if this is a segment line, ignore the min sizes
        if (!this.isSegment) {
            const geoLine = new GeometricLine(this.origin, this.endPoint);
            const length = geoLine.getLength();
            if (length < this.minSize) {
                const scalingFactor = this.minSize / length;
                const slope = geoLine.getSlope();
                this.endPoint.x = this.origin.x + (slope.denominator * scalingFactor);
                this.endPoint.y = this.origin.y + (slope.numerator * scalingFactor);
            }
        }
        this.updateBoundingBox();
    }

    translate(x, y) {
        this.origin.x += x;
        this.origin.y += y;

        this.endPoint.x += x;
        this.endPoint.y += y;

        this.update();
    }

    translateTo(x, y) {
        this.translate(x - this.origin.x, y - this.origin.y);
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x, this.origin.y, this.endPoint.x, this.endPoint.y);
    }

    /**
     * 
     * @param {GeometricLine} line 
     * @returns 
     */
    isLineIntersecting(line) {
        return GeometricLine.doIntersect(
            new GeometricLine(this.origin, this.endPoint),
            line
        );
    }
}