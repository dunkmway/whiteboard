import WhiteboardObject from "./WhiteboardObject.mjs";

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