"use strict";

// calculate total options valutes in a vote by iterating through their values.
function calcTotalOptionsValues(votes) {

    if (votes) {

        let totalOptionsValues = 0;
        const votesProps = Object.getOwnPropertyNames(votes);
    
        votesProps.forEach((option, index) => {
            totalOptionsValues += votes[option];
        });
    
        return totalOptionsValues;
    }

    throw new Error('votes not provided');

}

module.exports = { calcTotalOptionsValues };
