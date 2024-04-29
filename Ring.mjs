import GeometricLine from "./GeometricLine.mjs";
import WhiteboardObject from "./WhiteboardObject.mjs";
import Point from "./Point.mjs";

export default class Ring extends WhiteboardObject {
    constructor(options) {
        super(options);

        const defaults = {
            radius: 50,
            type: 'ring'
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.update();
    }

    clone() {
        return new Ring(super.clone());
    }

    draw(context) {
        super.draw(context);
        context.arc(this.origin.x, this.origin.y, this.radius, 0, 2 * Math.PI);
        context.stroke();
    }

    update() {
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x - this.radius, this.origin.y - this.radius, this.origin.x + this.radius, this.origin.y + this.radius);
    }

    isPointInside(point) {
        return Point.distance(this.origin, point) <= this.radius;
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

        // FIXME: figure out the case when both endpoints are outside of the ring but interect

        return false;
    }
}