
module.exports = function configVoteOptions(defaultOptionsValues, options) {

    try {
        const votes = {};
        const defaultOptions = [...defaultOptionsValues];

        if (!options || options.length < 1) {

            defaultOptions.forEach((option, index) => {
                votes[option] = 0;
            });

            return { configedOptions: defaultOptions, votes };
        }

        options.forEach((option, index) => {
            votes[option] = 0;
        });

        return { configedOptions: options, votes };
    } catch (error) {
        console.log(error.message);
    }

}
