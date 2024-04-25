import Point from "./Point.mjs";
import GeometricLine from "./GeometricLine.mjs";

export default class BoundingBox {
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

    /**
     * 
     * @param {GeometricLine} line 
     * @returns 
     */
    lineIntersects(line) {
        // check end points of the line if they are inside
        if (this.isPointInside(line.startPoint) || this.isPointInside(line.endPoint)) {
            return true;
        }

        // FIXME: we might be able to optimize the intersecting algorithm with the assumption
        // that the bounding box line are horizontal and vertical
        // check if the line intersects any side of the bounding box
        const top = new GeometricLine(
            new Point(this.startPoint.x, this.startPoint.y),
            new Point(this.endPoint.x, this.startPoint.y)
        )
        const right = new GeometricLine(
            new Point(this.endPoint.x, this.startPoint.y),
            new Point(this.endPoint.x, this.endPoint.y)
        )
        const bottom = new GeometricLine(
            new Point(this.endPoint.x, this.endPoint.y),
            new Point(this.startPoint.x, this.endPoint.y)
        )
        const left = new GeometricLine(
            new Point(this.startPoint.x, this.endPoint.y),
            new Point(this.startPoint.x, this.startPoint.y)
        )

        return (
            GeometricLine.doIntersect(line, top) ||
            GeometricLine.doIntersect(line, right) ||
            GeometricLine.doIntersect(line, bottom) ||
            GeometricLine.doIntersect(line, left)
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