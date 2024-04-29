import WhiteboardObject from "./WhiteboardObject.mjs";
import Path from "./Path.mjs";
import Line from "./Line.mjs";
import Rectangle from "./Rectangle.mjs";
import Box from "./Box.mjs";
import Circle from "./Circle.mjs";
import Ring from "./Ring.mjs";
import Polygon from "./Polygon.mjs";

export default class Group extends WhiteboardObject {
    constructor(options) {
        super(options);

        if (options.members) {
            options.members = options.members.flatMap(member => {
                switch (member.type) {
                    case 'path':
                        return new Path(member);
                    case 'line':
                        return new Line(member);
                    case 'rectangle':
                        return new Rectangle(member);
                    case 'box':
                        return new Box(member);
                    case 'circle':
                        return new Circle(member);
                    case 'ring':
                        return new Ring(member);
                    case 'polygon':
                        return new Polygon(member);
                    case 'group':
                        // if we are adding a new group, unpack that group and add it to this group
                        return (new Group(member)).members
                    default:
                }
            })
        }
        const defaults = {
            type: 'group',
            members: [],
        }

        Object.assign(defaults, options);
        Object.assign(this, defaults);

        this.update();
    }

    clone() {
        const newObject = super.clone();
        newObject.members = newObject.members.map(member => member.clone());
        return new Group(newObject);
    }

    draw(context) {
        super.draw(context);
        this.members.forEach(member => {
            member.draw(context)
        });
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

        this.members.forEach(member => {
            // left bound origin
            if (member.boundingBox.startPoint.x < left) {
                left = member.boundingBox.startPoint.x
            }
            // right bound startPoint 
            if (member.boundingBox.startPoint.x > right) {
                right = member.boundingBox.startPoint.x
            }
            // left bound end
            if (member.boundingBox.endPoint.x < left) {
                left = member.boundingBox.endPoint.x
            }
            // right bound end
            if (member.boundingBox.endPoint.x > right) {
                right = member.boundingBox.endPoint.x
            }
            // top bound startPoint
            if (member.boundingBox.startPoint.y < top) {
                top = member.boundingBox.startPoint.y
            }
            // bottom bound startPoint
            if (member.boundingBox.startPoint.y > bottom) {
                bottom = member.boundingBox.startPoint.y
            }
            // top bound end
            if (member.boundingBox.endPoint.y < top) {
                top = member.boundingBox.endPoint.y
            }
            // bottom bound end
            if (member.boundingBox.endPoint.y > bottom) {
                bottom = member.boundingBox.endPoint.y
            }
        })

        this.boundingBox.update(left, top, right, bottom);
    }

    updateSegments() {
        this.members.forEach(member => member.update());
    }

    translate(x, y) {
        this.origin.x += x;
        this.origin.y += y;

        this.members.forEach(member => member.translate(x, y));
        // we only need to update the bounding box since translate of the member will call update
        this.updateBoundingBox();
    }

    translateTo(x, y) {
        const deltaX = x - this.origin.x;
        const deltaY = y - this.origin.y;
        
        this.translate(deltaX, deltaY);
        // we only need to update the bounding box since translate of the member will call update
        this.updateBoundingBox();
    }

    /**
     * 
     * @param {GeometricLine} line 
     * @returns 
     */
    isLineIntersecting(line) {
        // check for intersection on each segment
        for (let i = 0; i < this.members.length; i++) {
            // first check if we are in the bounding box of the segment, this is a faster computation
            // then check for the more complex segment intersection
            if (this.members[i].lineIsInBoundingBox(line) && this.members[i].isLineIntersecting(line)) {
                return true;
            }
        }

        return false;
    }
}