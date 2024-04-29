import GeometricLine from "./GeometricLine.mjs";
import WhiteboardObject from "./WhiteboardObject.mjs";
import Line from "./Line.mjs";

export default class Path extends WhiteboardObject {
    constructor(options) {
        super(options);

        if (options.segments) {
            options.segments = options.segments.map(segment => new Line(segment));
        }
        const defaults = {
            type: 'path',
            segments: [],
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.update();
    }

    clone() {
        const newObject = super.clone();
        newObject.segments = newObject.segments.map(segment => segment.clone());
        return new Path(newObject);
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

    update() {
        this.updateSegments();
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

    updateSegments() {
        // only update if the origin and the origin of the first segment are different
        if (this.segments.length == 0) return;
        if (this.origin.x == this.segments[0].origin.x && this.origin.y == this.segments[0].origin.y) return;

        const deltaX = this.origin.x - this.segments[0].origin.x;
        const deltaY = this.origin.y - this.segments[0].origin.y;
        this.segments.forEach(segment => segment.translate(deltaX, deltaY));
    }

    translate(x, y) {
        this.origin.x += x;
        this.origin.y += y;

        this.segments.forEach(segment => segment.translate(x, y));
        this.update();
    }

    translateTo(x, y) {
        this.origin.x = x;
        this.origin.y = y;

        this.segments.forEach(segment => segment.translateTo(x, y));
        this.update();
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