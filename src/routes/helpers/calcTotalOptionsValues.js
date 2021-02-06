"use strict";

// calculate total options valutes in a vote by iterating through their values.
module.exports = function calcTotalOptionsValues(votes) {

    let totalOptionsValues = 0;
    const votesProps = Object.getOwnPropertyNames(votes);

    votesProps.forEach((option, index) => {
        totalOptionsValues += votes[option];
    });

    return totalOptionsValues;
}
