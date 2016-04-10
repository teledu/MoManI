import dictionary = require('models/dictionary');

export class Node<T> {
    children: Node<T>[] = [];
    parent: Node<T>;
    object: T;

    constructor(object: T) {
        this.object = object;
    }
}

export class Tree<T> {
    private lookup: dictionary<Node<T>>;

    constructor(items: T[], keyName: string, parentName: string) {
        this.lookup = new dictionary(_.map(items, i => {
            var node = new Node<T>(i);
            return {
                key: i[keyName],
                value: node,
            }
        }));
        _.forEach(this.lookup.values(), n => {
            var proposedParent = <Node<T>>this.lookup[n.object[parentName]];
            if (proposedParent) {
                n.parent = proposedParent;
                proposedParent.children.push(n);
            }
        });
    }

    getRoots: () => Node<T>[] = () => {
        return _.filter(this.lookup.values(), n => n.parent == null);
    }
}