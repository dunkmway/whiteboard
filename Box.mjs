import WhiteboardObject from "./WhiteboardObject.mjs";

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