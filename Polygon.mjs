import GeometricLine from "./GeometricLine.mjs";
import WhiteboardObject from "./WhiteboardObject.mjs";
import Point from "./Point.mjs";
import Line from "./Line.mjs";

export default class Polygon extends WhiteboardObject {
    constructor(options) {
        super(options);

        if (options.segments) {
            options.segments = options.segments.map(segment => new Line(segment));
        }

        const defaults = {
            numSides: 5,
            radius: this.minSize / 2,
            type: 'polygon',
            segments: [],
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.update();
    }

    clone() {
        const newObject = super.clone();
        newObject.segments = newObject.segments.map(segment => segment.clone());
        return new Polygon(newObject);
    }

    draw(context) {
        super.draw(context);
        this.segments.forEach(segment => {
            segment.draw(context)
        });
    }

    update() {
        if (this.radius < this.minSize / 2) this.radius = this.minSize / 2;
        this.updateSegments();
        this.updateBoundingBox();
    }
    
    updateBoundingBox() {
        // the segments should define the bounding box so just find the limits
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

    updateSegments() {
        this.segments = [];
        // go through all sides
        for (let i = 0; i < this.numSides; i++) {
            // get the start angle and end angle reletive to the origin of the segment
            const interiorAngle = (2 * Math.PI / this.numSides);
            const startAngle = i * interiorAngle + this.rotation;
            const endAngle = startAngle + interiorAngle;

            // get the exact location of the start and end points
            const start = new Point(this.origin.x + (Math.cos(startAngle) * this.radius), this.origin.y + (Math.sin(startAngle) * this.radius));
            const end = new Point(this.origin.x + (Math.cos(endAngle) * this.radius), this.origin.y + (Math.sin(endAngle) * this.radius));

            // push the new segment
            this.segments.push(new Line({
                origin: start,
                endPoint: end,
                fill: this.fill,
                stroke: this.stroke,
                lineWidth: this.lineWidth,
                lineCap: this.lineCap,
                lineJoin: this.lineJoin,
                lineDash: this.lineDash,
                isSegment: true
            }))
        }
    }

    isPointInside(point) {
        let inside = false;
        const x = point.x;
        const y = point.y;
    
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const xi = segment.endPoint.x;
            const yi = segment.endPoint.y;
            const xj = segment.startPoint.x;
            const yj = segment.startPoint.y;
    
            // image a horizontal line at the point extending to the right forever
            // if this line intersects the segments an odd number of times, the point is inside
            // the first check is if the line is within the y bounds
            // and the second check is if the horizontal line intersects the segment on the right of the point
            const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) {
                inside = !inside;
            }
        }
    
        return inside;
    }

    /**
     * 
     * @param {GeometricLine} line 
     * @returns 
     */
    isLineIntersecting(line) {
        // check for intersection on each segment
        for (let i = 0; i < this.segments.length; i++) {
            // first check if we are in the bounding box of the segment, this is a faster computation
            // then check for the more complex segment intersection
            if (this.segments[i].lineIsInBoundingBox(line) && this.segments[i].isLineIntersecting(line)) {
                return true;
            }
        }

        return false;
    }
}