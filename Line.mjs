import WhiteboardObject from "./WhiteboardObject.mjs";

export default class Line extends WhiteboardObject {
    constructor(options) {
        super(options);

        // ensure the option is set with the class and not just attributes
        if (options.endPoint) {
            options.endPoint = new Point(options.endPoint.x, options.endPoint.y);
        }
        const defaults = {
            endPoint: new Point(0, 0),
            type: 'line'
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.updateBoundingBox();
    }

    draw(context) {
        super.draw(context);
        context.moveTo(this.origin.x, this.origin.y);
        context.lineTo(this.endPoint.x, this.endPoint.y);
        context.stroke();
    }

    updateBoundingBox() {
        this.boundingBox.update(this.origin.x, this.origin.y, this.endPoint.x, this.endPoint.y);
    }

    getSlope() {
        return new Fraction(this.origin.y - this.endPoint.y, this.origin.x - this.endPoint.x);
    }

    getLength() {
        return Point.distance(this.origin, this.endPoint);
    }

    isLineIntersecting(line) {
        return Line.doIntersect(this, line);
    }

    static isParallel(line1, line2) {
        return Fraction.equals(line1.getSlope(), line2.getSlope());
    }

    static doIntersect(line1, line2) {

        const p1 = line1.origin;
        const q1 = line1.endPoint;
        const p2 = line2.origin;
        const q2 = line2.endPoint;
    
        // Find the four orientations needed for general and
        // special cases
        let o1 = Point.orientation(p1, q1, p2);
        let o2 = Point.orientation(p1, q1, q2);
        let o3 = Point.orientation(p2, q2, p1);
        let o4 = Point.orientation(p2, q2, q1);
        
        // General case
        if (o1 != o2 && o3 != o4)
            return true;
        
        // Special Cases
        // p1, q1 and p2 are collinear and p2 lies on segment p1q1
        if (o1 == 0 && Point.onSegment(p1, p2, q1)) return true;
        
        // p1, q1 and q2 are collinear and q2 lies on segment p1q1
        if (o2 == 0 && Point.onSegment(p1, q2, q1)) return true;
        
        // p2, q2 and p1 are collinear and p1 lies on segment p2q2
        if (o3 == 0 && Point.onSegment(p2, p1, q2)) return true;
        
        // p2, q2 and q1 are collinear and q1 lies on segment p2q2
        if (o4 == 0 && Point.onSegment(p2, q1, q2)) return true;
        
        return false; // Doesn't fall in any of the above cases
    }
}

class Fraction {
    constructor(numerator, denominator) {
        this.numerator = numerator;
        this.denominator = denominator;
    }

    reduce() {
        let a = this.numerator;
        let b = this.denominator; 
        let r;
        while ((a % b) > 0)  {
            r = a % b;
            a = b;
            b = r;
        }
        
        return new Fraction(this.numerator / b, this.denominator / b);
    }

    static equals(frac1, frac2) {
        return frac1.reduce() == frac2.reduce();
    }
}