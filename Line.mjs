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