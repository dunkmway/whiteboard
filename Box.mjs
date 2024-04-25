import WhiteboardObject from "./WhiteboardObject.mjs";
import Point from "./Point.mjs";
import GeometricLine from "./GeometricLine.mjs";

export default class Box extends WhiteboardObject {
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

    /**
     * 
     * @param {GeometricLine} line 
     * @returns 
     */
    isLineIntersecting(line) {
        // check if one end point is inside and the other outside
        if (
            this.isPointInside(line.startPoint) && !this.isPointInside(line.endPoint) || 
            this.isPointInside(line.endPoint) && !this.isPointInside(line.startPoint)
        ) {
            return true;
        }

        const endPoint = new Point(this.origin.x + this.width, this.origin.y + this.height);
        // check if the line intersects any side of the box
        const top = new GeometricLine(
            new Point(this.origin.x, this.origin.y),
            new Point(endPoint.x, this.origin.y)
        )
        const right = new GeometricLine(
            new Point(endPoint.x, this.origin.y),
            new Point(endPoint.x, endPoint.y)
        )
        const bottom = new GeometricLine(
            new Point(endPoint.x, endPoint.y),
            new Point(this.origin.x, endPoint.y)
        )
        const left = new GeometricLine(
            new Point(this.origin.x, endPoint.y),
            new Point(this.origin.x, this.origin.y)
        )

        return (
            GeometricLine.doIntersect(line, top) ||
            GeometricLine.doIntersect(line, right) ||
            GeometricLine.doIntersect(line, bottom) ||
            GeometricLine.doIntersect(line, left)
        )
    }
}