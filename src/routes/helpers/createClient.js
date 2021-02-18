

// gives the properties that you want from an object usually we want to extract safe props from object.

function makeFirstUpper(word) {
    if (word) {
        return word[0].toUpperCase() + word.substr(1, word.length);
    }

}

// arguments:
// 1: object which we want the props and values from
// 2: the props we want from the object
function createClient(obj, props) {

    if (Array.isArray(obj)) {

        const clientArr = [];
        let clientObjForArr = {};

        obj.forEach((objItem) => {

            props.forEach((propItem) => {
                const propArr = propItem.split('_');
                const clientProp = (propArr[0] + (propArr[1] ? makeFirstUpper(propArr[1]) : ''));

                if (objItem[propItem]) {

                    clientObjForArr[clientProp] = objItem[propItem];
                }
            });

            clientArr.push({ ...clientObjForArr });

        });

        return clientArr;
    }


    const clientObj = {};
    props.forEach((item, index) => {
        const propArr = item.split('_');
        const clientProp = (propArr[0] + (propArr[1] ? makeFirstUpper(propArr[1]) : ''));
        if (obj[item]) {
            clientObj[clientProp] = obj[item];
        }
    });

    return clientObj;
}

module.exports = {
    createClient
}

